// ─────────────────────────────────────────────────────────────
// pages/PlayPage.jsx  (UPGRADED — layout + visualization)
//
// WHAT CHANGED (vs original 327-line version):
//   • PlayPitchCanvas replaces PitchCanvas — shows full melody
//     in blue + live pitch in green, both simultaneously.
//   • KaraokeLyrics replaces LyricDisplay — karaoke-style,
//     past/current/future states, not clickable.
//   • Layout: top 60% canvas → middle lyrics → bottom controls.
//   • Stat boxes (YOUR PITCH / TARGET / CENTS) moved to the
//     bottom bar alongside progress — one compact strip.
//   • activeNoteIndex derived from notes array for components.
//
// WHAT IS IDENTICAL TO ORIGINAL:
//   • launchSession(), countdown logic, cdRef, all useEffect hooks
//   • startSession / stopSession / onComplete / onBack wiring
//   • finalScore watcher → onComplete() transition
//   • CountdownOverlay sub-component
//   • progressPct calculation
//   • All imports from useAudio context
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { useAudio }          from "../context/AudioContext.jsx";
import { getCentsError,
         freqToNoteName,
         formatCents }       from "../utils/musicMath.js";
import PlayPitchCanvas       from "../components/PlayPitchCanvas.jsx";
import KaraokeLyrics         from "../components/KaraokeLyrics.jsx";

const C = {
  border: "rgba(255,255,255,0.08)",
  muted:  "rgba(255,255,255,0.38)",
  font:   "'Courier New', Courier, monospace",
  green:  "#4ade80",
  red:    "#f87171",
  gold:   "#facc15",
  blue:   "#93c5fd",
};

// ── CountdownOverlay — unchanged from original ────────────────
function CountdownOverlay({ count }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(5,9,15,0.93)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
    }}>
      <div style={{
        fontSize: 120, fontWeight: 700, fontFamily: C.font,
        color: C.gold, lineHeight: 1,
        animation: "popIn 0.45s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {count}
      </div>
      <div style={{ color: C.muted, fontSize: 18, fontFamily: C.font, letterSpacing: 2 }}>
        GET READY TO SING
      </div>
      <style>{`@keyframes popIn{from{transform:scale(0.4);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ── Compact stat pill for bottom bar ─────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      background: "rgba(0,0,0,0.3)",
      border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "8px 18px", minWidth: 90,
    }}>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: C.font, letterSpacing: 2, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: C.font, color: color || "#e2e8f0" }}>
        {value}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function PlayPage({ onBack, onComplete }) {
  
  const {
    isListening, isPlaying,
    liveHz, activeNote, elapsedMs,
    notes, noteScores, finalScore,
    pitchHistory, micError,
    startSession, stopSession,
  } = useAudio();
const elapsedSec = elapsedMs / 1000;
console.log("elapsedSec:", elapsedSec);
console.log("pitchHistory length:", pitchHistory?.length);

  const [countdown,   setCountdown]   = useState(null);
  const [sessionDone, setSessionDone] = useState(false);
  const cdRef = useRef(null);

  // ── Timing logic — identical to original ─────────────────
  const launchSession = () => {
    setSessionDone(false);
    let c = 3;
    setCountdown(c);
    cdRef.current = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(cdRef.current);
        setCountdown(null);
        startSession();
      } else {
        setCountdown(c);
      }
    }, 1000);
  };

  useEffect(() => {
    if (finalScore !== null && !sessionDone) {
      setSessionDone(true);
      setTimeout(() => onComplete(), 600);
    }
  }, [finalScore]); // eslint-disable-line

  useEffect(() => {
    launchSession();
    return () => { clearInterval(cdRef.current); stopSession(); };
  }, []); // eslint-disable-line

  // ── Derived values ────────────────────────────────────────
  const totalDur       = notes?.length
    ? notes[notes.length - 1].time + notes[notes.length - 1].duration
    : 1;
  const progressPct    = totalDur > 0
    ? Math.min(100, (elapsedSec / totalDur) * 100)
    : 0;

  const activeNoteIndex = notes?.findIndex(n =>
    n.lyric === activeNote?.lyric && n.note === activeNote?.note
  ) ?? -1;

  const targetFreq  = activeNote?.freq ?? null;
  const cents       = getCentsError(liveHz, targetFreq);
  const inTune      = cents !== null && Math.abs(cents) < 50;
  const centsColor  = cents !== null ? (inTune ? C.green : C.red) : "rgba(255,255,255,0.35)";

  // ─────────────────────────────────────────────────────────
  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      height:        "calc(100vh - 56px)",   // fill viewport below navbar
      overflow:      "hidden",
    }}>
      {countdown !== null && <CountdownOverlay count={countdown} />}

      {/* ── 1. TOP STATUS BAR ─── unchanged layout ─────────── */}
      <div style={{
        padding:      "10px 28px",
        borderBottom: `1px solid ${C.border}`,
        background:   "rgba(0,0,0,0.2)",
        display:      "flex",
        alignItems:   "center",
        gap:          20,
        flexShrink:   0,
      }}>
        <div style={{
          fontFamily:    C.font, fontSize: 12, fontWeight: 700,
          color:         isPlaying ? C.green : sessionDone ? C.gold : C.muted,
          letterSpacing: 2, minWidth: 110,
        }}>
          {isPlaying ? "● SINGING" : sessionDone ? "✓ COMPLETE" : "READY"}
        </div>

        {/* Progress bar */}
        <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progressPct}%`,
            background: "linear-gradient(90deg, #3b82f6, #7c3aed)",
            borderRadius: 3, transition: "width 0.1s linear",
            boxShadow: "0 0 8px rgba(99,102,241,0.5)",
          }} />
        </div>
        <div style={{ fontFamily: C.font, fontSize: 11, color: C.muted, minWidth: 36, textAlign: "right" }}>
          {Math.round(progressPct)}%
        </div>

        {/* Back button */}
        <button
          onClick={() => { clearInterval(cdRef.current); stopSession(); onBack(); }}
          style={{
            padding: "6px 14px", borderRadius: 7,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,0.05)",
            color: "#fff", fontFamily: C.font, fontSize: 11,
            fontWeight: 700, cursor: "pointer", letterSpacing: 1,
          }}
        >
          ← BACK
        </button>
      </div>

      {/* ── 2. MIC ERROR ─────────────────────────────────────── */}
      {micError && (
        <div style={{
          padding: "8px 28px", flexShrink: 0,
          background: "rgba(239,68,68,0.08)",
          borderBottom: "1px solid rgba(239,68,68,0.2)",
          fontSize: 12, color: "#fca5a5", fontFamily: C.font,
        }}>
          ⚠️ {micError}
        </div>
      )}

      {/* ── 3. PITCH CANVAS — top ~60% ────────────────────────
            PlayPitchCanvas shows:
              - Full blue melody line (all notes, time-proportional)
              - Live green pitch trail overlaid
            No scrolling. Entire phrase visible at once.           */}
      <div style={{ flex: "0 0 62%", padding: "10px 20px 4px", minHeight: 0 }}>
        <div style={{
          fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: C.font,
          letterSpacing: 3, marginBottom: 6,
        }}>
          PITCH VISUALIZER — blue: target melody · green: your voice
        </div>
        <PlayPitchCanvas
          notes={notes}
          activeNoteIndex={activeNoteIndex}
          pitchHistory={pitchHistory}
          const elapsedSec={elapsedMs / 1000 }
          isPlaying={isPlaying}
          height={360}
          
        />
      </div>

      {/* ── 4. KARAOKE LYRICS — middle ────────────────────────
            Pure display — not clickable.
            Past = dimmed + score colour.
            Current = large gold + pulsing underline.
            Future = faded grey.                                   */}
      <div style={{
        borderTop:    `1px solid rgba(255,255,255,0.06)`,
        background:   "rgba(0,0,0,0.18)",
        flexShrink:   0,
        padding:      "0 20px",
      }}>
        <KaraokeLyrics
          notes={notes}
          activeNoteIndex={activeNoteIndex}
          noteScores={noteScores}
        />
      </div>

      {/* ── 5. BOTTOM CONTROLS — stat pills + intonation ─────── */}
      <div style={{
        flex:        "1 1 auto",
        display:     "flex",
        alignItems:  "center",
        justifyContent: "center",
        gap:         12,
        padding:     "12px 28px",
        flexWrap:    "wrap",
        background:  "rgba(0,0,0,0.15)",
      }}>

        {/* Your pitch */}
        <StatPill
          label="YOUR PITCH"
          value={liveHz > 0 ? `${freqToNoteName(liveHz)}  ${liveHz.toFixed(0)} Hz` : "—"}
          color={liveHz > 0 ? C.blue : "rgba(255,255,255,0.2)"}
        />

        {/* Target note */}
        <StatPill
          label="TARGET"
          value={activeNote ? `${activeNote.note}  ${activeNote.freq.toFixed(0)} Hz` : "—"}
          color={activeNote ? C.gold : "rgba(255,255,255,0.2)"}
        />

        {/* Cents deviation */}
        <StatPill
          label="CENTS OFF"
          value={formatCents(cents)}
          color={centsColor}
        />

        {/* Big intonation indicator */}
        <div style={{ fontSize: 40, lineHeight: 1 }}>
          {liveHz > 0 ? (inTune ? "🟢" : "🔴") : "⚫"}
        </div>

        {/* Hint text */}
        {cents !== null && (
          <div style={{
            fontFamily: C.font, fontSize: 12, fontWeight: 700,
            color: centsColor, letterSpacing: 1,
            minWidth: 120, textAlign: "center",
          }}>
            {inTune ? "✓ In tune!" : cents > 0 ? "Sing lower ↓" : "Sing higher ↑"}
          </div>
        )}

        {/* Live note score mini-bars — only appears after first note completes */}
        {Object.keys(noteScores).length > 0 && notes?.length > 0 && (
          <div style={{
            display: "flex", gap: 6, alignItems: "flex-end",
            height: 44, marginLeft: "auto",
            background: "rgba(0,0,0,0.2)",
            border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "6px 12px",
          }}>
            {notes.map((n, i) => {
              const sc  = noteScores[i] ?? null;
              const col = sc === null ? "rgba(255,255,255,0.08)"
                        : sc >= 75   ? C.green
                        : sc >= 40   ? "#fbbf24"
                        :              C.red;
              const h   = sc !== null ? Math.max(4, (sc / 100) * 30) : 3;
              return (
                <div key={i} style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 2, justifyContent: "flex-end",
                  flex: n.beats ?? 1,
                }}>
                  <div style={{
                    width: "100%", minWidth: 8,
                    height: h,
                    background: col,
                    borderRadius: 2,
                    boxShadow: sc !== null ? `0 0 4px ${col}` : "none",
                    transition: "height 0.3s ease",
                  }} />
                  <span style={{ fontSize: 8, color: col, fontFamily: C.font }}>{n.lyric}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
