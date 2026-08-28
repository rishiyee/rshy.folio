"use client";

import { useEffect, useState } from "react";
import CRTScreen from "./CRTScreen";

const STATIC_HOLD_MS = 1100;
const FADE_DURATION_MS = 400;

export default function GrainOverlay() {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSettled(true), STATIC_HOLD_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[30000] bg-black transition-opacity ease-out ${
        settled ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_DURATION_MS}ms` }}
    >
      <CRTScreen>
        <div className="h-full w-full bg-neutral-950" />
      </CRTScreen>
    </div>
  );
}
