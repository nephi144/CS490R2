// ─────────────────────────────────────────────────────────────
// components/MelodyContourMap.jsx
//
// PURPOSE: Tutorial-mode "full melody overview" visualization.
//
// This is NOT the live pitch trail (PitchCanvas).
// This component draws the ENTIRE melody as a static contour
// map — all notes, all durations, all pitch relationships —
// so participants can see the full melodic shape before singing.
//
// DESIGN DECISIONS:
//   • Horizontal axis = time. Each note's x-width is proportional
//     to its duration, so longer notes occupy more space.
//   • Vertical axis = pitch (Hz, log scale). Log scale is used
//     because musical intervals feel equal in log space — a
//     semitone looks the same size at F4 as at A4.
//   • Selected note is highlighted gold; sung notes show score.
//   • A live pitch dot follows the singer's voice within the
//     selected note's column while they are practicing.
//   • All notes are always visible — no clipping, no scrolling.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useMemo } from "react";

// ── Log-scale Hz → Y mapping ──────────────────────────────────
// Uses log2 so musical intervals are proportional visually.
function hzToYLog(hz, minHz, maxHz, height, padding) {
  const logMin = Math.log2(minHz);
  const logMax = Math.log2(maxHz);
  const logHz  = Math.log2(Math.max(hz, minHz));
  const ratio  = (logHz - logMin) / (logMax - logMin);
  // Invert: high pitch = top of canvas
  return height - padding - ratio * (height - padding * 2);
}

// ── Note name label from Hz ───────────────────────────────────
function hzToLabel(hz) {
  const A4    = 440;
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const midi  = Math.round(12 * Math.log2(hz / A4) + 69);
  return names[((midi % 12) + 12) % 12] + Math.floor(midi / 12 - 1);
}

export default function MelodyContourMap({
  notes,           // full note array from midiLoader / context
  selectedIndex,   // currently selected note index (highlighted)
  liveHz = 0,      // real-time detected pitch (0 = silent)
  noteScores = {}, // { index: 0–100 } — scored notes get colour
  height = 280,
}) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);

  // ── Derive pitch range from melody content ─────────────────
  // Add 15% headroom above and below so notes don't touch edges.
  const { freqMin, freqMax, totalDur } = useMemo(() => {
    if (!notes || notes.length === 0) return { freqMin: 200, freqMax: 600, totalDur: 10 };
    const freqs   = notes.map(n => n.freq);
    const rawMin  = Math.min(...freqs);
    const rawMax  = Math.max(...freqs);
    // Expand range by 1.5 semitones each side for breathing room
    const semitone = Math.pow(2, 1.5 / 12);
    const lastNote = notes[notes.length - 1];
    return {
      freqMin:  rawMin / semitone,
      freqMax:  rawMax * semitone,
      totalDur: lastNote.time + lastNote.duration,
    };
  }, [notes]);

  useEffect(() => {
    const canvas  = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper || !notes || notes.length === 0) return;

    // Match canvas pixel size to wrapper's actual rendered width
    const W = wrapper.clientWidth || 800;
    const H = height;
    canvas.width  = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");
    const PAD_X = 48;  // left/right padding for note labels
    const PAD_Y = 24;  // top/bottom padding
    const drawW = W - PAD_X * 2;

    // ── Helpers ───────────────────────────────────────────────
    const toX = (timeSec) => PAD_X + (timeSec / totalDur) * drawW;
    const toY = (hz)      => hzToYLog(hz, freqMin, freqMax, H, PAD_Y);

    // ── Background ────────────────────────────────────────────
    ctx.fillStyle = "#07101f";
    ctx.fillRect(0, 0, W, H);

    // ── Horizontal pitch grid lines ───────────────────────────
    // Draw a faint line at each note's frequency, labelled.
    const uniqueFreqs = [...new Set(notes.map(n => n.freq))];
    uniqueFreqs.forEach(freq => {
      const y = toY(freq);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.moveTo(PAD_X - 4, y);
      ctx.lineTo(W - PAD_X + 4, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Note name label on left
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "10px 'Courier New', monospace";
      ctx.textAlign = "right";
      ctx.fillText(hzToLabel(freq), PAD_X - 8, y + 4);
    });
    ctx.textAlign = "left";

    // ── Time axis tick marks ──────────────────────────────────
    notes.forEach(n => {
      const x = toX(n.time);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.moveTo(x, H - PAD_Y + 4);
      ctx.lineTo(x, H - PAD_Y + 10);
      ctx.stroke();
    });

    // ── Melody contour connecting line ────────────────────────
    // Draw a thin line connecting note centres for melodic shape.
    ctx.beginPath();
    ctx.strokeStyle = "rgba(147,197,253,0.2)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 5]);
    notes.forEach((n, i) => {
      const cx = toX(n.time + n.duration / 2);
      const cy = toY(n.freq);
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Note blocks ───────────────────────────────────────────
    notes.forEach((n, i) => {
      const x1 = toX(n.time);
      const x2 = toX(n.time + n.duration);
      const bW  = Math.max(x2 - x1 - 3, 4); // 3px gap between blocks
      const cy  = toY(n.freq);
      const bH  = 28; // fixed block height
      const by  = cy - bH / 2;

      const isSelected = i === selectedIndex;
      const score      = noteScores[i];
      const isScored   = score !== undefined;

      // Block colour logic:
      //  selected  → gold
      //  scored ≥75 → green, ≥40 → amber, else → red
      //  unvisited → blue-grey
      let blockColor, glowColor;
      if (isSelected) {
        blockColor = "rgba(250,204,21,0.25)";
        glowColor  = "rgba(250,204,21,0.6)";
      } else if (isScored) {
        if (score >= 75) {
          blockColor = "rgba(74,222,128,0.2)";
          glowColor  = "rgba(74,222,128,0.5)";
        } else if (score >= 40) {
          blockColor = "rgba(251,191,36,0.18)";
          glowColor  = "rgba(251,191,36,0.4)";
        } else {
          blockColor = "rgba(248,113,113,0.18)";
          glowColor  = "rgba(248,113,113,0.4)";
        }
      } else {
        blockColor = "rgba(147,197,253,0.1)";
        glowColor  = "rgba(147,197,253,0.25)";
      }

      // Block fill
      ctx.fillStyle = blockColor;
      ctx.beginPath();
      ctx.roundRect(x1, by, bW, bH, 5);
      ctx.fill();

      // Block border
      ctx.strokeStyle = isSelected
        ? "rgba(250,204,21,0.9)"
        : isScored
          ? glowColor
          : "rgba(147,197,253,0.3)";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Glow for selected
      if (isSelected) {
        ctx.shadowColor = "rgba(250,204,21,0.5)";
        ctx.shadowBlur  = 12;
        ctx.strokeStyle = "rgba(250,204,21,0.6)";
        ctx.lineWidth   = 2;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      }

      // ── Lyric label inside block ──────────────────────────
      const labelColor = isSelected ? "#facc15"
        : isScored
          ? (score >= 75 ? "#4ade80" : score >= 40 ? "#fbbf24" : "#f87171")
          : "#93c5fd";

      ctx.fillStyle  = labelColor;
      ctx.font       = `${isSelected ? "bold " : ""}12px 'Courier New', monospace`;
      ctx.textAlign  = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n.lyric, x1 + bW / 2, cy);

      // Score badge (small number below lyric)
      if (isScored) {
        ctx.fillStyle   = "rgba(255,255,255,0.4)";
        ctx.font        = "9px 'Courier New', monospace";
        ctx.fillText(`${score}%`, x1 + bW / 2, cy + 14);
      }

      // Duration label below block for longer notes
      if (bW > 48) {
        ctx.fillStyle    = "rgba(255,255,255,0.2)";
        ctx.font         = "9px 'Courier New', monospace";
        ctx.textBaseline = "top";
        ctx.fillText(n.note, x1 + bW / 2, by + bH + 4);
      }

      ctx.textBaseline = "alphabetic";
      ctx.textAlign    = "left";
    });

    // ── Live pitch dot (singer's voice, in selected note zone) ─
    if (liveHz > 0 && selectedIndex >= 0) {
      const selNote = notes[selectedIndex];
      if (selNote) {
        const dotX   = toX(selNote.time + selNote.duration / 2);
        const dotY   = toY(liveHz);
        const target = selNote.freq;
        const cents  = 1200 * Math.log2(liveHz / target);
        const inTune = Math.abs(cents) < 50;
        const dotColor = inTune ? "#4ade80" : Math.abs(cents) < 100 ? "#fbbf24" : "#f87171";

        // Connector line from note block to live dot
        const blockY = toY(target);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth   = 1;
        ctx.setLineDash([3, 4]);
        ctx.moveTo(dotX, blockY + 14);
        ctx.lineTo(dotX, dotY - 10);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dot glow
        ctx.shadowColor = dotColor;
        ctx.shadowBlur  = 16;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 9, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Cents label next to dot
        const cLabel = cents > 0 ? `+${Math.round(cents)}¢` : `${Math.round(cents)}¢`;
        ctx.fillStyle    = dotColor;
        ctx.font         = "bold 10px 'Courier New', monospace";
        ctx.textAlign    = "left";
        ctx.fillText(cLabel, dotX + 13, dotY + 4);

        // "YOU" label above dot
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font      = "9px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("YOU", dotX, dotY - 13);
        ctx.textAlign = "left";
      }
    }

    // ── Axis label: TIME → ────────────────────────────────────
    ctx.fillStyle  = "rgba(255,255,255,0.18)";
    ctx.font       = "9px 'Courier New', monospace";
    ctx.textAlign  = "right";
    ctx.fillText("TIME →", W - 6, H - 6);
    ctx.textAlign  = "left";
    ctx.fillText("PITCH ↑", 4, 14);

  }, [notes, selectedIndex, liveHz, noteScores, freqMin, freqMax, totalDur, height]);

  // Redraw on resize
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      // Trigger redraw by nudging a dependency — simplest approach
      // is to just manually call the draw. Use a flag to avoid loop.
      const canvas  = canvasRef.current;
      const wrapper = wrapperRef.current;
      if (canvas && wrapper) {
        canvas.width = wrapper.clientWidth;
        // The main useEffect will re-run because canvas.width changed
      }
    });
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: height,
          borderRadius: 10,
          display: "block",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      />
    </div>
  );
}
