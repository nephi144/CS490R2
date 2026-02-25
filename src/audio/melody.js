// ─────────────────────────────────────────────────────────────
// melody.js
// "I Am a Child of God" — First Phrase, Key of F Major, 3/4 time
// ─────────────────────────────────────────────────────────────

export const BPM = 88;
export const BEAT_MS = (60 / BPM) * 1000;

export const RAW_MELODY = [
  // { lyric, note, freq (Hz), beats }
  { lyric: "I",     note: "F4",  freq: 349.23, beats: 1 },
  { lyric: "am",    note: "F4",  freq: 349.23, beats: 1 },
  { lyric: "a",     note: "F4",  freq: 349.23, beats: 1 },
  { lyric: "child", note: "G4",  freq: 392.00, beats: 1 },
  { lyric: "of",    note: "A4",  freq: 440.00, beats: 2 },
  { lyric: "God",   note: "F4",  freq: 349.23, beats: 3 },
];


// Build cumulative startMs / endMs for each note
let cursor = 0;
export const MELODY = RAW_MELODY.map((n) => {
  const startMs = cursor;
  cursor += n.beats * BEAT_MS;
  return { ...n, startMs, endMs: cursor };
});

export const TOTAL_MS = cursor;
