"use client";

import type { ReactNode } from "react";
import CRTEffect from "vault66-crt-effect";
import "vault66-crt-effect/style.css";

export default function CRTScreen({ children }: { children: ReactNode }) {
  return (
    <CRTEffect
      fill
      preset="fallout"
      scanlineOpacity={0}
      // scanlineThickness={1}
      // scanlineGap={12}
      // sweepDuration={9}
      // sweepThickness={30}
      flickerIntensity={0.31}
      flickerSpeed={2.2}
      enableGlitch
      glitchIntensity={0.2}
      enableVignette={false}
      curvatureIntensity={0.3}
    >
      {children}
    </CRTEffect>
  );
}
