// ─────────────────────────────────────────────────────────────
// context/AudioContext.jsx
// Shared audio state accessible by all pages and components.
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useRef, useState, useCallback } from "react";
import { startPitchLoop, stopPitchLoop } from "../audio/pitchEngine.js";
import { scheduleMelody } from "../audio/scheduler.js";
import { MELODY, TOTAL_MS } from "../audio/melody";
import {
  scoreFromCents,
  getCentsError,
  averageScores,
  calculateFinalScore
} from "../utils/musicMath.js";

const AudioCtx = createContext(null);

export function AudioProvider({ children }) {

  // ── Refs (do not trigger re-render) ──
  const audioCtxRef  = useRef(null);
  const analyserRef  = useRef(null);
  const streamRef    = useRef(null);
  const timersRef    = useRef([]);
  const frameScores  = useRef({});
  const startTimeRef = useRef(0);

  // ── State ──
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

  // ── Expose melody to UI ──
  const notes = MELODY;

  // ─────────────────────────────────────
  // 🎤 MICROPHONE SETUP
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
  // 🎼 FULL SESSION (Play Mode)
  // ─────────────────────────────────────
  const startSession = useCallback(async () => {

    frameScores.current = {};
    MELODY.forEach((_, i) => { frameScores.current[i] = []; });

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
      MELODY.forEach((_, i) => {
        computed[i] = averageScores(frameScores.current[i] || []);
      });

      setNoteScores(computed);
      setFinalScore(calculateFinalScore(computed));

      stopMic();
    };

    const { timers } = scheduleMelody(ctx, handleNoteStart, handleComplete);
    timersRef.current = timers;

    startPitchLoop(ctx, analyserRef.current, (hz, clarity) => {
      setLiveHz(hz);
      setLiveClarity(clarity);

      const elapsed = performance.now() - startTimeRef.current;
      setElapsedMs(elapsed);

      if (hz > 0) {
        const noteIdx = MELODY.findIndex(
          (n) => elapsed >= n.startMs && elapsed < n.endMs
        );

        if (noteIdx >= 0) {
          const target = MELODY[noteIdx].freq;
          const cents  = getCentsError(hz, target);
          const sc     = scoreFromCents(cents);
          if (sc !== null) frameScores.current[noteIdx].push(sc);
        }

        setPitchHistory((prev) => [...prev.slice(-200), { hz }]);
      }
    });

    return true;
  }, [startMic, stopMic]);

  // ─────────────────────────────────────
  // 🎵 Tutorial Mode (Mic only)
  // ─────────────────────────────────────
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
  // 🔥 PROVIDER
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
        notes,            // ← FIXED
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