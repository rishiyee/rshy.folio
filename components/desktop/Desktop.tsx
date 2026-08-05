"use client";

import { useEffect, useRef, useState } from "react";
import TopBar from "./TopBar";
import DesktopIcon, { type IconOrigin } from "./DesktopIcon";
import WindowPanel, { type WindowTransitionPhase } from "./WindowPanel";
import ShutdownOverlay from "./ShutdownOverlay";
import BootOverlay from "./BootOverlay";
import ChatWidget, { type ChatWidgetHandle } from "./ChatWidget";
import Terminal from "./Terminal";
import NotesApp from "./NotesApp";
import ContactForm from "./ContactForm";
import AboutWindow from "./AboutWindow";
import PdfViewer from "./PdfViewer";
import PdfThumbnail from "./PdfThumbnail";
import MinimizedDock from "./MinimizedDock";
import {
  pointTarget,
  toViewportRect,
  type ViewportRect,
} from "@/lib/windowTransition";

const BACKGROUND_COLORS = [
  "rgb(227, 200, 40)", // yellow
  "rgb(139, 0, 0)", // dark red
  "rgb(0, 0, 0)", // black
  "rgb(251, 0, 236)", // FB00EC
  "rgb(255, 242, 0)", // FFF200
];

const BACKGROUND_STORAGE_KEY = "portfolio-os-background-index";

const DOC_PATH = "/case1.pdf";
const PROJECT_NAME = "Case Study"; // TODO: swap in the real project name

const WINDOW_TITLES = {
  works: "/works",
  terminal: "~/terminal",
  about: "about.txt",
  doc: "case1.pdf",
  notes: "notes.txt",
  contact: "contact.txt",
};

type WindowId = "works" | "terminal" | "about" | "doc" | "notes" | "contact";
type IconId = "works" | "terminal" | "notes" | "contact" | "about";
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
};

export default function Desktop() {
  const [booted, setBooted] = useState(false);
  const [shutdownActive, setShutdownActive] = useState(false);
  const [desktopCycle, setDesktopCycle] = useState(0);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [iconPositions, setIconPositions] = useState(DEFAULT_ICON_POSITIONS);
  const iconLabelTone = backgroundIndex === 1 || backgroundIndex === 2 ? "light" : "dark";
  const topZ = useRef(50);
  const chatRef = useRef<ChatWidgetHandle>(null);
  const iconElements = useRef<Partial<Record<IconId, HTMLButtonElement>>>({});
  const docLauncherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(BACKGROUND_STORAGE_KEY));
    if (Number.isInteger(stored) && stored >= 0 && stored < BACKGROUND_COLORS.length) {
      const frame = requestAnimationFrame(() => setBackgroundIndex(stored));
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  function changeBackground() {
    setBackgroundIndex((i) => {
      const next = (i + 1) % BACKGROUND_COLORS.length;
      window.localStorage.setItem(BACKGROUND_STORAGE_KEY, String(next));
      return next;
    });
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
    chatRef.current?.openWithMessage(
      "Found a bug? Describe it below and we'll take a look."
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: BACKGROUND_COLORS[backgroundIndex] }}
    >
      <div
        key={`${booted}-${desktopCycle}`}
        className={`fixed inset-0 ${booted ? "crt-on" : "opacity-0"}`}
      >
        <TopBar
          onOpenWindow={openWindow}
          onOpenAbout={() => openWindow("about")}
          onReportBug={reportBug}
          onShutdown={() => setShutdownActive(true)}
          onChangeBackground={changeBackground}
        />

        <DesktopIcon
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
                  : undefined
            }
            contentClassName={
              w.id === "doc" || w.id === "about" || w.id === "contact"
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button
                  ref={docLauncherRef}
                  type="button"
                  onClick={(event) =>
                    openWindow(
                      "doc",
                      toViewportRect(event.currentTarget.getBoundingClientRect())
                    )
                  }
                  className="flex flex-col items-stretch gap-1 border border-line p-1 text-left hover:border-accent hover:text-accent transition-colors"
                >
                  <PdfThumbnail src={DOC_PATH} />
                  <span className="px-1 pb-1">{PROJECT_NAME}</span>
                </button>
              </div>
            ) : w.id === "doc" ? (
              <PdfViewer src={DOC_PATH} />
            ) : w.id === "about" ? (
              <AboutWindow />
            ) : w.id === "notes" ? (
              <NotesApp />
            ) : w.id === "contact" ? (
              <ContactForm />
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
        <ChatWidget ref={chatRef} />
      </div>

      <ShutdownOverlay
        active={shutdownActive}
        onComplete={() => {
          setDesktopCycle((cycle) => cycle + 1);
          setShutdownActive(false);
        }}
      />

      {!booted && <BootOverlay onComplete={() => setBooted(true)} />}
    </div>
  );
}
