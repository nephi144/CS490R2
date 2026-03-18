// ─────────────────────────────────────────────────────────────
// components/PlayPitchCanvas.jsx
//
// Scrolling pitch canvas:
// - Melody scrolls right-to-left
// - Fixed playhead stays on screen
// - Blue target dot stays on playhead
// - Live pitch ball stays on playhead
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useMemo, useState } from "react";
import { getCentsError } from "../utils/musicMath.js";

// ── Log-scale Hz → Y ──────────────────────────────────────────
function hzToY(hz, minHz, maxHz, H, padY) {
  const logMin = Math.log2(minHz);
  const logMax = Math.log2(maxHz);
  const ratio = (Math.log2(Math.max(hz, minHz)) - logMin) / (logMax - logMin);
  return H - padY - ratio * (H - padY * 2);
}

function hzToLabel(hz) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const midi = Math.round(12 * Math.log2(hz / 440) + 69);
  return names[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

export default function PlayPitchCanvas({
  notes,
  activeNoteIndex,
  pitchHistory,
  elapsedSec,
  height = 380,
  isPlaying = false,
  previewProgress = 0,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [canvasW, setCanvasW] = useState(800);

  const { freqMin, freqMax, totalDur } = useMemo(() => {
    if (!notes?.length) {
      return { freqMin: 280, freqMax: 520, totalDur: 10 };
    }

    const freqs = notes.map((n) => n.freq);
    const pad = Math.pow(2, 2.5 / 12);

    return {
      freqMin: Math.min(...freqs) / pad,
      freqMax: Math.max(...freqs) * pad,
      totalDur: notes[notes.length - 1].endMs / 1000,
    };
  }, [notes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const W = canvasW;
    const H = height;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");

    const PAD_LEFT = 48;
    const PAD_RIGHT = 20;
    const PAD_Y = 24;
    const drawW = W - PAD_LEFT - PAD_RIGHT;

    const PLAYHEAD_X = PAD_LEFT + drawW * 0.22;
    const PX_PER_SEC = 140;

    const toX = (sec) => PLAYHEAD_X + (sec - elapsedSec) * PX_PER_SEC;
    const toY = (hz) => hzToY(hz, freqMin, freqMax, H, PAD_Y);

    // ── 1. Background ───────────────────────────────────────
    ctx.fillStyle = "#060d1a";
    ctx.fillRect(0, 0, W, H);

    // ── 2. Pitch grid + labels ──────────────────────────────
    if (notes?.length) {
      const uniqueFreqs = [...new Set(notes.map((n) => n.freq))].sort((a, b) => a - b);

      uniqueFreqs.forEach((freq) => {
        const y = toY(freq);

        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 8]);
        ctx.moveTo(PAD_LEFT, y);
        ctx.lineTo(W - PAD_RIGHT, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.font = "10px 'Courier New', monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(hzToLabel(freq), PAD_LEFT - 6, y);
      });

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }

    // Clip only the scrolling drawing area
    ctx.save();
    ctx.beginPath();
    ctx.rect(PAD_LEFT, 0, drawW, H);
    ctx.clip();

    // ── 3. Blue target melody ───────────────────────────────
    if (notes?.length) {
      notes.forEach((n, i) => {
        const x1 = toX(n.startMs / 1000);
        const x2 = toX(n.endMs / 1000);
        const y = toY(n.freq);
        const segW = x2 - x1;
        const isActive = i === activeNoteIndex;
        const isPast = activeNoteIndex > 0 && i < activeNoteIndex;

        // Skip fully off-screen segments
        if (x2 < PAD_LEFT - 20 || x1 > W - PAD_RIGHT + 20) return;

        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineWidth = isActive ? 6 : 4;
        ctx.strokeStyle = isActive ? "#60a5fa" : isPast ? "#3b82f6" : "#93c5fd";
        ctx.moveTo(x1 + 3, y);
        ctx.lineTo(x2 - 3, y);
        ctx.stroke();

        // Active-note progress fill
        if (i === activeNoteIndex) {
          let progress = 0;

          if (isPlaying) {
            const noteStart = n.startMs / 1000;
            const noteEnd = n.endMs / 1000;
            const noteLen = noteEnd - noteStart;

            if (elapsedSec >= noteStart && noteLen > 0) {
              progress = Math.min((elapsedSec - noteStart) / noteLen, 1);
            }
          } else {
            progress = previewProgress;
          }

          if (progress > 0) {
            const progressX = x1 + (x2 - x1) * progress;

            ctx.beginPath();
            ctx.lineCap = "round";
            ctx.lineWidth = 6;
            ctx.strokeStyle = "#facc15";
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
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.moveTo(x1 + 3, y);
          ctx.lineTo(x2 - 3, y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Connector to next note
        if (i < notes.length - 1) {
          const nextX = toX(notes[i + 1].startMs / 1000);
          const nextY = toY(notes[i + 1].freq);

          ctx.beginPath();
          ctx.strokeStyle = "rgba(147,197,253,0.25)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 5]);
          ctx.moveTo(x2, y);
          ctx.lineTo(nextX, nextY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Note label
        if (segW > 24) {
          ctx.fillStyle = isActive ? "#93c5fd" : "rgba(147,197,253,0.6)";
          ctx.font = `${isActive ? "bold " : ""}10px 'Courier New', monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(n.note, x1 + segW / 2, y - 8);
          ctx.textBaseline = "alphabetic";
          ctx.textAlign = "left";
        }
      });

      // ── 4. Fixed playhead + target dot ────────────────────
      const clampedSec = Math.min(Math.max(elapsedSec, 0), totalDur);
      const dotX = PLAYHEAD_X;

      const currentNote =
        notes.find(
          (n) =>
            clampedSec >= n.startMs / 1000 &&
            clampedSec < n.endMs / 1000
        ) ?? (clampedSec <= 0 ? notes[0] : notes[notes.length - 1]);

      const dotY = toY(currentNote.freq);

      ctx.beginPath();
      ctx.strokeStyle = "rgba(147,197,253,0.28)";
      ctx.lineWidth = 1.5;
      ctx.moveTo(PLAYHEAD_X, PAD_Y);
      ctx.lineTo(PLAYHEAD_X, H - PAD_Y);
      ctx.stroke();

      ctx.shadowColor = "rgba(96,165,250,0.9)";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(dotX, dotY, isPlaying ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isPlaying ? "#60a5fa" : "#93c5fd";
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isPlaying && elapsedSec > 0) {
        ctx.fillStyle = "rgba(147,197,253,0.7)";
        ctx.font = "bold 9px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("TARGET", dotX, dotY - 11);
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";
      }
    }

    // ── 5. Live pitch trail ─────────────────────────────────
    const validPoints = (pitchHistory || []).filter((p) => p.hz > 0);

    if (validPoints.length > 1) {
      const elapsedX = PLAYHEAD_X;
      const lastHz = validPoints[validPoints.length - 1].hz;
      const targetHz = activeNoteIndex >= 0 ? notes?.[activeNoteIndex]?.freq : null;
      const centsOff = targetHz ? Math.abs(getCentsError(lastHz, targetHz) ?? 999) : 999;
      const inTune = centsOff < 50;

      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      for (let i = 1; i < validPoints.length; i++) {
        const prev = validPoints[i - 1];
        const cur = validPoints[i];
        const frac0 = (i - 1) / (validPoints.length - 1);
        const frac1 = i / (validPoints.length - 1);
        const x0 = PAD_LEFT + frac0 * (elapsedX - PAD_LEFT);
        const x1 = PAD_LEFT + frac1 * (elapsedX - PAD_LEFT);
        const y0 = toY(prev.hz);
        const y1 = toY(cur.hz);

        const segCents = targetHz ? Math.abs(getCentsError(cur.hz, targetHz) ?? 999) : 999;
        const segColor =
          segCents < 30 ? "#4ade80" :
          segCents < 60 ? "#fbbf24" :
          "#f87171";

        ctx.beginPath();
        ctx.strokeStyle = segColor;
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = inTune ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.18)";
      ctx.shadowColor = inTune ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.3)";
      ctx.shadowBlur = 8;

      validPoints.forEach((p, i) => {
        const frac = i / (validPoints.length - 1);
        const x = PAD_LEFT + frac * (elapsedX - PAD_LEFT);
        const y = toY(p.hz);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── 6. Live pitch ball ────────────────────────────────
      const ballX = elapsedX;
      const ballY = toY(lastHz);
      const ballColor =
        centsOff < 30 ? "#4ade80" :
        centsOff < 60 ? "#fbbf24" :
        "#f87171";

      ctx.shadowColor = ballColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 9, 0, Math.PI * 2);
      ctx.fillStyle = ballColor;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = ballColor;
      ctx.font = "bold 9px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("YOU", ballX, ballY - 12);

      if (targetHz) {
        const cents = getCentsError(lastHz, targetHz);
        if (cents !== null) {
          const label = cents > 0 ? `+${Math.round(cents)}¢` : `${Math.round(cents)}¢`;
          ctx.fillText(label, ballX, ballY - 22);
        }
      }

      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
    }

    ctx.restore();

    // ── 7. Legend ───────────────────────────────────────────
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

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "9px 'Courier New', monospace";
      ctx.textBaseline = "middle";
      ctx.fillText(label, lx + 14, H - 10);
      lx += ctx.measureText(label).width + 32;
    });

    ctx.textBaseline = "alphabetic";
  }, [
    notes,
    activeNoteIndex,
    pitchHistory,
    elapsedSec,
    isPlaying,
    previewProgress,
    freqMin,
    freqMax,
    totalDur,
    height,
    canvasW,
  ]);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        if (w > 0) setCanvasW(w);
      }
    });

    if (wrapRef.current) {
      obs.observe(wrapRef.current);
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
          border: "1px solid rgba(96,165,250,0.15)",
        }}
      />
    </div>
  );
}