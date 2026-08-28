"use client";

import { useEffect, useRef } from "react";
import { useOthers, useUpdateMyPresence } from "@liveblocks/react";

const IDENTITY_KEY = "portfolio-cursor-identity";
const CURSOR_COLORS = ["#ff5c5c", "#5c9dff", "#72d572", "#f2c94c", "#c77dff", "#ff7ac8"];
const MAX_VISIBLE_CURSORS = 20;

type Identity = { name: string; color: string };

function getIdentity(): Identity {
  try {
    const saved = JSON.parse(window.localStorage.getItem(IDENTITY_KEY) ?? "null") as Identity | null;
    if (saved?.name && saved.color) return saved;
  } catch {
    window.localStorage.removeItem(IDENTITY_KEY);
  }

  const random = new Uint32Array(2);
  window.crypto.getRandomValues(random);
  const identity = {
    name: `Visitor ${String((random[0] % 9000) + 1000)}`,
    color: CURSOR_COLORS[random[1] % CURSOR_COLORS.length],
  };
  window.localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  return identity;
}

export default function MultiplayerCursors() {
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();
  const frameRef = useRef<number | null>(null);
  const latestPosition = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      updateMyPresence({ user: getIdentity() });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [updateMyPresence]);

  useEffect(() => {
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (coarsePointer) return;

    function flushPosition() {
      frameRef.current = null;
      updateMyPresence({ cursor: latestPosition.current });
    }

    function onPointerMove(event: PointerEvent) {
      latestPosition.current = {
        x: Math.min(1, Math.max(0, event.clientX / window.innerWidth)),
        y: Math.min(1, Math.max(0, event.clientY / window.innerHeight)),
      };
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(flushPosition);
      }
    }

    function hideCursor() {
      latestPosition.current = null;
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      updateMyPresence({ cursor: null });
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") hideCursor();
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", hideCursor);
    document.documentElement.addEventListener("pointerleave", hideCursor);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      updateMyPresence({ cursor: null });
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", hideCursor);
      document.documentElement.removeEventListener("pointerleave", hideCursor);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [updateMyPresence]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[19000] overflow-hidden">
      {others.slice(0, MAX_VISIBLE_CURSORS).map((other) => {
        const cursor = other.presence.cursor;
        if (!cursor) return null;
        const user = other.presence.user;
        return (
          <div
            key={other.connectionId}
            className="absolute left-0 top-0 transition-transform duration-75 ease-linear will-change-transform"
            style={{ transform: `translate3d(${cursor.x * 100}vw, ${cursor.y * 100}vh, 0)` }}
          >
            <svg width="20" height="24" viewBox="0 0 20 24" fill="none" className="drop-shadow-md">
              <path d="M2 1.5V19L6.7 14.7L10.1 22L13.4 20.5L10 13H17.5L2 1.5Z" fill={user.color} stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span className="ml-3 -mt-1 block whitespace-nowrap border border-black/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-black shadow-md" style={{ backgroundColor: user.color }}>
              {user.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
