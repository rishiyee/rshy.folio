"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import TopBar from "./TopBar";
import DesktopIcon, { type IconOrigin } from "./DesktopIcon";
import WindowPanel, { type WindowTransitionPhase } from "./WindowPanel";
import ShutdownOverlay from "./ShutdownOverlay";
import BootOverlay from "./BootOverlay";
import GrainOverlay from "./GrainOverlay";
import ChatApp from "./ChatApp";
import Terminal from "./Terminal";
import NotesApp from "./NotesApp";
import ContactForm from "./ContactForm";
import AboutWindow from "./AboutWindow";
import PdfViewer from "./PdfViewer";
import ProjectsApp from "./ProjectsApp";
import MinimizedDock from "./MinimizedDock";
import WordleGame from "./WordleGame";
import BackgroundPicker, { BACKGROUNDS } from "./BackgroundPicker";
import {
  pointTarget,
  toViewportRect,
  type ViewportRect,
} from "@/lib/windowTransition";

const BACKGROUND_STORAGE_KEY = "portfolio-os-background-index";
const THEME_STORAGE_KEY = "portfolio-os-theme";
type Theme = "dark" | "light";

const DOC_PATH = "/case1.pdf";
const GUIDE_STORAGE_KEY = "portfolio-os-guide-seen";

const WINDOW_TITLES = {
  works: "/works",
  terminal: "~/terminal",
  about: "about.txt",
  doc: "case1.pdf",
  notes: "notes.txt",
  contact: "contact.txt",
  wordle: "wordle.app",
  background: "desktop-backgrounds.app",
  chat: "assistant.app",
};

type WindowId = "works" | "terminal" | "about" | "doc" | "notes" | "contact" | "wordle" | "background" | "chat";
type IconId = "works" | "terminal" | "notes" | "contact" | "about" | "wordle" | "chat";
type OpenWindow = {
  id: WindowId;
  position: { x: number; y: number };
  zIndex: number;
  origin?: IconOrigin;
  maximized: boolean;
  minimized: boolean;
  transitionPhase: WindowTransitionPhase;
  transitionTarget?: ViewportRect;
};

const DEFAULT_ICON_POSITIONS: Record<IconId, { x: number; y: number }> = {
  works: { x: 24, y: 56 },
  terminal: { x: 24, y: 160 },
  notes: { x: 24, y: 264 },
  contact: { x: 24, y: 264 },
  about: { x: 24, y: 368 },
  wordle: { x: 120, y: 56 },
  chat: { x: 120, y: 160 },
};

export default function Desktop({ multiplayerLayer }: { multiplayerLayer?: ReactNode }) {
  const [booted, setBooted] = useState(false);
  const [entryReady, setEntryReady] = useState(false);
  const [chatPrompt, setChatPrompt] = useState<{ id: number; text: string }>();
  const [showGuide, setShowGuide] = useState(false);
  const [shutdownActive, setShutdownActive] = useState(false);
  const [desktopCycle, setDesktopCycle] = useState(0);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [theme, setTheme] = useState<Theme>("dark");
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [iconPositions, setIconPositions] = useState(DEFAULT_ICON_POSITIONS);
  const iconLabelTone = backgroundIndex === 1 || backgroundIndex === 2 ? "light" : "dark";
  const topZ = useRef(50);
  const chatPromptId = useRef(0);
  const iconElements = useRef<Partial<Record<IconId, HTMLButtonElement>>>({});
  const docLauncherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(BACKGROUND_STORAGE_KEY));
    if (Number.isInteger(stored) && stored >= 0 && stored < BACKGROUNDS.length) {
      const frame = requestAnimationFrame(() => setBackgroundIndex(stored));
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored !== "dark" && stored !== "light") return;
    const frame = requestAnimationFrame(() => setTheme(stored));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!booted) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setEntryReady(true), reduceMotion ? 50 : 1050);
    return () => window.clearTimeout(timer);
  }, [booted]);

  useEffect(() => {
    if (!entryReady || window.localStorage.getItem(GUIDE_STORAGE_KEY)) return;
    const timer = window.setTimeout(() => setShowGuide(true), 250);
    return () => window.clearTimeout(timer);
  }, [entryReady]);

  function dismissGuide() {
    setShowGuide(false);
    window.localStorage.setItem(GUIDE_STORAGE_KEY, "true");
  }

  function selectBackground(index: number) {
    setBackgroundIndex(index);
    window.localStorage.setItem(BACKGROUND_STORAGE_KEY, String(index));
  }

  function nextZ() {
    topZ.current += 1;
    return topZ.current;
  }

  function openWindow(id: WindowId, origin?: IconOrigin) {
    setWindows((prev) => {
      if (prev.some((w) => w.id === id)) {
        return prev.map((w) => {
          if (w.id !== id) return w;
          if (!w.minimized) return { ...w, zIndex: nextZ() };
          const dockElement = document.querySelector<HTMLElement>(
            `[data-minimize-target="${id}"]`
          );
          return {
            ...w,
            zIndex: nextZ(),
            minimized: false,
            transitionPhase: "opening",
            origin: dockElement ? toViewportRect(dockElement.getBoundingClientRect()) : w.origin,
            transitionTarget: undefined,
          };
        });
      }
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const defaultWidth = Math.min(viewportWidth * 0.4, viewportWidth - 32);
      const windowWidth =
        id === "about"
          ? Math.min(880, viewportWidth - 32)
          : id === "contact"
            ? Math.min(820, viewportWidth - 32)
            : defaultWidth;
      const requestedHeight =
        id === "about"
          ? 650
          : id === "contact"
            ? 610
            : id === "background"
              ? 430
              : id === "chat"
                ? 560
            : viewportWidth * 0.225 + 37;
      const windowHeight = Math.min(requestedHeight, viewportHeight - 48);
      const visibleWindowCount = prev.filter((window) => !window.minimized).length;
      const offsets = [
        { x: 0, y: 0 },
        { x: 48, y: 48 },
        { x: -48, y: 48 },
        { x: 48, y: -48 },
        { x: -48, y: -48 },
      ];
      const offset = offsets[visibleWindowCount % offsets.length];
      const x = Math.min(
        Math.max((viewportWidth - windowWidth) / 2 + offset.x, 0),
        Math.max(0, viewportWidth - windowWidth)
      );
      const y = Math.min(
        Math.max((viewportHeight - windowHeight) / 2 + offset.y, 36),
        Math.max(36, viewportHeight - windowHeight)
      );
      return [
        ...prev,
        {
          id,
          position: { x, y },
          zIndex: nextZ(),
          origin,
          maximized: false,
          minimized: false,
          transitionPhase: "opening",
        },
      ];
    });
  }

  function resolveOriginalTarget(openWindow: OpenWindow) {
    const iconElement =
      openWindow.id === "works" ||
      openWindow.id === "terminal" ||
      openWindow.id === "notes" ||
      openWindow.id === "contact" ||
      openWindow.id === "about"
          || openWindow.id === "wordle"
          || openWindow.id === "chat"
        ? iconElements.current[openWindow.id]
        : openWindow.id === "doc"
          ? docLauncherRef.current
          : undefined;

    return iconElement
      ? toViewportRect(iconElement.getBoundingClientRect())
      : openWindow.origin ?? pointTarget(window.innerWidth / 2, window.innerHeight - 24);
  }

  function closeWindow(id: WindowId) {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              zIndex: nextZ(),
              transitionPhase: "closing",
              transitionTarget: resolveOriginalTarget(w),
            }
          : w
      )
    );
  }

  function focusWindow(id: WindowId) {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ() } : w)));
  }

  function moveWindow(id: WindowId, position: { x: number; y: number }) {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, position } : w)));
  }

  function toggleMaximizeWindow(id: WindowId) {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))
    );
  }

  function minimizeWindow(id: WindowId) {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, zIndex: nextZ(), transitionPhase: "preparing-minimize" }
          : w
      )
    );

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const dockElement = document.querySelector<HTMLElement>(
          `[data-minimize-transition-target="${id}"]`
        );
        const target = dockElement
          ? toViewportRect(dockElement.getBoundingClientRect())
          : pointTarget(window.innerWidth / 2, window.innerHeight - 24);

        setWindows((prev) =>
          prev.map((w) =>
            w.id === id
              ? { ...w, transitionPhase: "minimizing", transitionTarget: target }
              : w
          )
        );
      });
    });
  }

  function restoreWindow(id: WindowId, origin: ViewportRect) {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              minimized: false,
              zIndex: nextZ(),
              origin,
              transitionPhase: "opening",
              transitionTarget: undefined,
            }
          : w
      )
    );
  }

  function completeWindowTransition(id: WindowId) {
    setWindows((prev) => {
      const current = prev.find((w) => w.id === id);
      if (!current) return prev;
      if (current.transitionPhase === "closing") {
        return prev.filter((w) => w.id !== id);
      }
      return prev.map((w) => {
        if (w.id !== id) return w;
        if (w.transitionPhase === "minimizing") {
          return {
            ...w,
            minimized: true,
            transitionPhase: "open",
            transitionTarget: undefined,
          };
        }
        if (w.transitionPhase === "opening") {
          return { ...w, transitionPhase: "open", transitionTarget: undefined };
        }
        return w;
      });
    });
  }

  function moveIcon(id: IconId, position: { x: number; y: number }) {
    setIconPositions((prev) => ({ ...prev, [id]: position }));
  }

  function reportBug() {
    chatPromptId.current += 1;
    setChatPrompt({
      id: chatPromptId.current,
      text: "Found a bug? Describe it below and we'll take a look.",
    });
    openWindow("chat");
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: BACKGROUNDS[backgroundIndex].color }}
    >
      <div
        key={`${booted}-${desktopCycle}`}
        aria-busy={booted && !entryReady}
        className={`fixed inset-0 ${
          booted
            ? `crt-on ${entryReady ? "" : "desktop-entering pointer-events-none"}`
            : "opacity-0"
        }`}
      >
        {!entryReady && <div aria-hidden="true" className="desktop-entry-signal" />}
        <TopBar
          onOpenWindow={openWindow}
          onOpenAbout={() => openWindow("about")}
          onReportBug={reportBug}
          onShutdown={() => setShutdownActive(true)}
          onChangeBackground={() => openWindow("background")}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        />

        <DesktopIcon
          entryIndex={0}
          label="Works"
          icon="/files.svg"
          position={iconPositions.works}
          labelTone={iconLabelTone}
          onMove={(position) => moveIcon("works", position)}
          onOpen={(origin) => openWindow("works", origin)}
          onElement={(element) => {
            if (element) iconElements.current.works = element;
            else delete iconElements.current.works;
          }}
        />
        <DesktopIcon
          entryIndex={1}
          label="Wordle"
          icon="/wordle.svg"
          position={iconPositions.wordle}
          labelTone={iconLabelTone}
          onMove={(position) => moveIcon("wordle", position)}
          onOpen={(origin) => openWindow("wordle", origin)}
          onElement={(element) => {
            if (element) iconElements.current.wordle = element;
            else delete iconElements.current.wordle;
          }}
        />
        <DesktopIcon
          entryIndex={2}
          label="Terminal"
          icon="/terminal.svg"
          position={iconPositions.terminal}
          labelTone={iconLabelTone}
          onMove={(position) => moveIcon("terminal", position)}
          onOpen={(origin) => openWindow("terminal", origin)}
          onElement={(element) => {
            if (element) iconElements.current.terminal = element;
            else delete iconElements.current.terminal;
          }}
        />
        <DesktopIcon
          entryIndex={3}
          label="Contact"
          icon="/contact.svg"
          position={iconPositions.contact}
          labelTone={iconLabelTone}
          onMove={(position) => moveIcon("contact", position)}
          onOpen={(origin) => openWindow("contact", origin)}
          onElement={(element) => {
            if (element) iconElements.current.contact = element;
            else delete iconElements.current.contact;
          }}
        />
        <DesktopIcon
          entryIndex={4}
          label="About"
          icon="/window.svg"
          position={iconPositions.about}
          labelTone={iconLabelTone}
          onMove={(position) => moveIcon("about", position)}
          onOpen={(origin) => openWindow("about", origin)}
          onElement={(element) => {
            if (element) iconElements.current.about = element;
            else delete iconElements.current.about;
          }}
        />
        <DesktopIcon
          entryIndex={5}
          label="Chat"
          icon="/chat.svg"
          position={iconPositions.chat}
          labelTone={iconLabelTone}
          onMove={(position) => moveIcon("chat", position)}
          onOpen={(origin) => openWindow("chat", origin)}
          onElement={(element) => {
            if (element) iconElements.current.chat = element;
            else delete iconElements.current.chat;
          }}
        />

        {windows.filter((w) => !w.minimized).map((w) => (
          <WindowPanel
            key={w.id}
            title={WINDOW_TITLES[w.id]}
            position={w.position}
            zIndex={w.zIndex}
            origin={w.origin}
            transitionPhase={w.transitionPhase}
            transitionTarget={w.transitionTarget}
            maximized={w.maximized}
            onClose={() => closeWindow(w.id)}
            onFocus={() => focusWindow(w.id)}
            onMove={(position) => moveWindow(w.id, position)}
            onToggleMaximize={() => toggleMaximizeWindow(w.id)}
            onMinimize={() => minimizeWindow(w.id)}
            onTransitionComplete={() => completeWindowTransition(w.id)}
            windowClassName={
              w.id === "about"
                ? "w-[min(880px,calc(100vw-2rem))] h-[min(650px,calc(100vh-5rem))]"
                : w.id === "contact"
                  ? "w-[min(820px,calc(100vw-2rem))] h-[min(610px,calc(100vh-5rem))]"
                  : w.id === "wordle"
                    ? "w-[min(500px,calc(100vw-2rem))] h-[min(680px,calc(100vh-5rem))]"
                    : w.id === "background"
                      ? "w-[min(560px,calc(100vw-2rem))] h-[min(430px,calc(100vh-5rem))]"
                      : w.id === "chat"
                        ? "w-[min(460px,calc(100vw-2rem))] h-[min(560px,calc(100vh-5rem))]"
                  : undefined
            }
            contentClassName={
              w.id === "doc" || w.id === "about" || w.id === "contact"
                || w.id === "wordle" || w.id === "chat"
                ? "p-0"
                : undefined
            }
          >
            {w.id === "terminal" ? (
              <Terminal
                onClose={() => closeWindow(w.id)}
                onOpenCase={() => openWindow("doc")}
              />
            ) : w.id === "works" ? (
              <ProjectsApp
                onOpenPdf={(origin) => {
                  docLauncherRef.current = document.activeElement instanceof HTMLButtonElement
                    ? document.activeElement
                    : null;
                  openWindow("doc", origin);
                }}
              />
            ) : w.id === "doc" ? (
              <PdfViewer src={DOC_PATH} />
            ) : w.id === "about" ? (
              <AboutWindow />
            ) : w.id === "notes" ? (
              <NotesApp />
            ) : w.id === "contact" ? (
              <ContactForm />
            ) : w.id === "wordle" ? (
              <WordleGame />
            ) : w.id === "background" ? (
              <BackgroundPicker selectedIndex={backgroundIndex} onSelect={selectBackground} />
            ) : w.id === "chat" ? (
              <ChatApp prompt={chatPrompt} />
            ) : null}
          </WindowPanel>
        ))}

        {windows.some(
          (w) =>
            w.transitionPhase === "preparing-minimize" ||
            w.transitionPhase === "minimizing"
        ) && (
          <div
            aria-hidden="true"
            className="invisible fixed bottom-3 left-1/2 z-[-1] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center border border-line bg-background p-1 pointer-events-none"
          >
            {windows
              .filter(
                (w) =>
                  w.minimized ||
                  w.transitionPhase === "preparing-minimize" ||
                  w.transitionPhase === "minimizing"
              )
              .map((w) => (
                <span
                  key={w.id}
                  data-minimize-transition-target={w.id}
                  className="border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.08em]"
                >
                  {WINDOW_TITLES[w.id]}
                </span>
              ))}
          </div>
        )}

        {windows.some((w) => w.minimized) && (
          <MinimizedDock
            items={windows
              .filter((w) => w.minimized)
              .map((w) => ({ id: w.id, title: WINDOW_TITLES[w.id] }))}
            onRestore={(id, element) =>
              restoreWindow(
                id as WindowId,
                toViewportRect(element.getBoundingClientRect())
              )
            }
          />
        )}

        {showGuide && (
          <aside className="fixed bottom-4 left-4 z-[15000] w-[min(310px,calc(100vw-2rem))] border border-line bg-background p-4 text-foreground shadow-2xl" aria-label="Getting started">
            <button type="button" onClick={dismissGuide} aria-label="Dismiss guide" className="absolute right-2 top-2 text-dim hover:text-accent">×</button>
            <p className="text-[9px] uppercase tracking-[0.16em] text-accent">New here?</p>
            <p className="mt-2 text-xs leading-5 text-dim">Start with selected projects, then explore About or open the AI assistant.</p>
            <button
              type="button"
              onClick={() => {
                dismissGuide();
                openWindow("works");
              }}
              className="mt-3 border border-accent px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-accent hover:bg-accent hover:text-background"
            >
              Open Works →
            </button>
          </aside>
        )}
        {entryReady && multiplayerLayer}
      </div>

      <ShutdownOverlay
        active={shutdownActive}
        onComplete={() => {
          setDesktopCycle((cycle) => cycle + 1);
          setShutdownActive(false);
        }}
      />

      {!booted && <BootOverlay onComplete={() => setBooted(true)} />}
      {!booted && <GrainOverlay />}
    </div>
  );
}
