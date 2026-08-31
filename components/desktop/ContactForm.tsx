"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "sent";
type ProjectType = "Brand" | "Product" | "Website" | "Other";

const PROJECT_TYPES: ProjectType[] = ["Brand", "Product", "Website", "Other"];

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("Product");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please complete your name, email, and project brief.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That email address does not look quite right.");
      return;
    }
    setError("");
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, projectType, message, website }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Your inquiry could not be sent.");
      setStatus("sent");
    } catch (submissionError) {
      setStatus("idle");
      setError(submissionError instanceof Error ? submissionError.message : "Your inquiry could not be sent.");
    }
  }

  function resetForm() {
    setName("");
    setEmail("");
    setProjectType("Product");
    setMessage("");
    setWebsite("");
    setError("");
    setStatus("idle");
  }

  if (status === "sent") {
    return (
      <div className="flex min-h-full items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md border border-line bg-background">
          <div className="flex items-center justify-between border-b border-line px-4 py-3 text-[9px] uppercase tracking-[0.16em] text-dim">
            <span>Transmission complete</span>
            <span className="text-accent">200 / received</span>
          </div>
          <div className="p-6 sm:p-8">
            <div className="mb-7 flex h-10 w-10 items-center justify-center border border-accent text-lg text-accent">✓</div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-dim">Thanks, {name}</p>
            <h2 className="mt-3 text-2xl tracking-[-0.04em] text-foreground">Your brief is in the queue.</h2>
            <p className="mt-4 max-w-sm text-xs leading-6 text-dim">
              We&apos;ve received your {projectType.toLowerCase()} inquiry and will get back to you soon.
            </p>
            <button type="button" onClick={resetForm} className="mt-8 border border-line px-4 py-2 text-[10px] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-accent hover:text-accent">
              Start another inquiry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="flex flex-col justify-between border-b border-line p-5 lg:border-b-0 lg:border-r lg:p-6">
        <div>
          <div className="mb-6 flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-dim">
            <span className="h-1.5 w-1.5 bg-accent" />
            New project inquiry
          </div>
          <h1 className="text-2xl leading-tight tracking-[-0.04em] text-foreground">Let&apos;s make something useful.</h1>
          <p className="mt-4 text-[11px] leading-5 text-dim">
            Tell us where you are, what you&apos;re building, and what a good outcome looks like.
          </p>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-4 text-[9px] uppercase tracking-[0.12em] lg:grid-cols-1">
          <div>
            <dt className="text-dimmer">Typical reply</dt>
            <dd className="mt-1 text-foreground/80">Within 2 business days</dd>
          </div>
          <div>
            <dt className="text-dimmer">Best for</dt>
            <dd className="mt-1 text-foreground/80">Focused, ambitious work</dd>
          </div>
        </dl>
      </aside>

      <form onSubmit={handleSubmit} noValidate className="flex min-h-full flex-col">
        <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          Website
          <input name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
        </label>
        <div className="grid border-b border-line sm:grid-cols-2">
          <label className="group border-b border-line p-4 focus-within:bg-foreground/[0.025] sm:border-b-0 sm:border-r sm:p-5">
            <span className="block text-[9px] uppercase tracking-[0.15em] text-dim group-focus-within:text-accent">01 / Your name *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="How should we address you?" className="mt-3 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-dimmer" />
          </label>
          <label className="group p-4 focus-within:bg-foreground/[0.025] sm:p-5">
            <span className="block text-[9px] uppercase tracking-[0.15em] text-dim group-focus-within:text-accent">02 / Email address *</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@company.com" className="mt-3 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-dimmer" />
          </label>
        </div>

        <fieldset className="border-b border-line p-4 sm:p-5">
          <legend className="sr-only">Project type</legend>
          <p className="mb-3 text-[9px] uppercase tracking-[0.15em] text-dim">03 / What are we making?</p>
          <div className="grid grid-cols-2 border-l border-t border-line sm:grid-cols-4">
            {PROJECT_TYPES.map((type) => (
              <button key={type} type="button" onClick={() => setProjectType(type)} aria-pressed={projectType === type} className={`border-b border-r border-line px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.1em] transition-colors ${projectType === type ? "bg-accent text-background" : "text-dim hover:text-foreground"}`}>
                {projectType === type ? "[x]" : "[ ]"} {type}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="group flex min-h-44 flex-1 flex-col p-4 focus-within:bg-foreground/[0.025] sm:p-5">
          <span className="text-[9px] uppercase tracking-[0.15em] text-dim group-focus-within:text-accent">04 / Project brief *</span>
          <textarea value={message} maxLength={1200} onChange={(e) => setMessage(e.target.value)} placeholder="A little context, the problem to solve, timing, and anything else we should know..." className="retro-scrollbar mt-3 min-h-28 flex-1 resize-none bg-transparent text-sm leading-6 text-foreground outline-none placeholder:text-dimmer" />
          <span className="mt-2 self-end text-[9px] tabular-nums text-dimmer">{message.length.toString().padStart(4, "0")} / 1200</span>
        </label>

        <div className="flex min-h-14 items-center justify-between gap-3 border-t border-line pl-4 sm:pl-5">
          <div aria-live="polite" className="text-[10px] text-accent">
            {error ? `! ${error}` : <span className="text-dimmer">Fields marked * are required</span>}
          </div>
          <button type="submit" disabled={status === "sending"} className="min-h-14 shrink-0 border-l border-line px-5 text-[10px] uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-accent hover:text-background disabled:opacity-50 sm:px-7">
            {status === "sending" ? "Transmitting..." : "Send inquiry →"}
          </button>
        </div>
      </form>
    </div>
  );
}
