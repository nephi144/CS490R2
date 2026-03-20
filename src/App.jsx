// ─────────────────────────────────────────────────────────────
// App.jsx  — FULL VIEWPORT layout
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { AudioProvider, useAudio } from "./context/AudioContext.jsx";
import TutorialPage                 from "./pages/TutorialPage.jsx";
import PlayPage                     from "./pages/PlayPage.jsx";
import ResultPage                   from "./pages/ResultPage.jsx";

const C = {
  bg:      "#05090f",
  border:  "rgba(255,255,255,0.08)",
  text:    "#e2e8f0",
  muted:   "rgba(255,255,255,0.38)",
  accent:  "#3b82f6",
  purple:  "#7c3aed",
  gold:    "#facc15",
  green:   "#4ade80",
  red:     "#f87171",
  font:    "'Courier New', Courier, monospace",
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
      <div style={{
        fontSize: 18, fontWeight: 700, fontFamily: C.font,
        background: "linear-gradient(90deg, #93c5fd, #c4b5fd)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        marginRight: 40, whiteSpace: "nowrap", letterSpacing: "0.02em",
      }}>
        Child of God
      </div>

      <div style={{ display: "flex", gap: 4, flex: 1 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { resetAll(); setPage(t.id); }}
            style={{
              padding: "6px 16px", borderRadius: "6px 6px 0 0",
              border: "none", cursor: "pointer", fontFamily: C.font,
              fontSize: 12, fontWeight: 700, letterSpacing: "0.07em",
              background: page === t.id ? "rgba(99,102,241,0.18)" : "transparent",
              color: page === t.id ? "#93c5fd" : C.muted,
              borderBottom: page === t.id ? "2px solid #3b82f6" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

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

// ── Divider ───────────────────────────────────────────────────
function Divider() {
  return (
    <div style={{ borderTop: `1px solid ${C.border}`, margin: "28px 0" }} />
  );
}

// ── Section label ─────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9, fontFamily: C.font, color: "rgba(255,255,255,0.25)",
      letterSpacing: 4, marginBottom: 16, textTransform: "uppercase",
    }}>
      {children}
    </div>
  );
}

// ── Feature row ───────────────────────────────────────────────
function FeatureRow({ icon, text }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: "rgba(99,102,241,0.15)",
        border: "1px solid rgba(99,102,241,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 13, color: C.muted, fontFamily: C.font, lineHeight: 1.6, paddingTop: 4 }}>
        {text}
      </span>
    </div>
  );
}

// ── Step row ──────────────────────────────────────────────────
function StepRow({ n, title, detail }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: "rgba(99,102,241,0.22)",
        border: "1px solid rgba(99,102,241,0.35)",
        color: "#93c5fd", fontFamily: C.font, fontSize: 11, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {n}
      </div>
      <div>
        <div style={{ fontSize: 13, color: C.text, fontFamily: C.font, fontWeight: 700, marginBottom: 2 }}>
          {title}
        </div>
        {detail && (
          <div style={{ fontSize: 12, color: C.muted, fontFamily: C.font, lineHeight: 1.6 }}>
            {detail}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Voice badge ───────────────────────────────────────────────
function VoiceBadge({ label, range, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${color}22`,
      borderRadius: 8, padding: "10px 14px",
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: C.font, color: C.text }}>{label}</div>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: C.font }}>{range}</div>
      </div>
    </div>
  );
}

// ── HomePage ──────────────────────────────────────────────────
function HomePage({ onTutorial, onPlay }) {
  const { micError } = useAudio();

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      minHeight: "calc(100vh - 56px)",
    }}>

      {/* ── LEFT COLUMN ─────────────────────────────────────── */}
      <div style={{
        display: "flex", flexDirection: "column",
        padding: "48px 52px",
        borderRight: `1px solid ${C.border}`,
        overflowY: "auto",
      }}>

        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontFamily: C.font, color: "rgba(255,255,255,0.2)", letterSpacing: 4, marginBottom: 14 }}>
            HYMN SINGING TRAINER & VISUALIZER
          </div>
          <h1 style={{
            margin: "0 0 16px",
            fontSize: "clamp(26px, 3vw, 40px)",
            fontWeight: 700, fontFamily: C.font,
            lineHeight: 1.25, letterSpacing: "0.01em",
            background: "linear-gradient(135deg, #93c5fd 0%, #c4b5fd 60%, #93c5fd 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Learn to Sing Hymns<br />with Real-Time Guidance
          </h1>
          <p style={{ margin: 0, color: C.muted, fontSize: 14, fontFamily: C.font, lineHeight: 1.8, maxWidth: 440 }}>
            This application helps users improve singing accuracy by combining music
            visualization with real-time pitch detection — making hymn singing
            interactive, visual, and accessible.
          </p>
        </div>

        {micError && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 20,
            fontSize: 12, color: "#fca5a5", fontFamily: C.font,
          }}>
            ⚠️ {micError}
          </div>
        )}

        {/* CTA buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320, marginBottom: 36 }}>
          <button style={BTN("primary")} onClick={onPlay}>START SINGING</button>
          <button style={BTN("ghost")} onClick={onTutorial}>OPEN TUTORIAL</button>
        </div>

        <Divider />

        {/* What this project is about */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>What This Project Does</SectionLabel>
          <FeatureRow icon="→" text="Displays the exact notes the user should sing, updated in real time" />
          <FeatureRow icon="→" text="Compares the user's live voice against the target melody" />
          <FeatureRow icon="→" text="Scores pitch accuracy note-by-note after each performance" />
          <FeatureRow icon="→" text="Supports Bass, Tenor, and Alto voice parts from the SATB arrangement" />
        </div>

        <Divider />

        {/* Purpose */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>Purpose</SectionLabel>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: C.muted, fontFamily: C.font, lineHeight: 1.8 }}>
            Many singers struggle to stay on pitch, identify their voice part, or follow
            music without prior training. This tool provides visual guidance and instant
            audio feedback — lowering the barrier to confident singing.
          </p>
        </div>

        <Divider />

        {/* Voice parts */}
        <div>
          <SectionLabel>Supported Voice Parts</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <VoiceBadge label="Bass"  range="C2 – E4"  color="#60a5fa" />
            <VoiceBadge label="Tenor" range="C3 – G4"  color="#4ade80" />
            <VoiceBadge label="Alto"  range="G3 – C5"  color="#facc15" />
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN ────────────────────────────────────── */}
      <div style={{
        display: "flex", flexDirection: "column",
        padding: "48px 52px",
        background: "rgba(0,0,0,0.18)",
        overflowY: "auto",
      }}>

        {/* How it works */}
        <div style={{ marginBottom: 36 }}>
          <SectionLabel>How It Works</SectionLabel>
          <StepRow n="1" title="Choose Your Voice" detail="Select Bass, Tenor, or Alto before starting." />
          <StepRow n="2" title="Start the Session" detail="The melody plays through your speakers." />
          <StepRow n="3" title="Sing Along" detail="Notes scroll across the screen. Blue dot = target. Green line = your voice." />
          <StepRow n="4" title="Match the Pitch" detail="Adjust your voice to follow the moving guide." />
          <StepRow n="5" title="Review Your Score" detail="Pitch accuracy is calculated note-by-note after the phrase ends." />
        </div>

        <Divider />

        {/* Practice mode callout */}
        <div style={{
          background: "rgba(99,102,241,0.07)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 12, padding: "20px 24px",
        }}>
          <SectionLabel>Practice Mode</SectionLabel>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: C.muted, fontFamily: C.font, lineHeight: 1.7 }}>
            Not ready to sing the full phrase? Use Tutorial Mode to isolate and hear any
            individual note, see where your voice sits on the pitch guide, and build
            confidence before a full session.
          </p>
          <button style={{ ...BTN("ghost"), fontSize: 11 }} onClick={onTutorial}>
            OPEN TUTORIAL MODE →
          </button>
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: "rgba(255,255,255,0.15)", fontFamily: C.font }}>
          Microphone access required · Best used in a quiet environment
        </div>
      </div>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────
function Router() {
  const [page, setPage] = useState("home");
  const { isListening, resetAll } = useAudio();

  const goTo = (p) => { resetAll(); setPage(p); };

  return (
    <div style={{
      width: "100vw", minHeight: "100vh",
      background: C.bg, color: C.text,
      boxSizing: "border-box", overflowX: "hidden",
    }}>
      <Navbar page={page} setPage={setPage} resetAll={resetAll} isListening={isListening} />

      <div style={{ paddingTop: 56, minHeight: "100vh", boxSizing: "border-box" }}>
        {page === "home" && (
          <HomePage onTutorial={() => setPage("tutorial")} onPlay={() => setPage("play")} />
        )}
        {page === "tutorial" && (
          <TutorialPage onBack={() => goTo("home")} onGoPlay={() => goTo("play")} />
        )}
        {page === "play" && (
          <PlayPage onBack={() => goTo("home")} onComplete={() => setPage("result")} />
        )}
        {page === "result" && (
          <ResultPage onHome={() => goTo("home")} onRetry={() => goTo("play")} />
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
