// ─────────────────────────────────────────────────────────────
// context/AudioContext.jsx
// TIME-BASED throughout — no index assumptions.
// Supports soprano / alto / tenor / bass via VOICES[voice].
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

  // ── Derived: current voice melody ────────────────────────
  // notes is the full array for the selected voice, with
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

      const source = ctx.createMediaStreamSource(stream);
      const hp     = ctx.createBiquadFilter();
      hp.type      = "highpass";
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
  // 🔄 SHARED PITCH TRACKING
  // Uses time-based lookup against the melody array.
  // ─────────────────────────────────────────────────────────
  const _startPitchTracking = useCallback((melody) => {
    startPitchLoop(audioCtxRef.current, analyserRef.current, (hz, clarity) => {
      setLiveHz(hz);
      setLiveClarity(clarity);

      const elapsed = performance.now() - startTimeRef.current;
      setElapsedMs(elapsed);

      if (hz > 0) {
        // TIME-BASED note lookup — no index assumptions
        const noteIdx = melody.findIndex(
          (n) => elapsed >= n.startMs && elapsed < n.endMs
        );
        if (noteIdx >= 0) {
          const cents = getCentsError(hz, melody[noteIdx].freq);
          const sc    = scoreFromCents(cents);
          if (sc !== null) frameScores.current[noteIdx].push(sc);
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

    // Reset score accumulators (keyed by note index)
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

    const handleNoteStart = (note) => {
      setActiveNote(note);
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
      onComplete: handleComplete,
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

    startTimeRef.current = performance.now() - offsetMs;

    const handleNoteStart = (note) => {
      setActiveNote(note);
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
      onComplete: handleComplete,
      timersRef,
      oscRef,
    });

    _startPitchTracking(melody);
    setIsPlaying(true);
    setIsPaused(false);
  }, [isPlaying, isPaused, voice, startMic, stopMic, _startPitchTracking]);

  // ─────────────────────────────────────────────────────────
  // 🎯 startFromNote — jump to a note by index (tutorial)
  // Stops current playback, then resumes from that note's startMs.
  // ─────────────────────────────────────────────────────────
  const startFromNote = useCallback(async (noteIndex) => {
    const melody = VOICES[voice];
    if (!melody?.length) return false;

    const offsetMs = melody[noteIndex]?.startMs ?? 0;

    // Stop whatever is running
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    killAllOscillators(oscRef, audioCtxRef.current);
    stopPitchLoop();

    // Reuse existing mic context if open, else open fresh
    let ctx = audioCtxRef.current;
    if (!ctx) {
      ctx = await startMic();
      if (!ctx) return false;
    }

    startTimeRef.current = performance.now() - offsetMs;
    setElapsedMs(offsetMs);

    const handleNoteStart = (note) => { setActiveNote(note); };
    const handleComplete  = () => {
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
      onComplete: handleComplete,
      timersRef,
      oscRef,
    });

    _startPitchTracking(melody);
    setIsPlaying(true);
    setIsPaused(false);
    return true;
  }, [voice, startMic, _startPitchTracking]);

  // ─────────────────────────────────────────────────────────
  // 🔔 previewSingleNote — play ONE note immediately, no scheduling
  // Used by the "Hear it" button in Tutorial.
  // Does NOT set isPlaying or affect timers/oscRef.
  // ─────────────────────────────────────────────────────────
  const previewSingleNote = useCallback(async (note) => {
    if (!note) return;

    // Ensure we have an AudioContext
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
  // 🔊 previewNote (Tone.js — kept for legacy callers)
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
      // notes is always the current voice's melody
      notes, voice, setVoice,
      previewNote,
      previewSingleNote,       // ← new: single-note audition
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
