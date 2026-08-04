"use client";

import { useEffect, useRef, useState } from "react";
import TopBar from "./TopBar";
import DesktopIcon, { type IconOrigin } from "./DesktopIcon";
import WindowPanel, { type WindowTransitionPhase } from "./WindowPanel";
import ShutdownOverlay from "./ShutdownOverlay";
import BootOverlay from "./BootOverlay";
import ChatWidget, { type ChatWidgetHandle } from "./ChatWidget";
import Terminal from "./Terminal";
import PdfViewer from "./PdfViewer";
import MinimizedDock from "./MinimizedDock";
import { COMPANY_NAME } from "@/lib/config";
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

const BACKGROUND_STORAGE_KEY = "vonnue-os-background-index";

const DOC_PATH = "/case1.pdf";

const WINDOW_CONTENT: Record<"about", { title: string; body: string[] }> = {
  about: {
    title: "about.txt",
    body: [
      `${COMPANY_NAME} — design & engineering studio.`,
      "",
      "We build interfaces, brands, and products.",
    ],
  },
};

const WINDOW_TITLES = {
  works: "/works",
  terminal: "~/terminal",
  about: "about.txt",
  doc: "case1.pdf",
};

type WindowId = "works" | "terminal" | "about" | "doc";
type IconId = "works" | "terminal";
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
      setBackgroundIndex(stored);
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
      const windowWidth =
        id === "doc" ? viewportWidth * 0.8 : Math.min(420, viewportWidth - 32);
      const windowHeight =
        id === "doc" ? windowWidth * (9 / 16) + 37 : Math.min(260, viewportHeight - 64);
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
        Math.max((viewportWidth - windowWidth) / 2 + offset.x, 16),
        Math.max(16, viewportWidth - windowWidth - 16)
      );
      const y = Math.min(
        Math.max((viewportHeight - windowHeight) / 2 + offset.y, 48),
        Math.max(48, viewportHeight - windowHeight - 16)
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
      openWindow.id === "works" || openWindow.id === "terminal"
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
            contentClassName={w.id === "doc" ? "p-0" : undefined}
          >
            {w.id === "terminal" ? (
              <Terminal
                onClose={() => closeWindow(w.id)}
                onOpenCase={() => openWindow("doc")}
              />
            ) : w.id === "works" ? (
              <>
                <button
                  ref={docLauncherRef}
                  type="button"
                  onClick={(event) =>
                    openWindow(
                      "doc",
                      toViewportRect(event.currentTarget.getBoundingClientRect())
                    )
                  }
                  className="block w-full text-left hover:text-accent transition-colors"
                >
                  case1.pdf   ................  view
                </button>
                <div>case-02   ................  in progress</div>
                <div>case-03   ................  in progress</div>
                <div className="h-3" />
                <div>3 items - updated regularly</div>
              </>
            ) : w.id === "doc" ? (
              <PdfViewer src={DOC_PATH} />
            ) : (
              WINDOW_CONTENT[w.id].body.map((line, idx) => (
                <div key={idx} className={line === "" ? "h-3" : undefined}>
                  {line}
                </div>
              ))
            )}
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
