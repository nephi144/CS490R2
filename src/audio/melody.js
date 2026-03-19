// ─────────────────────────────────────────────────────────────
// melody.js (FINAL — SATB + Lyrics + Timing)
// ─────────────────────────────────────────────────────────────

import { noteToFreq } from "../utils/pitchUtils";

export const BPM = 88;
export const BEAT_MS = (60 / BPM) * 1000;

// ─────────────────────────────────────────
// 🎤 BASE MELODY (Lyrics Source)
// ─────────────────────────────────────────
export const RAW_MELODY = [
  { lyric: "I", note: "E4", beats: 1 },
  { lyric: "am", note: "E4", beats: 1 },
  { lyric: "a", note: "E4", beats: 1 },
  { lyric: "child", note: "F4", beats: 1 },
  { lyric: "of", note: "G4", beats: 2 },
  { lyric: "God", note: "E4", beats: 3 },

  { lyric: "And", note: "G4", beats: 1 },
  { lyric: "he", note: "C5", beats: 1 },
  { lyric: "has", note: "C5", beats: 1 },
  { lyric: "sent", note: "B4", beats: 1 },
  { lyric: "me", note: "A4", beats: 1 },
  { lyric: "here,", note: "G4", beats: 2 },

  { lyric: "Has", note: "G4", beats: 1 },
  { lyric: "giv-", note: "G4", beats: 1 },
  { lyric: "-en", note: "E4", beats: 1 },
  { lyric: "me", note: "E4", beats: 1 },
  { lyric: "an", note: "G4", beats: 1 },

  { lyric: "earth-", note: "G4", beats: 1 },
  { lyric: "-ly", note: "F4", beats: 1 },
  { lyric: "home", note: "F4", beats: 1.5 },
  { lyric: "With", note: "E4", beats: 0.5 },

  { lyric: "par-", note: "E4", beats: 1 },
  { lyric: "-ents", note: "D4", beats: 1 },
  { lyric: "kind", note: "B4", beats: 1 },
  { lyric: "and", note: "A4", beats: 1 },
  { lyric: "dear.", note: "G4", beats: 3 },

  { lyric: "Lead", note: "E4", beats: 1 },
  { lyric: "me,", note: "G4", beats: 1 },
  { lyric: "guide", note: "E4", beats: 1 },
  { lyric: "me,", note: "G4", beats: 1 },

  { lyric: "walk", note: "G4", beats: 1 },
  { lyric: "be-", note: "F4", beats: 1 },
  { lyric: "side", note: "D4", beats: 1 },
  { lyric: "me,", note: "F4", beats: 1 },

  { lyric: "Help", note: "B4", beats: 1 },
  { lyric: "me", note: "B4", beats: 1 },
  { lyric: "find", note: "A4", beats: 1.5 },
  { lyric: "the", note: "A4", beats: 0.5 },
  { lyric: "way.", note: "G4", beats: 3 },

  { lyric: "Teach", note: "E4", beats: 1 },
  { lyric: "me", note: "G4", beats: 1 },
  { lyric: "all", note: "E4", beats: 1 },
  { lyric: "that", note: "G4", beats: 1 },

  { lyric: "I", note: "C5", beats: 1 },
  { lyric: "must", note: "A4", beats: 1 },
  { lyric: "do", note: "F4", beats: 1.5 },
  { lyric: "To", note: "D4", beats: 0.5 },

  { lyric: "live", note: "F4", beats: 1 },
  { lyric: "with", note: "F4", beats: 1 },
  { lyric: "him", note: "E4", beats: 1 },
  { lyric: "some-", note: "D4", beats: 1 },
  { lyric: "day.", note: "C4", beats: 3 },
];

// ─────────────────────────────────────────
// 🎵 Convert base melody → soprano version
// ─────────────────────────────────────────
let cursor = 0;

export const MELODY = RAW_MELODY.map((n) => {
  const startMs = cursor;
  const duration = n.beats * BEAT_MS;
  cursor += duration;

  return {
    ...n,
    freq: noteToFreq(n.note),
    startMs,
    endMs: cursor,
  };
});

export const TOTAL_MS = cursor;

// ─────────────────────────────────────────
// 🎵 SATB DATA (from XML)
// ─────────────────────────────────────────
// ─────────────────────────────────────────
// 🎵 FULL SATB (ALIGNED TO RAW_MELODY)
// ─────────────────────────────────────────

// NOTE:
// These are MUSICAL approximations (simple harmony version)
// Good enough for URC + demo + training

export const TENOR = [
  "B3","B3","B3","C4","D4","B3",
  "D4","E4","E4","D4","C4","B3",
  "B3","B3","B3","B3","D4",
  "D4","C4","C4","B3",
  "B3","A3","F4","E4","D4",
  "B3","D4","B3","D4",
  "D4","C4","A3","C4",
  "F4","F4","E4","E4","D4",
  "B3","D4","B3","D4",
  "E4","C4","A3","F3",
  "A3","A3","G3","F3","E3"
];

export const ALTO = [
  "C4","C4","C4","C4","D4","C4",
  "E4","F4","F4","E4","D4","C4",
  "C4","C4","C4","C4","D4",
  "D4","C4","C4","C4",
  "C4","B3","G4","F4","E4",
  "C4","E4","C4","E4",
  "E4","D4","B3","D4",
  "G4","G4","F4","F4","E4",
  "C4","E4","C4","E4",
  "F4","D4","B3","G3",
  "B3","B3","A3","G3","F3"
];

export const BASS = [
  "C3","C3","C3","D3","E3","C3",
  "E3","G3","G3","F3","E3","D3",
  "D3","D3","C3","C3","E3",
  "E3","D3","D3","C3",
  "C3","B2","G3","F3","E3",
  "C3","E3","C3","E3",
  "E3","D3","B2","D3",
  "G3","G3","F3","F3","E3",
  "C3","E3","C3","E3",
  "F3","D3","B2","G2",
  "C3","C3","C3","B2","C3"
];
// ─────────────────────────────────────────
// 🔥 BUILD FULL MELODY FOR EACH VOICE
// ─────────────────────────────────────────
// ─────────────────────────────────────────
// 🔥 BUILD FULL VOICE (MATCHES RAW_MELODY)
// ─────────────────────────────────────────
const buildVoiceMelody = (voiceNotes) => {
  let cursor = 0;

  return RAW_MELODY.map((base, i) => {
    const noteName = voiceNotes[i] || base.note;

    const freq = noteToFreq(noteName);
    const duration = base.beats * BEAT_MS;

    const startMs = cursor;
    cursor += duration;

    return {
      lyric: base.lyric,
      note: noteName,
      freq,
      startMs,
      endMs: cursor,
    };
  });
};

// ─────────────────────────────────────────
// 🎯 FINAL VOICES OBJECT
// ─────────────────────────────────────────
export const VOICES = {
  bass: buildVoiceMelody(BASS),
  alto: buildVoiceMelody(ALTO),
  tenor: buildVoiceMelody(TENOR),
};