// ─────────────────────────────────────────────────────────────
// components/PitchCanvas.jsx
// Real-time pitch visualization using HTML5 Canvas.
// Draws: grid, target zone band, pitch trail, live ball, cents label.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { getCentsError } from "../utils/musicMath.js";

const FREQ_MIN = 200;
const FREQ_MAX = 600;
const REFERENCE_LINES = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];

function hzToY(hz, height) {
  return height - ((hz - FREQ_MIN) / (FREQ_MAX - FREQ_MIN)) * height;
}

export default function PitchCanvas({
  targetFreq,
  pitchHistory,
  width = 580,
  height = 150,
  isActive = false,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // ── Background ──────────────────────────────────────────
    ctx.fillStyle = "#080d1c";
    ctx.fillRect(0, 0, W, H);

    // ── Reference grid lines (one per note in range) ────────
    REFERENCE_LINES.forEach((f) => {
      const y = hzToY(f, H);
      if (y < 0 || y > H) return;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    });

    // ── Target pitch zone (±50 cents band) ──────────────────
    if (targetFreq) {
      const semitoneRatio = Math.pow(2, 50 / 1200);
      const topY = hzToY(targetFreq * semitoneRatio, H);
      const botY = hzToY(targetFreq / semitoneRatio, H);
      const targetY = hzToY(targetFreq, H);

      // Soft green band
      const grad = ctx.createLinearGradient(0, topY, 0, botY);
      grad.addColorStop(0,   "rgba(74,222,128,0)");
      grad.addColorStop(0.5, "rgba(74,222,128,0.12)");
      grad.addColorStop(1,   "rgba(74,222,128,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, topY, W, botY - topY);

      // Target line
      ctx.beginPath();
      ctx.strokeStyle = "rgba(74,222,128,0.75)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([10, 6]);
      ctx.moveTo(0, targetY);
      ctx.lineTo(W, targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = "rgba(74,222,128,0.8)";
      ctx.font = "bold 10px 'Courier New', monospace";
      ctx.fillText(`TARGET ${targetFreq.toFixed(0)} Hz`, 8, targetY - 5);
    }

    // ── Pitch trail ──────────────────────────────────────────
    const validPoints = pitchHistory.filter((p) => p.hz > 0);

    if (validPoints.length > 1) {
      const last = validPoints[validPoints.length - 1];
      const centsOff = targetFreq
        ? Math.abs(getCentsError(last.hz, targetFreq) ?? 999)
        : 999;
      const trailColor = centsOff < 50 ? "#4ade80" : "#f87171";

      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      validPoints.forEach((p, i) => {
        const x = (i / (validPoints.length - 1)) * (W - 24);
        const y = hzToY(p.hz, H);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });

      ctx.strokeStyle = trailColor;
      ctx.stroke();

      // ── Live ball at right edge ────────────────────────────
      const ballX = (W - 24) + 12;
      const ballY = hzToY(last.hz, H);
      const ballColor =
        centsOff < 30 ? "#4ade80" :
        centsOff < 60 ? "#fbbf24" :
                        "#f87171";

      ctx.shadowColor = ballColor;
      ctx.shadowBlur  = 18;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 9, 0, Math.PI * 2);
      ctx.fillStyle = ballColor;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cents label above ball
      if (targetFreq) {
        const cents = getCentsError(last.hz, targetFreq);
        if (cents !== null) {
          const label = cents > 0 ? `+${Math.round(cents)}¢` : `${Math.round(cents)}¢`;
          ctx.fillStyle = ballColor;
          ctx.font = "bold 10px 'Courier New', monospace";
          ctx.textAlign = "center";
          ctx.fillText(label, ballX, ballY - 13);
          ctx.textAlign = "left";
        }
      }
    }

    // ── Idle hint ────────────────────────────────────────────
    if (!isActive && validPoints.length === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.font = "13px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText("🎤  Pitch will appear here", W / 2, H / 2);
      ctx.textAlign = "left";
    }
  }, [pitchHistory, targetFreq, isActive, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: "100%",
        height: height,
        borderRadius: 10,
        display: "block",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    />
  );
}
