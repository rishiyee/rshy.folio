"use client";

import { useEffect, useState } from "react";

const BOOT_LINES = [
  "VONNUE OS v1.0",
  "[ OK ] Initializing kernel",
  "[ OK ] Mounting /works",
  "[ OK ] Mounting /terminal",
  "[ OK ] Starting display server",
  "[ OK ] Loading Geist Mono",
  "[ OK ] Calibrating weighted clock (-25 -> 125)",
  "[ OK ] Syncing year progress",
  "[ OK ] Rendering desktop shell",
  "System ready.",
];

const LINE_INTERVAL_MS = 420;
const HOLD_AFTER_MS = 500;
const FADE_DURATION_MS = 300;

export default function BootOverlay({ onComplete }: { onComplete: () => void }) {
  const [lineCount, setLineCount] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setLineCount(i);
      if (i >= BOOT_LINES.length) {
        clearInterval(id);
        setTimeout(() => setFading(true), HOLD_AFTER_MS);
      }
    }, LINE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(onComplete, FADE_DURATION_MS);
    return () => clearTimeout(t);
  }, [fading, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black p-8 text-sm sm:text-base text-foreground/80 leading-relaxed transition-opacity duration-300 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {BOOT_LINES.slice(0, lineCount).map((line, idx) => (
        <div key={idx}>{line}</div>
      ))}
      {lineCount < BOOT_LINES.length && <span className="cursor-blink">█</span>}
    </div>
  );
}
