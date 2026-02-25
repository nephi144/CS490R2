// ─────────────────────────────────────────────────────────────
// components/ScorePanel.jsx
// Displays:
//   - Animated SVG score ring with final percentage
//   - Per-note accuracy bar chart
//   - Encouraging label based on score range
// ─────────────────────────────────────────────────────────────

import { MELODY } from "../audio/melody.js";

// ── Score Ring ────────────────────────────────────────────────
function ScoreRing({ score }) {
  const RADIUS      = 52;
  const STROKE      = 9;
  const circumference = 2 * Math.PI * RADIUS;
  const offset      = circumference - (score / 100) * circumference;

  const color =
    score >= 85 ? "#4ade80" :
    score >= 65 ? "#fbbf24" :
                  "#f87171";

  const label =
    score >= 90 ? "🌟 Outstanding!" :
    score >= 75 ? "🎉 Great job!"   :
    score >= 55 ? "👍 Good effort!" :
                  "💪 Keep going!";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <svg
        width={130}
        height={130}
        style={{ transform: "rotate(-90deg)" }}
        aria-label={`Score: ${score}%`}
      >
        {/* Track */}
        <circle
          cx={65} cy={65} r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={STROKE}
        />
        {/* Progress arc */}
        <circle
          cx={65} cy={65} r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease",
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
        {/* Score text (counter-rotated) */}
        <text
          x={65} y={65}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            transform: "rotate(90deg)",
            transformOrigin: "65px 65px",
            fill: color,
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "'Courier New', monospace",
          }}
        >
          {score}%
        </text>
      </svg>

      <span
        style={{
          color,
          fontFamily: "'Courier New', monospace",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Per-Note Bars ─────────────────────────────────────────────
function NoteBreakdown({ noteScores }) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.3)",
        borderRadius: 12,
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 14,
          fontFamily: "'Courier New', monospace",
        }}
      >
        Per-Note Accuracy
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {MELODY.map((n, i) => {
          const sc = noteScores[i] ?? 0;
          const color =
            sc >= 75 ? "#4ade80" :
            sc >= 40 ? "#fbbf24" :
                       "#f87171";

          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Lyric label */}
              <div
                style={{
                  width: 52,
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#93c5fd",
                }}
              >
                "{n.lyric}"
              </div>

              {/* Progress bar */}
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${sc}%`,
                    background: color,
                    borderRadius: 4,
                    boxShadow: `0 0 6px ${color}`,
                    transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </div>

              {/* Score number */}
              <div
                style={{
                  width: 42,
                  textAlign: "right",
                  fontFamily: "'Courier New', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color,
                }}
              >
                {sc}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────
export default function ScorePanel({ finalScore, noteScores }) {
  if (finalScore === null) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <ScoreRing score={finalScore} />
      </div>
      <NoteBreakdown noteScores={noteScores} />
    </div>
  );
}
