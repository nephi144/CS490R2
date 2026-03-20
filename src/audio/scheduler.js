// ─────────────────────────────────────────────────────────────
// scheduler.js — TIME-BASED, voice-agnostic
// Works with any VOICES[voice] melody array.
// ─────────────────────────────────────────────────────────────

import { BEAT_MS } from "./melody.js";

// ─────────────────────────────────────────
// Internal: play one oscillator note
// Returns the oscillator so callers can kill it early.
// ─────────────────────────────────────────
function playNote(audioCtx, freq, startTime, durationSec) {
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0,    startTime);
  gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
  gain.gain.setValueAtTime(0.35, startTime + durationSec - 0.05);
  gain.gain.linearRampToValueAtTime(0, startTime + durationSec);

  osc.start(startTime);
  osc.stop(startTime + durationSec + 0.02);

  return osc;
}

// ─────────────────────────────────────────
// 🎼 scheduleMelody
//
// Schedules playback for any voice melody array.
// All timing is derived from note.startMs / note.endMs —
// NO index-based assumptions.
//
// Params:
//   audioCtx      — Web Audio AudioContext
//   melody        — VOICES[voice] array (has startMs, endMs, freq)
//   startOffsetMs — resume/jump offset in ms (default 0)
//   onNoteStart   — callback(note) when a note becomes active
//   onComplete    — callback() when the last note finishes
//   timersRef     — ref({ current: [] }) for setTimeout handles
//   oscRef        — ref({ current: [] }) for oscillator handles
// ─────────────────────────────────────────
export function scheduleMelody({
  audioCtx,
  melody,
  startOffsetMs = 0,
  onNoteStart,
  onComplete,
  timersRef,
  oscRef,
}) {
  if (!audioCtx || !melody?.length) return;

  // Clear any previous timers + oscillators
  if (timersRef?.current) {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }
  if (oscRef?.current) {
    oscRef.current = [];
  }

  // Small lookahead so the first note isn't clipped
  const playStart = audioCtx.currentTime + 0.1;

  melody.forEach((note) => {
    // Skip notes that have already fully elapsed
    if (note.endMs <= startOffsetMs) return;

    // If we're resuming mid-note, play only the remaining tail
    const adjustedStartMs = Math.max(note.startMs, startOffsetMs);
    const delayMs         = adjustedStartMs - startOffsetMs;
    const audioStartTime  = playStart + delayMs / 1000;
    const durationSec     = ((note.endMs - adjustedStartMs) / 1000) * 0.92; // slight duck

    // Schedule Web Audio oscillator
    const osc = playNote(audioCtx, note.freq, audioStartTime, durationSec);
    if (oscRef?.current) oscRef.current.push(osc);

    // Schedule UI callback (onNoteStart fires at the NOTE's original startMs,
    // so the canvas highlights correctly even on mid-note resume)
    const uiDelayMs = (audioStartTime - audioCtx.currentTime) * 1000;
    const t = setTimeout(() => {
      onNoteStart?.(note);
    }, Math.max(0, uiDelayMs));

    timersRef?.current.push(t);
  });

  // ── onComplete fires after the last note ends ──
  const lastNote    = melody[melody.length - 1];
  const remainingMs = lastNote.endMs - startOffsetMs;
  const endDelayMs  = (playStart - audioCtx.currentTime) * 1000 + remainingMs + 200;

  const endTimer = setTimeout(() => {
    onComplete?.();
  }, Math.max(0, endDelayMs));

  timersRef?.current.push(endTimer);
}

// ─────────────────────────────────────────
// killAllOscillators
// Immediately silences every tracked oscillator.
// Call on pause / stop / voice-change.
// ─────────────────────────────────────────
export function killAllOscillators(oscRef, audioCtx) {
  if (!oscRef?.current) return;
  const now = audioCtx?.currentTime ?? 0;
  oscRef.current.forEach((osc) => {
    try { osc.stop(now); } catch (_) { /* already stopped — ignore */ }
  });
  oscRef.current = [];
}

// ─────────────────────────────────────────
// previewNote — single-note audition (e.g. "Hear it" button)
// Does NOT touch timersRef or oscRef — fully self-contained.
// ─────────────────────────────────────────
export function previewNote(audioCtx, freq, beats) {
  if (!audioCtx) return;
  const durationSec = (beats * BEAT_MS / 1000) * 1.1;
  playNote(audioCtx, freq, audioCtx.currentTime + 0.05, durationSec);
}
