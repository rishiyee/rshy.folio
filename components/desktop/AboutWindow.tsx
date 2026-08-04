const SERVICES = [
  "Brand systems",
  "Digital products",
  "Web experiences",
  "Creative development",
];

const PRINCIPLES = [
  ["01", "Clarity first", "We reduce ideas to their clearest, most useful form."],
  ["02", "Built together", "Design and engineering move as one continuous process."],
  ["03", "Made to last", "Every system is considered beyond the first release."],
];

export default function AboutWindow() {
  return (
    <article className="min-h-full">
      <header className="grid border-b border-line sm:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="flex min-h-64 flex-col justify-between p-5 sm:min-h-72 sm:p-7">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-dim">
            <span className="h-1.5 w-1.5 bg-accent" />
            Independent design &amp; engineering studio
          </div>
          <div className="mt-12">
            <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-dim">About Vonnue</p>
            <h1 className="max-w-xl text-2xl leading-[1.12] tracking-[-0.04em] text-foreground sm:text-4xl">
              We turn ambitious ideas into clear, useful digital experiences.
            </h1>
          </div>
        </div>
        <div className="relative min-h-64 overflow-hidden border-t border-line sm:min-h-72 sm:border-l sm:border-t-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/me.png" alt="Vonnue studio founder" className="absolute inset-0 h-full w-full object-cover grayscale" />
          <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/85 px-3 py-2 text-[9px] uppercase tracking-[0.14em] backdrop-blur-sm">
            <span>Founder / Designer</span>
            <span className="text-accent">Vonnue</span>
          </div>
        </div>
      </header>

      <section className="grid border-b border-line sm:grid-cols-[minmax(0,1.35fr)_minmax(13rem,0.65fr)]">
        <div className="p-5 sm:p-7">
          <p className="mb-4 text-[10px] uppercase tracking-[0.18em] text-accent">What we do</p>
          <p className="max-w-2xl text-sm leading-7 text-foreground/80">
            Vonnue works across strategy, identity, interface design, and code. We
            partner with people who care about the details to shape brands and
            products that feel distinctive, intuitive, and ready for the real world.
          </p>
        </div>
        <div className="border-t border-line p-5 sm:border-l sm:border-t-0 sm:p-7">
          <p className="mb-4 text-[10px] uppercase tracking-[0.18em] text-dim">Capabilities</p>
          <ul className="space-y-2.5" aria-label="Studio capabilities">
            {SERVICES.map((service) => (
              <li key={service} className="flex items-center gap-2 text-xs text-foreground/80">
                <span className="text-accent">+</span>
                {service}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="p-5 sm:p-7">
        <div className="mb-4 flex items-end justify-between gap-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-dim">How we work</p>
          <p className="text-[9px] uppercase tracking-[0.14em] text-dimmer">Small team / close collaboration</p>
        </div>
        <div className="grid border-l border-t border-line sm:grid-cols-3">
          {PRINCIPLES.map(([number, title, description]) => (
            <div key={number} className="border-b border-r border-line p-4">
              <span className="text-[9px] text-accent">{number}</span>
              <h2 className="mt-6 text-xs uppercase tracking-[0.08em] text-foreground">{title}</h2>
              <p className="mt-2 text-[11px] leading-5 text-dim">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}