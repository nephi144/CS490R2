// ─────────────────────────────────────────────────────────────
// pages/PlayPage.jsx
// TIME-BASED: activeNoteIndex derived from elapsedMs, not array position.
// Voice list includes soprano/alto/tenor/bass from VOICES.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { useAudio }        from "../context/AudioContext.jsx";
import { getCentsError, freqToNoteName, formatCents } from "../utils/musicMath.js";
import PlayPitchCanvas     from "../components/PlayPitchCanvas.jsx";
import KaraokeLyrics       from "../components/KaraokeLyrics.jsx";

const C = {
  border: "rgba(255,255,255,0.08)",
  muted:  "rgba(255,255,255,0.38)",
  font:   "'Courier New', Courier, monospace",
  green:  "#4ade80",
  red:    "#f87171",
  gold:   "#facc15",
  blue:   "#93c5fd",
  purple: "#a78bfa",
};

// ── CountdownOverlay ──────────────────────────────────────────
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

// ── Voice Selection Screen ────────────────────────────────────
function VoiceSelectScreen({ voice, setVoice, onStart, onBack }) {
  const voices = [
    { id: "soprano", label: "Soprano", range: "C4 – G5", emoji: "🔴" },
    { id: "alto",    label: "Alto",    range: "G3 – C5", emoji: "🟨" },
    { id: "tenor",   label: "Tenor",   range: "C3 – G4", emoji: "🟩" },
    { id: "bass",    label: "Bass",    range: "E2 – E4", emoji: "🟦" },
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
          STEP 1 OF 2
        </div>
        <h2 style={{ margin: 0, fontFamily: C.font, fontSize: 28, color: "#fff", fontWeight: 700 }}>
          Choose Your Voice
        </h2>
        <p style={{ margin: "8px 0 0", fontFamily: C.font, fontSize: 12, color: C.muted }}>
          Select the part that matches your singing range.
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
                width: 160, padding: "24px 16px",
                borderRadius: 14,
                border: `2px solid ${isSelected ? C.blue : C.border}`,
                background: isSelected ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
                cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 10,
                transition: "all 0.15s",
                boxShadow: isSelected ? "0 0 20px rgba(59,130,246,0.25)" : "none",
              }}
            >
              <div style={{ fontSize: 36 }}>{v.emoji}</div>
              <div style={{
                fontSize: 18, fontWeight: 700, fontFamily: C.font,
                color: isSelected ? C.blue : "#e2e8f0",
              }}>
                {v.label}
              </div>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: C.font }}>
                {v.range}
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
          onClick={onStart}
          style={{
            padding: "14px 40px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
            color: "#fff", fontFamily: C.font, fontSize: 14,
            fontWeight: 700, cursor: "pointer", letterSpacing: 1,
            boxShadow: "0 4px 20px rgba(99,102,241,0.45)",
          }}
        >
          ▶ START AS {voice.toUpperCase()}
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
          ← BACK
        </button>
      </div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      background: "rgba(0,0,0,0.3)", border: `1px solid ${C.border}`,
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
    voice, setVoice,
    isListening, isPlaying, isPaused,
    liveHz, activeNote, elapsedMs,
    notes, noteScores, finalScore,
    pitchHistory, micError,
    startSession, stopSession,
    pauseSession, resumeSession,
  } = useAudio();

  const elapsedSec = elapsedMs / 1000;

  const [voiceConfirmed, setVoiceConfirmed] = useState(false);
  const [countdown,      setCountdown]      = useState(null);
  const [sessionDone,    setSessionDone]    = useState(false);
  const cdRef = useRef(null);

  // ── Countdown → startSession ────────────────────────────
  const launchCountdown = () => {
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

  const handleVoiceConfirmed = () => {
    setVoiceConfirmed(true);
    launchCountdown();
  };

  useEffect(() => {
    return () => { clearInterval(cdRef.current); stopSession(); };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (finalScore !== null && !sessionDone) {
      setSessionDone(true);
      setTimeout(() => onComplete(), 600);
    }
  }, [finalScore]); // eslint-disable-line

  // ── Play / Pause / Resume ──────────────────────────────
  const handlePlayPause = () => {
    if (isPlaying && !isPaused)  { pauseSession();   }
    else if (isPaused)           { resumeSession();  }
    else if (!sessionDone)       { launchCountdown(); }
  };

  const playBtnLabel =
    isPlaying   ? "⏸ PAUSE"  :
    isPaused    ? "▶ RESUME" :
    sessionDone ? "✓ DONE"   : "▶ PLAY";

  const playBtnColor =
    isPlaying   ? C.red  :
    isPaused    ? C.gold :
    sessionDone ? C.muted : C.green;

  // ── TIME-BASED derived values ───────────────────────────
  const totalDur    = notes?.length ? notes[notes.length - 1].endMs / 1000 : 1;
  const progressPct = totalDur > 0 ? Math.min(100, (elapsedSec / totalDur) * 100) : 0;

  // Derive active note index from elapsed time (not array position)
  let activeNoteIndex = -1;
  if (notes?.length) {
    activeNoteIndex = notes.findIndex(
      (n) => elapsedMs >= n.startMs && elapsedMs < n.endMs
    );
    // After melody finishes, clamp to last note for visual continuity
    if (activeNoteIndex === -1 && elapsedMs >= notes[notes.length - 1].endMs) {
      activeNoteIndex = notes.length - 1;
    }
  }

  const targetFreq = activeNote?.freq ?? null;
  const cents      = getCentsError(liveHz, targetFreq);
  const inTune     = cents !== null && Math.abs(cents) < 50;
  const centsColor = cents !== null ? (inTune ? C.green : C.red) : "rgba(255,255,255,0.35)";

  // ── Voice select screen ─────────────────────────────────
  if (!voiceConfirmed) {
    return (
      <VoiceSelectScreen
        voice={voice}
        setVoice={setVoice}
        onStart={handleVoiceConfirmed}
        onBack={onBack}
      />
    );
  }

  // ─────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "calc(100vh - 56px)", overflow: "hidden",
    }}>
      {countdown !== null && <CountdownOverlay count={countdown} />}

      {/* ── TOP BAR ────────────────────────────────────────── */}
      <div style={{
        padding: "10px 28px",
        borderBottom: `1px solid ${C.border}`,
        background: "rgba(0,0,0,0.2)",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <div style={{
          fontFamily: C.font, fontSize: 12, fontWeight: 700, letterSpacing: 2, minWidth: 130,
          color: isPlaying ? C.green : isPaused ? C.gold : sessionDone ? C.gold : C.muted,
        }}>
          {isPlaying ? "● SINGING" : isPaused ? "⏸ PAUSED" : sessionDone ? "✓ COMPLETE" : "READY"}
        </div>

        <button
          onClick={handlePlayPause}
          disabled={sessionDone || countdown !== null}
          style={{
            padding: "6px 16px", borderRadius: 7,
            border: `1px solid ${playBtnColor}`,
            background: `${playBtnColor}22`,
            color: playBtnColor,
            fontFamily: C.font, fontSize: 11, fontWeight: 700,
            cursor: (sessionDone || countdown !== null) ? "not-allowed" : "pointer",
            letterSpacing: 1, opacity: (sessionDone || countdown !== null) ? 0.4 : 1,
            transition: "all 0.15s",
          }}
        >
          {playBtnLabel}
        </button>

        {/* Voice badge (read-only during session) */}
        <div style={{
          padding: "5px 12px", borderRadius: 6,
          border: `1px solid ${C.border}`,
          background: "rgba(255,255,255,0.04)",
          fontFamily: C.font, fontSize: 11, color: C.blue, letterSpacing: 1,
        }}>
          {voice.toUpperCase()}
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

      {/* ── MIC ERROR ─────────────────────────────────────────── */}
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

      {/* ── PITCH CANVAS ──────────────────────────────────────── */}
      <div style={{ flex: "0 0 62%", padding: "10px 20px 4px", minHeight: 0 }}>
        <div style={{
          fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: C.font,
          letterSpacing: 3, marginTop: 10, marginBottom: 6,
        }}>
          PITCH VISUALIZER — blue: target melody · green: your voice
        </div>
        <PlayPitchCanvas
          notes={notes}
          activeNoteIndex={activeNoteIndex}
          pitchHistory={pitchHistory}
          elapsedSec={elapsedSec}
          isPlaying={isPlaying}
          height={360}
        />
      </div>

      {/* ── KARAOKE LYRICS ────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid rgba(255,255,255,0.06)`,
        background: "rgba(0,0,0,0.18)", flexShrink: 0, padding: "0 20px",
      }}>
        <KaraokeLyrics melody={notes} activeNoteIndex={activeNoteIndex} />
      </div>

      {/* ── BOTTOM STATS ──────────────────────────────────────── */}
      <div style={{
        flex: "1 1 auto", display: "flex", alignItems: "center",
        justifyContent: "center", gap: 12, padding: "12px 28px",
        flexWrap: "wrap", background: "rgba(0,0,0,0.15)",
      }}>
        <StatPill
          label="YOUR PITCH"
          value={liveHz > 0 ? `${freqToNoteName(liveHz)}  ${liveHz.toFixed(0)} Hz` : "—"}
          color={liveHz > 0 ? C.blue : "rgba(255,255,255,0.2)"}
        />
        <StatPill
          label="TARGET"
          value={activeNote ? `${activeNote.note}  ${activeNote.freq.toFixed(0)} Hz` : "—"}
          color={activeNote ? C.gold : "rgba(255,255,255,0.2)"}
        />
        <StatPill
          label="CENTS OFF"
          value={formatCents(cents)}
          color={centsColor}
        />

        <div style={{ fontSize: 40, lineHeight: 1 }}>
          {liveHz > 0 ? (inTune ? "🟢" : "🔴") : "⚫"}
        </div>

        {cents !== null && (
          <div style={{
            fontFamily: C.font, fontSize: 12, fontWeight: 700,
            color: centsColor, letterSpacing: 1,
            minWidth: 120, textAlign: "center",
          }}>
            {inTune ? "✓ In tune!" : cents > 0 ? "Sing lower ↓" : "Sing higher ↑"}
          </div>
        )}

        {/* Per-note score bar chart */}
        {Object.keys(noteScores).length > 0 && notes?.length > 0 && (
          <div style={{
            display: "flex", gap: 6, alignItems: "flex-end",
            height: 44, marginLeft: "auto",
            background: "rgba(0,0,0,0.2)", border: `1px solid ${C.border}`,
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
                    width: "100%", minWidth: 8, height: h,
                    background: col, borderRadius: 2,
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
