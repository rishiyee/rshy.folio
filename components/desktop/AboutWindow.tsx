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
  return (
    <article className="grid min-h-full md:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="border-b border-line md:border-b-0 md:border-r">
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
          <h1 className="mt-3 text-3xl tracking-[-0.06em] text-foreground">Portfolio</h1>
          <p className="mt-4 text-[11px] leading-5 text-dim">
            I design and build brands, products,
            and digital experiences with equal attention to form and function.
          </p>

          <dl className="mt-7 border-t border-line pt-4 text-[9px] uppercase tracking-[0.12em]">
            <div className="flex justify-between gap-4 py-1.5">
              <dt className="text-dimmer">Focus</dt>
              <dd className="text-right text-foreground/80">Design + technology</dd>
            </div>
            <div className="flex justify-between gap-4 py-1.5">
              <dt className="text-dimmer">Mode</dt>
              <dd className="text-right text-foreground/80">Independent studio</dd>
            </div>
            <div className="flex justify-between gap-4 py-1.5">
              <dt className="text-dimmer">Status</dt>
              <dd className="text-right text-accent">Open to projects</dd>
            </div>
          </dl>
        </div>
      </aside>

      <div>
        <header className="border-b border-line p-5 sm:p-7">
          <p className="text-[9px] uppercase tracking-[0.18em] text-dim">About / Profile</p>
          <h2 className="mt-5 max-w-2xl text-2xl leading-[1.15] tracking-[-0.045em] text-foreground sm:text-4xl">
            Building thoughtful work where identity, interface, and code meet.
          </h2>
          <p className="mt-5 max-w-2xl text-xs leading-6 text-foreground/65">
            I turn early ideas into focused systems and expressive digital
            experiences. My approach is curious, collaborative, and grounded in the
            details that make work feel effortless.
          </p>
        </header>

        <section className="border-b border-line p-5 sm:p-7">
          <SectionLabel number="01">Skills</SectionLabel>
          <div className="grid border-l border-t border-line sm:grid-cols-3">
            {SKILL_GROUPS.map((group) => (
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
            {EXPERIENCE.map((item, index) => (
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
            {EDUCATION.map((item) => (
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
      </div>
    </article>
  );
}