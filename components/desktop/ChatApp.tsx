"use client";

import { useEffect, useRef, useState } from "react";

type Message = { from: "user" | "system"; text: string };
type Typing = { text: string; revealed: number };

const INITIAL_GREETING =
  "Hi — I'm Hrishikesh's AI portfolio assistant. Ask me about his skills, experience, work, or contact details.";
const TYPE_SPEED_MS = 28;

export default function ChatApp({ prompt }: { prompt?: { id: number; text: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<Typing | null>({ text: INITIAL_GREETING, revealed: 0 });
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastPromptId = useRef<number | undefined>(undefined);

  function queueSystemMessage(text: string) {
    setTyping({ text, revealed: 0 });
  }

  useEffect(() => {
    if (!prompt || prompt.id === lastPromptId.current) return;
    lastPromptId.current = prompt.id;
    const frame = requestAnimationFrame(() => queueSystemMessage(prompt.text));
    return () => cancelAnimationFrame(frame);
  }, [prompt]);

  useEffect(() => {
    if (!typing) return;
    const id = setTimeout(() => {
      if (typing.revealed >= typing.text.length) {
        setMessages((current) => [...current, { from: "system", text: typing.text }]);
        setTyping(null);
      } else {
        setTyping((current) =>
          current ? { ...current, revealed: current.revealed + 1 } : current
        );
      }
    }, TYPE_SPEED_MS);
    return () => clearTimeout(id);
  }, [typing]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, typing]);

  async function send() {
    const text = draft.trim();
    if (!text || sending || typing) return;
    const nextMessages: Message[] = [...messages, { from: "user", text }];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      queueSystemMessage(data.reply || data.error || "The AI assistant is unavailable.");
    } catch {
      queueSystemMessage("I couldn't reach the AI assistant. Please try again shortly.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-dim">
        <span className="h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_6px_rgb(16_185_129)]" />
        AI Assistant online
      </div>

      <div ref={listRef} className="retro-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3 text-xs">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[85%] border px-2 py-1.5 leading-relaxed ${
              message.from === "user"
                ? "self-end border-accent-dim text-foreground/90"
                : "self-start border-line text-dim"
            }`}
          >
            {message.text}
          </div>
        ))}
        {typing && (
          <div className="max-w-[85%] self-start border border-line px-2 py-1.5 leading-relaxed text-dim">
            {typing.text.slice(0, typing.revealed)}
            <span className="cursor-blink">█</span>
          </div>
        )}
        {sending && !typing && (
          <div className="self-start border border-line px-2 py-1.5 text-dim">
            Thinking<span className="cursor-blink">_</span>
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="flex items-stretch border-t border-line"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          aria-label="Message"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base text-foreground outline-none placeholder:text-dimmer disabled:opacity-50 sm:text-xs"
        />
        <button
          type="submit"
          disabled={sending || Boolean(typing) || !draft.trim()}
          className="border-l border-line px-4 text-xs text-dim transition-colors hover:text-accent disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
