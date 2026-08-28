export const BACKGROUNDS = [
  { name: "Solar Yellow", color: "rgb(227, 200, 40)" },
  { name: "Oxblood", color: "rgb(139, 0, 0)" },
  { name: "Midnight", color: "rgb(0, 0, 0)" },
  { name: "Electric Pink", color: "rgb(251, 0, 236)" },
  { name: "Signal Yellow", color: "rgb(255, 242, 0)" },
] as const;

export default function BackgroundPicker({
  selectedIndex,
  onSelect,
}: {
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <section aria-labelledby="background-picker-title">
      <div className="mb-4">
        <h2 id="background-picker-title" className="text-sm font-bold uppercase tracking-[0.1em]">
          Desktop Background
        </h2>
        <p className="mt-1 text-[11px] text-dim">Select a color to preview it immediately.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BACKGROUNDS.map((background, index) => {
          const selected = index === selectedIndex;
          return (
            <button
              key={background.name}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(index)}
              className={`group border p-1.5 text-left transition-colors ${
                selected
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line hover:border-foreground"
              }`}
            >
              <span
                className="relative block aspect-[4/3] overflow-hidden border border-black/30"
                style={{ backgroundColor: background.color }}
              >
                <span className="absolute inset-x-0 top-0 h-2.5 border-b border-white/25 bg-black/75" />
                <span className="absolute left-2 top-5 h-4 w-3 border border-white/60 bg-white/25" />
                <span className="absolute left-2 top-10 h-4 w-3 border border-white/60 bg-white/25" />
                {selected && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center bg-accent text-xs font-bold text-background">
                    ✓
                  </span>
                )}
              </span>
              <span className="mt-1.5 flex items-center justify-between gap-2 px-0.5 text-[10px] font-bold uppercase tracking-[0.06em]">
                <span>{background.name}</span>
                {selected && <span>Selected</span>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
