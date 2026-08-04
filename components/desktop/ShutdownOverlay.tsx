"use client";

import { useEffect, useState } from "react";

type Phase = "idle" | "closing" | "black" | "booting";

const BOOT_LINES = [
  "OS — BOOT SEQUENCE",
  "[ OK ] Initializing kernel",
  "[ OK ] Mounting /works",
  "[ OK ] Mounting /terminal",
  "[ OK ] Starting display server",
  "[ OK ] Loading Geist Mono",
  "System ready.",
];

export default function ShutdownOverlay({
  active,
  onComplete,
}: {
  active: boolean;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [lineCount, setLineCount] = useState(0);

  useEffect(() => {
    if (active) setPhase("closing");
  }, [active]);

  useEffect(() => {
    if (phase !== "black") return;
    const wake = () => setPhase("booting");
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "booting") return;
    setLineCount(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setLineCount(i);
      if (i >= BOOT_LINES.length) {
        clearInterval(id);
        setTimeout(() => {
          setPhase("idle");
          onComplete();
        }, 450);
      }
    }, 220);
    return () => clearInterval(id);
  }, [phase, onComplete]);

  if (phase === "idle") return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden">
      {phase === "closing" && (
        <div
          className="absolute inset-0 bg-foreground crt-off"
          onAnimationEnd={() => setPhase("black")}
        />
      )}
      {phase === "booting" && (
        <div className="fade-in p-8 text-sm sm:text-base text-foreground/80 leading-relaxed">
          {BOOT_LINES.slice(0, lineCount).map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
          <span className="cursor-blink">█</span>
        </div>
      )}
    </div>
  );
}
