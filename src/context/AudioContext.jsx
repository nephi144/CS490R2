// ─────────────────────────────────────────────────────────────
// context/AudioContext.jsx
//
// TIME-BASED engine — fully independent SATB voice support.
//
// KEY ARCHITECTURE:
//   _startPitchTracking is the SINGLE source of truth for:
//     • elapsedMs    — wall-clock ms since session start
//     • activeNote   — note active RIGHT NOW (time lookup, 60fps)
//     • scoring      — cents vs that same note, same frame
//
//   Previously, activeNote was set by scheduler's onNoteStart
//   (setTimeout, ±50ms jitter). With independent per-voice beats,
//   this caused targetFreq to point at the WRONG note → -2000¢.
//
//   scheduler's onNoteStart now ONLY resets pitchHistory (trail
//   wipe at note boundaries). It never calls setActiveNote.
// ─────────────────────────────────────────────────────────────

import {
  createContext, useContext, useRef,
  useState, useCallback, useMemo, useEffect
} from "react";

import { startPitchLoop, stopPitchLoop } from "../audio/pitchEngine.js";
import { scheduleMelody, killAllOscillators, previewNote as schedPreview } from "../audio/scheduler.js";
import { VOICES } from "../audio/melody";

import {
  scoreFromCents, getCentsError,
  averageScores, calculateFinalScore
} from "../utils/musicMath.js";

import * as Tone from "tone";

const AudioCtx = createContext(null);

export function AudioProvider({ children }) {

  // ── Refs ──────────────────────────────────────────────────
  const audioCtxRef     = useRef(null);
  const analyserRef     = useRef(null);
  const streamRef       = useRef(null);
  const timersRef       = useRef([]);
  const oscRef          = useRef([]);
  const frameScores     = useRef({});
  const startTimeRef    = useRef(0);
  const pausedAtRef     = useRef(0);
  const previewSynthRef = useRef(null);

  // ── State ─────────────────────────────────────────────────
  const [voice,        setVoice]        = useState("bass");
  const [isListening,  setIsListening]  = useState(false);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [isPaused,     setIsPaused]     = useState(false);
  const [micError,     setMicError]     = useState(null);
  const [liveHz,       setLiveHz]       = useState(0);
  const [liveClarity,  setLiveClarity]  = useState(0);
  const [activeNote,   setActiveNote]   = useState(null);
  const [elapsedMs,    setElapsedMs]    = useState(0);
  const [noteScores,   setNoteScores]   = useState({});
  const [finalScore,   setFinalScore]   = useState(null);
  const [pitchHistory, setPitchHistory] = useState([]);

  // notes = full built melody for the selected voice
  // { lyric, note, freq, beats, startMs, endMs }
  const notes = useMemo(() => VOICES[voice] ?? [], [voice]);

  // ─────────────────────────────────────────────────────────
  // 🎤 MICROPHONE
  // ─────────────────────────────────────────────────────────
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });
      streamRef.current = stream;

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      const source  = ctx.createMediaStreamSource(stream);
      const hp      = ctx.createBiquadFilter();
      hp.type       = "highpass";
      hp.frequency.value = 150;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;

      source.connect(hp);
      hp.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      setMicError(null);
      return ctx;
    } catch (err) {
      setMicError("Microphone access denied. Please allow mic access.");
      return null;
    }
  }, []);

  const stopMic = useCallback(() => {
    stopPitchLoop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
    setLiveHz(0);
    setLiveClarity(0);
  }, []);

  // ─────────────────────────────────────────────────────────
  // 🔄 SHARED PITCH TRACKING — AUTHORITATIVE TIME ENGINE
  //
  // Runs at ~60fps via requestAnimationFrame inside pitchEngine.
  // This is the ONLY place that sets activeNote and elapsedMs
  // during playback. Both are derived from the same elapsed time
  // value, so the TARGET display and scoring are always in sync.
  //
  // Why this matters for independent SATB voices:
  //   Each voice has its own startMs/endMs per note. If you call
  //   setActiveNote from scheduler's onNoteStart (setTimeout), the
  //   note boundary can fire 10–50ms late, pointing targetFreq at
  //   the previous note while the pitch loop already scores the
  //   next one → cents error of ±1200¢ or more.
  //
  //   With this approach both always use the same elapsed value
  //   so the error is bounded by rAF timing (<2ms).
  // ─────────────────────────────────────────────────────────
  const _startPitchTracking = useCallback((melody) => {
    startPitchLoop(audioCtxRef.current, analyserRef.current, (hz, clarity) => {
      setLiveHz(hz);
      setLiveClarity(clarity);

      // 1. Single elapsed computation used for BOTH activeNote and scoring
      const elapsed = performance.now() - startTimeRef.current;
      setElapsedMs(elapsed);

      // 2. Time-based note lookup — voice-agnostic, no index math
      //    Works identically for all four voices with independent beats.
      const activeIdx   = melody.findIndex(
        (n) => elapsed >= n.startMs && elapsed < n.endMs
      );
      const currentNote = activeIdx >= 0 ? melody[activeIdx] : null;

      // 3. Update activeNote — this is what PlayPage reads for the
      //    TARGET pill and cents calculation. Same frame = same note.
      setActiveNote(currentNote);

      // 4. Score only when mic detects pitch AND a note is sounding
      if (hz > 0 && currentNote !== null) {
        const cents = getCentsError(hz, currentNote.freq);
        const sc    = scoreFromCents(cents);
        if (sc !== null) {
          frameScores.current[activeIdx].push(sc);
        }
        setPitchHistory((prev) => [...prev.slice(-200), { hz }]);
      }
    });
  }, []);

  // ─────────────────────────────────────────────────────────
  // ▶ START SESSION
  // ─────────────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    const melody = VOICES[voice];

    // Initialise per-note score buckets (keyed by note index)
    frameScores.current = {};
    melody.forEach((_, i) => { frameScores.current[i] = []; });

    setNoteScores({});
    setFinalScore(null);
    setPitchHistory([]);
    setActiveNote(null);
    setElapsedMs(0);
    setIsPaused(false);
    pausedAtRef.current = 0;

    const ctx = await startMic();
    if (!ctx) return false;

    setIsPlaying(true);
    startTimeRef.current = performance.now();

    // onNoteStart: pitch trail reset only — NOT setActiveNote.
    // activeNote is driven by _startPitchTracking (see above).
    const handleNoteStart = (_note) => {
      setPitchHistory([]);
    };

    const handleComplete = () => {
      stopPitchLoop();
      killAllOscillators(oscRef, audioCtxRef.current);
      setIsPlaying(false);
      setIsPaused(false);
      setActiveNote(null);

      const computed = {};
      melody.forEach((_, i) => {
        computed[i] = averageScores(frameScores.current[i] || []);
      });
      setNoteScores(computed);
      setFinalScore(calculateFinalScore(computed));
      stopMic();
    };

    scheduleMelody({
      audioCtx: ctx,
      melody,
      startOffsetMs: 0,
      onNoteStart: handleNoteStart,
      onComplete:  handleComplete,
      timersRef,
      oscRef,
    });

    _startPitchTracking(melody);
    return true;
  }, [voice, startMic, stopMic, _startPitchTracking]);

  // ─────────────────────────────────────────────────────────
  // ⏸ PAUSE — kills oscillators immediately
  // ─────────────────────────────────────────────────────────
  const pauseSession = useCallback(() => {
    if (!isPlaying || isPaused) return;

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    killAllOscillators(oscRef, audioCtxRef.current);
    stopPitchLoop();

    const elapsed = performance.now() - startTimeRef.current;
    pausedAtRef.current = elapsed;
    setElapsedMs(elapsed);
    setIsPlaying(false);
    setIsPaused(true);
  }, [isPlaying, isPaused]);

  // ─────────────────────────────────────────────────────────
  // ▶ RESUME — fresh AudioContext from saved offset
  // ─────────────────────────────────────────────────────────
  const resumeSession = useCallback(async () => {
    if (isPlaying || !isPaused) return;

    const melody   = VOICES[voice];
    const offsetMs = pausedAtRef.current;

    const ctx = await startMic();
    if (!ctx) return;

    // Reconstruct elapsed-time origin so performance.now() - startTimeRef
    // gives the correct ms value from the paused position onward.
    startTimeRef.current = performance.now() - offsetMs;

    // onNoteStart: trail reset only (same reasoning as startSession)
    const handleNoteStart = (_note) => {
      setPitchHistory([]);
    };

    const handleComplete = () => {
      stopPitchLoop();
      killAllOscillators(oscRef, audioCtxRef.current);
      setIsPlaying(false);
      setIsPaused(false);
      setActiveNote(null);

      const computed = {};
      melody.forEach((_, i) => {
        computed[i] = averageScores(frameScores.current[i] || []);
      });
      setNoteScores(computed);
      setFinalScore(calculateFinalScore(computed));
      stopMic();
    };

    scheduleMelody({
      audioCtx: ctx,
      melody,
      startOffsetMs: offsetMs,
      onNoteStart: handleNoteStart,
      onComplete:  handleComplete,
      timersRef,
      oscRef,
    });

    _startPitchTracking(melody);
    setIsPlaying(true);
    setIsPaused(false);
  }, [isPlaying, isPaused, voice, startMic, stopMic, _startPitchTracking]);

  // ─────────────────────────────────────────────────────────
  // 🎯 startFromNote — jump to note by index (tutorial)
  // ─────────────────────────────────────────────────────────
  const startFromNote = useCallback(async (noteIndex) => {
    const melody = VOICES[voice];
    if (!melody?.length) return false;

    // Map note index → ms offset using that voice's own startMs
    const offsetMs = melody[noteIndex]?.startMs ?? 0;

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    killAllOscillators(oscRef, audioCtxRef.current);
    stopPitchLoop();

    let ctx = audioCtxRef.current;
    if (!ctx) {
      ctx = await startMic();
      if (!ctx) return false;
    }

    startTimeRef.current = performance.now() - offsetMs;
    setElapsedMs(offsetMs);

    // onNoteStart: trail reset only
    const handleNoteStart = (_note) => {
      setPitchHistory([]);
    };

    const handleComplete = () => {
      stopPitchLoop();
      killAllOscillators(oscRef, audioCtxRef.current);
      setIsPlaying(false);
      setActiveNote(null);
    };

    scheduleMelody({
      audioCtx: ctx,
      melody,
      startOffsetMs: offsetMs,
      onNoteStart: handleNoteStart,
      onComplete:  handleComplete,
      timersRef,
      oscRef,
    });

    _startPitchTracking(melody);
    setIsPlaying(true);
    setIsPaused(false);
    return true;
  }, [voice, startMic, _startPitchTracking]);

  // ─────────────────────────────────────────────────────────
  // 🔔 previewSingleNote — one note, no scheduling (Tutorial)
  // ─────────────────────────────────────────────────────────
  const previewSingleNote = useCallback(async (note) => {
    if (!note) return;
    let ctx = audioCtxRef.current;
    if (!ctx) {
      ctx = await startMic();
      if (!ctx) return;
    }
    schedPreview(ctx, note.freq, note.beats ?? 1);
  }, [startMic]);

  // ─────────────────────────────────────────────────────────
  // 🎧 TUTORIAL LISTENING — mic only, no melody playback
  // ─────────────────────────────────────────────────────────
  const startTutorialListening = useCallback(async () => {
    const ctx = await startMic();
    if (!ctx) return false;

    setPitchHistory([]);
    startPitchLoop(ctx, analyserRef.current, (hz, clarity) => {
      setLiveHz(hz);
      setLiveClarity(clarity);
      if (hz > 0) {
        setPitchHistory((prev) => [...prev.slice(-150), { hz }]);
      }
    });
    return true;
  }, [startMic]);

  // ─────────────────────────────────────────────────────────
  // ■ STOP / RESET
  // ─────────────────────────────────────────────────────────
  const stopSession = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    killAllOscillators(oscRef, audioCtxRef.current);
    stopPitchLoop();
    stopMic();
    setIsPlaying(false);
    setIsPaused(false);
    setActiveNote(null);
  }, [stopMic]);

  const resetAll = useCallback(() => {
    stopSession();
    setNoteScores({});
    setFinalScore(null);
    setPitchHistory([]);
    setLiveHz(0);
    setActiveNote(null);
    setElapsedMs(0);
    pausedAtRef.current = 0;
  }, [stopSession]);

  // ─────────────────────────────────────────────────────────
  // 🔊 previewNote (Tone.js — legacy, kept for compatibility)
  // ─────────────────────────────────────────────────────────
  const previewNote = useCallback(async (note) => {
    if (!note) return;
    if (!previewSynthRef.current) {
      previewSynthRef.current = new Tone.Synth().toDestination();
    }
    previewSynthRef.current.triggerAttackRelease(note.note || note.freq, "1n");
  }, []);

  // ─────────────────────────────────────────────────────────
  // 🔄 RESET ON VOICE CHANGE
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    killAllOscillators(oscRef, audioCtxRef.current);
    stopPitchLoop();
    setIsPlaying(false);
    setIsPaused(false);
    setActiveNote(null);
    pausedAtRef.current = 0;
  }, [voice]);

  return (
    <AudioCtx.Provider value={{
      audioCtxRef, analyserRef,
      isListening, isPlaying, isPaused,
      micError,
      liveHz, liveClarity,
      activeNote, elapsedMs,
      notes, voice, setVoice,
      previewNote,
      previewSingleNote,
      noteScores, finalScore, pitchHistory,
      startSession, pauseSession, resumeSession,
      startFromNote,
      startTutorialListening,
      stopSession, resetAll,
      setMicError,
    }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used inside <AudioProvider>");
  return ctx;
}
