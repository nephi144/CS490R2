// ─────────────────────────────────────────────────────────────
// scheduler.js
// Melody playback using raw Web Audio API (no Tone.js dependency)
// ─────────────────────────────────────────────────────────────

import { MELODY, BEAT_MS } from "./melody.js";

/**
 * Play a single synthesized piano-like note.
 */
function playNote(audioCtx, freq, startTime, durationSec) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = "triangle"; // Warmer sound than sine, cleaner than sawtooth
  osc.frequency.setValueAtTime(freq, startTime);

  // Attack–sustain–release envelope
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.4, startTime + 0.025);   // attack
  gain.gain.setValueAtTime(0.35, startTime + durationSec - 0.06); // sustain
  gain.gain.linearRampToValueAtTime(0, startTime + durationSec); // release

  osc.start(startTime);
  osc.stop(startTime + durationSec + 0.02);
}

/**
 * Schedule the full melody and trigger UI callbacks per note.
 *
 * @param {AudioContext} audioCtx
 * @param {(noteObj: object) => void} onNoteStart  — called (via setTimeout) when each note begins
 * @param {() => void} onComplete                  — called when the phrase ends
 * @returns {{ timers: number[] }} — list of timer IDs so caller can cancel them
 */
export function scheduleMelody(audioCtx, onNoteStart, onComplete) {
  const playStart = audioCtx.currentTime + 0.15; // small lead-in
  const timers = [];

  MELODY.forEach((note) => {
    const audioStartTime = playStart + note.startMs / 1000;
    const durationSec = (note.beats * BEAT_MS / 1000) * 0.92; // slight gap between notes

    // Schedule audio
    playNote(audioCtx, note.freq, audioStartTime, durationSec);

    // Schedule UI update using setTimeout aligned to audioCtx clock
    const delayMs = (audioStartTime - audioCtx.currentTime) * 1000;
    const t = setTimeout(() => onNoteStart(note), delayMs);
    timers.push(t);
  });

  // Schedule completion callback
  const lastNote = MELODY[MELODY.length - 1];
  const endDelay = (playStart + lastNote.endMs / 1000 - audioCtx.currentTime) * 1000 + 400;
  const endTimer = setTimeout(onComplete, endDelay);
  timers.push(endTimer);

  return { timers };
}

/**
 * Play a single note immediately (for Tutorial mode preview).
 */
export function previewNote(audioCtx, freq, beats) {
  const durationSec = (beats * BEAT_MS / 1000) * 1.1;
  playNote(audioCtx, freq, audioCtx.currentTime + 0.05, durationSec);
}
