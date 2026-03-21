// ─────────────────────────────────────────────────────────────
// melody.js — SATB with INDEPENDENT timing per voice
// Each voice has its own { lyric, note, beats } array and its
// own startMs/endMs timeline.  Voices are NOT beat-aligned.
// ─────────────────────────────────────────────────────────────

import { noteToFreq } from "../utils/pitchUtils";

export const BPM     = 88;
export const BEAT_MS = (60 / BPM) * 1000;

// ─────────────────────────────────────────
// 🎵 SOPRANO
// ─────────────────────────────────────────
export const SOPRANO = [
  { lyric: "I",      note: "E4", beats: 1   },
  { lyric: "am",     note: "E4", beats: 1   },
  { lyric: "a",      note: "E4", beats: 1   },
  { lyric: "child",  note: "F4", beats: 1   },
  { lyric: "of",     note: "G4", beats: 2   },
  { lyric: "God",    note: "E4", beats: 3   },

  { lyric: "And",    note: "G4", beats: 1   },
  { lyric: "he",     note: "C5", beats: 1   },
  { lyric: "has",    note: "C5", beats: 1   },
  { lyric: "sent",   note: "B4", beats: 1   },
  { lyric: "me",     note: "A4", beats: 1   },
  { lyric: "here,",  note: "G4", beats: 2   },

  { lyric: "Has",    note: "G4", beats: 1   },
  { lyric: "giv-",   note: "G4", beats: 1   },
  { lyric: "-en",    note: "E4", beats: 1   },
  { lyric: "me",     note: "E4", beats: 1   },
  { lyric: "an",     note: "G4", beats: 1   },

  { lyric: "earth-", note: "G4", beats: 1   },
  { lyric: "-ly",    note: "F4", beats: 1   },
  { lyric: "home",   note: "F4", beats: 1.5 },
  { lyric: "With",   note: "E4", beats: 0.5 },

  { lyric: "par-",   note: "E4", beats: 1   },
  { lyric: "-ents",  note: "D4", beats: 1   },
  { lyric: "kind",   note: "B4", beats: 1   },
  { lyric: "and",    note: "A4", beats: 1   },
  { lyric: "dear.",  note: "G4", beats: 3   },

  { lyric: "Lead",   note: "E4", beats: 1   },
  { lyric: "me,",    note: "G4", beats: 1   },
  { lyric: "guide",  note: "E4", beats: 1   },
  { lyric: "me,",    note: "G4", beats: 1   },

  { lyric: "walk",   note: "G4", beats: 1   },
  { lyric: "be-",    note: "F4", beats: 1   },
  { lyric: "side",   note: "D4", beats: 1   },
  { lyric: "me,",    note: "F4", beats: 1   },

  { lyric: "Help",   note: "B4", beats: 1   },
  { lyric: "me",     note: "B4", beats: 1   },
  { lyric: "find",   note: "A4", beats: 1.5 },
  { lyric: "the",    note: "A4", beats: 0.5 },
  { lyric: "way.",   note: "G4", beats: 3   },

  { lyric: "Teach",  note: "E4", beats: 1   },
  { lyric: "me",     note: "G4", beats: 1   },
  { lyric: "all",    note: "E4", beats: 1   },
  { lyric: "that",   note: "G4", beats: 1   },

  { lyric: "I",      note: "C5", beats: 1   },
  { lyric: "must",   note: "A4", beats: 1   },
  { lyric: "do",     note: "F4", beats: 1.5 },
  { lyric: "To",     note: "D4", beats: 0.5 },

  { lyric: "live",   note: "F4", beats: 1   },
  { lyric: "with",   note: "F4", beats: 1   },
  { lyric: "him",    note: "E4", beats: 1   },
  { lyric: "some-",  note: "D4", beats: 1   },
  { lyric: "day.",   note: "C4", beats: 3   },
];

// ─────────────────────────────────────────
// 🎵 ALTO — independent beats
// ─────────────────────────────────────────
export const ALTO = [
  { lyric: "I",      note: "C4",  beats: 1   },
  { lyric: "am",     note: "C4",  beats: 0.5 },
  { lyric: "a",      note: "C4",  beats: 0.5 },
  { lyric: "child",  note: "C4",  beats: 1   },
  { lyric: "of",     note: "D4",  beats: 1   },
  { lyric: "God",    note: "C4",  beats: 3   },

  { lyric: "And",    note: "G4",  beats: 1   },
  { lyric: "he",     note: "A4",  beats: 1   },
  { lyric: "has",    note: "A4",  beats: 1   },
  { lyric: "sent",   note: "G4",  beats: 1   },
  { lyric: "me",     note: "F4",  beats: 1   },
  { lyric: "here,",  note: "E4",  beats: 3   },

  { lyric: "Has",    note: "G4",  beats: 1   },
  { lyric: "giv-",   note: "C#4", beats: 1   },
  { lyric: "-en",    note: "C#4", beats: 1   },
  { lyric: "me",     note: "C#4", beats: 1   },
  { lyric: "an",     note: "C#4", beats: 1   },

  { lyric: "earth-", note: "E4",  beats: 1   },
  { lyric: "-ly",    note: "D4",  beats: 1   },
  { lyric: "home",   note: "D4",  beats: 1.5 },
  { lyric: "With",   note: "E4",  beats: 0.5 },

  { lyric: "par-",   note: "C4",  beats: 1   },
  { lyric: "-ents",  note: "C4",  beats: 1   },
  { lyric: "kind",   note: "F#4", beats: 1   },
  { lyric: "and",    note: "F#4", beats: 1   },
  { lyric: "dear.",  note: "D4",  beats: 4   },

  { lyric: "Lead",   note: "C4",  beats: 1   },
  { lyric: "me,",    note: "G4",  beats: 1   },
  { lyric: "guide",  note: "C4",  beats: 1   },
  { lyric: "me,",    note: "G4",  beats: 1   },

  { lyric: "walk",   note: "E4",  beats: 1   },
  { lyric: "be-",    note: "D4",  beats: 1   },
  { lyric: "side",   note: "D4",  beats: 1   },
  { lyric: "me,",    note: "F4",  beats: 1   },

  { lyric: "Help",   note: "F4",  beats: 1   },
  { lyric: "me",     note: "F4",  beats: 1   },
  { lyric: "find",   note: "F4",  beats: 1.5 },
  { lyric: "the",    note: "F4",  beats: 0.5 },
  { lyric: "way.",   note: "E4",  beats: 4   },

  { lyric: "Teach",  note: "C4",  beats: 1   },
  { lyric: "me",     note: "G4",  beats: 1   },
  { lyric: "all",    note: "C4",  beats: 1   },
  { lyric: "that",   note: "G4",  beats: 1   },

  { lyric: "I",      note: "F4",  beats: 1   },
  { lyric: "must",   note: "A4",  beats: 1   },
  { lyric: "do",     note: "F4",  beats: 1.5 },
  { lyric: "To",     note: "D4",  beats: 0.5 },

  { lyric: "live",   note: "B5",  beats: 1   },
  { lyric: "with",   note: "B5",  beats: 1   },
  { lyric: "him",    note: "B5",  beats: 1   },
  { lyric: "some-",  note: "B5",  beats: 1   },
  { lyric: "day.",   note: "C4",  beats: 4   },
];

// ─────────────────────────────────────────
// 🎵 TENOR — independent beats
// ─────────────────────────────────────────
export const TENOR = [
  { lyric: "I",      note: "G5",  beats: 1   },
  { lyric: "am",     note: "G5",  beats: 0.5 },
  { lyric: "a",      note: "G5",  beats: 0.5 },
  { lyric: "child",  note: "A5",  beats: 1   },
  { lyric: "of",     note: "B5",  beats: 1   },
  { lyric: "God",    note: "G5",  beats: 3   },

  { lyric: "And",    note: "C4",  beats: 1   },
  { lyric: "he",     note: "C4",  beats: 1   },
  { lyric: "has",    note: "C4",  beats: 1   },
  { lyric: "sent",   note: "A5",  beats: 1   },
  { lyric: "me",     note: "B5",  beats: 1   },
  { lyric: "here,",  note: "C4",  beats: 3   },

  { lyric: "Has",    note: "C4",  beats: 1   },
  { lyric: "giv-",   note: "E5",  beats: 1   },
  { lyric: "-en",    note: "E5",  beats: 1   },
  { lyric: "me",     note: "A5",  beats: 1   },
  { lyric: "an",     note: "A5",  beats: 1   },

  { lyric: "earth-", note: "A5",  beats: 1   },
  { lyric: "-ly",    note: "A5",  beats: 1   },
  { lyric: "home",   note: "A5",  beats: 1.5 },
  { lyric: "With",   note: "G5",  beats: 0.5 },

  { lyric: "par-",   note: "F#5", beats: 1   },
  { lyric: "-ents",  note: "F#5", beats: 1   },
  { lyric: "kind",   note: "C4",  beats: 1   },
  { lyric: "and",    note: "C4",  beats: 1   },
  { lyric: "dear.",  note: "B5",  beats: 4   },

  { lyric: "Lead",   note: "G5",  beats: 1   },
  { lyric: "me,",    note: "G5",  beats: 1   },
  { lyric: "guide",  note: "G5",  beats: 1   },
  { lyric: "me,",    note: "G5",  beats: 1   },

  { lyric: "walk",   note: "B5",  beats: 1   },
  { lyric: "be-",    note: "B5",  beats: 1   },
  { lyric: "side",   note: "B5",  beats: 1   },
  { lyric: "me,",    note: "B5",  beats: 1   },

  { lyric: "Help",   note: "D5",  beats: 1   },
  { lyric: "me",     note: "D5",  beats: 1   },
  { lyric: "find",   note: "G5",  beats: 1.5 },
  { lyric: "the",    note: "G5",  beats: 0.5 },
  { lyric: "way.",   note: "G5",  beats: 4   },

  { lyric: "Teach",  note: "G5",  beats: 1   },
  { lyric: "me",     note: "G5",  beats: 1   },
  { lyric: "all",    note: "A#5", beats: 1   },
  { lyric: "that",   note: "A#5", beats: 1   },

  { lyric: "I",      note: "A5",  beats: 1   },
  { lyric: "must",   note: "A5",  beats: 1   },
  { lyric: "do",     note: "A5",  beats: 1.5 },
  { lyric: "To",     note: "A5",  beats: 0.5 },

  { lyric: "live",   note: "G5",  beats: 1   },
  { lyric: "with",   note: "G5",  beats: 1   },
  { lyric: "him",    note: "G5",  beats: 1   },
  { lyric: "some-",  note: "F5",  beats: 1   },
  { lyric: "day.",   note: "E5",  beats: 4   },
];

// ─────────────────────────────────────────
// 🎵 BASS — independent beats
// ─────────────────────────────────────────
export const BASS = [
  { lyric: "I",      note: "C5",  beats: 1   },
  { lyric: "am",     note: "C5",  beats: 0.5 },
  { lyric: "a",      note: "C5",  beats: 0.5 },
  { lyric: "child",  note: "C5",  beats: 1   },
  { lyric: "of",     note: "C5",  beats: 1   },
  { lyric: "God",    note: "C5",  beats: 3   },

  { lyric: "And",    note: "E5",  beats: 1   },
  { lyric: "he",     note: "F5",  beats: 1   },
  { lyric: "has",    note: "F5",  beats: 1   },
  { lyric: "sent",   note: "A5",  beats: 1   },
  { lyric: "me",     note: "B5",  beats: 1   },
  { lyric: "here,",  note: "C4",  beats: 3   },

  { lyric: "Has",    note: "C4",  beats: 1   },
  { lyric: "giv-",   note: "A6",  beats: 1   },
  { lyric: "-en",    note: "A6",  beats: 1   },
  { lyric: "me",     note: "A6",  beats: 1   },
  { lyric: "an",     note: "A6",  beats: 1   },

  { lyric: "earth-", note: "D5",  beats: 1   },
  { lyric: "-ly",    note: "D5",  beats: 1   },
  { lyric: "home",   note: "D5",  beats: 1.5 },
  { lyric: "With",   note: "D5",  beats: 0.5 },

  { lyric: "par-",   note: "D5",  beats: 1   },
  { lyric: "-ents",  note: "D5",  beats: 1   },
  { lyric: "kind",   note: "D5",  beats: 1   },
  { lyric: "and",    note: "D5",  beats: 1   },
  { lyric: "dear.",  note: "G5",  beats: 4   },

  { lyric: "Lead",   note: "C5",  beats: 1   },
  { lyric: "me,",    note: "C5",  beats: 1   },
  { lyric: "guide",  note: "C5",  beats: 1   },
  { lyric: "me,",    note: "C5",  beats: 1   },

  { lyric: "walk",   note: "G5",  beats: 1   },
  { lyric: "be-",    note: "G5",  beats: 1   },
  { lyric: "side",   note: "G5",  beats: 1   },
  { lyric: "me,",    note: "G5",  beats: 1   },

  { lyric: "Help",   note: "D5",  beats: 1   },
  { lyric: "me",     note: "D5",  beats: 1   },
  { lyric: "find",   note: "G6",  beats: 1.5 },
  { lyric: "the",    note: "G6",  beats: 0.5 },
  { lyric: "way.",   note: "C5",  beats: 4   },

  { lyric: "Teach",  note: "C5",  beats: 1   },
  { lyric: "me",     note: "C5",  beats: 1   },
  { lyric: "all",    note: "C5",  beats: 1   },
  { lyric: "that",   note: "C5",  beats: 1   },

  { lyric: "I",      note: "C5",  beats: 1   },
  { lyric: "must",   note: "C5",  beats: 1   },
  { lyric: "do",     note: "C5",  beats: 1.5 },
  { lyric: "To",     note: "C5",  beats: 0.5 },

  { lyric: "live",   note: "G5",  beats: 1   },
  { lyric: "with",   note: "G5",  beats: 1   },
  { lyric: "him",    note: "G6",  beats: 1   },
  { lyric: "some-",  note: "G6",  beats: 1   },
  { lyric: "day.",   note: "C5",  beats: 4   },
];

// ─────────────────────────────────────────
// 🔥 buildVoiceMelody
// Uses the voice's OWN beats — fully independent timing.
// ─────────────────────────────────────────
const buildVoiceMelody = (voiceNotes) => {
  let cursor = 0;
  return voiceNotes.map((n) => {
    const noteName = n.note.trim();
    const freq     = noteToFreq(noteName);
    const duration = n.beats * BEAT_MS;
    const startMs  = cursor;
    cursor += duration;
    return {
      lyric:   n.lyric,
      note:    noteName,
      freq,
      beats:   n.beats,
      startMs,
      endMs:   cursor,
    };
  });
};

// ─────────────────────────────────────────
// 🎯 FINAL VOICES OBJECT
// ─────────────────────────────────────────
export const VOICES = {
  soprano: buildVoiceMelody(SOPRANO),
  alto:    buildVoiceMelody(ALTO),
  tenor:   buildVoiceMelody(TENOR),
  bass:    buildVoiceMelody(BASS),
};

// Convenience export — soprano is the "default" melody
export const MELODY   = VOICES.soprano;
export const TOTAL_MS = MELODY[MELODY.length - 1].endMs;
