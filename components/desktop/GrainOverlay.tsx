"use client";

import { useEffect, useState } from "react";

const SETTLE_DELAY_MS = 1000;
const FADE_DURATION_MS = 500;

export default function GrainOverlay() {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSettled(true), SETTLE_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`grain-noise pointer-events-none fixed inset-0 z-[10000] transition-opacity ease-out ${
        settled ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_DURATION_MS}ms` }}
    />
  );
}
