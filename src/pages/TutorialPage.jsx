// ─────────────────────────────────────────────────────────────
// pages/TutorialPage.jsx
//
// BUGS FIXED:
//
//   BUG 1 — Silent "Hear It" button (three layers):
//     a) Context exposes `previewNote` but TutorialPage was
//        destructuring `playPreviewNote` → always undefined →
//        the `if (note && playPreviewNote)` guard silently ate it.
//        Fix: destructure the correct name `previewNote`.
//
//     b) doHearIt was a plain sync function. Chrome requires
//        `await Tone.start()` to be called synchronously inside
//        the exact click handler that received the user gesture.
//        Any async gap (even a resolved Promise) can break the
//        gesture chain and leave Tone's AudioContext suspended.
//        Fix: doHearIt is now `async`, calls Tone.start() first.
//
//     c) startTutorialListening() opens a native Web AudioContext
//        for the mic. Tone.js has its own separate AudioContext.
//        Chrome silently suspends a second AudioContext if the
//        first is already running. Calling Tone.start() inside
//        the click handler (synchronously) forces Chrome to resume
//        Tone's context while still inside the gesture.
//        Fix: same as (b) — explicit Tone.start() in click handler.
//
//   BUG 2 — Two pitch canvases (MelodyContourMap + PitchCanvas):
//     Both panels showed different views of the same data.
//     Fix: replaced both with a single <PlayPitchCanvas> — the
//     same component PlayPage uses — which already draws the full
//     blue melody guide + live green pitch trail in one canvas.
//
// UNCHANGED:
//   • All left-panel controls (note selector, target card, nav)
//   • Live feedback card (your pitch / target note display)
//   • Mic setup lifecycle (startTutorialListening on mount)
//   • Loading guard
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import * as Tone               from "tone";
import { useAudio }            from "../context/AudioContext.jsx";
import { getCentsError, freqToNoteName, formatCents, tuningHint }
                               from "../utils/musicMath.js";
import PlayPitchCanvas         from "../components/PlayPitchCanvas.jsx";

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
  padding: "10px 20px", borderRadius: 8,
  border: variant === "ghost" ? `1px solid ${C.border}` : "none",
  cursor: "pointer", fontFamily: C.font, fontSize: 12,
  fontWeight: 700, letterSpacing: "0.07em",
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
    liveHz, pitchHistory,
    micError, notes,
    startTutorialListening, stopSession,
    previewNote,               // FIX 1a: was 'playPreviewNote' — wrong name
  } = useAudio();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [started,     setStarted]     = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  // Loading guard — notes load async
  if (!notes || notes.length === 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "calc(100vh - 56px)",
        color: "rgba(255,255,255,0.4)", fontFamily: C.font,
        fontSize: 14, letterSpacing: 2,
      }}>
        Loading melody…
      </div>
    );
  }

  const note     = notes[selectedIdx] ?? notes[0];
  const cents    = getCentsError(liveHz, note.freq);
  const inTune   = cents !== null && Math.abs(cents) < 50;
  const hasPitch = liveHz > 0;

  // Start mic on mount
  useEffect(() => {
    let live = true;
    startTutorialListening().then(ok => { if (live && ok) setStarted(true); });
    return () => { live = false; stopSession(); };
  }, []); // eslint-disable-line

  // ── FIX 1b + 1c: Hear It handler ─────────────────────────────
  // MUST be async. MUST call Tone.start() synchronously inside the
  // click handler — Chrome only grants AudioContext resume during
  // an active user gesture. Any async gap before Tone.start() can
  // leave Tone's AudioContext suspended with no error or warning.
const doHearIt = async () => {
  if (!note) return;

  await Tone.start();

  const duration = 1000; // 1 second preview
  const start = performance.now();

  previewNote(note);

  setPreviewProgress(0);

  const animate = () => {
    const elapsed = performance.now() - start;
    const progress = Math.min(elapsed / duration, 1);

    setPreviewProgress(progress);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
};

  const feedbackColor = hasPitch
    ? (inTune ? C.green : C.red)
    : "rgba(255,255,255,0.15)";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "300px 1fr",
      height: "calc(100vh - 56px)",
      overflow: "hidden",
    }}>

      {/* ── LEFT PANEL — note selector + controls ─────────── */}
      <div style={{
        borderRight: `1px solid ${C.border}`,
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        background: "rgba(0,0,0,0.15)",
        overflowY: "auto",
      }}>

        {/* Header */}
        <div>
          <h2 style={{ margin: "0 0 4px", fontFamily: C.font, fontSize: 18, color: "#fff" }}>
            Tutorial Mode
          </h2>
          <p style={{ margin: 0, fontFamily: C.font, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
            Select a word → <strong style={{ color: C.blue }}>Hear it</strong> → sing and match the blue guide.
          </p>
        </div>

        {/* Note selector */}
        <div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 8 }}>
            SELECT A WORD
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {notes.map((n, i) => (
              <div
                key={i}
                onClick={() => setSelectedIdx(i)}
                style={{
                  background: i === selectedIdx ? "rgba(250,204,21,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${i === selectedIdx ? "rgba(250,204,21,0.5)" : C.border}`,
                  borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                  textAlign: "center", transition: "all 0.15s", minWidth: 48,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: i === selectedIdx ? C.gold : C.blue, fontFamily: C.font }}>
                  {n.lyric}
                </div>
                <div style={{ fontSize: 9, color: C.muted, fontFamily: C.font, marginTop: 1 }}>
                  {n.note}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Target note card */}
        <div style={{
          background: "rgba(0,0,0,0.3)", border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "16px",
        }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 10 }}>
            TARGET NOTE
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.gold, fontFamily: C.font, marginBottom: 4 }}>
            "{note.lyric}"
          </div>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: C.font, marginBottom: 14 }}>
            {note.note} · {note.freq.toFixed(1)} Hz
          </div>
          {/* FIX 1: onClick is async, calls Tone.start() first */}
          <button
            style={BTN("primary")}
            onClick={doHearIt}
            disabled={!started}
          >
            ▶ Hear it
          </button>
        </div>

        {/* Live feedback card */}
        <div style={{
          background: hasPitch
            ? (inTune ? "rgba(74,222,128,0.07)" : "rgba(248,113,113,0.07)")
            : "rgba(0,0,0,0.2)",
          border: `1px solid ${feedbackColor}`,
          borderRadius: 10, padding: "16px",
          textAlign: "center", transition: "all 0.2s",
        }}>
          {hasPitch ? (
            <>
              <div style={{ fontSize: 36, fontWeight: 700, color: feedbackColor, fontFamily: C.font, lineHeight: 1 }}>
                {freqToNoteName(liveHz)}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: C.font, marginTop: 3 }}>
                {liveHz.toFixed(1)} Hz
              </div>
              <div style={{ fontSize: 13, color: feedbackColor, fontFamily: C.font, marginTop: 6 }}>
                {formatCents(cents)} — {tuningHint(cents)}
              </div>
              <div style={{ fontSize: 36, marginTop: 6 }}>
                {inTune ? "🟢" : "🔴"}
              </div>
            </>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 13, fontFamily: C.font, padding: "8px 0" }}>
              {started ? "🎤  Sing into the mic…" : "Starting mic…"}
            </div>
          )}
        </div>

        {/* Mic error */}
        {micError && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#fca5a5", fontFamily: C.font,
          }}>
            ⚠️ {micError}
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ ...BTN(), flex: 1 }} onClick={() => setSelectedIdx(Math.max(0, selectedIdx - 1))}>
              ← Prev
            </button>
            <button style={{ ...BTN(), flex: 1 }} onClick={() => setSelectedIdx(Math.min(notes.length - 1, selectedIdx + 1))}>
              Next →
            </button>
          </div>
          <button style={BTN("green")} onClick={() => { stopSession(); onGoPlay(); }}>
            🎤 Start Singing!
          </button>
          <button style={BTN()} onClick={() => { stopSession(); onBack(); }}>
            ← Back to Home
          </button>
        </div>
      </div>

      {/* ── RIGHT PANEL — unified pitch canvas ───────────────── */}
      {/* FIX 2: replaced MelodyContourMap + PitchCanvas with a
          single PlayPitchCanvas — same component as PlayPage.
          Shows blue full-melody guide + live green pitch trail
          in one canvas. selectedIdx maps to activeNoteIndex so
          the current word's note glows blue. elapsedSec=0 in
          tutorial (no transport running) so the dot sits at the
          selected note's position.                               */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        padding: "16px 24px 12px",
        gap: 8,
        overflow: "hidden",
      }}>

        {/* Canvas label */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontFamily: C.font, letterSpacing: 3 }}>
            PITCH GUIDE — blue: full melody · green: your voice
          </div>
          <div style={{
            fontSize: 10, color: C.gold, fontFamily: C.font, fontWeight: 700,
            background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.25)",
            borderRadius: 6, padding: "3px 10px",
          }}>
            {note.note} — {note.lyric}
          </div>
        </div>

        {/* Unified canvas — fills remaining height */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <PlayPitchCanvas
            notes={notes}
            activeNoteIndex={selectedIdx}
            pitchHistory={pitchHistory}
            elapsedSec={0}
            isPlaying={false}
            height={420}
            previewProgress={previewProgress}

          />
        </div>

        {/* YOUR PITCH + TARGET inline below canvas */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            background: "rgba(0,0,0,0.25)", border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "12px 16px",
          }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 6 }}>
              YOUR PITCH
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: C.font, color: hasPitch ? C.blue : "rgba(255,255,255,0.18)" }}>
              {hasPitch ? freqToNoteName(liveHz) : "—"}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: C.font, marginTop: 2 }}>
              {hasPitch ? `${liveHz.toFixed(0)} Hz` : "waiting…"}
            </div>
          </div>
          <div style={{
            background: "rgba(0,0,0,0.25)", border: "1px solid rgba(250,204,21,0.2)",
            borderRadius: 10, padding: "12px 16px",
          }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 6 }}>
              TARGET
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: C.font, color: C.gold }}>
              {note.note}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: C.font, marginTop: 2 }}>
              {note.freq.toFixed(0)} Hz
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", flexShrink: 0 }}>
          {[
            { color: "#93c5fd",              label: "Full melody guide" },
            { color: "rgba(250,204,21,0.9)", label: "Selected note" },
            { color: "#4ade80",              label: "Your pitch (in tune)" },
            { color: "#f87171",              label: "Your pitch (off)" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: C.muted, fontFamily: C.font }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
