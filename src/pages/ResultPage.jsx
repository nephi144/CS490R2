// ─────────────────────────────────────────────────────────────
// pages/ResultPage.jsx — FULL VIEWPORT layout
// Left:  Score ring + grade + encouragement
// Right: Per-note breakdown bars + action buttons
// ─────────────────────────────────────────────────────────────

import { useAudio }   from "../context/AudioContext.jsx";
import { MELODY }     from "../audio/melody.js";
import ScorePanel     from "../components/ScorePanel.jsx";

const C = {
  border: "rgba(255,255,255,0.08)",
  muted:  "rgba(255,255,255,0.38)",
  font:   "'Courier New', Courier, monospace",
  green:  "#4ade80",
  red:    "#f87171",
  gold:   "#facc15",
  blue:   "#93c5fd",
};

const BTN = (variant = "ghost") => ({
  padding: "13px 32px",
  borderRadius: 10,
  border: variant === "ghost" ? `1px solid ${C.border}` : "none",
  cursor: "pointer",
  fontFamily: C.font,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.07em",
  background:
    variant === "primary" ? "linear-gradient(135deg,#3b82f6,#7c3aed)" :
                            "rgba(255,255,255,0.06)",
  color: "#fff",
  boxShadow: variant === "primary" ? "0 4px 20px rgba(99,102,241,0.4)" : "none",
  transition: "opacity 0.15s",
});

export default function ResultPage({ onHome, onRetry }) {
  const { finalScore, noteScores } = useAudio();

  const grade =
    finalScore >= 90 ? { label: "S", color: C.gold,     text: "Outstanding!" } :
    finalScore >= 80 ? { label: "A", color: C.green,    text: "Excellent!"   } :
    finalScore >= 65 ? { label: "B", color: "#34d399",  text: "Great job!"   } :
    finalScore >= 50 ? { label: "C", color: "#fbbf24",  text: "Good effort!" } :
    finalScore >= 35 ? { label: "D", color: "#fb923c",  text: "Keep going!"  } :
                       { label: "F", color: C.red,      text: "Try again!"   };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "420px 1fr",
      minHeight: "calc(100vh - 56px)",
    }}>

      {/* ── LEFT — score hero ───────────────────────────── */}
      <div style={{
        borderRight: `1px solid ${C.border}`,
        padding: "60px 52px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        background: "rgba(0,0,0,0.18)",
      }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{
            margin: "0 0 6px",
            fontSize: 28,
            fontFamily: C.font,
            background: "linear-gradient(90deg, #93c5fd, #c4b5fd)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 700,
          }}>
            Your Results
          </h2>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 2, textTransform: "uppercase" }}>
            I Am a Child of God — First Phrase
          </p>
        </div>

        {/* Score ring */}
        {finalScore !== null && <ScorePanel finalScore={finalScore} noteScores={{}} hideBreakdown />}

        {/* Grade badge */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}>
          <div style={{
            width: 80, height: 80,
            borderRadius: 16,
            background: `rgba(${grade.color === C.gold ? "250,204,21" : grade.color === C.green ? "74,222,128" : "59,130,246"},0.12)`,
            border: `2px solid ${grade.color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, fontWeight: 700, fontFamily: C.font,
            color: grade.color,
            boxShadow: `0 0 24px ${grade.color}33`,
          }}>
            {grade.label}
          </div>
          <div style={{ fontSize: 18, color: grade.color, fontFamily: C.font, fontWeight: 700 }}>
            {grade.text}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
          <button style={BTN("primary")} onClick={onRetry}>🔁 Try Again</button>
          <button style={BTN()}          onClick={onHome}>← Back to Home</button>
        </div>
      </div>

      {/* ── RIGHT — per-note breakdown ───────────────────── */}
      <div style={{ padding: "52px 56px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 4 }}>
            PER-NOTE ACCURACY
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, fontFamily: C.font }}>
            How closely did your pitch match each word?
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MELODY.map((n, i) => {
            const sc  = noteScores[i] ?? 0;
            const col = sc >= 75 ? C.green : sc >= 40 ? "#fbbf24" : C.red;

            return (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: C.font, fontSize: 15, fontWeight: 700, color: C.blue }}>
                    "{n.lyric}" <span style={{ color: C.muted, fontSize: 11, fontWeight: 400 }}>{n.note}</span>
                  </span>
                  <span style={{ fontFamily: C.font, fontSize: 15, fontWeight: 700, color: col }}>
                    {sc}%
                  </span>
                </div>
                <div style={{ height: 12, background: "rgba(255,255,255,0.05)", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${sc}%`,
                    background: col,
                    borderRadius: 6,
                    boxShadow: `0 0 8px ${col}`,
                    transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Score legend */}
        <div style={{
          marginTop: "auto",
          background: "rgba(0,0,0,0.2)",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "18px 22px",
        }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", fontFamily: C.font, letterSpacing: 3, marginBottom: 12 }}>
            SCORING GUIDE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { range: "Within ±20 cents", score: "100 pts", color: C.green },
              { range: "Within ±40 cents", score: "90 pts",  color: C.green },
              { range: "Within ±60 cents", score: "75 pts",  color: "#fbbf24" },
              { range: "Within ±100 cents", score: "50 pts", color: "#fbbf24" },
              { range: "Within ±200 cents", score: "25 pts", color: C.red },
              { range: "Beyond ±200 cents", score: "0 pts",  color: C.red },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.muted, fontFamily: C.font }}>{row.range}</span>
                <span style={{ fontSize: 11, color: row.color, fontFamily: C.font, fontWeight: 700 }}>{row.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
