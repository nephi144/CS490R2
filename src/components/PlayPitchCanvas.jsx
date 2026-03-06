// ─────────────────────────────────────────────────────────────
// components/PlayPitchCanvas.jsx  (FIXED)
//
// BUGS FIXED:
//   1. ResizeObserver was setting canvas.width directly, which
//      clears the pixel buffer but does NOT trigger useEffect.
//      Fix: ResizeObserver now sets a React state variable so
//      useEffect re-runs and redraws after every resize.
//   2. Idle hint "Melody will appear when session starts" was
//      hiding the blue guide. Blue guide now renders always —
//      before, during, and after singing.
//   3. Blue guide used thin rgba(147,197,253,0.55) — too faint
//      on dark background. Now uses solid bright #60a5fa / #93c5fd.
//   4. Moving blue dot added: advances with elapsedSec, independent
//      of mic input. Visible even before user sings.
//
// DRAW ORDER (painter's algorithm — back to front):
//   1. Background
//   2. Pitch grid lines + labels
//   3. Blue target melody (always, no conditions)
//   4. Moving blue playhead dot
//   5. Green/red live pitch trail (only when mic active)
//   6. Live pitch ball
//   7. Legend
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useMemo, useState } from "react";
import { getCentsError } from "../utils/musicMath.js";

// ── Log-scale Hz → Y ──────────────────────────────────────────
function hzToY(hz, minHz, maxHz, H, padY) {
  const logMin = Math.log2(minHz);
  const logMax = Math.log2(maxHz);
  const ratio  = (Math.log2(Math.max(hz, minHz)) - logMin) / (logMax - logMin);
  return H - padY - ratio * (H - padY * 2);
}

function hzToLabel(hz) {
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const midi  = Math.round(12 * Math.log2(hz / 440) + 69);
  return names[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

export default function PlayPitchCanvas({
  notes,
  activeNoteIndex,
  pitchHistory,
  elapsedSec,
  height = 380,       // increased default
  isPlaying = false,
  previewProgress = 0, 
}) {
  const canvasRef  = useRef(null);
  const wrapRef    = useRef(null);
  // FIX 1: track canvas width as React state so ResizeObserver
  // triggers a real re-render + useEffect redraw
  const [canvasW, setCanvasW] = useState(800);

  const { freqMin, freqMax, totalDur } = useMemo(() => {
    if (!notes?.length) return { freqMin: 280, freqMax: 520, totalDur: 10 };
    const freqs = notes.map(n => n.freq);
    const pad   = Math.pow(2, 2.5 / 12);
    return {
      freqMin:  Math.min(...freqs) / pad,
      freqMax:  Math.max(...freqs) * pad,
      totalDur: notes[notes.length - 1].time + notes[notes.length - 1].duration,
    };
  }, [notes]);

  // ── Main draw effect ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;

    // Use React-tracked width (avoids stale closure on resize)
    const W = canvasW;
    const H = height;
    canvas.width  = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");

    const PAD_LEFT  = 48;
    const PAD_RIGHT = 20;
    const PAD_Y     = 24;
    const drawW     = W - PAD_LEFT - PAD_RIGHT;

    const toX = (sec) => PAD_LEFT + (sec / totalDur) * drawW;
    const toY = (hz)  => hzToY(hz, freqMin, freqMax, H, PAD_Y);

    // ── 1. Background ─────────────────────────────────────────
    ctx.fillStyle = "#060d1a";
    ctx.fillRect(0, 0, W, H);

    // ── 2. Pitch grid lines ───────────────────────────────────
    if (notes?.length) {
      const uniqueFreqs = [...new Set(notes.map(n => n.freq))].sort((a, b) => a - b);
      uniqueFreqs.forEach(freq => {
        const y = toY(freq);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth   = 1;
        ctx.setLineDash([3, 8]);
        ctx.moveTo(PAD_LEFT, y);
        ctx.lineTo(W - PAD_RIGHT, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle    = "rgba(255,255,255,0.28)";
        ctx.font         = "10px 'Courier New', monospace";
        ctx.textAlign    = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(hzToLabel(freq), PAD_LEFT - 6, y);
      });
      ctx.textAlign    = "left";
      ctx.textBaseline = "alphabetic";
    }

    // ── 3. BLUE TARGET MELODY — always visible, no conditions ──
    // FIX 2: removed all guards. Draws before session, during, after.
    // FIX 3: bright solid colours instead of low-opacity rgba.
    if (notes?.length) {
      notes.forEach((n, i) => {
        const x1       = toX(n.time);
        const x2       = toX(n.time + n.duration);
        const y        = toY(n.freq);
        const segW     = x2 - x1;
        const isActive = i === activeNoteIndex;
        const isPast   = activeNoteIndex > 0 && i < activeNoteIndex;

        // ── Thick horizontal note bar ─────────────────────────
        ctx.beginPath();
        ctx.lineCap     = "round";
        ctx.lineWidth   = isActive ? 6 : 4;
        // Bright blue always — active brighter, past slightly dimmer
        ctx.strokeStyle = isActive ? "#60a5fa"   // bright active blue
                        : isPast   ? "#3b82f6"   // slightly dimmer past
                        :            "#93c5fd";  // future blue
        ctx.moveTo(x1 + 3, y);
        ctx.lineTo(x2 - 3, y);
        ctx.stroke();
// 🔥 Animated progress fill (Tutorial + Singing)
if (i === activeNoteIndex) {

  let progress = 0;

  if (isPlaying) {
    // Singing mode (real-time fill)
    const noteStart = n.time;
    const noteEnd   = n.time + n.duration;
    const noteLen   = noteEnd - noteStart;

    if (elapsedSec >= noteStart) {
      progress = Math.min(
        (elapsedSec - noteStart) / noteLen,
        1
      );
    }

  } else {
    // Tutorial preview mode
    progress = previewProgress;
  }

  if (progress > 0) {
    const progressX = x1 + (x2 - x1) * progress;

    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineWidth = 6;

    ctx.strokeStyle = "#facc15";   // gold progress
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 18;

    ctx.moveTo(x1 + 3, y);
    ctx.lineTo(progressX - 3, y);
    ctx.stroke();

    ctx.shadowBlur = 0;
  }
}

        // Glow on active note
        if (isActive) {
          ctx.shadowColor = "rgba(96,165,250,0.8)";
          ctx.shadowBlur  = 16;
          ctx.beginPath();
          ctx.moveTo(x1 + 3, y);
          ctx.lineTo(x2 - 3, y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // ── Diagonal connector to next note ──────────────────
        if (i < notes.length - 1) {
          const nextY = toY(notes[i + 1].freq);
          ctx.beginPath();
          ctx.strokeStyle = "rgba(147,197,253,0.25)";
          ctx.lineWidth   = 1.5;
          ctx.setLineDash([2, 5]);
          ctx.moveTo(x2, y);
          ctx.lineTo(toX(notes[i + 1].time), nextY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // ── Note name label ───────────────────────────────────
        if (segW > 24) {
          ctx.fillStyle    = isActive ? "#93c5fd" : "rgba(147,197,253,0.6)";
          ctx.font         = `${isActive ? "bold " : ""}10px 'Courier New', monospace`;
          ctx.textAlign    = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(n.note, x1 + segW / 2, y - 8);
          ctx.textBaseline = "alphabetic";
          ctx.textAlign    = "left";
        }
      });

      // ── 4. MOVING BLUE DOT — advances with elapsedSec ────────
      // Independent of mic. Visible before user sings.
      // X = playback position, Y = current target note pitch
      const clampedSec = Math.min(Math.max(elapsedSec, 0), totalDur);
      const dotX = toX(clampedSec);

      // Find which note we're currently on for Y position
      const currentNote = notes.find(n =>
        clampedSec >= n.time && clampedSec < n.time + n.duration
      ) ?? (clampedSec <= 0 ? notes[0] : notes[notes.length - 1]);

      const dotY = toY(currentNote.freq);

      // Vertical playhead line
      ctx.beginPath();
      ctx.strokeStyle = "rgba(147,197,253,0.2)";
      ctx.lineWidth   = 1;
      ctx.moveTo(dotX, PAD_Y);
      ctx.lineTo(dotX, H - PAD_Y);
      ctx.stroke();

      // The dot itself — bright blue, pulsing via shadowBlur
      ctx.shadowColor = "rgba(96,165,250,0.9)";
      ctx.shadowBlur  = 18;
      ctx.beginPath();
      ctx.arc(dotX, dotY, isPlaying ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isPlaying ? "#60a5fa" : "#93c5fd";
      ctx.fill();
      ctx.shadowBlur = 0;

      // Small "TARGET" label above dot when playing
      if (isPlaying && elapsedSec > 0) {
        ctx.fillStyle    = "rgba(147,197,253,0.7)";
        ctx.font         = "bold 9px 'Courier New', monospace";
        ctx.textAlign    = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("TARGET", dotX, dotY - 11);
        ctx.textBaseline = "alphabetic";
        ctx.textAlign    = "left";
      }
    }

    // ── 5. GREEN/RED LIVE PITCH TRAIL ─────────────────────────
    const validPoints = (pitchHistory || []).filter(p => p.hz > 0);
    if (validPoints.length > 1) {
      const elapsedX  = Math.min(toX(Math.max(elapsedSec, 0.01)), W - PAD_RIGHT);
      const lastHz    = validPoints[validPoints.length - 1].hz;
      const targetHz  = activeNoteIndex >= 0 ? notes?.[activeNoteIndex]?.freq : null;
      const centsOff  = targetHz ? Math.abs(getCentsError(lastHz, targetHz) ?? 999) : 999;
      const inTune    = centsOff < 50;

      // Draw trail — colour per-segment based on accuracy
      // Split trail into segments coloured individually
      ctx.lineWidth = 3;
      ctx.lineJoin  = "round";
      ctx.lineCap   = "round";

      for (let i = 1; i < validPoints.length; i++) {
        const prev = validPoints[i - 1];
        const cur  = validPoints[i];
        const frac0 = (i - 1) / (validPoints.length - 1);
        const frac1 = i       / (validPoints.length - 1);
        const x0 = PAD_LEFT + frac0 * (elapsedX - PAD_LEFT);
        const x1 = PAD_LEFT + frac1 * (elapsedX - PAD_LEFT);
        const y0 = toY(prev.hz);
        const y1 = toY(cur.hz);

        // Per-segment colour based on accuracy
        const segCents = targetHz
          ? Math.abs(getCentsError(cur.hz, targetHz) ?? 999) : 999;
        const segColor = segCents < 30  ? "#4ade80"
                       : segCents < 60  ? "#fbbf24"
                       :                  "#f87171";

        ctx.beginPath();
        ctx.strokeStyle = segColor;
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      // Glow pass over the whole trail
      ctx.beginPath();
      ctx.lineWidth   = 2;
      ctx.strokeStyle = inTune ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.18)";
      ctx.shadowColor = inTune ? "rgba(74,222,128,0.4)"  : "rgba(248,113,113,0.3)";
      ctx.shadowBlur  = 8;
      validPoints.forEach((p, i) => {
        const frac = i / (validPoints.length - 1);
        const x    = PAD_LEFT + frac * (elapsedX - PAD_LEFT);
        const y    = toY(p.hz);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── 6. Live pitch ball ────────────────────────────────────
      const ballX     = elapsedX;
      const ballY     = toY(lastHz);
      const ballColor = centsOff < 30  ? "#4ade80"
                      : centsOff < 60  ? "#fbbf24"
                      :                  "#f87171";

      ctx.shadowColor = ballColor;
      ctx.shadowBlur  = 20;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 9, 0, Math.PI * 2);
      ctx.fillStyle = ballColor;
      ctx.fill();
      ctx.shadowBlur = 0;

      // "YOU" label
      ctx.fillStyle    = ballColor;
      ctx.font         = "bold 9px 'Courier New', monospace";
      ctx.textAlign    = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("YOU", ballX, ballY - 12);

      // Cents deviation
      if (targetHz) {
        const cents = getCentsError(lastHz, targetHz);
        if (cents !== null) {
          const label = cents > 0 ? `+${Math.round(cents)}¢` : `${Math.round(cents)}¢`;
          ctx.fillText(label, ballX, ballY - 22);
        }
      }
      ctx.textBaseline = "alphabetic";
      ctx.textAlign    = "left";
    }

    // ── 7. Legend ─────────────────────────────────────────────
    const legendItems = [
      { color: "#93c5fd", label: "Target melody" },
      { color: "#4ade80", label: "Your pitch — in tune" },
      { color: "#f87171", label: "Your pitch — off" },
    ];
    let lx = PAD_LEFT;
    legendItems.forEach(({ color, label }) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(lx + 5, H - 10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle    = "rgba(255,255,255,0.35)";
      ctx.font         = "9px 'Courier New', monospace";
      ctx.textBaseline = "middle";
      ctx.fillText(label, lx + 14, H - 10);
      lx += ctx.measureText(label).width + 32;
    });
    ctx.textBaseline = "alphabetic";

  // FIX 1: canvasW in dependency array — resize now triggers full redraw
  }, [notes, activeNoteIndex, pitchHistory, elapsedSec, isPlaying,
    previewProgress,
      freqMin, freqMax, totalDur, height, canvasW]);

  // FIX 1: ResizeObserver updates React state (triggers re-render+redraw)
  // instead of setting canvas.width directly (which only clears the buffer)
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        if (w > 0) setCanvasW(w);
      }
    });
    if (wrapRef.current) {
      obs.observe(wrapRef.current);
      // Set initial width
      setCanvasW(wrapRef.current.clientWidth || 800);
    }
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapRef} style={{ width: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height,
          borderRadius: 12,
          display: "block",
          border: "1px solid rgba(96,165,250,0.15)",  // subtle blue border
        }}
      />
    </div>
  );
}
