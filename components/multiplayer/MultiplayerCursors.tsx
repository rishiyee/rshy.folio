"use client";

import { useEffect, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const IDENTITY_KEY = "portfolio-cursor-identity";
const CURSOR_COLORS = ["#ff5c5c", "#5c9dff", "#72d572", "#f2c94c", "#c77dff", "#ff7ac8"];
const MAX_VISIBLE_CURSORS = 20;
const BROADCAST_INTERVAL_MS = 33;
const REACTIONS = [
  { id: "design", icon: "✦", label: "Great design" },
  { id: "build", icon: "⚡", label: "Smart build" },
  { id: "idea", icon: "+1", label: "Love the idea" },
  { id: "talk", icon: "@", label: "Let's talk" },
] as const;

type Identity = { name: string; color: string };
type Cursor = { x: number; y: number } | null;
type CursorMessage = { clientId: string; cursor: Cursor; user: Identity };
type ReactionId = (typeof REACTIONS)[number]["id"];
type ReactionMessage = { clientId: string; reaction: ReactionId; user: Identity; eventId: string };
type ReactionNotice = ReactionMessage & { noticeId: string };

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

function isReactionMessage(value: unknown): value is ReactionMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ReactionMessage>;
  return typeof message.clientId === "string"
    && typeof message.user?.name === "string"
    && typeof message.user.color === "string"
    && typeof message.eventId === "string"
    && REACTIONS.some((reaction) => reaction.id === message.reaction);
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
  const [onlineCount, setOnlineCount] = useState(1);
  const [totalVisits, setTotalVisits] = useState<number | null>(null);
  const [secondsHere, setSecondsHere] = useState(0);
  const [notices, setNotices] = useState<ReactionNotice[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const clientIdRef = useRef("");
  const identityRef = useRef<Identity | null>(null);
  const sessionIdRef = useRef("");
  const sendTimerRef = useRef<number | null>(null);
  const lastSentAtRef = useRef(0);
  const latestPositionRef = useRef<Cursor>(null);

  useEffect(() => {
    const clientId = window.crypto.randomUUID();
    const sessionId = window.crypto.randomUUID();
    const identity = getIdentity();
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });
    const channel = supabase.channel(roomId, {
      config: { broadcast: { self: false }, presence: { key: clientId } },
    });
    supabaseRef.current = supabase;
    channelRef.current = channel;
    clientIdRef.current = clientId;
    identityRef.current = identity;
    sessionIdRef.current = sessionId;

    async function startVisit() {
      const { error } = await supabase.from("portfolio_visits").insert({
        session_id: sessionId,
        visitor_name: identity.name,
        page_path: window.location.pathname,
      });
      if (error) {
        console.warn("Could not start portfolio visit", error.message);
        return;
      }
      const { data } = await supabase.rpc("get_portfolio_visit_stats");
      const stats = Array.isArray(data) ? data[0] : data;
      if (stats && typeof stats.total_visits === "number") setTotalVisits(stats.total_visits);
    }

    async function updateVisit() {
      await supabase
        .from("portfolio_visits")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("session_id", sessionId);
    }

    void startVisit();
    const heartbeat = window.setInterval(() => void updateVisit(), 30_000);
    const elapsedTimer = window.setInterval(() => setSecondsHere((seconds) => seconds + 1), 1_000);

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
      .on("presence", { event: "sync" }, () => {
        const count = Object.values(channel.presenceState()).reduce(
          (total, presences) => total + presences.length,
          0,
        );
        setOnlineCount(Math.max(1, count));
      })
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        if (!isReactionMessage(payload)) return;
        const notice = { ...payload, noticeId: payload.eventId };
        setNotices((current) => [...current.slice(-2), notice]);
        window.setTimeout(() => {
          setNotices((current) => current.filter((item) => item.noticeId !== notice.noticeId));
        }, 4200);
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
      if (document.visibilityState === "hidden") {
        hideCursor();
        void updateVisit();
      }
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
      window.clearInterval(heartbeat);
      window.clearInterval(elapsedTimer);
      void updateVisit();
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
      channelRef.current = null;
      supabaseRef.current = null;
    };
  }, [roomId, supabaseKey, supabaseUrl]);

  function sendReaction(reaction: ReactionId) {
    const channel = channelRef.current;
    const identity = identityRef.current;
    if (!channel || !identity) return;
    const message: ReactionMessage = {
      clientId: clientIdRef.current,
      reaction,
      user: identity,
      eventId: window.crypto.randomUUID(),
    };
    void channel.send({ type: "broadcast", event: "reaction", payload: message });
    void supabaseRef.current
      ?.from("portfolio_signals")
      .insert({
        reaction,
        visitor_name: identity.name,
        page_path: window.location.pathname,
      })
      .then(({ error }) => {
        if (error) console.warn("Could not save portfolio signal", error.message);
      });
    const notice = { ...message, noticeId: message.eventId };
    setNotices((current) => [...current.slice(-2), notice]);
    window.setTimeout(() => {
      setNotices((current) => current.filter((item) => item.noticeId !== notice.noticeId));
    }, 4200);
    setPanelOpen(false);
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[19000] overflow-hidden">
      <div aria-hidden="true">
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

      <div className="absolute bottom-4 right-4 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
        <div aria-live="polite" className="flex flex-col items-end gap-1.5">
          {notices.map((notice) => {
            const reaction = REACTIONS.find((item) => item.id === notice.reaction);
            return (
              <div key={notice.noticeId} className="multiplayer-notice border border-line bg-background/95 px-3 py-2 text-[9px] uppercase tracking-wide text-foreground shadow-lg backdrop-blur-sm">
                <span className="mr-2" style={{ color: notice.user.color }}>{reaction?.icon}</span>
                <span className="text-dim">{notice.user.name}:</span> {reaction?.label}
              </div>
            );
          })}
        </div>

        {panelOpen && (
          <div className="pointer-events-auto w-56 border border-line bg-background/95 p-2 shadow-xl backdrop-blur-sm">
            <div className="mb-2 border-b border-line px-1 pb-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-foreground">Leave a signal</p>
              <p className="mt-1 text-[8px] leading-3 text-dim">Shared live and saved anonymously for review.</p>
            </div>
            <div className="mb-2 grid grid-cols-2 gap-px bg-line text-center">
              <div className="bg-background px-2 py-2"><p className="text-[8px] uppercase text-dimmer">Total visits</p><p className="mt-1 text-xs text-foreground">{totalVisits ?? "—"}</p></div>
              <div className="bg-background px-2 py-2"><p className="text-[8px] uppercase text-dimmer">Your time</p><p className="mt-1 text-xs text-foreground">{formatDuration(secondsHere)}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {REACTIONS.map((reaction) => (
                <button key={reaction.id} type="button" onClick={() => sendReaction(reaction.id)} className="border border-line px-2 py-2 text-left text-[8px] uppercase leading-3 text-dim transition-colors hover:border-accent hover:text-accent">
                  <span className="mr-1.5 text-accent">{reaction.icon}</span>{reaction.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button type="button" onClick={() => setPanelOpen((open) => !open)} aria-expanded={panelOpen} className="pointer-events-auto flex items-center gap-2 border border-line bg-background/95 px-3 py-2 text-[9px] uppercase tracking-wider text-dim shadow-lg backdrop-blur-sm transition-colors hover:border-accent hover:text-accent">
          <span className="h-1.5 w-1.5 bg-green-400 shadow-[0_0_6px_rgb(74,222,128)]" />
          {onlineCount} online
          <span className="text-accent">{panelOpen ? "×" : "+ signal"}</span>
        </button>
      </div>
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
