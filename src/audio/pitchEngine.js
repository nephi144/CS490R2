// ─────────────────────────────────────────────────────────────
// pitchEngine.js
// McLeod Pitch Method (MPM) — inline, no external library needed
// ─────────────────────────────────────────────────────────────

let analyserNode = null;
let rafId = null;

// ── MPM Core ──────────────────────────────────────────────────
function detectPitchMPM(buffer, sampleRate) {
  const SIZE = buffer.length;
  const CUTOFF = 0.97;
  const SMALL_CUTOFF = 0.5;
  const LOWER_PITCH_CUTOFF = 80;

  // Normalized square difference function (NSDF)
  const nsdf = new Float32Array(SIZE);
  for (let tau = 0; tau < SIZE; tau++) {
    let acf = 0, div = 0;
    for (let i = 0; i < SIZE - tau; i++) {
      acf += buffer[i] * buffer[i + tau];
      div += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
    }
    nsdf[tau] = div === 0 ? 0 : (2 * acf) / div;
  }

  // Find key maxima
  const maxPositions = [];
  let pos = 0, curMaxPos = 0;
  const limit = (SIZE - 1) / 3;

  while (pos < limit && nsdf[pos] > 0) pos++;
  while (pos < limit && nsdf[pos] <= 0) pos++;

  while (pos < limit) {
    if (nsdf[pos] > nsdf[pos - 1] && nsdf[pos] >= nsdf[pos + 1]) {
      if (curMaxPos === 0 || nsdf[pos] > nsdf[curMaxPos]) curMaxPos = pos;
    }
    pos++;
    if (pos < limit && nsdf[pos] <= 0) {
      if (curMaxPos > 0) maxPositions.push(curMaxPos);
      curMaxPos = 0;
      while (pos < limit && nsdf[pos] <= 0) pos++;
    }
  }
  if (curMaxPos > 0) maxPositions.push(curMaxPos);
  if (maxPositions.length === 0) return { freq: 0, clarity: 0 };

  const highestMax = maxPositions.reduce((a, b) => (nsdf[a] > nsdf[b] ? a : b));
  const threshold = nsdf[highestMax] * CUTOFF;

  let chosenPeriod = -1;
  for (const mp of maxPositions) {
    if (nsdf[mp] >= threshold) { chosenPeriod = mp; break; }
  }
  if (chosenPeriod < 0 || nsdf[chosenPeriod] < SMALL_CUTOFF) return { freq: 0, clarity: 0 };

  // Parabolic interpolation for sub-sample accuracy
  const x0 = chosenPeriod < 1 ? chosenPeriod : chosenPeriod - 1;
  const x2 = chosenPeriod + 1 < SIZE ? chosenPeriod + 1 : chosenPeriod;
  let betterPeriod;
  if (x0 === chosenPeriod) {
    betterPeriod = nsdf[chosenPeriod] <= nsdf[x2] ? chosenPeriod : x2;
  } else if (x2 === chosenPeriod) {
    betterPeriod = nsdf[chosenPeriod] <= nsdf[x0] ? chosenPeriod : x0;
  } else {
    const s0 = nsdf[x0], s1 = nsdf[chosenPeriod], s2 = nsdf[x2];
    betterPeriod = chosenPeriod + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
  }

  const freq = sampleRate / betterPeriod;
  const clarity = nsdf[chosenPeriod];

  if (freq < LOWER_PITCH_CUTOFF || freq > 1200) return { freq: 0, clarity: 0 };
  return { freq, clarity };
}

// ── Public API ────────────────────────────────────────────────

/**
 * Start microphone and pitch detection loop.
 * @param {AudioContext} audioCtx - existing AudioContext from useAudio
 * @param {(freq: number, clarity: number) => void} onPitch - callback per frame
 */
export function startPitchLoop(audioCtx, analyser, onPitch) {
  analyserNode = analyser;
  const buf = new Float32Array(analyser.fftSize);
  const sampleRate = audioCtx.sampleRate;

  function loop() {
    analyserNode.getFloatTimeDomainData(buf);

    // RMS noise gate — ignore silence/background noise
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / buf.length);

    if (rms > 0.01) {
      const { freq, clarity } = detectPitchMPM(buf, sampleRate);
      // Clarity threshold: raise to 0.90 in noisy environments
      if (clarity > 0.80 && freq > 0) {
        onPitch(freq, clarity);
      } else {
        onPitch(0, clarity);
      }
    } else {
      onPitch(0, 0);
    }

    rafId = requestAnimationFrame(loop);
  }

  loop();
}

export function stopPitchLoop() {
  cancelAnimationFrame(rafId);
  rafId = null;
}
