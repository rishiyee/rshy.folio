"use client";

import { useEffect, useState } from "react";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  fractionalSecondDigits: 3,
  hour12: true,
  timeZoneName: "short",
});

export default function Clock() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setLabel(timeFormatter.format(new Date()));
    tick();
    const id = setInterval(tick, 16);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-[10px] sm:text-xs tabular-nums text-foreground select-none whitespace-nowrap">
      {label ?? "--- --, ----, --:--:--.--- -- ---"}
    </span>
  );
}
