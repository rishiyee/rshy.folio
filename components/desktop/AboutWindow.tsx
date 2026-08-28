"use client";

import { useEffect, useState } from "react";

const SKILL_GROUPS = [
  {
    label: "Design",
    skills: ["Product design", "UI / UX", "Brand systems", "Art direction"],
  },
  {
    label: "Engineering",
    skills: ["Creative development", "Frontend systems", "Prototyping", "Interaction"],
  },
  {
    label: "Thinking",
    skills: ["Strategy", "Research", "Systems thinking", "Collaboration"],
  },
];

const EXPERIENCE = [
  {
    period: "Present",
    role: "Independent Designer & Developer",
    place: "Independent practice",
    description:
      "Leading projects from early strategy through identity, interface design, prototyping, and production.",
  },
  {
    period: "Ongoing",
    role: "Design & Engineering Partner",
    place: "Selected collaborations",
    description:
      "Working closely with ambitious teams to make complex products and ideas feel clear, useful, and distinct.",
  },
];

const EDUCATION = [
  {
    period: "Ongoing",
    title: "Independent studio research",
    detail: "Product systems, visual culture, interaction, and creative technology.",
  },
  {
    period: "Always",
    title: "Learning through making",
    detail: "A practice shaped by experiments, collaboration, critique, and shipped work.",
  },
];

type AboutContent = {
  name: string;
  title: string;
  intro: string;
  skillGroups: typeof SKILL_GROUPS;
  experience: typeof EXPERIENCE;
  education: typeof EDUCATION;
  socials: { label: string; value: string }[];
};

const DEFAULT_CONTENT: AboutContent = {
  name: "Hrishikesh Vyshnav",
  title: "Building thoughtful work where identity, interface, and code meet.",
  intro: "I turn early ideas into focused systems and expressive digital experiences. My approach is curious, collaborative, and grounded in the details that make work feel effortless.",
  skillGroups: SKILL_GROUPS,
  experience: EXPERIENCE,
  education: EDUCATION,
  socials: [],
};

function parseAboutMarkdown(markdown: string): AboutContent {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim());
  const section = (name: string) => {
    const start = lines.indexOf(`## ${name}`);
    const end = lines.findIndex((line, index) => index > start && line.startsWith("## "));
    return start < 0 ? [] : lines.slice(start + 1, end < 0 ? undefined : end);
  };
  const groups: AboutContent["skillGroups"] = [];
  for (const line of section("Skills")) {
    if (line.startsWith("### ")) groups.push({ label: line.slice(4), skills: [] });
    else if (line.startsWith("- ")) groups.at(-1)?.skills.push(line.slice(2));
  }
  const entries = (name: string) => {
    const result: { heading: string; body: string[] }[] = [];
    for (const line of section(name)) {
      if (line.startsWith("### ")) result.push({ heading: line.slice(4), body: [] });
      else if (line) result.at(-1)?.body.push(line);
    }
    return result;
  };
  const experience = entries("Experience").map(({ heading, body }) => {
    const [period, role = ""] = heading.split(" — ");
    return { period, role, place: body[0] ?? "", description: body.slice(1).join(" ") };
  });
  const education = entries("Education").map(({ heading, body }) => {
    const [period, title = ""] = heading.split(" — ");
    return { period, title, detail: body.join(" ") };
  });
  const firstSection = lines.findIndex((line) => line.startsWith("## "));
  const name = lines.find((line) => line.startsWith("Name:"))?.slice(5).trim();
  const socials = section("Social connections").flatMap((line) => {
    const match = line.match(/^-\s+([^:]+):\s*(.*)$/);
    return match ? [{ label: match[1].trim(), value: match[2].trim() }] : [];
  });
  return {
    name: name || DEFAULT_CONTENT.name,
    title: lines.find((line) => line.startsWith("# "))?.slice(2) || DEFAULT_CONTENT.title,
    intro:
      lines
        .slice(1, firstSection)
        .filter((line) => line && !line.startsWith("Name:"))
        .join(" ") || DEFAULT_CONTENT.intro,
    skillGroups: groups.length ? groups : SKILL_GROUPS,
    experience: experience.length ? experience : EXPERIENCE,
    education: education.length ? education : EDUCATION,
    socials,
  };
}

function socialHref(label: string, value: string) {
  if (!value) return undefined;
  if (label.toLowerCase() === "email") {
    return value.startsWith("mailto:") ? value : `mailto:${value}`;
  }
  if (label.toLowerCase() === "phone") {
    return value.startsWith("tel:") ? value : `tel:${value.replace(/[^+\d]/g, "")}`;
  }
  return /^https?:\/\//i.test(value) ? value : undefined;
}

function SectionLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3 text-[9px] uppercase tracking-[0.18em] text-dim">
      <span className="text-accent">{number}</span>
      <span>{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export default function AboutWindow() {
  const [content, setContent] = useState(DEFAULT_CONTENT);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/about.md", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load about.md");
        return response.text();
      })
      .then((markdown) => setContent(parseAboutMarkdown(markdown)))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error(error);
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <article className="grid min-h-full md:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="border-b border-line md:sticky md:top-0 md:self-start md:border-b-0 md:border-r">
        <div className="relative aspect-[4/3] overflow-hidden border-b border-line md:aspect-[4/5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/me.png"
            alt="Portfolio portrait"
            className="absolute inset-0 h-full w-full object-cover grayscale"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-background/85 px-4 py-3 text-[9px] uppercase tracking-[0.14em] backdrop-blur-sm">
            <span>Profile / 001</span>
            <span className="flex items-center gap-2 text-foreground">
              <span className="h-1.5 w-1.5 bg-accent" /> Active
            </span>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <p className="text-[9px] uppercase tracking-[0.18em] text-accent">Designer / Developer</p>
          <h1 className="mt-3 text-3xl tracking-[-0.06em] text-foreground">
            {content.name}
          </h1>
          <p className="mt-4 text-[11px] leading-5 text-dim">
            I design and build brands, products,
            and digital experiences with equal attention to form and function.
          </p>
          <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-[9px] uppercase tracking-[0.12em] text-foreground">
            <span className="h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_6px_rgb(16_185_129)]" />
            Available for full-time roles
          </div>
          <a
            href="/Hrishikesh-Vyshnav-Resume.pdf"
            download
            className="mt-4 inline-flex border border-line px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Download résumé ↓
          </a>
        </div>
      </aside>

      <div>
        <header className="border-b border-line p-5 sm:p-7">
          <p className="text-[9px] uppercase tracking-[0.18em] text-dim">About / Profile</p>
          <h2 className="mt-5 max-w-2xl text-2xl leading-[1.15] tracking-[-0.045em] text-foreground sm:text-4xl">
            {content.title}
          </h2>
          <p className="mt-5 max-w-2xl text-xs leading-6 text-foreground/65">
            {content.intro}
          </p>
        </header>

        <section className="border-b border-line p-5 sm:p-7">
          <SectionLabel number="01">Skills</SectionLabel>
          <div className="grid border-l border-t border-line sm:grid-cols-3">
            {content.skillGroups.map((group) => (
              <div key={group.label} className="border-b border-r border-line p-4">
                <h3 className="mb-4 text-[10px] uppercase tracking-[0.14em] text-foreground">
                  {group.label}
                </h3>
                <ul className="space-y-2.5">
                  {group.skills.map((skill) => (
                    <li key={skill} className="flex gap-2 text-[10px] text-dim">
                      <span className="text-accent">+</span> {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-line p-5 sm:p-7">
          <SectionLabel number="02">Experience</SectionLabel>
          <div className="border-t border-line">
            {content.experience.map((item, index) => (
              <article
                key={`${item.period}-${item.role}`}
                className="grid gap-3 border-b border-line py-5 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-6"
              >
                <div className="text-[9px] uppercase tracking-[0.14em] text-accent">
                  {item.period}
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-xs uppercase tracking-[0.08em] text-foreground">
                      {item.role}
                    </h3>
                    <span className="text-[9px] text-dimmer">0{index + 1}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-dim">{item.place}</p>
                  <p className="mt-3 max-w-xl text-[11px] leading-5 text-foreground/65">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="p-5 sm:p-7">
          <SectionLabel number="03">Education</SectionLabel>
          <div className="grid gap-px bg-line sm:grid-cols-2">
            {content.education.map((item) => (
              <article key={item.title} className="bg-background p-4 sm:p-5">
                <span className="text-[9px] uppercase tracking-[0.14em] text-accent">
                  {item.period}
                </span>
                <h3 className="mt-5 text-xs uppercase tracking-[0.08em] text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-[11px] leading-5 text-dim">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-line p-5 sm:p-7">
          <SectionLabel number="04">Contact / Social</SectionLabel>
          <div className="grid border-l border-t border-line sm:grid-cols-2">
            {content.socials.map((item) => {
              const href = socialHref(item.label, item.value);
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 border-b border-r border-line p-4"
                >
                  <span className="text-[9px] uppercase tracking-[0.14em] text-dim">
                    {item.label}
                  </span>
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="truncate text-[10px] text-accent hover:underline"
                    >
                      {item.value.replace(/^(mailto:|tel:)/, "")}
                    </a>
                  ) : (
                    <span className="text-[10px] text-dimmer">Not set</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </article>
  );
}
