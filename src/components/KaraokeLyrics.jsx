import { useEffect, useMemo, useRef } from "react";

function buildWords(melody = []) {
  const words = [];
  let currentWord = "";
  let startIndex = 0;

  for (let i = 0; i < melody.length; i++) {
    const raw = melody[i]?.lyric ?? "";
    const lyric = String(raw).trim();

    if (!lyric) continue;

    // This syllable continues a previous one (e.g. "-en", "-ly", "-ents")
    if (lyric.startsWith("-")) {
      if (currentWord) {
        // Complete the hyphenated word started earlier
        currentWord += lyric.slice(1);
        words.push({ text: currentWord, start: startIndex, end: i });
        currentWord = "";
      } else {
        // Orphaned leading-dash syllable — treat as standalone
        words.push({ text: lyric.slice(1), start: i, end: i });
      }
      continue;
    }

    // This syllable starts a hyphenated word (e.g. "giv-", "earth-", "be-", "some-")
    if (lyric.endsWith("-")) {
      // If there's already a dangling syllable, flush it first
      if (currentWord) {
        words.push({ text: currentWord, start: startIndex, end: i - 1 });
      }
      currentWord = lyric.slice(0, -1);
      startIndex = i;
      continue;
    }

    // Normal word — but first check if there's a dangling syllable to flush.
    // This handles cases like "be-" -> "side" where "side" doesn't start with "-"
    if (currentWord) {
      currentWord += lyric;
      words.push({ text: currentWord, start: startIndex, end: i });
      currentWord = "";
      continue;
    }

    words.push({ text: lyric, start: i, end: i });
  }

  // Flush any trailing dangling syllable (e.g. a trailing "some-" at end of melody)
  if (currentWord) {
    words.push({ text: currentWord, start: startIndex, end: melody.length - 1 });
  }

  return words;
}

function buildLines(words = [], maxChars = 28) {
  const lines = [];
  let current = [];
  let currentLen = 0;

  const endsPhrase = (text) => /[,.!?]$/.test(text);

  for (const word of words) {
    const nextLen = currentLen + (current.length ? 1 : 0) + word.text.length;

    if (current.length && nextLen > maxChars) {
      lines.push(current);
      current = [word];
      currentLen = word.text.length;
      continue;
    }

    current.push(word);
    currentLen = nextLen;

    if (endsPhrase(word.text)) {
      lines.push(current);
      current = [];
      currentLen = 0;
    }
  }

  if (current.length) lines.push(current);

  return lines;
}

export default function KaraokeLyrics({
  melody = [],
  activeNoteIndex = -1,
  height = 150,
}) {
  const scrollerRef = useRef(null);
  const activeWordRef = useRef(null);

  const { words, lines, activeWordIndex, activeLineIndex } = useMemo(() => {
    const words = buildWords(melody);
    const lines = buildLines(words);

    const activeWordIndex =
      activeNoteIndex < 0
        ? -1
        : words.findIndex(
            (w) => activeNoteIndex >= w.start && activeNoteIndex <= w.end
          );

    const activeLineIndex =
      activeWordIndex < 0
        ? 0
        : lines.findIndex((line) =>
            line.some((w) => words[activeWordIndex] === w)
          );

    return { words, lines, activeWordIndex, activeLineIndex };
  }, [melody, activeNoteIndex]);

  const currentLine = lines[activeLineIndex] || [];
  const nextLine = lines[activeLineIndex + 1] || [];

  useEffect(() => {
    if (!scrollerRef.current || !activeWordRef.current) return;

    const container = scrollerRef.current;
    const activeEl = activeWordRef.current;

    const targetLeft =
      activeEl.offsetLeft - container.clientWidth / 2 + activeEl.clientWidth / 2;

    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });
  }, [activeWordIndex]);

  return (
    <div
      style={{
        width: "100%",
        minHeight: height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 12,
        padding: "16px 20px",
        borderRadius: 22,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        marginBottom: 10,
        overflow: "hidden",
      }}
    >
      {/* Moving current line */}
      <div
        ref={scrollerRef}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: "6px 0",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            paddingLeft: "45%",
            paddingRight: "45%",
            minWidth: "max-content",
          }}
        >
          {currentLine.map((word, i) => {
            const globalIndex = words.findIndex((w) => w === word);
            const isActive = globalIndex === activeWordIndex;
            const isPast = globalIndex < activeWordIndex;
            const isFuture = globalIndex > activeWordIndex;

            return (
              <span
                key={`${word.text}-${word.start}-${i}`}
                ref={isActive ? activeWordRef : null}
                style={{
                  display: "inline-block",
                  marginRight: 14,
                  padding: isActive ? "10px 16px" : "6px 8px",
                  borderRadius: 999,
                  fontSize: isActive ? 30 : 24,
                  fontWeight: isActive ? 800 : 650,
                  lineHeight: 1.1,
                  transition: "all 180ms ease",
                  transform: isActive ? "scale(1.08)" : "scale(1)",
                  color: isActive
                    ? "#ffffff"
                    : isPast
                    ? "rgba(255,255,255,0.72)"
                    : isFuture
                    ? "rgba(255,255,255,0.35)"
                    : "rgba(255,255,255,0.42)",
                  background: isActive
                    ? "linear-gradient(135deg, #3b82f6, #7c3aed)"
                    : "transparent",
                  boxShadow: isActive
                    ? "0 6px 20px rgba(59,130,246,0.35)"
                    : "none",
                }}
              >
                {word.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* Next line preview */}
      <div
        style={{
          minHeight: 28,
          textAlign: "center",
          fontSize: 18,
          fontWeight: 600,
          color: "rgba(255,255,255,0.30)",
          letterSpacing: "0.02em",
        }}
      >
        {nextLine.map((w) => w.text).join(" ")}
      </div>
    </div>
  );
}