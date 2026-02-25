// ─────────────────────────────────────────────────────────────
// components/LyricDisplay.jsx
// Shows the full phrase with the active word highlighted in gold.
// Also shows the current note name below the active lyric.
// ─────────────────────────────────────────────────────────────

import { MELODY } from "../audio/melody.js";

export default function LyricDisplay({ activeNote, noteScores }) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.4)",
        borderRadius: 14,
        padding: "20px 24px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 14,
        flexWrap: "wrap",
        minHeight: 90,
      }}
    >
      {MELODY.map((n, i) => {
        const isActive  = activeNote?.lyric === n.lyric && activeNote?.note === n.note;
        const sc        = noteScores[i];
        const isDone    = sc !== undefined;

        const scoreColor =
          sc >= 75 ? "#4ade80" :
          sc >= 40 ? "#fbbf24" :
          sc !== undefined ? "#f87171" : null;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              transition: "transform 0.15s ease",
              transform: isActive ? "scale(1.15)" : "scale(1)",
            }}
          >
            {/* Word */}
            <span
              style={{
                fontSize: isActive ? "clamp(32px, 7vw, 48px)" : "clamp(20px, 4vw, 28px)",
                fontWeight: 700,
                fontFamily: "'Courier New', Courier, monospace",
                color: isActive
                  ? "#facc15"
                  : isDone
                    ? scoreColor
                    : "rgba(255,255,255,0.35)",
                letterSpacing: "0.02em",
                textShadow: isActive ? "0 0 20px rgba(250,204,21,0.6)" : "none",
                transition: "color 0.2s, font-size 0.15s, text-shadow 0.2s",
              }}
            >
              {n.lyric}
            </span>

            {/* Note name below active word */}
            <span
              style={{
                fontSize: 10,
                fontFamily: "'Courier New', monospace",
                color: isActive ? "rgba(250,204,21,0.7)" : "rgba(255,255,255,0.18)",
                letterSpacing: 1,
                transition: "color 0.2s",
              }}
            >
              {n.note}
            </span>

            {/* Score dot after note finishes */}
            {isDone && (
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: scoreColor,
                  boxShadow: `0 0 6px ${scoreColor}`,
                }}
              />
            )}
          </div>
        );
      })}

      {/* Placeholder if nothing active yet */}
      {!activeNote && Object.keys(noteScores).length === 0 && (
        <span
          style={{
            color: "rgba(255,255,255,0.2)",
            fontFamily: "'Courier New', monospace",
            fontSize: 16,
            alignSelf: "center",
          }}
        >
          Waiting to start…
        </span>
      )}
    </div>
  );
}
