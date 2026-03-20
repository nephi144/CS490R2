// ─────────────────────────────────────────────────────────────
// scheduler.js (CLEAN + OFFSET SUPPORT + OSCILLATOR TRACKING)
// ─────────────────────────────────────────────────────────────

import { BEAT_MS } from "./melody.js";

/**
 * Play a single synthesized note.
 * CHANGE: returns the oscillator so callers can kill it early.
 */
function playNote(audioCtx, freq, startTime, durationSec) {
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
  gain.gain.setValueAtTime(0.35, startTime + durationSec - 0.05);
  gain.gain.linearRampToValueAtTime(0, startTime + durationSec);

  osc.start(startTime);
  osc.stop(startTime + durationSec + 0.02);

  return osc; // ADD
}

/**
 * 🎼 MAIN SCHEDULER
 * ADD: oscRef — optional ref; all created oscillators are pushed
 *      into oscRef.current so the caller can stop them instantly.
 */
export function scheduleMelody({
  audioCtx,
  melody,
  startOffsetMs = 0,
  onNoteStart,
  onComplete,
  timersRef,
  oscRef,        // ADD
}) {
  if (!audioCtx || !melody) return;

  const playStart = audioCtx.currentTime + 0.1;

  if (timersRef?.current) {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  // ADD: reset osc list
  if (oscRef?.current) {
    oscRef.current = [];
  }

  melody.forEach((note) => {
    const noteStartMs = note.startMs;
    const noteEndMs   = note.endMs;

    if (noteEndMs <= startOffsetMs) return;

    const adjustedStartMs = Math.max(noteStartMs, startOffsetMs);
    const delayMs         = adjustedStartMs - startOffsetMs;
    const startTime       = playStart + delayMs / 1000;
    const durationSec     = (noteEndMs - adjustedStartMs) / 1000 * 0.92;

    // ADD: store osc
    const osc = playNote(audioCtx, note.freq, startTime, durationSec);
    if (oscRef?.current) oscRef.current.push(osc);

    const uiDelay = (startTime - audioCtx.currentTime) * 1000;
    const t = setTimeout(() => {
      onNoteStart?.(note);
    }, Math.max(0, uiDelay));

    timersRef?.current.push(t);
  });

  const last = melody[melody.length - 1];
  if (last) {
    const remainingMs = last.endMs - startOffsetMs;
    const endDelay =
      (playStart - audioCtx.currentTime) * 1000 + remainingMs + 200;

    const endTimer = setTimeout(() => {
      onComplete?.();
    }, Math.max(0, endDelay));

    timersRef?.current.push(endTimer);
  }
}

/**
 * NEW: Stop all tracked oscillators immediately (for pause/stop).
 */
export function killAllOscillators(oscRef, audioCtx) {
  if (!oscRef?.current) return;
  const now = audioCtx?.currentTime ?? 0;
  oscRef.current.forEach((osc) => {
    try { osc.stop(now); } catch (_) { /* already stopped */ }
  });
  oscRef.current = [];
}

/**
 * 🔊 Preview single note
 */
export function previewNote(audioCtx, freq, beats) {
  const durationSec = (beats * BEAT_MS / 1000) * 1.1;
  playNote(audioCtx, freq, audioCtx.currentTime + 0.05, durationSec);
}
