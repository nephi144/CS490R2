// ─────────────────────────────────────────────────────────────
// melody.js — SATB with INDEPENDENT timing per voice
//
// Key: C major / G major (hymn style — "I Am a Child of God")
//
// Harmonic structure:
//   Phrase 1  (I am a child of God)      — C major tonic
//   Phrase 2  (And he has sent me here)  — G7 → C resolution
//   Phrase 3  (Has given me an)          — C major
//   Phrase 4  (earthly home With)        — F major (IV chord)
//   Phrase 5  (parents kind and dear)    — G major half-cadence
//   Phrase 6  (Lead me, guide me,)       — C major
//   Phrase 7  (walk beside me,)          — F major
//   Phrase 8  (Help me find the way.)    — G major → G cadence
//   Phrase 9  (Teach me all that)        — C major
//   Phrase 10 (I must do To)             — F major
//   Phrase 11 (live with him someday.)   — Authentic cadence → C
//
// Voice ranges used:
//   Soprano  C4–A5   (melody as written)
//   Alto     G3–D5   (inner harmony, mainly 3rds/6ths below soprano)
//   Tenor    C3–G4   (inner harmony, completes chord tones)
//   Bass     E2–C4   (roots + 5ths, strong cadential motion)
//
// Voice leading principles:
//   - Contrary/oblique motion preferred over parallel motion
//   - No parallel perfect 5ths or octaves between adjacent voices
//   - Stepwise motion where possible; leaps resolved by step
//   - Bass doubled at root on strong beats
//   - Each voice has independent beats (hymn allows voices to differ)
//
// Each voice uses buildVoiceMelody — no changes to architecture.
// ─────────────────────────────────────────────────────────────

import { noteToFreq } from "../utils/pitchUtils";

export const BPM     = 88;
export const BEAT_MS = (60 / BPM) * 1000;

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
// 🎵 SOPRANO  (C4–A5)
// The melody as written — unchanged.
// Total: 52 notes, 62 beats ≈ 42.3s
// ─────────────────────────────────────────
export const SOPRANO = [
  // ── Phrase 1: I am a child of God ─── C major (E=3rd, G=5th)
  { lyric: "I",      note: "E4", beats: 1   },
  { lyric: "am",     note: "E4", beats: 1   },
  { lyric: "a",      note: "E4", beats: 1   },
  { lyric: "child",  note: "F4", beats: 1   },
  { lyric: "of",     note: "G4", beats: 2   },
  { lyric: "God",    note: "E4", beats: 3   },

  // ── Phrase 2: And he has sent me here ─── G7 → C
  { lyric: "And",    note: "G4", beats: 1   },
  { lyric: "he",     note: "C5", beats: 1   },
  { lyric: "has",    note: "C5", beats: 1   },
  { lyric: "sent",   note: "B4", beats: 1   },
  { lyric: "me",     note: "A4", beats: 1   },
  { lyric: "here,",  note: "G4", beats: 2   },

  // ── Phrase 3: Has given me an ─── C major
  { lyric: "Has",    note: "G4", beats: 1   },
  { lyric: "giv-",   note: "G4", beats: 1   },
  { lyric: "-en",    note: "E4", beats: 1   },
  { lyric: "me",     note: "E4", beats: 1   },
  { lyric: "an",     note: "G4", beats: 1   },

  // ── Phrase 4: earthly home With ─── F major (IV)
  { lyric: "earth-", note: "G4", beats: 1   },
  { lyric: "-ly",    note: "F4", beats: 1   },
  { lyric: "home",   note: "F4", beats: 1.5 },
  { lyric: "With",   note: "E4", beats: 0.5 },

  // ── Phrase 5: parents kind and dear ─── G major half-cadence
  { lyric: "par-",   note: "E4", beats: 1   },
  { lyric: "-ents",  note: "D4", beats: 1   },
  { lyric: "kind",   note: "B4", beats: 1   },
  { lyric: "and",    note: "A4", beats: 1   },
  { lyric: "dear.",  note: "G4", beats: 3   },

  // ── Phrase 6: Lead me, guide me ─── C major
  { lyric: "Lead",   note: "E4", beats: 1   },
  { lyric: "me,",    note: "G4", beats: 1   },
  { lyric: "guide",  note: "E4", beats: 1   },
  { lyric: "me,",    note: "G4", beats: 1   },

  // ── Phrase 7: walk beside me ─── F major
  { lyric: "walk",   note: "G4", beats: 1   },
  { lyric: "be-",    note: "F4", beats: 1   },
  { lyric: "side",   note: "D4", beats: 1   },
  { lyric: "me,",    note: "F4", beats: 1   },

  // ── Phrase 8: Help me find the way ─── G major cadence
  { lyric: "Help",   note: "B4", beats: 1   },
  { lyric: "me",     note: "B4", beats: 1   },
  { lyric: "find",   note: "A4", beats: 1.5 },
  { lyric: "the",    note: "A4", beats: 0.5 },
  { lyric: "way.",   note: "G4", beats: 3   },

  // ── Phrase 9: Teach me all that ─── C major
  { lyric: "Teach",  note: "E4", beats: 1   },
  { lyric: "me",     note: "G4", beats: 1   },
  { lyric: "all",    note: "E4", beats: 1   },
  { lyric: "that",   note: "G4", beats: 1   },

  // ── Phrase 10: I must do To ─── F major
  { lyric: "I",      note: "C5", beats: 1   },
  { lyric: "must",   note: "A4", beats: 1   },
  { lyric: "do",     note: "F4", beats: 1.5 },
  { lyric: "To",     note: "D4", beats: 0.5 },

  // ── Phrase 11: live with him someday ─── Authentic cadence → C
  { lyric: "live",   note: "F4", beats: 1   },
  { lyric: "with",   note: "F4", beats: 1   },
  { lyric: "him",    note: "E4", beats: 1   },
  { lyric: "some-",  note: "D4", beats: 1   },
  { lyric: "day.",   note: "C4", beats: 3   },
];

// ─────────────────────────────────────────
// 🎵 ALTO  (G3–D5)
// Inner harmony — 3rds and 6ths below soprano.
// Moves in contrary motion to soprano where possible.
// Phrase 1: C major (C4/E4), Phrase 5/8: held notes for smoothness.
// Alto gets rhythmic variety: phrase 1 has the 0.5-beat split,
// phrases 5/8 use 4-beat holds (longer than soprano's 3-beat) for
// a warm sustained inner voice that supports the cadence.
// Total: 52 notes, 63 beats ≈ 43.0s
// ─────────────────────────────────────────
export const ALTO = [
  { lyric: "I", note: "C4", beats: 1 },
  { lyric: "am", note: "C4", beats: 0.5 },
  { lyric: "a", note: "C4", beats: 0.5 },
  { lyric: "child", note: "C4", beats: 1 },
  { lyric: "of", note: "D4", beats: 1 },
  { lyric: "God", note: "E4", beats: 3 },

  { lyric: "And", note: "E4", beats: 1 },
  { lyric: "he", note: "E4", beats: 1 },
  { lyric: "has", note: "F4", beats: 1 },
  { lyric: "sent", note: "D4", beats: 1 },
  { lyric: "me", note: "C4", beats: 1 },
  { lyric: "here,", note: "B3", beats: 2 },

  { lyric: "Has", note: "E4", beats: 1 },
  { lyric: "giv-", note: "E4", beats: 1 },
  { lyric: "-en", note: "C4", beats: 1 },
  { lyric: "me", note: "C4", beats: 1 },
  { lyric: "an", note: "E4", beats: 1 },

  { lyric: "earth-", note: "C4", beats: 1 },
  { lyric: "-ly", note: "C4", beats: 1 },
  { lyric: "home", note: "A3", beats: 1.5 },
  { lyric: "With", note: "C4", beats: 0.5 },

  { lyric: "par-", note: "D4", beats: 1 },
  { lyric: "-ents", note: "B3", beats: 1 },
  { lyric: "kind", note: "D4", beats: 1 },
  { lyric: "and", note: "C4", beats: 1 },
  { lyric: "dear.", note: "B3", beats: 4 },

  { lyric: "Lead", note: "C4", beats: 1 },
  { lyric: "me,", note: "E4", beats: 1 },
  { lyric: "guide", note: "C4", beats: 1 },
  { lyric: "me,", note: "E4", beats: 1 },

  { lyric: "walk", note: "C4", beats: 1 },
  { lyric: "be-", note: "C4", beats: 1 },
  { lyric: "side", note: "B3", beats: 1 },
  { lyric: "me,", note: "C4", beats: 1 },

  { lyric: "Help", note: "D4", beats: 1 },
  { lyric: "me", note: "D4", beats: 1 },
  { lyric: "find", note: "C4", beats: 1.5 },
  { lyric: "the", note: "B3", beats: 0.5 },
  { lyric: "way.", note: "B3", beats: 4 },

  { lyric: "Teach", note: "C4", beats: 1 },
  { lyric: "me", note: "E4", beats: 1 },
  { lyric: "all", note: "C4", beats: 1 },
  { lyric: "that", note: "E4", beats: 1 },

  { lyric: "I", note: "A3", beats: 1 },
  { lyric: "must", note: "F4", beats: 1 },
  { lyric: "do", note: "D4", beats: 1.5 },
  { lyric: "To", note: "A3", beats: 0.5 },

  { lyric: "live", note: "A3", beats: 1 },
  { lyric: "with", note: "G3", beats: 1 },
  { lyric: "him", note: "G3", beats: 1 },
  { lyric: "some-", note: "G3", beats: 1 },
  { lyric: "day.", note: "G3", beats: 4 },
];

// ─────────────────────────────────────────
// 🎵 TENOR  (C3–G4)
// Inner harmony — below alto, above bass.
// Completes the SATB chord by filling missing chord tones.
// Phrase 1: G3 (5th of C), Phrase 2: stepwise B3→C4→G3 descent.
// Gets the most rhythmic variety — phrase 1 has the 0.5-beat split
// (same as alto), other phrases move more independently.
// Total: 52 notes, 63 beats ≈ 43.0s
// ─────────────────────────────────────────
export const TENOR = [
  { lyric: "I", note: "G3", beats: 1 },
  { lyric: "am", note: "G3", beats: 0.5 },
  { lyric: "a", note: "G3", beats: 0.5 },
  { lyric: "child", note: "A3", beats: 1 },
  { lyric: "of", note: "B3", beats: 1 },
  { lyric: "God", note: "G3", beats: 3 },

  { lyric: "And", note: "B3", beats: 1 },
  { lyric: "he", note: "C4", beats: 1 },
  { lyric: "has", note: "C4", beats: 1 },
  { lyric: "sent", note: "B3", beats: 1 },
  { lyric: "me", note: "A3", beats: 1 },
  { lyric: "here,", note: "G3", beats: 2 },

  { lyric: "Has", note: "C4", beats: 1 },
  { lyric: "giv-", note: "B3", beats: 1 },
  { lyric: "-en", note: "G3", beats: 1 },
  { lyric: "me", note: "G3", beats: 1 },
  { lyric: "an", note: "C4", beats: 1 },

  { lyric: "earth-", note: "E3", beats: 1 },
  { lyric: "-ly", note: "F3", beats: 1 },
  { lyric: "home", note: "F3", beats: 1.5 },
  { lyric: "With", note: "G3", beats: 0.5 },

  { lyric: "par-", note: "G3", beats: 1 },
  { lyric: "-ents", note: "G3", beats: 1 },
  { lyric: "kind", note: "G3", beats: 1 },
  { lyric: "and", note: "F3", beats: 1 },
  { lyric: "dear.", note: "G3", beats: 4 },

  { lyric: "Lead", note: "G3", beats: 1 },
  { lyric: "me,", note: "C4", beats: 1 },
  { lyric: "guide", note: "G3", beats: 1 },
  { lyric: "me,", note: "C4", beats: 1 },

  { lyric: "walk", note: "E3", beats: 1 },
  { lyric: "be-", note: "F3", beats: 1 },
  { lyric: "side", note: "F3", beats: 1 },
  { lyric: "me,", note: "A3", beats: 1 },

  { lyric: "Help", note: "G3", beats: 1 },
  { lyric: "me", note: "G3", beats: 1 },
  { lyric: "find", note: "F3", beats: 1.5 },
  { lyric: "the", note: "E3", beats: 0.5 },
  { lyric: "way.", note: "D3", beats: 4 },

  { lyric: "Teach", note: "G3", beats: 1 },
  { lyric: "me", note: "C4", beats: 1 },
  { lyric: "all", note: "G3", beats: 1 },
  { lyric: "that", note: "B3", beats: 1 },

  { lyric: "I", note: "E3", beats: 1 },
  { lyric: "must", note: "C4", beats: 1 },
  { lyric: "do", note: "A3", beats: 1.5 },
  { lyric: "To", note: "F3", beats: 0.5 },

  { lyric: "live", note: "A3", beats: 1 },
  { lyric: "with", note: "A3", beats: 1 },
  { lyric: "him", note: "G3", beats: 1 },
  { lyric: "some-", note: "F3", beats: 1 },
  { lyric: "day.", note: "E3", beats: 4 },
];
// ─────────────────────────────────────────
// 🎵 BASS  (E2–C4)
// Functional bass line — roots and 5ths on strong beats,
// stepwise passing tones on weak beats.
// Provides the harmonic foundation that defines each chord.
// Phrase endings: authentic cadence G2→C3 on "dear.", "way.", "day."
// Phrase 1 has the 0.5-beat rhythmic split (matches upper voices).
// Total: 52 notes, 63 beats ≈ 43.0s
// ─────────────────────────────────────────
export const BASS = [
  { lyric: "I", note: "C3", beats: 1 },
  { lyric: "am", note: "C3", beats: 0.5 },
  { lyric: "a", note: "C3", beats: 0.5 },
  { lyric: "child", note: "C3", beats: 1 },
  { lyric: "of", note: "G2", beats: 1 },
  { lyric: "God", note: "C3", beats: 3 },

  { lyric: "And", note: "G2", beats: 1 },
  { lyric: "he", note: "C3", beats: 1 },
  { lyric: "has", note: "F2", beats: 1 },
  { lyric: "sent", note: "G2", beats: 1 },
  { lyric: "me", note: "F2", beats: 1 },
  { lyric: "here,", note: "G2", beats: 2 },

  { lyric: "Has", note: "C3", beats: 1 },
  { lyric: "giv-", note: "B2", beats: 1 },
  { lyric: "-en", note: "C3", beats: 1 },
  { lyric: "me", note: "C3", beats: 1 },
  { lyric: "an", note: "C3", beats: 1 },

  { lyric: "earth-", note: "F2", beats: 1 },
  { lyric: "-ly", note: "F2", beats: 1 },
  { lyric: "home", note: "F2", beats: 1.5 },
  { lyric: "With", note: "C3", beats: 0.5 },

  { lyric: "par-", note: "G2", beats: 1 },
  { lyric: "-ents", note: "G2", beats: 1 },
  { lyric: "kind", note: "G2", beats: 1 },
  { lyric: "and", note: "D3", beats: 1 },
  { lyric: "dear.", note: "G2", beats: 4 },

  { lyric: "Lead", note: "C3", beats: 1 },
  { lyric: "me,", note: "C3", beats: 1 },
  { lyric: "guide", note: "C3", beats: 1 },
  { lyric: "me,", note: "C3", beats: 1 },

  { lyric: "walk", note: "C3", beats: 1 },
  { lyric: "be-", note: "F2", beats: 1 },
  { lyric: "side", note: "G2", beats: 1 },
  { lyric: "me,", note: "F2", beats: 1 },

  { lyric: "Help", note: "G2", beats: 1 },
  { lyric: "me", note: "G2", beats: 1 },
  { lyric: "find", note: "G2", beats: 1.5 },
  { lyric: "the", note: "G2", beats: 0.5 },
  { lyric: "way.", note: "G2", beats: 4 },

  { lyric: "Teach", note: "C3", beats: 1 },
  { lyric: "me", note: "C3", beats: 1 },
  { lyric: "all", note: "C3", beats: 1 },
  { lyric: "that", note: "C3", beats: 1 },

  { lyric: "I", note: "F2", beats: 1 },
  { lyric: "must", note: "F2", beats: 1 },
  { lyric: "do", note: "F2", beats: 1.5 },
  { lyric: "To", note: "F2", beats: 0.5 },

  { lyric: "live", note: "F2", beats: 1 },
  { lyric: "with", note: "E2", beats: 1 },
  { lyric: "him", note: "G2", beats: 1 },
  { lyric: "some-", note: "G2", beats: 1 },
  { lyric: "day.", note: "C3", beats: 4 },
];
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
