"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function Dropdown({
  trigger,
  children,
  align = "left",
  open,
  hoverActivate,
  onOpen,
  onClose,
  triggerClassName = "",
}: {
  trigger: (open: boolean) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  open: boolean;
  hoverActivate: boolean;
  onOpen: () => void;
  onClose: () => void;
  triggerClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => {
        if (hoverActivate && !open) onOpen();
      }}
    >
      <button
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 h-full text-[10px] sm:text-xs text-foreground/90 hover:bg-[rgb(0,4,255)] transition-colors ${
          open ? "bg-[rgb(0,4,255)]" : ""
        } ${triggerClassName}`}
      >
        {trigger(open)}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute top-full min-w-[180px] bg-[rgb(245,245,245)] z-50 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children(onClose)}
        </div>
      )}
    </div>
  );
}
