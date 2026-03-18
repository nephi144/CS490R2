// ─────────────────────────────────────────
// melody.js (FINAL SIMPLE VERSION)
// ─────────────────────────────────────────

// 🎵 Bass (already done)
export const BASS = [
  { freq: 130.81, duration: 2 },
  { freq: 130.81, duration: 2 },
  { freq: 130.81, duration: 3 },
  { freq: 164.81, duration: 1 },
  { freq: 174.61, duration: 2 },
  { freq: 220.00, duration: 1 },
  { freq: 246.94, duration: 1 },
  { freq: 261.63, duration: 3 },
  { freq: 110.00, duration: 2 },
  { freq: 110.00, duration: 2 },
  { freq: 146.83, duration: 2 },
  { freq: 146.83, duration: 2 },
  { freq: 196.00, duration: 3 },
  { freq: 130.81, duration: 2 },
  { freq: 130.81, duration: 2 },
  { freq: 196.00, duration: 2 },
  { freq: 98.00,  duration: 2 },
  { freq: 130.81, duration: 3 },
];

// 🎵 Alto (converted from your XML)
export const ALTO = [
  { freq: 261.63, duration: 1 }, // C4
  { freq: 261.63, duration: 0.5 },
  { freq: 261.63, duration: 0.5 },
  { freq: 261.63, duration: 1 },
  { freq: 293.66, duration: 1 },

  { freq: 261.63, duration: 3 },
  { freq: 392.00, duration: 1 },

  { freq: 440.00, duration: 1.5 },
  { freq: 440.00, duration: 0.5 },
  { freq: 392.00, duration: 1 },
  { freq: 349.23, duration: 1 },

  { freq: 329.63, duration: 3 },
  { freq: 392.00, duration: 1 },

  { freq: 277.18, duration: 2 }, // C#4
  { freq: 277.18, duration: 2 },

  { freq: 329.63, duration: 1 },
  { freq: 293.66, duration: 1 },
  { freq: 293.66, duration: 1.5 },
  { freq: 329.63, duration: 0.5 },

  { freq: 261.63, duration: 2 },
  { freq: 369.99, duration: 2 }, // F#4

  { freq: 293.66, duration: 3 },

  { freq: 261.63, duration: 1 },
  { freq: 392.00, duration: 1 },
  { freq: 261.63, duration: 1 },
  { freq: 392.00, duration: 1 },

  { freq: 329.63, duration: 1 },
  { freq: 293.66, duration: 1 },
  { freq: 293.66, duration: 1 },
  { freq: 349.23, duration: 1 },

  { freq: 349.23, duration: 1 },
  { freq: 349.23, duration: 1 },
  { freq: 349.23, duration: 1.5 },
  { freq: 349.23, duration: 0.5 },

  { freq: 329.63, duration: 3 },

  { freq: 261.63, duration: 1 },
  { freq: 392.00, duration: 1 },
  { freq: 261.63, duration: 1 },
  { freq: 392.00, duration: 1 },

  { freq: 349.23, duration: 1 },
  { freq: 440.00, duration: 1 },
  { freq: 349.23, duration: 1.5 },
  { freq: 293.66, duration: 0.5 },

  { freq: 246.94, duration: 1 },
  { freq: 246.94, duration: 1 },
  { freq: 246.94, duration: 2 },

  { freq: 261.63, duration: 3 },
];

// 🎵 Tenor (converted from your XML)
export const TENOR = [
  { freq: 196.00, duration: 2 }, // G3
  { freq: 220.00, duration: 1 }, // A3
  { freq: 246.94, duration: 1 }, // B3

  { freq: 196.00, duration: 3 },
  { freq: 261.63, duration: 1 },

  { freq: 261.63, duration: 2 },
  { freq: 220.00, duration: 1 },
  { freq: 246.94, duration: 1 },

  { freq: 261.63, duration: 3 },

  { freq: 164.81, duration: 2 }, // E3
  { freq: 220.00, duration: 2 },

  { freq: 220.00, duration: 2 },
  { freq: 220.00, duration: 1.5 },
  { freq: 196.00, duration: 0.5 },

  { freq: 185.00, duration: 2 }, // F#3
  { freq: 261.63, duration: 2 },

  { freq: 246.94, duration: 3 },

  { freq: 196.00, duration: 2 },
  { freq: 196.00, duration: 2 },

  { freq: 246.94, duration: 2 },
  { freq: 246.94, duration: 2 },

  { freq: 146.83, duration: 2 },
  { freq: 196.00, duration: 2 },

  { freq: 196.00, duration: 3 },

  { freq: 196.00, duration: 2 },
  { freq: 233.08, duration: 2 }, // Bb3

  { freq: 220.00, duration: 3 },

  { freq: 196.00, duration: 2 },
  { freq: 196.00, duration: 1 },
  { freq: 174.61, duration: 1 },

  { freq: 164.81, duration: 3 },
];

// 🎯 Voice selector
export const VOICES = {
  bass: BASS,
  alto: ALTO,
  tenor: TENOR,
};