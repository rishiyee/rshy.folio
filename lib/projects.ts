export type ProjectStatus = "Live" | "Prototype" | "In progress";

export type Project = {
  slug: string;
  title: string;
  eyebrow: string;
  pitch: string;
  year: string;
  status: ProjectStatus;
  role: string;
  stack: string[];
  accent: string;
  preview: string;
  liveUrl?: string;
  sourceUrl?: string;
  caseStudyPdf?: string;
  problem: string;
  features: string[];
  decisions: string[];
  outcome: string;
  learned: string;
  next: string;
};

// This is the only file you need to edit when adding another project.
// Replace the sample copy and links with your real evidence before publishing.
export const projects: Project[] = [
  {
    slug: "portfolio-os",
    title: "Portfolio OS",
    eyebrow: "Interactive portfolio",
    pitch: "A desktop-inspired portfolio that turns browsing my work into a playful, explorable experience.",
    year: "2026",
    status: "Live",
    role: "Product design + development",
    stack: ["Next.js", "TypeScript", "Supabase"],
    accent: "#e3a335",
    preview: "OS_01",
    problem: "Most portfolio sites feel like static archives. I wanted the interface itself to demonstrate interaction design and frontend craft.",
    features: ["Draggable window system", "Live visitor lounge", "Built-in apps and assistant"],
    decisions: ["Used a familiar desktop metaphor", "Kept every interaction keyboard-accessible", "Made motion respect reduced-motion preferences"],
    outcome: "A portfolio that is both the container for the work and a project worth exploring on its own.",
    learned: "Novel navigation needs clear onboarding and strong mobile fallbacks.",
    next: "Add lightweight analytics and publish performance results.",
  },
  {
    slug: "wordle",
    title: "Wordle.app",
    eyebrow: "Game experiment",
    pitch: "A compact word game rebuilt as a native app inside the portfolio desktop.",
    year: "2026",
    status: "Live",
    role: "Frontend development",
    stack: ["React", "TypeScript", "CSS"],
    accent: "#6aaa64",
    preview: "GAME_02",
    problem: "Recreate a familiar game while making it feel at home inside a completely different interface system.",
    features: ["Validated guesses", "Physical keyboard support", "Responsive game board"],
    decisions: ["Reused the portfolio window language", "Kept feedback immediate", "Separated word validation from UI state"],
    outcome: "A small but complete interaction that shows state management, input handling, and interface polish.",
    learned: "Small games expose edge cases quickly—especially around repeated letters and input timing.",
    next: "Add shareable results and accessible color themes.",
  },
  {
    slug: "case-study-01",
    title: "Selected Work 01",
    eyebrow: "Product / interface",
    pitch: "A visual case study covering the problem, process, system, and final product experience.",
    year: "2025",
    status: "Prototype",
    role: "Design + prototyping",
    stack: ["Research", "UI/UX", "Prototype"],
    accent: "#e3c828",
    preview: "CASE_03",
    caseStudyPdf: "/case1.pdf",
    problem: "Turn a broad product brief into a focused experience with a clear visual and interaction system.",
    features: ["End-to-end user flow", "Reusable visual system", "High-fidelity prototype"],
    decisions: ["Prioritized the core journey", "Reduced competing actions", "Documented repeatable patterns"],
    outcome: "A coherent concept ready for validation and engineering handoff.",
    learned: "The strongest visual direction emerges after the information hierarchy is settled.",
    next: "Validate the prototype with five target users and document the findings.",
  },
];
