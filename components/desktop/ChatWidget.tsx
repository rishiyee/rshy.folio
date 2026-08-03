"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  calculateRectTransform,
  rectTransformToCss,
  toViewportRect,
} from "@/lib/windowTransition";

type Message = { from: "user" | "system"; text: string };
type Typing = { text: string; revealed: number };

export type ChatWidgetHandle = { openWithMessage: (text: string) => void };

const INITIAL_GREETING = "Hey — thanks for stopping by. Leave a message and we'll get back to you.";

const AUTO_REPLIES = [
  "Noted — we'll get back to you soon.",
  "Message received. Thanks for reaching out.",
  "Got it. We'll follow up shortly.",
];

const TYPE_SPEED_MS = 28;

const ChatWidget = forwardRef<ChatWidgetHandle>(function ChatWidget(_props, ref) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<Typing | null>(null);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelAnimationRef = useRef<Animation | null>(null);
  const greetedRef = useRef(false);
  const interactedRef = useRef(false);

  function queueSystemMessage(text: string) {
    setTyping({ text, revealed: 0 });
  }

  function openChat() {
    panelAnimationRef.current?.cancel();
    setClosing(false);
    setOpen(true);
    if (!greetedRef.current) {
      greetedRef.current = true;
      queueSystemMessage(INITIAL_GREETING);
    }
  }

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const button = buttonRef.current;
    if (!open || closing || !panel || !button) return;

    const panelRect = toViewportRect(panel.getBoundingClientRect());
    const buttonRect = toViewportRect(button.getBoundingClientRect());
    const initialTransform = rectTransformToCss(
      calculateRectTransform(panelRect, buttonRect)
    );
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animation = panel.animate(
      [
        { transform: initialTransform, opacity: 0, filter: "blur(2px)" },
        {
          transform: "translate3d(0, 0, 0) scale(1)",
          opacity: 1,
          filter: "blur(0)",
        },
      ],
      {
        duration: reduceMotion ? 1 : 300,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "both",
      }
    );
    panelAnimationRef.current = animation;
    return () => animation.cancel();
  }, [closing, open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!interactedRef.current) openChat();
    }, 15000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    openWithMessage(text: string) {
      interactedRef.current = true;
      greetedRef.current = true;
      setOpen(true);
      queueSystemMessage(text);
    },
  }));

  useEffect(() => {
    if (!typing) return;
    const id = setTimeout(() => {
      if (typing.revealed >= typing.text.length) {
        setMessages((prev) => [...prev, { from: "system", text: typing.text }]);
        setTyping(null);
      } else {
        setTyping((cur) => (cur ? { ...cur, revealed: cur.revealed + 1 } : cur));
      }
    }, TYPE_SPEED_MS);
    return () => clearTimeout(id);
  }, [typing]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, typing, open]);

  function toggleOpen() {
    interactedRef.current = true;
    if (open) {
      close();
    } else {
      openChat();
    }
  }

  function close() {
    interactedRef.current = true;
    const panel = panelRef.current;
    const button = buttonRef.current;
    if (!panel || !button || closing) {
      setOpen(false);
      return;
    }

    panelAnimationRef.current?.cancel();
    setClosing(true);
    const panelRect = toViewportRect(panel.getBoundingClientRect());
    const buttonRect = toViewportRect(button.getBoundingClientRect());
    const finalTransform = rectTransformToCss(
      calculateRectTransform(panelRect, buttonRect)
    );
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animation = panel.animate(
      [
        {
          transform: "translate3d(0, 0, 0) scale(1)",
          opacity: 1,
          filter: "blur(0)",
        },
        { transform: finalTransform, opacity: 0, filter: "blur(2px)" },
      ],
      {
        duration: reduceMotion ? 1 : 300,
        easing: "cubic-bezier(0.7, 0, 0.84, 0)",
        fill: "both",
      }
    );
    panelAnimationRef.current = animation;
    void animation.finished
      .then(() => {
        setOpen(false);
        setClosing(false);
      })
      .catch(() => {});
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { from: "user", text }]);
    setDraft("");
    // TODO: wire real delivery through Resend once an API key exists
    const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
    setTimeout(() => queueSystemMessage(reply), 500);
  }

  return (
    <div className="chat-startup-in fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-2">
      {open && (
        <div ref={panelRef} className={`w-80 max-w-[calc(100vw-2rem)] border border-line bg-background flex flex-col ${closing ? "pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-xs tracking-[0.1em] uppercase text-foreground/90">
              Chat
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close chat"
              className="w-5 h-5 flex items-center justify-center border border-line text-xs text-dim hover:text-accent hover:border-accent transition-colors"
            >
              x
            </button>
          </div>

          <div
            ref={listRef}
            className="retro-scrollbar flex flex-col gap-2 h-64 overflow-y-auto px-3 py-2 text-xs"
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-[85%] px-2 py-1.5 border leading-relaxed ${
                  m.from === "user"
                    ? "self-end border-accent-dim text-foreground/90"
                    : "self-start border-line text-dim"
                }`}
              >
                {m.text}
              </div>
            ))}
            {typing && (
              <div className="max-w-[85%] px-2 py-1.5 border leading-relaxed self-start border-line text-dim">
                {typing.text.slice(0, typing.revealed)}
                <span className="cursor-blink">█</span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-stretch border-t border-line"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent px-3 py-2 text-xs text-foreground outline-none placeholder:text-dimmer"
            />
            <button
              type="submit"
              className="px-3 text-xs text-dim hover:text-accent transition-colors border-l border-line"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        aria-label={open ? "Close chat" : "Open chat"}
        className="w-11 h-11 flex items-center justify-center border border-line bg-background text-foreground/90 hover:border-accent hover:text-accent transition-colors"
      >
        {open ? "x" : ">_"}
      </button>
    </div>
  );
});

export default ChatWidget;
