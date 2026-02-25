// ─────────────────────────────────────────────────────────────
// pages/TutorialPage.jsx — FULL VIEWPORT layout
// Left panel: note selector + target info + controls
// Right panel: live feedback + PitchCanvas (large)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useAudio }            from "../context/AudioContext.jsx";
import { MELODY }              from "../audio/melody.js";
import { previewNote }         from "../audio/scheduler.js";
import { getCentsError, freqToNoteName, formatCents, tuningHint } from "../utils/musicMath.js";
import PitchCanvas             from "../components/PitchCanvas.jsx";

const C = {
  border:  "rgba(255,255,255,0.08)",
  muted:   "rgba(255,255,255,0.38)",
  font:    "'Courier New', Courier, monospace",
  green:   "#4ade80",
  red:     "#f87171",
  gold:    "#facc15",
  blue:    "#93c5fd",
};

const BTN = (variant = "ghost") => ({
  padding: "10px 20px",
  borderRadius: 8,
  border: variant === "ghost" ? `1px solid ${C.border}` : "none",
  cursor: "pointer",
  fontFamily: C.font,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.07em",
  background:
    variant === "primary" ? "linear-gradient(135deg,#3b82f6,#7c3aed)" :
    variant === "green"   ? "linear-gradient(135deg,#16a34a,#059669)" :
                            "rgba(255,255,255,0.06)",
  color: "#fff",
  boxShadow: variant === "primary" ? "0 4px 18px rgba(99,102,241,0.4)" : "none",
  whiteSpace: "nowrap",
});

export default function TutorialPage({ onBack, onGoPlay }) {
  const {
    isListening, liveHz, pitchHistory,
    micError, audioCtxRef,
    startTutorialListening, stopSession,
  } = useAudio();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [started,     setStarted]     = useState(false);

  const note     = MELODY[selectedIdx];
  const cents    = getCentsError(liveHz, note.freq);
  const inTune   = cents !== null && Math.abs(cents) < 50;
  const hasPitch = liveHz > 0;

  // Start mic on mount
  useEffect(() => {
    let live = true;
    startTutorialListening().then(ok => { if (live && ok) setStarted(true); });
    return () => { live = false; stopSession(); };
  }, []); // eslint-disable-line

  const doHearIt = () => {
    const ctx = audioCtxRef.current;
    if (ctx) previewNote(ctx, note.freq, note.beats);
  };

  // Colour for inTune state
  const feedbackColor = hasPitch ? (inTune ? C.green : C.red) : "rgba(255,255,255,0.15)";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "340px 1fr",
      minHeight: "calc(100vh - 56px)",
    }}>

      {/* ── LEFT PANEL — controls ─────────────────────────── */}
      <div style={{
        borderRight: `1px solid ${C.border}`,
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        background: "rgba(0,0,0,0.15)",
      }}>
        {/* Header */}
        <div>
          <h2 style={{ margin: "0 0 4px", fontFamily: C.font, fontSize: 20, color: "#fff" }}>
            Tutorial Mode
          </h2>
          <p style={{ margin: 0, fontFamily: C.font, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            Select a word → press <strong style={{ color: C.blue }}>Hear it</strong> → sing it back and match the green line.
          </p>
        </div>

        {/* Note selector */}
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 10 }}>
            SELECT A WORD
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MELODY.map((n, i) => (
              <div
                key={i}
                onClick={() => setSelectedIdx(i)}
                style={{
                  background: i === selectedIdx ? "rgba(250,204,21,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${i === selectedIdx ? "rgba(250,204,21,0.5)" : C.border}`,
                  borderRadius: 10,
                  padding: "10px 16px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                  minWidth: 56,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color: i === selectedIdx ? C.gold : C.blue, fontFamily: C.font }}>
                  {n.lyric}
                </div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: C.font, marginTop: 2 }}>
                  {n.note}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Target note card */}
        <div style={{
          background: "rgba(0,0,0,0.3)",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "20px",
        }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 12 }}>
            TARGET NOTE
          </div>
          <div style={{ fontSize: 42, fontWeight: 700, color: C.gold, fontFamily: C.font, marginBottom: 6 }}>
            "{note.lyric}"
          </div>
          <div style={{ fontSize: 13, color: C.muted, fontFamily: C.font, marginBottom: 16 }}>
            {note.note} · {note.freq.toFixed(2)} Hz · {note.beats} beat{note.beats > 1 ? "s" : ""}
          </div>
          <button style={BTN("primary")} onClick={doHearIt} disabled={!started}>
            ▶ Hear it
          </button>
        </div>

        {/* Mic error */}
        {micError && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#fca5a5", fontFamily: C.font,
          }}>
            ⚠️ {micError}
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={BTN()} onClick={() => setSelectedIdx(Math.max(0, selectedIdx - 1))}>← Prev</button>
            <button style={BTN()} onClick={() => setSelectedIdx(Math.min(MELODY.length - 1, selectedIdx + 1))}>Next →</button>
          </div>
          <button style={BTN("green")} onClick={() => { stopSession(); onGoPlay(); }}>
            🎤 Start Singing!
          </button>
          <button style={BTN()} onClick={() => { stopSession(); onBack(); }}>← Back to Home</button>
        </div>
      </div>

      {/* ── RIGHT PANEL — live feedback ───────────────────── */}
      <div style={{
        padding: "32px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>

        {/* Big live pitch display */}
        <div style={{
          background: hasPitch
            ? (inTune ? "rgba(74,222,128,0.07)" : "rgba(248,113,113,0.07)")
            : "rgba(0,0,0,0.2)",
          border: `1px solid ${feedbackColor}`,
          borderRadius: 16,
          padding: "32px 40px",
          textAlign: "center",
          transition: "all 0.2s",
          minHeight: 160,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}>
          {hasPitch ? (
            <>
              <div style={{ fontSize: 52, fontWeight: 700, color: feedbackColor, fontFamily: C.font, lineHeight: 1 }}>
                {freqToNoteName(liveHz)}
              </div>
              <div style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", fontFamily: C.font }}>
                {liveHz.toFixed(1)} Hz
              </div>
              <div style={{ fontSize: 16, color: feedbackColor, fontFamily: C.font, marginTop: 4 }}>
                {formatCents(cents)} — {tuningHint(cents)}
              </div>
              <div style={{ fontSize: 48, marginTop: 8 }}>
                {inTune ? "🟢" : "🔴"}
              </div>
            </>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 16, fontFamily: C.font }}>
              {started ? "🎤  Sing into the microphone…" : "Starting microphone…"}
            </div>
          )}
        </div>

        {/* Two stat boxes: YOUR PITCH vs TARGET */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 8 }}>YOUR PITCH</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: C.font, color: hasPitch ? C.blue : "rgba(255,255,255,0.18)" }}>
              {hasPitch ? freqToNoteName(liveHz) : "—"}
            </div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: C.font, marginTop: 4 }}>
              {hasPitch ? `${liveHz.toFixed(0)} Hz` : "waiting…"}
            </div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.25)", border: `1px solid rgba(250,204,21,0.2)`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 8 }}>TARGET</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: C.font, color: C.gold }}>
              {note.note}
            </div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: C.font, marginTop: 4 }}>
              {note.freq.toFixed(0)} Hz
            </div>
          </div>
        </div>

        {/* Canvas — large, fills remaining space */}
        <div style={{ flex: 1, minHeight: 220 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 10 }}>
            PITCH VISUALIZER — match your voice to the green line
          </div>
          <PitchCanvas
            targetFreq={note.freq}
            pitchHistory={pitchHistory}
            width={900}
            height={260}
            isActive={hasPitch}
          />
        </div>

        {/* Cents guide legend */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { color: C.green,               label: "In tune (within ±50 cents)" },
            { color: "#fbbf24",             label: "Close (±50–100 cents)" },
            { color: C.red,                 label: "Off pitch (>100 cents)" },
            { color: "rgba(74,222,128,0.4)", label: "Green band = target zone" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
              <span style={{ fontSize: 11, color: C.muted, fontFamily: C.font }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
