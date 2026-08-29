"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const IDENTITY_KEY = "portfolio-cursor-identity";
const CURSOR_COLORS = ["#ff5c5c", "#5c9dff", "#72d572", "#f2c94c", "#c77dff", "#ff7ac8"];
const MAX_VISIBLE_CURSORS = 20;
const BROADCAST_INTERVAL_MS = 33;

type Identity = { name: string; color: string };
type Cursor = { x: number; y: number } | null;
type CursorMessage = { clientId: string; cursor: Cursor; user: Identity };

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

function isCursorMessage(value: unknown): value is CursorMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<CursorMessage>;
  const cursorIsValid = message.cursor === null || (
    typeof message.cursor?.x === "number" && typeof message.cursor.y === "number"
  );
  return typeof message.clientId === "string"
    && typeof message.user?.name === "string"
    && typeof message.user.color === "string"
    && cursorIsValid;
}

export default function MultiplayerCursors({
  roomId,
  supabaseKey,
  supabaseUrl,
}: {
  roomId: string;
  supabaseKey: string;
  supabaseUrl: string;
}) {
  const [others, setOthers] = useState<Map<string, CursorMessage>>(() => new Map());
  const sendTimerRef = useRef<number | null>(null);
  const lastSentAtRef = useRef(0);
  const latestPositionRef = useRef<Cursor>(null);

  useEffect(() => {
    const clientId = window.crypto.randomUUID();
    const identity = getIdentity();
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });
    const channel = supabase.channel(roomId, {
      config: { broadcast: { self: false }, presence: { key: clientId } },
    });

    channel
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        if (!isCursorMessage(payload) || payload.clientId === clientId) return;
        setOthers((current) => {
          const next = new Map(current);
          if (payload.cursor) next.set(payload.clientId, payload);
          else next.delete(payload.clientId);
          return next;
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const departedIds = new Set(
          leftPresences.flatMap((presence) => {
            const id = (presence as { clientId?: unknown }).clientId;
            return typeof id === "string" ? [id] : [];
          }),
        );
        if (departedIds.size === 0) return;
        setOthers((current) => {
          const next = new Map(current);
          departedIds.forEach((id) => next.delete(id));
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ clientId });
      });

    function broadcastCursor(cursor: Cursor) {
      void channel.send({
        type: "broadcast",
        event: "cursor",
        payload: { clientId, cursor, user: identity } satisfies CursorMessage,
      });
      lastSentAtRef.current = performance.now();
    }

    function flushPosition() {
      sendTimerRef.current = null;
      broadcastCursor(latestPositionRef.current);
    }

    function schedulePosition() {
      if (sendTimerRef.current !== null) return;
      const delay = Math.max(0, BROADCAST_INTERVAL_MS - (performance.now() - lastSentAtRef.current));
      sendTimerRef.current = window.setTimeout(flushPosition, delay);
    }

    function onPointerMove(event: PointerEvent) {
      latestPositionRef.current = {
        x: Math.min(1, Math.max(0, event.clientX / window.innerWidth)),
        y: Math.min(1, Math.max(0, event.clientY / window.innerHeight)),
      };
      schedulePosition();
    }

    function hideCursor() {
      latestPositionRef.current = null;
      if (sendTimerRef.current !== null) window.clearTimeout(sendTimerRef.current);
      sendTimerRef.current = null;
      broadcastCursor(null);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") hideCursor();
    }

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (!coarsePointer) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("blur", hideCursor);
      document.documentElement.addEventListener("pointerleave", hideCursor);
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      if (sendTimerRef.current !== null) window.clearTimeout(sendTimerRef.current);
      void channel.send({
        type: "broadcast",
        event: "cursor",
        payload: { clientId, cursor: null, user: identity } satisfies CursorMessage,
      });
      void supabase.removeChannel(channel);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", hideCursor);
      document.documentElement.removeEventListener("pointerleave", hideCursor);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [roomId, supabaseKey, supabaseUrl]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[19000] overflow-hidden">
      {Array.from(others.values()).slice(0, MAX_VISIBLE_CURSORS).map((other) => {
        const cursor = other.cursor;
        if (!cursor) return null;
        const user = other.user;
        return (
          <div
            key={other.clientId}
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
