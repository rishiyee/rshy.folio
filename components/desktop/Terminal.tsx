"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { SOCIAL_LINKS } from "@/lib/config";
import { getWeightedClock, getYearProgress } from "@/lib/time";

type Line = { text: string; kind: "output" | "command" | "error" };
type FsFile = { type: "file"; content: string[] };
type FsDir = { type: "dir"; children: Record<string, FsNode> };
type FsNode = FsFile | FsDir;

const HELP_LINES = [
  "Commands:",
  "  help              show this list",
  "  about             about this site",
  "  whoami            who you are",
  "  socials           social links",
  "  clock             current weighted time",
  "  date              year progress",
  "",
  "Filesystem:",
  "  ls [path]         list directory contents",
  "  cd [path]         change directory (.. goes up, ~ goes home)",
  "  cat <file>        print a file's contents",
  "  pwd               print working directory",
  "  mkdir <name>      create a directory",
  "  touch <file>      create an empty file",
  "  works             quick summary of active work",
  "  case1             open the Case 1 PDF",
  "  open case1.pdf    open the Case 1 PDF",
  "",
  "Other:",
  "  echo <text>       print text (echo text > file writes to a file)",
  "  clear             clear the screen",
  "  exit              close this window",
];

const COMMANDS = [
  "help",
  "about",
  "whoami",
  "socials",
  "clock",
  "date",
  "works",
  "pwd",
  "ls",
  "cd",
  "cat",
  "mkdir",
  "touch",
  "echo",
  "clear",
  "exit",
];

function buildFs(): FsDir {
  const socialEntries = Object.entries(SOCIAL_LINKS).filter(([, v]) => v);
  return {
    type: "dir",
    children: {
      works: {
        type: "dir",
        children: {
          "case1.pdf": {
            type: "file",
            content: ['Available - run "open case1.pdf" to view.'],
          },
          "case-02.txt": { type: "file", content: ["case-02 — in progress"] },
          "case-03.txt": { type: "file", content: ["case-03 — in progress"] },
        },
      },
      "about.txt": {
        type: "file",
        content: ["Independent designer and developer portfolio."],
      },
      "socials.txt": {
        type: "file",
        content: socialEntries.length
          ? socialEntries.map(([k, v]) => `${k}: ${v}`)
          : ["No social links configured yet."],
      },
      "readme.txt": {
        type: "file",
        content: ['Type "help" to see available commands.'],
      },
    },
  };
}

const ROOT = buildFs();

function resolvePath(cwd: string[], input: string): string[] {
  const absolute = input.startsWith("/") || input.startsWith("~");
  const stripped = input.replace(/^~/, "").replace(/^\/+/, "");
  const segments = absolute ? [] : [...cwd];

  for (const part of stripped.split("/").filter(Boolean)) {
    if (part === ".") continue;
    if (part === "..") segments.pop();
    else segments.push(part);
  }
  return segments;
}

function getNode(path: string[]): FsNode | null {
  let node: FsNode = ROOT;
  for (const part of path) {
    if (node.type !== "dir") return null;
    const next: FsNode | undefined = node.children[part];
    if (!next) return null;
    node = next;
  }
  return node;
}

function getParentAndName(path: string[]): { parent: FsDir; name: string } | null {
  if (path.length === 0) return null;
  const name = path[path.length - 1];
  const parent = getNode(path.slice(0, -1));
  if (!parent || parent.type !== "dir") return null;
  return { parent, name };
}

function formatPrompt(cwd: string[]) {
  return `visitor@localhost:~${cwd.length ? "/" + cwd.join("/") : ""}$`;
}

function commonPrefix(values: string[]) {
  if (values.length === 0) return "";
  return values.slice(1).reduce((prefix, value) => {
    let index = 0;
    while (index < prefix.length && prefix[index] === value[index]) index += 1;
    return prefix.slice(0, index);
  }, values[0]);
}

function getPathCompletions(cwd: string[], input: string, directoriesOnly: boolean) {
  const slashIndex = input.lastIndexOf("/");
  const directoryInput = slashIndex >= 0 ? input.slice(0, slashIndex + 1) : "";
  const namePrefix = slashIndex >= 0 ? input.slice(slashIndex + 1) : input;
  const directoryPath = resolvePath(cwd, directoryInput || ".");
  const directory = getNode(directoryPath);
  if (!directory || directory.type !== "dir") return [];

  return Object.entries(directory.children)
    .filter(([name, node]) =>
      name.startsWith(namePrefix) && (!directoriesOnly || node.type === "dir")
    )
    .map(([name, node]) => `${directoryInput}${name}${node.type === "dir" ? "/" : ""}`)
    .sort();
}

export default function Terminal({
  onClose,
  onOpenCase,
}: {
  onClose: () => void;
  onOpenCase: () => void;
}) {
  const [lines, setLines] = useState<Line[]>([
    { text: 'OS terminal — type "help" to get started.', kind: "output" },
  ]);
  const [draft, setDraft] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [cwd, setCwd] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  function push(entries: Line[]) {
    setLines((prev) => [...prev, ...entries]);
  }

  function run(raw: string) {
    const trimmed = raw.trim();
    push([{ text: `${formatPrompt(cwd)} ${raw}`, kind: "command" }]);

    if (trimmed) {
      setHistory((prev) => (prev[prev.length - 1] === trimmed ? prev : [...prev, trimmed]));
    }
    setHistoryIndex(null);

    if (!trimmed) return;

    const [cmd, ...rest] = trimmed.split(/\s+/);
    const arg = rest.join(" ");

    switch (cmd.toLowerCase()) {
      case "help":
        push(HELP_LINES.map((text) => ({ text, kind: "output" })));
        break;
      case "about":
        push([{ text: "Independent designer and developer portfolio.", kind: "output" }]);
        break;
      case "whoami":
        push([{ text: "visitor", kind: "output" }]);
        break;
      case "socials": {
        const entries = Object.entries(SOCIAL_LINKS).filter(([, v]) => v);
        push(
          entries.length
            ? entries.map(([k, v]) => ({ text: `${k}: ${v}`, kind: "output" as const }))
            : [{ text: "No social links configured yet.", kind: "output" }]
        );
        break;
      }
      case "clock":
        push([{ text: getWeightedClock(new Date()).label, kind: "output" }]);
        break;
      case "date": {
        const p = getYearProgress(new Date());
        push([
          {
            text: `Day ${p.dayOfYear} of ${p.daysInYear} — ${p.percent}% through the year.`,
            kind: "output",
          },
        ]);
        break;
      }
      case "works":
        push([
          { text: "case1.pdf  ................  view", kind: "output" },
          { text: "case-02   ................  in progress", kind: "output" },
          { text: "case-03   ................  in progress", kind: "output" },
        ]);
        break;
      case "case1":
        push([{ text: "Opening case1.pdf...", kind: "output" }]);
        onOpenCase();
        break;
      case "open":
        if (["case1", "case1.pdf", "case-01.pdf"].includes(arg.toLowerCase())) {
          push([{ text: "Opening case1.pdf...", kind: "output" }]);
          onOpenCase();
        } else {
          push([{ text: `open: ${arg || "missing file"}: unsupported target`, kind: "error" }]);
        }
        break;
      case "pwd":
        push([{ text: cwd.length ? `~/${cwd.join("/")}` : "~", kind: "output" }]);
        break;
      case "ls": {
        const path = arg ? resolvePath(cwd, arg) : cwd;
        const node = getNode(path);
        if (!node) {
          push([{ text: `ls: ${arg}: No such file or directory`, kind: "error" }]);
        } else if (node.type === "file") {
          push([{ text: arg, kind: "output" }]);
        } else {
          const names = Object.entries(node.children)
            .map(([name, child]) => (child.type === "dir" ? `${name}/` : name))
            .sort();
          push([{ text: names.length ? names.join("  ") : "(empty)", kind: "output" }]);
        }
        break;
      }
      case "cd": {
        const path = resolvePath(cwd, arg || "~");
        const node = getNode(path);
        if (!node) {
          push([{ text: `cd: ${arg}: No such file or directory`, kind: "error" }]);
        } else if (node.type !== "dir") {
          push([{ text: `cd: ${arg}: Not a directory`, kind: "error" }]);
        } else {
          setCwd(path);
        }
        break;
      }
      case "cat": {
        if (!arg) {
          push([{ text: "usage: cat <file>", kind: "error" }]);
          break;
        }
        const path = resolvePath(cwd, arg);
        const node = getNode(path);
        if (!node) {
          push([{ text: `cat: ${arg}: No such file or directory`, kind: "error" }]);
        } else if (node.type === "dir") {
          push([{ text: `cat: ${arg}: Is a directory`, kind: "error" }]);
        } else {
          push(node.content.map((text) => ({ text, kind: "output" as const })));
        }
        break;
      }
      case "mkdir": {
        if (!arg) {
          push([{ text: "usage: mkdir <name>", kind: "error" }]);
          break;
        }
        const info = getParentAndName(resolvePath(cwd, arg));
        if (!info) {
          push([{ text: `mkdir: cannot create directory '${arg}'`, kind: "error" }]);
        } else if (info.parent.children[info.name]) {
          push([
            { text: `mkdir: cannot create directory '${arg}': File exists`, kind: "error" },
          ]);
        } else {
          info.parent.children[info.name] = { type: "dir", children: {} };
        }
        break;
      }
      case "touch": {
        if (!arg) {
          push([{ text: "usage: touch <file>", kind: "error" }]);
          break;
        }
        const info = getParentAndName(resolvePath(cwd, arg));
        if (!info) {
          push([{ text: `touch: cannot touch '${arg}'`, kind: "error" }]);
        } else if (!info.parent.children[info.name]) {
          info.parent.children[info.name] = { type: "file", content: [] };
        } else if (info.parent.children[info.name].type !== "file") {
          push([{ text: `touch: cannot touch '${arg}': Is a directory`, kind: "error" }]);
        }
        break;
      }
      case "echo": {
        const redirect = arg.match(/^([\s\S]*)\s>\s(\S+)$/);
        if (!redirect) {
          push([{ text: arg, kind: "output" }]);
          break;
        }
        const [, content, target] = redirect;
        const info = getParentAndName(resolvePath(cwd, target));
        if (!info) {
          push([{ text: `echo: cannot create '${target}'`, kind: "error" }]);
        } else if (info.parent.children[info.name]?.type === "dir") {
          push([{ text: `echo: ${target}: Is a directory`, kind: "error" }]);
        } else {
          info.parent.children[info.name] = { type: "file", content: [content] };
        }
        break;
      }
      case "sudo":
        push([{ text: "Nice try. Permission denied.", kind: "error" }]);
        break;
      case "clear":
        setLines([]);
        break;
      case "exit":
        onClose();
        break;
      default:
        push([{ text: `command not found: ${cmd} (try "help")`, kind: "error" }]);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const firstSpace = draft.search(/\s/);

      if (firstSpace === -1) {
        const matches = COMMANDS.filter((command) => command.startsWith(draft));
        if (matches.length === 1) setDraft(`${matches[0]} `);
        else if (matches.length > 1) {
          const prefix = commonPrefix(matches);
          if (prefix.length > draft.length) setDraft(prefix);
          else push([{ text: matches.join("  "), kind: "output" }]);
        }
        return;
      }

      const command = draft.slice(0, firstSpace).toLowerCase();
      const argument = draft.slice(firstSpace + 1).trimStart();

      if (command === "open") {
        const matches = ["case1.pdf"].filter((target) => target.startsWith(argument));
        if (matches.length === 1) setDraft(`open ${matches[0]} `);
        return;
      }

      if (!["cd", "ls", "cat", "mkdir", "touch"].includes(command)) return;
      const matches = getPathCompletions(cwd, argument, command === "cd");
      if (matches.length === 1) {
        const suffix = matches[0].endsWith("/") ? "" : " ";
        setDraft(`${command} ${matches[0]}${suffix}`);
      } else if (matches.length > 1) {
        const prefix = commonPrefix(matches);
        if (prefix.length > argument.length) setDraft(`${command} ${prefix}`);
        else push([{ text: matches.join("  "), kind: "output" }]);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setDraft(history[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(null);
        setDraft("");
      } else {
        setHistoryIndex(nextIndex);
        setDraft(history[nextIndex]);
      }
    }
  }

  return (
    <div
      className="flex flex-col text-xs h-full"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="retro-scrollbar flex-1 overflow-y-auto leading-relaxed">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`whitespace-pre-wrap break-words ${
              line.kind === "error"
                ? "text-accent"
                : line.kind === "command"
                  ? "text-foreground/90"
                  : "text-dim"
            }`}
          >
            {line.text}
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = draft;
            setDraft("");
            run(value);
          }}
          className="flex items-center gap-1.5"
        >
          <span className="text-foreground/90 shrink-0">{formatPrompt(cwd)}</span>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent outline-none text-foreground caret-accent"
          />
        </form>
      </div>
    </div>
  );
}
