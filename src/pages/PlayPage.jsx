// ─────────────────────────────────────────────────────────────
// pages/PlayPage.jsx — FULL VIEWPORT layout
// Top bar:    progress + status
// Center:     BIG lyrics display
// Left col:   pitch stats (YOUR / TARGET / CENTS)
// Right col:  large PitchCanvas
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { useAudio }     from "../context/AudioContext.jsx";
import { MELODY, TOTAL_MS } from "../audio/melody.js";
import { getCentsError, freqToNoteName, formatCents } from "../utils/musicMath.js";
import LyricDisplay     from "../components/LyricDisplay.jsx";
import PitchCanvas      from "../components/PitchCanvas.jsx";

const C = {
  border: "rgba(255,255,255,0.08)",
  muted:  "rgba(255,255,255,0.38)",
  font:   "'Courier New', Courier, monospace",
  green:  "#4ade80",
  red:    "#f87171",
  gold:   "#facc15",
  blue:   "#93c5fd",
};

// ── Countdown overlay ─────────────────────────────────────────
function CountdownOverlay({ count }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(5,9,15,0.93)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
    }}>
      <div style={{
        fontSize: 120,
        fontWeight: 700,
        fontFamily: C.font,
        color: C.gold,
        lineHeight: 1,
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

// ── Stat box ──────────────────────────────────────────────────
function StatBox({ label, value, subvalue, borderColor }) {
  return (
    <div style={{
      background: "rgba(0,0,0,0.28)",
      border: `1px solid ${borderColor || C.border}`,
      borderRadius: 12,
      padding: "18px 22px",
      transition: "border-color 0.2s",
    }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: C.font, color: "#e2e8f0" }}>
        {value}
      </div>
      {subvalue && (
        <div style={{ fontSize: 12, color: C.muted, fontFamily: C.font, marginTop: 4 }}>
          {subvalue}
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function PlayPage({ onBack, onComplete }) {
  const {
    isListening, isPlaying,
    liveHz, activeNote, elapsedMs,
    noteScores, finalScore,
    pitchHistory, micError,
    startSession, stopSession,
  } = useAudio();

  const [countdown,   setCountdown]   = useState(null);
  const [sessionDone, setSessionDone] = useState(false);
  const cdRef = useRef(null);

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

  const progressPct  = TOTAL_MS > 0 ? Math.min(100, (elapsedMs / TOTAL_MS) * 100) : 0;
  const targetFreq   = activeNote?.freq ?? null;
  const cents        = getCentsError(liveHz, targetFreq);
  const inTune       = cents !== null && Math.abs(cents) < 50;
  const centsColor   = cents !== null ? (inTune ? C.green : C.red) : "rgba(255,255,255,0.2)";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 56px)" }}>
      {countdown !== null && <CountdownOverlay count={countdown} />}

      {/* ── TOP STATUS BAR ──────────────────────────────── */}
      <div style={{
        padding: "14px 36px",
        borderBottom: `1px solid ${C.border}`,
        background: "rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        gap: 24,
      }}>
        {/* Status label */}
        <div style={{
          fontFamily: C.font,
          fontSize: 13,
          fontWeight: 700,
          color: isPlaying ? C.green : sessionDone ? C.gold : C.muted,
          letterSpacing: 2,
          minWidth: 120,
        }}>
          {isPlaying ? "● SINGING" : sessionDone ? "✓ COMPLETE" : "READY"}
        </div>

        {/* Progress bar — full width */}
        <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progressPct}%`,
            background: "linear-gradient(90deg, #3b82f6, #7c3aed)",
            borderRadius: 3,
            transition: "width 0.1s linear",
            boxShadow: "0 0 10px rgba(99,102,241,0.5)",
          }} />
        </div>

        {/* Progress % */}
        <div style={{ fontFamily: C.font, fontSize: 12, color: C.muted, minWidth: 42, textAlign: "right" }}>
          {Math.round(progressPct)}%
        </div>

        {/* Back button */}
        <button
          onClick={() => { clearInterval(cdRef.current); stopSession(); onBack(); }}
          style={{
            padding: "7px 16px", borderRadius: 7,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,0.05)",
            color: "#fff", fontFamily: C.font, fontSize: 11,
            fontWeight: 700, cursor: "pointer", letterSpacing: 1,
          }}
        >
          ← BACK
        </button>
      </div>

      {/* ── LYRICS STRIP ────────────────────────────────── */}
      <div style={{ padding: "20px 36px", borderBottom: `1px solid ${C.border}` }}>
        {micError && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "10px 16px", marginBottom: 12,
            fontSize: 12, color: "#fca5a5", fontFamily: C.font,
          }}>
            ⚠️ {micError}
          </div>
        )}
        <LyricDisplay activeNote={activeNote} noteScores={noteScores} />
      </div>

      {/* ── MAIN CONTENT — 2 columns ────────────────────── */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: 0,
      }}>

        {/* LEFT — pitch stats */}
        <div style={{
          padding: "28px 28px",
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          background: "rgba(0,0,0,0.12)",
        }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", fontFamily: C.font, letterSpacing: 3 }}>
            LIVE PITCH DATA
          </div>

          {/* Your pitch */}
          <div style={{
            background: "rgba(0,0,0,0.28)", border: `1px solid ${C.border}`,
            borderRadius: 12, padding: "18px 20px",
          }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 8 }}>YOUR PITCH</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: C.font, color: liveHz > 0 ? C.blue : "rgba(255,255,255,0.18)" }}>
              {liveHz > 0 ? freqToNoteName(liveHz) : "—"}
            </div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: C.font, marginTop: 4 }}>
              {liveHz > 0 ? `${liveHz.toFixed(0)} Hz` : "sing to detect"}
            </div>
          </div>

          {/* Target */}
          <div style={{
            background: "rgba(0,0,0,0.28)", border: `1px solid rgba(250,204,21,0.2)`,
            borderRadius: 12, padding: "18px 20px",
          }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 8 }}>TARGET NOTE</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: C.font, color: activeNote ? C.gold : "rgba(255,255,255,0.18)" }}>
              {activeNote ? activeNote.note : "—"}
            </div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: C.font, marginTop: 4 }}>
              {activeNote ? `${activeNote.freq.toFixed(0)} Hz` : "waiting…"}
            </div>
          </div>

          {/* Cents error */}
          <div style={{
            background: "rgba(0,0,0,0.28)",
            border: `1px solid ${cents !== null ? (inTune ? "rgba(74,222,128,0.35)" : "rgba(248,113,113,0.25)") : C.border}`,
            borderRadius: 12, padding: "18px 20px",
            transition: "border-color 0.2s",
          }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 8 }}>CENTS ERROR</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: C.font, color: centsColor }}>
              {formatCents(cents)}
            </div>
            <div style={{ fontSize: 13, color: centsColor, fontFamily: C.font, marginTop: 4 }}>
              {cents === null ? "—" : inTune ? "✓ In tune!" : cents > 0 ? "Sing lower ↓" : "Sing higher ↑"}
            </div>
          </div>

          {/* Big green/red indicator */}
          <div style={{
            textAlign: "center",
            fontSize: 64,
            lineHeight: 1,
            marginTop: 8,
          }}>
            {liveHz > 0 ? (inTune ? "🟢" : "🔴") : "⚫"}
          </div>
        </div>

        {/* RIGHT — large canvas */}
        <div style={{ padding: "28px 36px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", fontFamily: C.font, letterSpacing: 3 }}>
            PITCH VISUALIZER — your voice vs target note
          </div>

          {/* Canvas fills available height */}
          <div style={{ flex: 1, minHeight: 280 }}>
            <PitchCanvas
              targetFreq={targetFreq}
              pitchHistory={pitchHistory}
              width={900}
              height={320}
              isActive={isPlaying && liveHz > 0}
            />
          </div>

          {/* Note-score mini bar chart */}
          {Object.keys(noteScores).length > 0 && (
            <div style={{
              background: "rgba(0,0,0,0.2)",
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "16px 20px",
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 12 }}>
                NOTE ACCURACY SO FAR
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 50 }}>
                {MELODY.map((n, i) => {
                  const sc = noteScores[i] ?? null;
                  if (sc === null) return (
                    <div key={i} style={{ flex: n.beats, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }} />
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: C.font }}>{n.lyric}</span>
                    </div>
                  );
                  const h   = Math.max(4, (sc / 100) * 40);
                  const col = sc >= 75 ? C.green : sc >= 40 ? "#fbbf24" : C.red;
                  return (
                    <div key={i} style={{ flex: n.beats, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                      <div style={{ width: "100%", height: h, background: col, borderRadius: 3, boxShadow: `0 0 6px ${col}` }} />
                      <span style={{ fontSize: 10, color: col, fontFamily: C.font }}>{n.lyric}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
