// ─────────────────────────────────────────────────────────────
// pages/TutorialPage.jsx
// TIME-BASED throughout.
//
// "Hear it"        → previewSingleNote (single note, no scheduling)
// "▶ badge"        → startFromNote(index) uses note.startMs offset
// activeNoteIndex  → time-based lookup against elapsedMs
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
    variant === "gold"    ? "linear-gradient(135deg,#b45309,#d97706)" :
                            "rgba(255,255,255,0.06)",
  color: "#fff",
  boxShadow: variant === "primary" ? "0 4px 18px rgba(99,102,241,0.4)" : "none",
  whiteSpace: "nowrap",
});

// ── Voice Selection Screen ────────────────────────────────────
function VoiceSelectScreen({ voice, setVoice, onConfirm, onBack }) {
  const voices = [
    { id: "soprano", label: "Soprano", range: "C4 – G5", emoji: "🔴", desc: "High melodic line" },
    { id: "alto",    label: "Alto",    range: "G3 – C5", emoji: "🟨", desc: "Higher harmonies" },
    { id: "tenor",   label: "Tenor",   range: "C3 – G4", emoji: "🟩", desc: "Mid-range, warm voice" },
    { id: "bass",    label: "Bass",    range: "E2 – E4", emoji: "🟦", desc: "Lower, rich tones" },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "calc(100vh - 56px)",
      gap: 32, padding: "0 24px",
      background: "radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, fontFamily: C.font, color: C.muted, letterSpacing: 4, marginBottom: 10 }}>
          TUTORIAL MODE
        </div>
        <h2 style={{ margin: 0, fontFamily: C.font, fontSize: 28, color: "#fff", fontWeight: 700 }}>
          Choose Your Voice
        </h2>
        <p style={{ margin: "8px 0 0", fontFamily: C.font, fontSize: 12, color: C.muted }}>
          Pick the part you want to practice. You can change it later.
        </p>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {voices.map((v) => {
          const isSelected = voice === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setVoice(v.id)}
              style={{
                width: 160, padding: "24px 16px", borderRadius: 14,
                border: `2px solid ${isSelected ? C.blue : C.border}`,
                background: isSelected ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
                cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                transition: "all 0.15s",
                boxShadow: isSelected ? "0 0 20px rgba(59,130,246,0.25)" : "none",
              }}
            >
              <div style={{ fontSize: 36 }}>{v.emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: C.font, color: isSelected ? C.blue : "#e2e8f0" }}>
                {v.label}
              </div>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: C.font }}>{v.range}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: C.font, textAlign: "center" }}>
                {v.desc}
              </div>
              {isSelected && (
                <div style={{ fontSize: 9, color: C.blue, fontFamily: C.font, letterSpacing: 2, fontWeight: 700 }}>
                  ✓ SELECTED
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={onConfirm}
          style={{
            padding: "14px 40px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
            color: "#fff", fontFamily: C.font, fontSize: 14,
            fontWeight: 700, cursor: "pointer", letterSpacing: 1,
            boxShadow: "0 4px 20px rgba(99,102,241,0.45)",
          }}
        >
          ▶ PRACTICE AS {voice.toUpperCase()}
        </button>
        <button
          onClick={onBack}
          style={{
            padding: "14px 24px", borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,0.05)",
            color: "#fff", fontFamily: C.font, fontSize: 12,
            fontWeight: 700, cursor: "pointer", letterSpacing: 1,
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function TutorialPage({ onBack, onGoPlay }) {
  const {
    voice, setVoice,
    liveHz, pitchHistory,
    micError, notes,
    isPlaying, isPaused,
    elapsedMs,
    startTutorialListening, stopSession,
    startFromNote,
    previewSingleNote,       // ← single-note audition (no scheduling)
  } = useAudio();

  // ── ALL HOOKS FIRST ───────────────────────────────────────
  const [voiceConfirmed, setVoiceConfirmed] = useState(false);
  const [selectedIdx,    setSelectedIdx]    = useState(0);
  const [started,        setStarted]        = useState(false);
  const [playingFromIdx, setPlayingFromIdx] = useState(null);

  // Start mic after voice is confirmed
  useEffect(() => {
    if (!voiceConfirmed) return;
    let live = true;
    startTutorialListening().then(ok => { if (live && ok) setStarted(true); });
    return () => { live = false; stopSession(); };
  }, [voiceConfirmed]); // eslint-disable-line

  // Clear playingFromIdx when playback ends
  useEffect(() => {
    if (!isPlaying && !isPaused) setPlayingFromIdx(null);
  }, [isPlaying, isPaused]);

  // ── Conditional renders AFTER all hooks ──────────────────

  if (!voiceConfirmed) {
    return (
      <VoiceSelectScreen
        voice={voice}
        setVoice={setVoice}
        onConfirm={() => setVoiceConfirmed(true)}
        onBack={onBack}
      />
    );
  }

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

  // ── Derived values ─────────────────────────────────────
  const note     = notes[selectedIdx] ?? notes[0];
  const cents    = getCentsError(liveHz, note.freq);
  const inTune   = cents !== null && Math.abs(cents) < 50;
  const hasPitch = liveHz > 0;

  // ── TIME-BASED active note index ──────────────────────
  // During live playback: find note by elapsed time.
  // When paused/stopped:  fall back to the selected word.
  const liveActiveIdx = isPlaying
    ? notes.findIndex((n) => elapsedMs >= n.startMs && elapsedMs < n.endMs)
    : -1;
  const activeNoteIndex  = liveActiveIdx >= 0 ? liveActiveIdx : selectedIdx;

  // Canvas time: when playing use real elapsed; when static, show selected note position
  const canvasElapsedSec = isPlaying
    ? elapsedMs / 1000
    : (notes[selectedIdx]?.startMs ?? 0) / 1000;

  const feedbackColor = hasPitch ? (inTune ? C.green : C.red) : "rgba(255,255,255,0.15)";

  // ── Handlers ─────────────────────────────────────────

  /**
   * "Hear it" — plays ONLY the selected note (no full-melody scheduling).
   * Uses previewSingleNote which calls schedPreview(ctx, freq, beats).
   */
  const doHearIt = async () => {
    if (!started || !note) return;
    await Tone.start();
    await previewSingleNote(note);
  };

  /**
   * ▶ badge on a word — plays from that note's startMs to end of melody.
   * Uses startFromNote(index) which maps index → note.startMs offset.
   */
  const doPlayFromNote = async (idx) => {
    if (!started) return;
    await Tone.start();
    setSelectedIdx(idx);
    setPlayingFromIdx(idx);
    await startFromNote(idx);
  };

  const doStop = () => {
    stopSession();
    // Restart mic-only listening after stopping melody playback
    startTutorialListening().then(ok => { if (ok) setStarted(true); });
    setPlayingFromIdx(null);
  };

  // ─────────────────────────────────────────────────────
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "300px 1fr",
      height: "calc(100vh - 56px)",
      overflow: "hidden",
    }}>

      {/* ── LEFT PANEL ──────────────────────────────────── */}
      <div style={{
        borderRight: `1px solid ${C.border}`,
        padding: "24px 20px",
        display: "flex", flexDirection: "column", gap: 16,
        background: "rgba(0,0,0,0.15)", overflowY: "auto",
      }}>

        <div>
          <h2 style={{ margin: "0 0 2px", fontFamily: C.font, fontSize: 18, color: "#fff" }}>
            Tutorial Mode
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{
              fontSize: 10, fontFamily: C.font, color: C.blue,
              background: "rgba(147,197,253,0.1)",
              border: "1px solid rgba(147,197,253,0.25)",
              borderRadius: 6, padding: "2px 10px", letterSpacing: 1, fontWeight: 700,
            }}>
              {voice.toUpperCase()}
            </div>
            <button
              onClick={() => { stopSession(); setVoiceConfirmed(false); setStarted(false); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: C.font, fontSize: 10, color: C.muted,
                textDecoration: "underline", padding: 0,
              }}
            >
              change
            </button>
          </div>
          <p style={{ margin: 0, fontFamily: C.font, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
            Select a word → <strong style={{ color: C.blue }}>Hear it</strong> → canvas follows along.
          </p>
        </div>

        {/* Playing status banner */}
        {isPlaying && (
          <div style={{
            background: "rgba(74,222,128,0.08)",
            border: "1px solid rgba(74,222,128,0.3)",
            borderRadius: 8, padding: "8px 12px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 11, color: C.green, fontFamily: C.font, fontWeight: 700, letterSpacing: 1 }}>
              ● FROM "{notes[playingFromIdx]?.lyric ?? "…"}"
            </span>
            <button
              onClick={doStop}
              style={{ ...BTN(), padding: "4px 10px", fontSize: 10, border: "1px solid rgba(248,113,113,0.4)", color: C.red }}
            >
              ■ STOP
            </button>
          </div>
        )}

        {/* Word selector grid */}
        <div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 8 }}>
            SELECT A WORD
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {notes.map((n, i) => {
              const isSelected   = i === selectedIdx;
              const isActiveLive = isPlaying && i === activeNoteIndex;
              const isFromHere   = i === playingFromIdx;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  style={{
                    background: isActiveLive ? "rgba(74,222,128,0.12)" : isSelected ? "rgba(250,204,21,0.1)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isActiveLive ? "rgba(74,222,128,0.5)" : isSelected ? "rgba(250,204,21,0.5)" : C.border}`,
                    borderRadius: 8, padding: "8px 12px",
                    cursor: "pointer", textAlign: "center",
                    transition: "all 0.15s", minWidth: 48, position: "relative",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: C.font, color: isActiveLive ? C.green : isSelected ? C.gold : C.blue }}>
                    {n.lyric}
                  </div>
                  <div style={{ fontSize: 9, color: C.muted, fontFamily: C.font, marginTop: 1 }}>
                    {n.note}
                  </div>
                  {/* ▶ badge — plays from this note's startMs */}
                  <div
                    onClick={(e) => { e.stopPropagation(); doPlayFromNote(i); }}
                    title={`Play from "${n.lyric}"`}
                    style={{
                      position: "absolute", top: -6, right: -6,
                      width: 16, height: 16, borderRadius: "50%",
                      background: isFromHere ? C.gold : "rgba(147,197,253,0.75)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 7, color: "#000", fontWeight: 900, cursor: "pointer",
                    }}
                  >
                    ▶
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", fontFamily: C.font, marginTop: 6 }}>
            Tap ▶ badge to play from any word.
          </div>
        </div>

        {/* Target note panel */}
        <div style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 10 }}>
            TARGET NOTE
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.gold, fontFamily: C.font, marginBottom: 4 }}>
            "{note.lyric}"
          </div>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: C.font, marginBottom: 14 }}>
            {note.note} · {note.freq.toFixed(1)} Hz
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* "Hear it" plays ONLY this note — no full melody scheduling */}
            <button style={{ ...BTN("primary"), flex: 1 }} onClick={doHearIt} disabled={!started}>
              ▶ Hear it
            </button>
            {isPlaying && (
              <button
                style={{ ...BTN(), flex: 1, border: "1px solid rgba(248,113,113,0.4)", color: C.red }}
                onClick={doStop}
              >
                ■ Stop
              </button>
            )}
          </div>
        </div>

        {/* Live pitch feedback */}
        <div style={{
          background: hasPitch ? (inTune ? "rgba(74,222,128,0.07)" : "rgba(248,113,113,0.07)") : "rgba(0,0,0,0.2)",
          border: `1px solid ${feedbackColor}`,
          borderRadius: 10, padding: "16px", textAlign: "center", transition: "all 0.2s",
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
              <div style={{ fontSize: 36, marginTop: 6 }}>{inTune ? "🟢" : "🔴"}</div>
            </>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 13, fontFamily: C.font, padding: "8px 0" }}>
              {started ? "🎤  Sing into the mic…" : "Starting mic…"}
            </div>
          )}
        </div>

        {micError && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "8px 12px",
            fontSize: 11, color: "#fca5a5", fontFamily: C.font,
          }}>
            ⚠️ {micError}
          </div>
        )}

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ ...BTN(), flex: 1 }} onClick={() => setSelectedIdx(Math.max(0, selectedIdx - 1))}>← Prev</button>
            <button style={{ ...BTN(), flex: 1 }} onClick={() => setSelectedIdx(Math.min(notes.length - 1, selectedIdx + 1))}>Next →</button>
          </div>
          <button style={BTN("green")} onClick={() => { stopSession(); onGoPlay(); }}>🎤 Start Singing!</button>
          <button style={BTN()} onClick={() => { stopSession(); onBack(); }}>← Back to Home</button>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", padding: "16px 24px 12px", gap: 8, overflow: "hidden" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontFamily: C.font, letterSpacing: 3 }}>
            {isPlaying ? "LIVE PLAYBACK — scrolling to match audio" : "PITCH GUIDE — select a word to focus"}
          </div>
          <div style={{
            fontSize: 10, color: C.gold, fontFamily: C.font, fontWeight: 700,
            background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.25)",
            borderRadius: 6, padding: "3px 10px",
          }}>
            {note.note} — {note.lyric}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <PlayPitchCanvas
            notes={notes}
            activeNoteIndex={activeNoteIndex}
            pitchHistory={pitchHistory}
            elapsedSec={canvasElapsedSec}
            isPlaying={isPlaying}
            height={420}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flexShrink: 0 }}>
          <div style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 6 }}>YOUR PITCH</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: C.font, color: hasPitch ? C.blue : "rgba(255,255,255,0.18)" }}>
              {hasPitch ? freqToNoteName(liveHz) : "—"}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: C.font, marginTop: 2 }}>
              {hasPitch ? `${liveHz.toFixed(0)} Hz` : "waiting…"}
            </div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(250,204,21,0.2)", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 6 }}>TARGET</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: C.font, color: C.gold }}>{note.note}</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: C.font, marginTop: 2 }}>{note.freq.toFixed(0)} Hz</div>
          </div>
        </div>

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
