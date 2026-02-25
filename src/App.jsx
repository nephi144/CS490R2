// ─────────────────────────────────────────────────────────────
// App.jsx  — FULL VIEWPORT layout (no more mobile card)
// Structure:
//   ┌─────────────────── NAVBAR ──────────────────────┐
//   │  Logo            Page Tabs         Mic Status   │
//   └─────────────────────────────────────────────────┘
//   ┌──────────── FULL-WIDTH PAGE CONTENT ────────────┐
//   │  Home  /  Tutorial  /  Play  /  Result           │
//   └─────────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { AudioProvider, useAudio } from "./context/AudioContext.jsx";
import { MELODY }                   from "./audio/melody.js";
import TutorialPage                 from "./pages/TutorialPage.jsx";
import PlayPage                     from "./pages/PlayPage.jsx";
import ResultPage                   from "./pages/ResultPage.jsx";

// ── Design tokens ─────────────────────────────────────────────
const C = {
  bg:        "#05090f",
  surface:   "rgba(255,255,255,0.03)",
  border:    "rgba(255,255,255,0.08)",
  text:      "#e2e8f0",
  muted:     "rgba(255,255,255,0.38)",
  accent:    "#3b82f6",
  purple:    "#7c3aed",
  gold:      "#facc15",
  green:     "#4ade80",
  red:       "#f87171",
  font:      "'Courier New', Courier, monospace",
};

const BTN = (variant = "ghost") => ({
  padding: variant === "ghost" ? "8px 18px" : "12px 32px",
  borderRadius: 8,
  border: variant === "ghost" ? `1px solid ${C.border}` : "none",
  cursor: "pointer",
  fontFamily: C.font,
  fontSize: variant === "ghost" ? 12 : 14,
  fontWeight: 700,
  letterSpacing: "0.07em",
  background:
    variant === "primary" ? `linear-gradient(135deg, ${C.accent}, ${C.purple})` :
    variant === "green"   ? "linear-gradient(135deg,#16a34a,#059669)" :
                            "rgba(255,255,255,0.06)",
  color: "#fff",
  boxShadow: variant === "primary" ? "0 4px 20px rgba(99,102,241,0.35)" : "none",
  transition: "opacity 0.15s, transform 0.1s",
  whiteSpace: "nowrap",
});

// ── Navbar ────────────────────────────────────────────────────
function Navbar({ page, setPage, resetAll, isListening }) {
  const tabs = [
    { id: "home",     label: "Home" },
    { id: "tutorial", label: "Tutorial" },
    { id: "play",     label: "Sing" },
    { id: "result",   label: "Results" },
  ];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: 56,
      background: "rgba(5,9,15,0.92)",
      borderBottom: `1px solid ${C.border}`,
      backdropFilter: "blur(14px)",
      display: "flex",
      alignItems: "center",
      padding: "0 28px",
      gap: 0,
    }}>
      {/* Logo */}
      <div style={{
        fontSize: 18,
        fontWeight: 700,
        fontFamily: C.font,
        background: `linear-gradient(90deg, #93c5fd, #c4b5fd)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginRight: 40,
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
      }}>
        🎵 Child of God
      </div>

      {/* Page tabs */}
      <div style={{ display: "flex", gap: 4, flex: 1 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { resetAll(); setPage(t.id); }}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              fontFamily: C.font,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.07em",
              background: page === t.id ? "rgba(99,102,241,0.18)" : "transparent",
              color: page === t.id ? "#93c5fd" : C.muted,
              borderBottom: page === t.id ? `2px solid #3b82f6` : "2px solid transparent",
              borderRadius: "6px 6px 0 0",
              transition: "all 0.15s",
            }}
          >
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Mic status */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: isListening ? C.green : "#374151",
          boxShadow: isListening ? `0 0 8px ${C.green}` : "none",
          transition: "all 0.3s",
        }} />
        <span style={{ fontSize: 11, color: C.muted, fontFamily: C.font, letterSpacing: 1 }}>
          {isListening ? "MIC ON" : "MIC OFF"}
        </span>
      </div>
    </nav>
  );
}

// ── Home Page — full viewport ─────────────────────────────────
function HomePage({ onTutorial, onPlay }) {
  const { micError } = useAudio();

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "1fr",
      gap: 0,
      height: "100%",
      minHeight: "calc(100vh - 56px)",
    }}>
      {/* LEFT — Hero text */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 64px",
        borderRight: `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎵</div>

        <h1 style={{
          margin: "0 0 12px",
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 700,
          fontFamily: C.font,
          letterSpacing: "0.02em",
          lineHeight: 1.2,
          background: "linear-gradient(135deg, #93c5fd 0%, #c4b5fd 50%, #93c5fd 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          I Am a Child<br />of God
        </h1>

        <p style={{
          color: C.muted,
          fontSize: 15,
          fontFamily: C.font,
          lineHeight: 1.8,
          marginBottom: 36,
          maxWidth: 420,
        }}>
          A real-time pitch accuracy tracker. Sing the first phrase,
          see your pitch on screen, and get an accuracy score —
          no music reading required.
        </p>

        {micError && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: "#fca5a5",
            fontFamily: C.font,
          }}>
            ⚠️ {micError}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 340 }}>
          <button style={BTN("ghost")} onClick={onTutorial}>
            🎓 TUTORIAL — Practice each note
          </button>
          <button style={BTN("primary")} onClick={onPlay}>
            🎤 START — Sing the full phrase
          </button>
        </div>

        <p style={{
          marginTop: 28,
          fontSize: 11,
          color: "rgba(255,255,255,0.18)",
          fontFamily: C.font,
        }}>
          Microphone access required · Best in a quiet room
        </p>
      </div>

      {/* RIGHT — Note preview grid */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 64px",
        background: "rgba(0,0,0,0.2)",
      }}>
        <div style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.25)",
          fontFamily: C.font,
          letterSpacing: 3,
          marginBottom: 28,
          textTransform: "uppercase",
        }}>
          First Phrase — Notes Preview
        </div>

        {/* Big note cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 36,
        }}>
          {MELODY.map((n, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "20px 16px",
              textAlign: "center",
            }}>
              <div style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#93c5fd",
                fontFamily: C.font,
                marginBottom: 6,
              }}>
                {n.lyric}
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: C.font }}>
                {n.note}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: C.font, marginTop: 4 }}>
                {n.freq.toFixed(0)} Hz
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "20px 24px",
        }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: C.font, letterSpacing: 3, marginBottom: 14 }}>
            HOW IT WORKS
          </div>
          {[
            ["1", "Melody plays through your speakers"],
            ["2", "You sing along into the microphone"],
            ["3", "Your pitch appears on screen in real time"],
            ["4", "Get a score based on how close you were"],
          ].map(([n, t]) => (
            <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "rgba(99,102,241,0.25)",
                color: "#93c5fd",
                fontFamily: C.font,
                fontSize: 11,
                fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {n}
              </div>
              <span style={{ fontSize: 13, color: C.muted, fontFamily: C.font, lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Router + full-page shell ──────────────────────────────────
function Router() {
  const [page, setPage] = useState("home");
  const { isListening, resetAll } = useAudio();

  const goTo = (p) => { resetAll(); setPage(p); };

  return (
    <div style={{
      width: "100vw",
      minHeight: "100vh",
      background: C.bg,
      backgroundImage: "none",
      color: C.text,
      boxSizing: "border-box",
      overflowX: "hidden",
    }}>
      {/* Fixed navbar */}
      <Navbar page={page} setPage={setPage} resetAll={resetAll} isListening={isListening} />

      {/* Page area — below navbar */}
      <div style={{ paddingTop: 56, minHeight: "100vh", boxSizing: "border-box" }}>

        {page === "home" && (
          <HomePage
            onTutorial={() => setPage("tutorial")}
            onPlay={() => setPage("play")}
          />
        )}

        {page === "tutorial" && (
          <TutorialPage
            onBack={() => goTo("home")}
            onGoPlay={() => goTo("play")}
          />
        )}

        {page === "play" && (
          <PlayPage
            onBack={() => goTo("home")}
            onComplete={() => setPage("result")}
          />
        )}

        {page === "result" && (
          <ResultPage
            onHome={() => goTo("home")}
            onRetry={() => goTo("play")}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <Router />
    </AudioProvider>
  );
}
