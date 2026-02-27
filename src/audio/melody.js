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