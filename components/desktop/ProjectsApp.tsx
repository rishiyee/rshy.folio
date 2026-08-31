"use client";

import { useState } from "react";
import { projects, type Project } from "@/lib/projects";
import { toViewportRect, type ViewportRect } from "@/lib/windowTransition";

type Filter = "All" | "Live" | "Prototype";

export default function ProjectsApp({
  onOpenPdf,
}: {
  onOpenPdf: (origin: ViewportRect) => void;
}) {
  const [filter, setFilter] = useState<Filter>("All");
  const [selected, setSelected] = useState<Project | null>(null);
  const visible = projects.filter((project) => filter === "All" || project.status === filter);

  if (selected) {
    return <ProjectDetail project={selected} onBack={() => setSelected(null)} onOpenPdf={onOpenPdf} />;
  }

  return (
    <div className="min-h-full p-4 sm:p-5">
      <header className="mb-5 border-b border-line pb-4">
        <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-accent">Selected experiments / 2025—26</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Things I made real.</h1>
            <p className="mt-2 max-w-xl text-[11px] leading-5 text-dim">Rapidly built with AI-assisted workflows, then shaped through hands-on design, debugging, testing, and iteration.</p>
          </div>
          <p className="shrink-0 text-[10px] uppercase tracking-wider text-dimmer">{projects.length.toString().padStart(2, "0")} projects</p>
        </div>
      </header>

      <div className="mb-4 flex gap-1" aria-label="Filter projects">
        {(["All", "Live", "Prototype"] as Filter[]).map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`border px-2.5 py-1.5 text-[9px] uppercase tracking-wider transition-colors ${filter === item ? "border-accent bg-accent text-black" : "border-line text-dim hover:border-accent hover:text-accent"}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((project, index) => (
          <button key={project.slug} type="button" onClick={() => setSelected(project)} className="group border border-line p-2 text-left transition-colors hover:border-accent focus-visible:border-accent focus-visible:outline-none">
            <ProjectPreview project={project} index={index} />
            <div className="flex items-start justify-between gap-3 px-1 pb-1 pt-3">
              <div>
                <p className="text-[9px] uppercase tracking-[0.12em] text-dim">{project.eyebrow}</p>
                <h2 className="mt-1 text-sm font-bold text-foreground group-hover:text-accent">{project.title}</h2>
              </div>
              <span className="mt-0.5 whitespace-nowrap text-[9px] uppercase text-dim">[{project.status}]</span>
            </div>
            <p className="px-1 pb-3 text-[10px] leading-4 text-dim">{project.pitch}</p>
            <div className="flex items-center justify-between border-t border-line px-1 pt-2 text-[9px] uppercase tracking-wide text-dimmer">
              <span>{project.stack.slice(0, 2).join(" / ")}</span><span className="text-accent">Open case →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProjectPreview({ project, index }: { project: Project; index: number }) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden border border-line bg-black p-3" style={{ background: `linear-gradient(135deg, ${project.accent}22, #050505 62%)` }}>
      <div className="absolute inset-x-3 top-3 flex justify-between text-[8px] uppercase tracking-[0.16em] text-white/45"><span>{project.preview}</span><span>0{index + 1}</span></div>
      <div className="absolute bottom-3 left-3 right-3">
        <div className="mb-2 h-px w-full bg-white/15"><div className="h-px w-2/3" style={{ backgroundColor: project.accent }} /></div>
        <p className="max-w-[80%] text-lg font-bold leading-none text-white sm:text-xl">{project.title}</p>
      </div>
      <span className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 border border-white/10" style={{ boxShadow: `inset 0 0 0 7px ${project.accent}18` }} />
    </div>
  );
}

function ProjectDetail({ project, onBack, onOpenPdf }: { project: Project; onBack: () => void; onOpenPdf: (origin: ViewportRect) => void }) {
  return (
    <article className="min-h-full p-4 sm:p-6">
      <button type="button" onClick={onBack} className="mb-5 text-[10px] uppercase tracking-wider text-dim hover:text-accent">← All projects</button>
      <div className="border-b border-line pb-5">
        <div className="mb-3 flex items-center gap-2 text-[9px] uppercase tracking-[0.14em]"><span className="text-accent">{project.eyebrow}</span><span className="text-dimmer">/ {project.year}</span><span className="border border-line px-1.5 py-0.5 text-dim">{project.status}</span></div>
        <h1 className="max-w-2xl text-2xl font-bold leading-tight text-foreground sm:text-4xl">{project.title}</h1>
        <p className="mt-3 max-w-2xl text-xs leading-5 text-dim sm:text-sm sm:leading-6">{project.pitch}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {project.caseStudyPdf && <button type="button" onClick={(event) => onOpenPdf(toViewportRect(event.currentTarget.getBoundingClientRect()))} className="border border-accent bg-accent px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-black">View full case study ↗</button>}
          {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="border border-line px-3 py-2 text-[9px] uppercase tracking-wider hover:border-accent hover:text-accent">Live demo ↗</a>}
          {project.sourceUrl && <a href={project.sourceUrl} target="_blank" rel="noreferrer" className="border border-line px-3 py-2 text-[9px] uppercase tracking-wider hover:border-accent hover:text-accent">Source ↗</a>}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-4">
        {[['Role', project.role], ['Stack', project.stack.join(', ')], ['Year', project.year], ['Status', project.status]].map(([label, value]) => <div key={label} className="bg-background px-3 py-4"><dt className="text-[8px] uppercase tracking-wider text-dimmer">{label}</dt><dd className="mt-1 text-[10px] leading-4 text-foreground">{value}</dd></div>)}
      </dl>

      <div className="grid gap-7 py-6 sm:grid-cols-[1.1fr_0.9fr]">
        <section><SectionLabel number="01" title="The problem" /><p className="text-[11px] leading-5 text-dim">{project.problem}</p></section>
        <section><SectionLabel number="02" title="Key features" /><List items={project.features} /></section>
        <section><SectionLabel number="03" title="Decisions I made" /><List items={project.decisions} /></section>
        <section><SectionLabel number="04" title="The result" /><p className="text-[11px] leading-5 text-dim">{project.outcome}</p></section>
      </div>
      <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
        <section className="bg-background p-4"><SectionLabel number="05" title="What I learned" /><p className="text-[10px] leading-5 text-dim">{project.learned}</p></section>
        <section className="bg-background p-4"><SectionLabel number="06" title="What’s next" /><p className="text-[10px] leading-5 text-dim">{project.next}</p></section>
      </div>
    </article>
  );
}

function SectionLabel({ number, title }: { number: string; title: string }) { return <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground"><span className="mr-2 text-accent">{number}</span>{title}</h2>; }
function List({ items }: { items: string[] }) { return <ul className="space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-[10px] leading-4 text-dim"><span className="text-accent">+</span><span>{item}</span></li>)}</ul>; }

