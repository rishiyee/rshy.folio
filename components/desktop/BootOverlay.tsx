"use client";

import { useEffect, useState } from "react";
import CRTScreen from "./CRTScreen";

const BOOT_LINES = [
  "OS v1.0",
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
const STATIC_LEAD_IN_MS = 1500;
const HOLD_AFTER_MS = 500;
const EXIT_DURATION_MS = 380;

export default function BootOverlay({ onComplete }: { onComplete: () => void }) {
  const [lineCount, setLineCount] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let i = 0;
    let lineTimer: ReturnType<typeof setInterval> | undefined;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    const leadInTimer = setTimeout(() => {
      i = 1;
      setLineCount(i);
      lineTimer = setInterval(() => {
        i += 1;
        setLineCount(i);
        if (i >= BOOT_LINES.length) {
          clearInterval(lineTimer);
          holdTimer = setTimeout(() => setFading(true), HOLD_AFTER_MS);
        }
      }, LINE_INTERVAL_MS);
    }, STATIC_LEAD_IN_MS);

    return () => {
      clearTimeout(leadInTimer);
      if (lineTimer) clearInterval(lineTimer);
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, []);

  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(onComplete, EXIT_DURATION_MS);
    return () => clearTimeout(t);
  }, [fading, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[20000] bg-black ${fading ? "boot-crt-exit" : ""}`}
    >
      <CRTScreen>
        <div className="h-full p-8 text-sm leading-relaxed text-neutral-300 sm:text-base">
          {BOOT_LINES.slice(0, lineCount).map((line, idx) => (
            <div
              key={idx}
              className={idx === BOOT_LINES.length - 1 ? "boot-ready-line" : undefined}
            >
              {line}
            </div>
          ))}
          {lineCount >= BOOT_LINES.length && (
            <div className="boot-launch-status" role="status">
              <span aria-hidden="true" className="boot-launch-dot" />
              Opening desktop…
            </div>
          )}
      {lineCount < BOOT_LINES.length && <span className="cursor-blink">█</span>}
        </div>
      </CRTScreen>
    </div>
  );
}
