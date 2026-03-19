// ─────────────────────────────────────────────────────────────
// context/AudioContext.jsx (FINAL — SATB ENABLED)
// ─────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect
} from "react";

import { startPitchLoop, stopPitchLoop } from "../audio/pitchEngine.js";
import { scheduleMelody } from "../audio/scheduler.js";
import { VOICES, TOTAL_MS } from "../audio/melody";

import {
  scoreFromCents,
  getCentsError,
  averageScores,
  calculateFinalScore
} from "../utils/musicMath.js";

import * as Tone from "tone";

const AudioCtx = createContext(null);

export function AudioProvider({ children }) {

  // ── Refs ──
  const audioCtxRef  = useRef(null);
  const analyserRef  = useRef(null);
  const streamRef    = useRef(null);
  const timersRef    = useRef([]);
  const frameScores  = useRef({});
  const startTimeRef = useRef(0);
  const previewSynthRef = useRef(null);

  // ── State ──
  const [voice, setVoice] = useState("bass"); // 🔥 NEW

  const [isListening,  setIsListening]  = useState(false);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [micError,     setMicError]     = useState(null);
  const [liveHz,       setLiveHz]       = useState(0);
  const [liveClarity,  setLiveClarity]  = useState(0);
  const [activeNote,   setActiveNote]   = useState(null);
  const [elapsedMs,    setElapsedMs]    = useState(0);
  const [noteScores,   setNoteScores]   = useState({});
  const [finalScore,   setFinalScore]   = useState(null);
  const [pitchHistory, setPitchHistory] = useState([]);

  // ─────────────────────────────────────
  // 🎵 CURRENT MELODY (based on voice)
  // ─────────────────────────────────────
  const currentMelody = useMemo(() => {
    return VOICES[voice] || [];
  }, [voice]);

  const notes = useMemo(() => {
    return currentMelody.map((n) => ({
      ...n,
      time: n.startMs / 1000,
      duration: (n.endMs - n.startMs) / 1000,
    }));
  }, [currentMelody]);

  // ─────────────────────────────────────
  // 🎤 MICROPHONE
  // ─────────────────────────────────────
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);

      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
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

  // ─────────────────────────────────────
  // 🎼 SESSION (PLAY MODE)
  // ─────────────────────────────────────
  const startSession = useCallback(async () => {

    const melody = VOICES[voice];

    // reset scores
    frameScores.current = {};
    melody.forEach((_, i) => {
      frameScores.current[i] = [];
    });

    setNoteScores({});
    setFinalScore(null);
    setPitchHistory([]);
    setActiveNote(null);
    setElapsedMs(0);

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
      setIsPlaying(false);
      setActiveNote(null);

      const computed = {};
      melody.forEach((_, i) => {
        computed[i] = averageScores(frameScores.current[i] || []);
      });

      setNoteScores(computed);
      setFinalScore(calculateFinalScore(computed));

      stopMic();
    };

    // 🔥 PASS MELODY HERE
    const { timers } = scheduleMelody(
      ctx,
      melody,
      handleNoteStart,
      handleComplete
    );

    timersRef.current = timers;

    startPitchLoop(ctx, analyserRef.current, (hz, clarity) => {
      setLiveHz(hz);
      setLiveClarity(clarity);

      const elapsed = performance.now() - startTimeRef.current;
      setElapsedMs(elapsed);

      if (hz > 0) {
        const noteIdx = melody.findIndex(
          (n) => elapsed >= n.startMs && elapsed < n.endMs
        );

        if (noteIdx >= 0) {
          const target = melody[noteIdx].freq;
          const cents  = getCentsError(hz, target);
          const sc     = scoreFromCents(cents);
          if (sc !== null) {
            frameScores.current[noteIdx].push(sc);
          }
        }

        setPitchHistory((prev) => [
          ...prev.slice(-200),
          { hz }
        ]);
      }
    });

    return true;

  }, [voice, startMic, stopMic]);

  // ─────────────────────────────────────
  // 🎧 TUTORIAL MODE
  // ─────────────────────────────────────
  const startTutorialListening = useCallback(async () => {
    const ctx = await startMic();
    if (!ctx) return false;

    setPitchHistory([]);

    startPitchLoop(ctx, analyserRef.current, (hz, clarity) => {
      setLiveHz(hz);
      setLiveClarity(clarity);

      if (hz > 0) {
        setPitchHistory((prev) => [
          ...prev.slice(-150),
          { hz }
        ]);
      }
    });

    return true;
  }, [startMic]);

  const stopSession = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    stopPitchLoop();
    stopMic();

    setIsPlaying(false);
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
  }, [stopSession]);

  // ─────────────────────────────────────
  // 🔊 PREVIEW NOTE
  // ─────────────────────────────────────
  const previewNote = useCallback(async (note) => {
    if (!note) return;

    if (!previewSynthRef.current) {
      previewSynthRef.current = new Tone.Synth().toDestination();
    }

    previewSynthRef.current.triggerAttackRelease(
      note.note || note.freq,
      "1n"
    );
  }, []);

  // ─────────────────────────────────────
  // 🔄 RESET WHEN VOICE CHANGES
  // ─────────────────────────────────────
  useEffect(() => {
    stopPitchLoop();
    setIsPlaying(false);
    setActiveNote(null);
  }, [voice]);

  // ─────────────────────────────────────
  // 🚀 PROVIDER
  // ─────────────────────────────────────
  return (
    <AudioCtx.Provider
      value={{
        audioCtxRef,
        analyserRef,
        isListening,
        isPlaying,
        micError,
        liveHz,
        liveClarity,
        activeNote,
        elapsedMs,
        notes,
        voice,        // 🔥 NEW
        setVoice,     // 🔥 NEW
        previewNote,
        noteScores,
        finalScore,
        pitchHistory,
        startSession,
        startTutorialListening,
        stopSession,
        resetAll,
        setMicError,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used inside <AudioProvider>");
  return ctx;
}