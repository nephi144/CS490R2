// ─────────────────────────────────────────────────────────────
// "I Am a Child of God" — Key of F Major, 3/4 time
// ─────────────────────────────────────────────────────────────

import { noteToFreq } from "../utils/pitchUtils";
export const BPM = 88;
export const BEAT_MS = (60 / BPM) * 1000;

export const RAW_MELODY = [
  { lyric: "I",     note: "E4", beats: 1 },
  { lyric: "am",    note: "E4", beats: 1 },
  { lyric: "a",     note: "E4", beats: 1 },
  { lyric: "child", note: "F4", beats: 1 },
  { lyric: "of",    note: "G4", beats: 2 },
  { lyric: "God",   note: "E4", beats: 3 },
  

  { lyric: "And",   note: "G4", beats: 1 },
  { lyric: "he",    note: "C5", beats: 1 },
  { lyric: "has",   note: "C5", beats: 1 },
  { lyric: "sent",  note: "B4", beats: 1 },
  { lyric: "me",    note: "A4", beats: 1 },
  { lyric: "here,", note: "G4", beats: 2 },
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

// Build cumulative startMs / endMs for each note
let cursor = 0;

export const MELODY = RAW_MELODY.map((n) => {
  const startMs = cursor;
  const duration = n.beats * BEAT_MS;
  cursor += duration;

  return {
    ...n,
    freq: noteToFreq(n.note), // ✅ Automatically calculated
    startMs,
    endMs: cursor,
  };
});

export const TOTAL_MS = cursor;