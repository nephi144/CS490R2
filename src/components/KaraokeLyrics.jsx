// ─────────────────────────────────────────────────────────────
// components/KaraokeLyrics.jsx
//
// Karaoke-style lyric display for PlayPage.
// NOT clickable — purely visual, driven by activeNoteIndex.
//
// State of each word:
//   past    → dimmed, scored colour (green/amber/red)
//   current → large, gold, glowing
//   future  → faded grey
// ─────────────────────────────────────────────────────────────

const FONT = "'Courier New', Courier, monospace";

function scoreColor(sc) {
  if (sc === undefined || sc === null) return null;
  if (sc >= 75) return "#4ade80";
  if (sc >= 40) return "#fbbf24";
  return "#f87171";
}

export default function KaraokeLyrics({ notes = [], activeNoteIndex = -1, noteScores = {} }) {
  if (!notes.length) return null;

  return (
    <div style={{
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      gap:            "clamp(10px, 2.5vw, 28px)",
      flexWrap:       "wrap",
      padding:        "10px 24px",
      minHeight:      72,
      userSelect:     "none",    // not interactive — prevent accidental text selection
    }}>
      {notes.map((n, i) => {
        const state =
          i < activeNoteIndex  ? "past"    :
          i === activeNoteIndex ? "current" :
                                  "future";

        const sc      = noteScores[i];
        const pastCol = scoreColor(sc) ?? "rgba(255,255,255,0.38)";

        // ── Per-state styling ──────────────────────────────────
        const wordStyle = {
          past: {
            fontSize:   "clamp(18px, 2.8vw, 26px)",
            fontWeight: 600,
            color:      pastCol,
            opacity:    0.65,
            textShadow: "none",
            transform:  "scale(1)",
          },
          current: {
            fontSize:   "clamp(30px, 5vw, 46px)",
            fontWeight: 700,
            color:      "#facc15",
            opacity:    1,
            textShadow: "0 0 24px rgba(250,204,21,0.7), 0 0 6px rgba(250,204,21,0.4)",
            transform:  "scale(1.08)",
          },
          future: {
            fontSize:   "clamp(18px, 2.8vw, 26px)",
            fontWeight: 400,
            color:      "rgba(255,255,255,0.22)",
            opacity:    1,
            textShadow: "none",
            transform:  "scale(1)",
          },
        }[state];

        return (
          <div
            key={i}
            style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              gap:            3,
              transition:     "transform 0.18s ease, font-size 0.18s ease",
              transform:      wordStyle.transform,
            }}
          >
            {/* Word */}
            <span style={{
              fontFamily:  FONT,
              fontSize:    wordStyle.fontSize,
              fontWeight:  wordStyle.fontWeight,
              color:       wordStyle.color,
              opacity:     wordStyle.opacity,
              textShadow:  wordStyle.textShadow,
              letterSpacing: "0.03em",
              transition:  "color 0.2s, font-size 0.18s, text-shadow 0.2s, opacity 0.2s",
              lineHeight:  1,
            }}>
              {n.lyric}
            </span>

            {/* Score dot under past words */}
            {state === "past" && sc !== undefined && (
              <div style={{
                width:     5,
                height:    5,
                borderRadius: "50%",
                background:   pastCol,
                boxShadow:    `0 0 5px ${pastCol}`,
                marginTop:    2,
              }} />
            )}

            {/* Pulsing underline under current word */}
            {state === "current" && (
              <div style={{
                height:     2,
                width:      "70%",
                borderRadius: 2,
                background: "#facc15",
                boxShadow:  "0 0 8px rgba(250,204,21,0.8)",
                animation:  "kPulse 1s ease-in-out infinite",
                marginTop:  2,
              }} />
            )}
          </div>
        );
      })}

      {/* Waiting state before session starts */}
      {activeNoteIndex === -1 && Object.keys(noteScores).length === 0 && (
        <span style={{
          position:   "absolute",
          color:      "rgba(255,255,255,0.18)",
          fontFamily: FONT,
          fontSize:   15,
          letterSpacing: 2,
        }}>
          — waiting to start —
        </span>
      )}

      <style>{`
        @keyframes kPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}
