// ─────────────────────────────────────────────────────────────
// melody.js (FINAL — SATB + Independent Timing per Voice)
// ─────────────────────────────────────────────────────────────

import { noteToFreq } from "../utils/pitchUtils";

export const BPM     = 88;
export const BEAT_MS = (60 / BPM) * 1000;

// ─────────────────────────────────────────
// 🎤 RAW_MELODY — authoritative rhythm source
// All voices inherit beat durations from here.
// ─────────────────────────────────────────
export const RAW_MELODY = [
  { lyric: "I",      note: "E4", beats: 1 },
  { lyric: "am",     note: "E4", beats: 1 },
  { lyric: "a",      note: "E4", beats: 1 },
  { lyric: "child",  note: "F4", beats: 1 },
  { lyric: "of",     note: "G4", beats: 2 },
  { lyric: "God",    note: "E4", beats: 3 },

  { lyric: "And",    note: "G4", beats: 1 },
  { lyric: "he",     note: "C5", beats: 1 },
  { lyric: "has",    note: "C5", beats: 1 },
  { lyric: "sent",   note: "B4", beats: 1 },
  { lyric: "me",     note: "A4", beats: 1 },
  { lyric: "here,",  note: "G4", beats: 2 },

  { lyric: "Has",    note: "G4", beats: 1 },
  { lyric: "giv-",   note: "G4", beats: 1 },
  { lyric: "-en",    note: "E4", beats: 1 },
  { lyric: "me",     note: "E4", beats: 1 },
  { lyric: "an",     note: "G4", beats: 1 },

  { lyric: "earth-", note: "G4", beats: 1 },
  { lyric: "-ly",    note: "F4", beats: 1 },
  { lyric: "home",   note: "F4", beats: 1.5 },
  { lyric: "With",   note: "E4", beats: 0.5 },

  { lyric: "par-",   note: "E4", beats: 1 },
  { lyric: "-ents",  note: "D4", beats: 1 },
  { lyric: "kind",   note: "B4", beats: 1 },
  { lyric: "and",    note: "A4", beats: 1 },
  { lyric: "dear.",  note: "G4", beats: 3 },

  { lyric: "Lead",   note: "E4", beats: 1 },
  { lyric: "me,",    note: "G4", beats: 1 },
  { lyric: "guide",  note: "E4", beats: 1 },
  { lyric: "me,",    note: "G4", beats: 1 },

  { lyric: "walk",   note: "G4", beats: 1 },
  { lyric: "be-",    note: "F4", beats: 1 },
  { lyric: "side",   note: "D4", beats: 1 },
  { lyric: "me,",    note: "F4", beats: 1 },

  { lyric: "Help",   note: "B4", beats: 1 },
  { lyric: "me",     note: "B4", beats: 1 },
  { lyric: "find",   note: "A4", beats: 1.5 },
  { lyric: "the",    note: "A4", beats: 0.5 },
  { lyric: "way.",   note: "G4", beats: 3 },

  { lyric: "Teach",  note: "E4", beats: 1 },
  { lyric: "me",     note: "G4", beats: 1 },
  { lyric: "all",    note: "E4", beats: 1 },
  { lyric: "that",   note: "G4", beats: 1 },

  { lyric: "I",      note: "C5", beats: 1 },
  { lyric: "must",   note: "A4", beats: 1 },
  { lyric: "do",     note: "F4", beats: 1.5 },
  { lyric: "To",     note: "D4", beats: 0.5 },

  { lyric: "live",   note: "F4", beats: 1 },
  { lyric: "with",   note: "F4", beats: 1 },
  { lyric: "him",    note: "E4", beats: 1 },
  { lyric: "some-",  note: "D4", beats: 1 },
  { lyric: "day.",   note: "C4", beats: 3 },
];

// ─────────────────────────────────────────
// 🎵 SOPRANO — same as RAW_MELODY
// ─────────────────────────────────────────
export const SOPRANO = RAW_MELODY;

// ─────────────────────────────────────────
// 🎵 ALTO voice notes (pitch only — rhythm from RAW_MELODY)
// ─────────────────────────────────────────
export const ALTO_NOTES = [
  "C4","C4","C4","D4","E4","C4",
  "E4","G4","G4","G4","F4","E4",
  "E4","E4","C4","C4","E4",
  "E4","D4","D4","C4",
  "C4","B3","G4","F4","E4",
  "C4","E4","C4","E4",
  "E4","D4","B3","D4",
  "G4","G4","F4","F4","E4",
  "C4","E4","C4","E4",
  "G4","F4","D4","B3",
  "D4","D4","C4","B3","C4",
];

// ─────────────────────────────────────────
// 🎵 TENOR voice notes (pitch only — rhythm from RAW_MELODY)
// ─────────────────────────────────────────
export const TENOR_NOTES = [
  "G5","G5","G5","A5","B5","G5",
  "C4","C4","C4","A5","B5","C4",
  "C4","E5","E5","A5","A5",
  "A5","A5","A5","G5",
  "F#5","F#5","C4","C4","B5",
  "G5","G5","G5","G5",
  "B5","B5","B5","B5",
  "D5","D5","G5","G5","G5",
  "G5","G5","A#5","A#5",
  "A5","A5","A5","A5",
  "G5","G5","G5","F5","E5",
];

// ─────────────────────────────────────────
// 🎵 BASS voice notes (pitch only — rhythm from RAW_MELODY)
// ─────────────────────────────────────────
export const BASS_NOTES = [
  "C5","C5","C5","C5","C5","C5",
  "E5","F5","F5","A5","B5","C4",
  "C4","A6","A6","A6","A6",
  "D5","D5","D5","D5",
  "D5","D5","D5","D5","G5",
  "C5","C5","C5","C5",
  "G5","G5","G5","G5",
  "D5","D5","G6","G6","C5",
  "C5","C5","C5","C5",
  "C5","C5","C5","C5",
  "G5","G5","G6","G6","C5",
];

// ─────────────────────────────────────────
// 🔥 buildVoiceMelody
// Maps RAW_MELODY beats → startMs/endMs,
// swapping only the pitch from the voice array.
// ─────────────────────────────────────────
const buildVoiceMelody = (pitchNotes) => {
  let cursor = 0;
  return RAW_MELODY.map((base, i) => {
    const noteName = (pitchNotes[i] ?? base.note).trim(); // trim stray spaces
    const freq     = noteToFreq(noteName);
    const duration = base.beats * BEAT_MS;
    const startMs  = cursor;
    cursor += duration;
    return {
      lyric:   base.lyric,
      note:    noteName,
      freq,
      beats:   base.beats,
      startMs,
      endMs:   cursor,
    };
  });
};

// ─────────────────────────────────────────
// 🎯 FINAL VOICES OBJECT
// ─────────────────────────────────────────
export const VOICES = {
  soprano: buildVoiceMelody(RAW_MELODY.map((n) => n.note)),
  alto:    buildVoiceMelody(ALTO_NOTES),
  tenor:   buildVoiceMelody(TENOR_NOTES),
  bass:    buildVoiceMelody(BASS_NOTES),
};

// Convenience export — soprano is the "default" melody
export const MELODY   = VOICES.soprano;
export const TOTAL_MS = MELODY[MELODY.length - 1].endMs;
