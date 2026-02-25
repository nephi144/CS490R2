// ─────────────────────────────────────────────────────────────
// musicMath.js
// Pure utility functions — no side effects, easy to unit test
// ─────────────────────────────────────────────────────────────

/**
 * Calculate cents error between a detected Hz and a target Hz.
 * 100 cents = 1 semitone. Positive = sharp, Negative = flat.
 * Returns null if inputs are invalid.
 */
export function getCentsError(detectedHz, targetHz) {
  if (!detectedHz || !targetHz || detectedHz <= 0 || targetHz <= 0) return null;
  return 1200 * Math.log2(detectedHz / targetHz);
}

/**
 * Score a single frame based on cents error.
 * Returns 0–100.
 */
export function scoreFromCents(cents) {
  if (cents === null) return null;
  const abs = Math.abs(cents);
  if (abs <= 20)  return 100;  // Nearly perfect
  if (abs <= 40)  return 90;   // Excellent
  if (abs <= 60)  return 75;   // Good
  if (abs <= 100) return 50;   // Fair
  if (abs <= 200) return 25;   // Off
  return 0;                    // Way off
}

/**
 * Average an array of per-frame scores into a single note score (0–100).
 */
export function averageScores(frameScores) {
  if (!frameScores || frameScores.length === 0) return 0;
  const sum = frameScores.reduce((a, b) => a + b, 0);
  return Math.round(sum / frameScores.length);
}

/**
 * Calculate the overall final score from per-note scores.
 * @param {Object} noteScores - { noteIndex: score }
 */
export function calculateFinalScore(noteScores) {
  const values = Object.values(noteScores);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Convert a frequency (Hz) to the nearest note name (e.g. "A4", "F#3").
 */
export function freqToNoteName(freq) {
  if (!freq || freq <= 0) return "—";
  const A4 = 440;
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const midi = Math.round(12 * Math.log2(freq / A4) + 69);
  const octave = Math.floor(midi / 12) - 1;
  return noteNames[((midi % 12) + 12) % 12] + octave;
}

/**
 * Format cents as a readable string: "+12¢", "-34¢"
 */
export function formatCents(cents) {
  if (cents === null) return "—";
  const rounded = Math.round(cents);
  return rounded > 0 ? `+${rounded}¢` : `${rounded}¢`;
}

/**
 * Determine tuning direction hint.
 */
export function tuningHint(cents) {
  if (cents === null) return "";
  const abs = Math.abs(cents);
  if (abs <= 25) return "✓ In tune!";
  return cents > 0 ? "Sing lower ↓" : "Sing higher ↑";
}
