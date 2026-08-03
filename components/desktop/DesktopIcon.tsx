"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useIsMobile } from "@/lib/useIsMobile";

export type IconOrigin = { x: number; y: number; width: number; height: number };
export type IconPosition = { x: number; y: number };

export default function DesktopIcon({
  label,
  icon,
  position,
  onMove,
  onOpen,
  onElement,
  labelTone = "dark",
}: {
  label: string;
  icon?: string;
  position: IconPosition;
  onMove: (position: IconPosition) => void;
  onOpen: (origin: IconOrigin) => void;
  onElement?: (element: HTMLButtonElement | null) => void;
  labelTone?: "light" | "dark";
}) {
  const [selected, setSelected] = useState(false);
  const [dragging, setDragging] = useState(false);
  const isMobile = useIsMobile();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragState = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    dragged: boolean;
    x: number;
    y: number;
  } | null>(null);

  function triggerOpen() {
    const rect = buttonRef.current?.getBoundingClientRect();
    onOpen(
      rect
        ? { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
        : { x: 0, y: 0, width: 0, height: 0 }
    );
  }

  useEffect(() => {
    if (!dragging) return;

    function onPointerMove(e: globalThis.PointerEvent) {
      const state = dragState.current;
      const el = buttonRef.current;
      if (!state || !el) return;
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) state.dragged = true;
      if (!state.dragged) return;

      const x = Math.min(Math.max(state.originX + dx, 0), window.innerWidth - 80);
      const y = Math.min(Math.max(state.originY + dy, 36), window.innerHeight - 40);
      state.x = x;
      state.y = y;
      // Mutate the DOM directly during the drag so tracking is 1:1 with the
      // pointer — going through React state on every move re-renders the
      // whole desktop tree and lags behind the cursor.
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }

    function onPointerUp() {
      setDragging(false);
      const state = dragState.current;
      if (state?.dragged) onMove({ x: state.x, y: state.y });
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragging, onMove]);

  function startDrag(e: PointerEvent) {
    if (isMobile) return;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
      dragged: false,
      x: position.x,
      y: position.y,
    };
    setDragging(true);
  }

  function handleClick() {
    if (isMobile) {
      triggerOpen();
      return;
    }
    if (dragState.current?.dragged) {
      dragState.current = null;
      return;
    }
    setSelected(true);
  }

  return (
    <button
      ref={(element) => {
        buttonRef.current = element;
        onElement?.(element);
      }}
      type="button"
      onPointerDown={startDrag}
      onClick={handleClick}
      onBlur={() => setSelected(false)}
      onDoubleClick={triggerOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") triggerOpen();
      }}
      style={{ left: position.x, top: position.y }}
      className={`fixed flex flex-col items-center gap-1.5 w-20 px-1 py-2 text-center outline-none select-none touch-none transition-colors ${
        labelTone === "light"
          ? "text-white hover:bg-white/15 active:bg-white/25 focus-visible:bg-white/20"
          : "text-black hover:bg-black/10 active:bg-black/20 focus-visible:bg-black/15"
      } ${
        selected
          ? labelTone === "light"
            ? "bg-white/20"
            : "bg-black/15"
          : ""
      }`}
    >
      {icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt=""
          draggable={false}
          className="w-[50px] h-[50px] object-contain pointer-events-none"
        />
      ) : (
        <span className="w-9 h-9 border border-dim flex items-center justify-center text-[10px] text-dim pointer-events-none">
          [ ]
        </span>
      )}
      <span className="text-[10px] text-current leading-tight pointer-events-none">
        {label}
      </span>
    </button>
  );
}
