// ─────────────────────────────────────────────────────────────
// scheduler.js (FIXED — SATB COMPATIBLE)
// ─────────────────────────────────────────────────────────────

import { BEAT_MS } from "./melody.js";

/**
 * Play a single synthesized note
 */
function playNote(audioCtx, freq, startTime, durationSec) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, startTime);

  // Envelope
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
  gain.gain.setValueAtTime(0.35, startTime + durationSec - 0.05);
  gain.gain.linearRampToValueAtTime(0, startTime + durationSec);

  osc.start(startTime);
  osc.stop(startTime + durationSec + 0.02);
}

/**
 * Schedule melody playback
 */
export function scheduleMelody(ctx, melody, onNoteStart, onComplete) {

  const playStart = ctx.currentTime + 0.15;
  const timers = [];

  melody.forEach((note) => {

    const startTime = playStart + note.startMs / 1000;
    const durationSec = (note.endMs - note.startMs) / 1000 * 0.92;

    // 🔊 AUDIO
    playNote(ctx, note.freq, startTime, durationSec);

    // 🧠 UI SYNC
    const delayMs = (startTime - ctx.currentTime) * 1000;

    const t = setTimeout(() => {
      onNoteStart(note);
    }, delayMs);

    timers.push(t);
  });

  // 🏁 COMPLETE
  const last = melody[melody.length - 1];

  const endDelay =
    (playStart + last.endMs / 1000 - ctx.currentTime) * 1000 + 300;

  const endTimer = setTimeout(onComplete, endDelay);
  timers.push(endTimer);

  return { timers };
}

/**
 * Preview single note
 */
export function previewNote(audioCtx, freq, beats) {
  const durationSec = (beats * BEAT_MS / 1000) * 1.1;
  playNote(audioCtx, freq, audioCtx.currentTime + 0.05, durationSec);
}