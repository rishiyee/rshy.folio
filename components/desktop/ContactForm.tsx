"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "sent";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("All fields are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setStatus("sending");
    // TODO: wire real delivery through Resend once an API key and destination inbox exist.
    setTimeout(() => setStatus("sent"), 600);
  }

  if (status === "sent") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
        <div>Message received.</div>
        <div className="text-dim">We&apos;ll get back to you soon.</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.08em] text-dim">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-line bg-transparent px-2 py-1.5 text-foreground outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.08em] text-dim">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-line bg-transparent px-2 py-1.5 text-foreground outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-1 flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.08em] text-dim">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="retro-scrollbar flex-1 resize-none border border-line bg-transparent px-2 py-1.5 text-foreground outline-none focus:border-accent"
        />
      </label>
      {error && <div className="text-accent">{error}</div>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="border border-line px-3 py-1.5 uppercase tracking-[0.08em] text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
