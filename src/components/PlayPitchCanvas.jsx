// ─────────────────────────────────────────────────────────────
// components/PlayPitchCanvas.jsx
//
// Play-mode pitch visualization. Two simultaneous lines:
//   Blue  = full target melody (static, always visible)
//   Green = live user pitch trail (scrolling, real-time)
//
// The full melody is drawn once across the entire width so
// participants can always see where they are in the phrase.
// No scrolling. No zooming. Pitch proportions are log-scale.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useMemo } from "react";
import { getCentsError } from "../utils/musicMath.js";

// ── Log-scale Hz → Y (musical intervals look equal) ──────────
function hzToY(hz, minHz, maxHz, H, padY) {
  const logMin = Math.log2(minHz);
  const logMax = Math.log2(maxHz);
  const ratio  = (Math.log2(Math.max(hz, minHz)) - logMin) / (logMax - logMin);
  return H - padY - ratio * (H - padY * 2);
}

// ── Nearest note name from Hz ─────────────────────────────────
function hzToLabel(hz) {
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const midi  = Math.round(12 * Math.log2(hz / 440) + 69);
  return names[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

export default function PlayPitchCanvas({
  notes,          // full note array from context (midiLoader shape)
  activeNoteIndex,// index of currently playing note (-1 if none)
  pitchHistory,   // [{ hz }] — live mic frames
  elapsedSec,     // Transport seconds elapsed
  height = 320,
  isPlaying = false,
}) {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);

  // ── Derive pitch range from melody + generous padding ─────
  const { freqMin, freqMax, totalDur } = useMemo(() => {
    if (!notes?.length) return { freqMin: 280, freqMax: 520, totalDur: 10 };
    const freqs = notes.map(n => n.freq);
    const pad   = Math.pow(2, 2.5 / 12); // 2.5 semitones headroom
    return {
      freqMin:  Math.min(...freqs) / pad,
      freqMax:  Math.max(...freqs) * pad,
      totalDur: notes[notes.length - 1].time + notes[notes.length - 1].duration,
    };
  }, [notes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap || !notes?.length) return;

    const W    = wrap.clientWidth  || 800;
    const H    = height;
    canvas.width  = W;
    canvas.height = H;

    const ctx  = canvas.getContext("2d");
    const PAD_LEFT  = 44;  // room for pitch labels
    const PAD_RIGHT = 16;
    const PAD_Y     = 20;
    const drawW     = W - PAD_LEFT - PAD_RIGHT;

    const toX = (sec) => PAD_LEFT + (sec / totalDur) * drawW;
    const toY = (hz)  => hzToY(hz, freqMin, freqMax, H, PAD_Y);

    // ── Background ────────────────────────────────────────────
    ctx.fillStyle = "#060d1a";
    ctx.fillRect(0, 0, W, H);

    // ── Pitch grid — one faint line per unique note freq ──────
    const uniqueFreqs = [...new Set(notes.map(n => n.freq))].sort((a, b) => a - b);
    uniqueFreqs.forEach(freq => {
      const y = toY(freq);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 7]);
      ctx.moveTo(PAD_LEFT, y);
      ctx.lineTo(W - PAD_RIGHT, y);
      ctx.stroke();
      ctx.setLineDash([]);
      // Label
      ctx.fillStyle    = "rgba(255,255,255,0.22)";
      ctx.font         = "9px 'Courier New', monospace";
      ctx.textAlign    = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(hzToLabel(freq), PAD_LEFT - 6, y);
    });
    ctx.textAlign    = "left";
    ctx.textBaseline = "alphabetic";

    // ── Playhead — vertical line at current Transport time ────
    if (isPlaying && elapsedSec > 0) {
      const px = toX(elapsedSec);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth   = 1;
      ctx.moveTo(px, PAD_Y);
      ctx.lineTo(px, H - PAD_Y);
      ctx.stroke();
    }

    // ── BLUE TARGET MELODY LINE ───────────────────────────────
    // Drawn as connected segments: centre of each note block.
    // Width of each segment = note duration, proportional to totalDur.
    notes.forEach((n, i) => {
      const x1 = toX(n.time);
      const x2 = toX(n.time + n.duration);
      const y  = toY(n.freq);
      const isActive = i === activeNoteIndex;

      // Segment bar — thick horizontal line per note
      ctx.beginPath();
      ctx.strokeStyle = isActive
        ? "rgba(147,197,253,1)"
        : "rgba(147,197,253,0.55)";
      ctx.lineWidth   = isActive ? 4 : 2.5;
      ctx.lineCap     = "round";
      ctx.moveTo(x1 + 2, y);
      ctx.lineTo(x2 - 2, y);
      ctx.stroke();

      // Glow on active note
      if (isActive) {
        ctx.shadowColor = "rgba(147,197,253,0.6)";
        ctx.shadowBlur  = 10;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      }

      // Connecting diagonal to next note
      if (i < notes.length - 1) {
        const nextY = toY(notes[i + 1].freq);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(147,197,253,0.18)";
        ctx.lineWidth   = 1;
        ctx.setLineDash([2, 4]);
        ctx.moveTo(x2, y);
        ctx.lineTo(toX(notes[i + 1].time), nextY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Note label above segment (only if wide enough)
      const segW = x2 - x1;
      if (segW > 30) {
        ctx.fillStyle    = isActive ? "#93c5fd" : "rgba(147,197,253,0.45)";
        ctx.font         = `${isActive ? "bold " : ""}9px 'Courier New', monospace`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(n.note, x1 + segW / 2, y - 6);
        ctx.textBaseline = "alphabetic";
        ctx.textAlign    = "left";
      }
    });

    // ── GREEN LIVE PITCH LINE ─────────────────────────────────
    // Maps pitch history frames evenly across elapsed time so
    // the green line grows left-to-right in sync with melody.
    const validPoints = pitchHistory.filter(p => p.hz > 0);
    if (validPoints.length > 1) {
      // Spread frames across elapsed portion of the canvas
      const elapsedX = Math.min(toX(Math.max(elapsedSec, 0.01)), W - PAD_RIGHT);

      // Determine in-tune state of most recent frame
      const lastHz    = validPoints[validPoints.length - 1].hz;
      const targetHz  = activeNoteIndex >= 0 ? notes[activeNoteIndex]?.freq : null;
      const centsOff  = targetHz ? Math.abs(getCentsError(lastHz, targetHz) ?? 999) : 999;
      const inTune    = centsOff < 50;

      // Draw the trail
      ctx.beginPath();
      ctx.lineWidth   = 2.5;
      ctx.lineJoin    = "round";
      ctx.lineCap     = "round";

      validPoints.forEach((p, i) => {
        const frac = i / (validPoints.length - 1);
        const x    = PAD_LEFT + frac * (elapsedX - PAD_LEFT);
        const y    = toY(p.hz);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });

      ctx.strokeStyle = inTune ? "#4ade80" : "#f87171";
      ctx.stroke();

      // Glow — green if in tune, red if off
      ctx.shadowColor = inTune ? "rgba(74,222,128,0.5)" : "rgba(248,113,113,0.35)";
      ctx.shadowBlur  = inTune ? 10 : 6;
      ctx.stroke();
      ctx.shadowBlur  = 0;

      // Live ball at current position
      const ballX     = elapsedX;
      const ballY     = toY(lastHz);
      const ballColor = centsOff < 30  ? "#4ade80"
                      : centsOff < 60  ? "#fbbf24"
                      :                  "#f87171";

      ctx.shadowColor = ballColor;
      ctx.shadowBlur  = 16;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
      ctx.fillStyle   = ballColor;
      ctx.fill();
      ctx.shadowBlur  = 0;

      // Cents deviation label above ball
      if (targetHz) {
        const cents = getCentsError(lastHz, targetHz);
        if (cents !== null) {
          const label = cents > 0 ? `+${Math.round(cents)}¢` : `${Math.round(cents)}¢`;
          ctx.fillStyle    = ballColor;
          ctx.font         = "bold 10px 'Courier New', monospace";
          ctx.textAlign    = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(label, ballX, ballY - 11);
          ctx.textBaseline = "alphabetic";
          ctx.textAlign    = "left";
        }
      }
    }

    // ── Legend ────────────────────────────────────────────────
    const legendItems = [
      { color: "rgba(147,197,253,0.9)", label: "Target melody" },
      { color: "#4ade80",               label: "Your pitch (in tune)" },
      { color: "#f87171",               label: "Your pitch (off)" },
    ];
    let lx = PAD_LEFT;
    legendItems.forEach(({ color, label }) => {
      ctx.fillStyle = color;
      ctx.fillRect(lx, H - 13, 18, 3);
      ctx.fillStyle    = "rgba(255,255,255,0.3)";
      ctx.font         = "9px 'Courier New', monospace";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, lx + 22, H - 3);
      lx += ctx.measureText(label).width + 48;
    });
    ctx.textBaseline = "alphabetic";

    // ── Idle hint ─────────────────────────────────────────────
    if (!isPlaying && validPoints.length === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font      = "14px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText("Melody will appear when session starts", W / 2, H / 2);
      ctx.textAlign = "left";
    }

  }, [notes, activeNoteIndex, pitchHistory, elapsedSec, isPlaying,
      freqMin, freqMax, totalDur, height]);

  // Redraw on container resize
  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (canvasRef.current && wrapRef.current) {
        canvasRef.current.width = wrapRef.current.clientWidth;
      }
    });
    if (wrapRef.current) obs.observe(wrapRef.current);
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
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      />
    </div>
  );
}
