"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useIsMobile } from "@/lib/useIsMobile";
import {
  calculateRectTransform,
  rectTransformToCss,
  toViewportRect,
  type ViewportRect,
} from "@/lib/windowTransition";

type Position = { x: number; y: number };
const MENU_BAR_HEIGHT = 36;

function clampToViewport(position: Position, width: number, height: number): Position {
  return {
    x: Math.min(Math.max(position.x, 0), Math.max(0, window.innerWidth - width)),
    y: Math.min(
      Math.max(position.y, MENU_BAR_HEIGHT),
      Math.max(MENU_BAR_HEIGHT, window.innerHeight - height)
    ),
  };
}

export type WindowTransitionPhase =
  | "opening"
  | "open"
  | "preparing-minimize"
  | "minimizing"
  | "closing";

export default function WindowPanel({
  title,
  position,
  zIndex,
  origin,
  transitionPhase,
  transitionTarget,
  maximized,
  onClose,
  onFocus,
  onMove,
  onToggleMaximize,
  onMinimize,
  onTransitionComplete,
  windowClassName = "w-[40vw] h-[calc(22.5vw+37px)] max-w-[calc(100vw-2rem)]",
  contentClassName = "p-4",
  children,
}: {
  title: string;
  position: Position;
  zIndex: number;
  origin?: ViewportRect;
  transitionPhase: WindowTransitionPhase;
  transitionTarget?: ViewportRect;
  maximized: boolean;
  onClose: () => void;
  onFocus: () => void;
  onMove: (position: Position) => void;
  onToggleMaximize: () => void;
  onMinimize: () => void;
  onTransitionComplete: () => void;
  windowClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const transitionCompleteRef = useRef(onTransitionComplete);
  const resizeOriginRef = useRef<ViewportRect | null>(null);
  const dragState = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const isMobile = useIsMobile();
  const fullscreen = isMobile || maximized;
  const transitionLocked =
    transitionPhase === "opening" ||
    transitionPhase === "minimizing" ||
    transitionPhase === "closing";

  useEffect(() => {
    transitionCompleteRef.current = onTransitionComplete;
  }, [onTransitionComplete]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !transitionLocked) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, transitionLocked]);

  useLayoutEffect(() => {
    const element = panelRef.current;
    if (!element || transitionPhase === "open" || transitionPhase === "preparing-minimize") {
      return;
    }

    const windowRect = toViewportRect(element.getBoundingClientRect());
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animation: Animation;

    if (transitionPhase === "opening") {
      const initialTransform = origin?.width && origin.height
        ? rectTransformToCss(calculateRectTransform(windowRect, origin))
        : "translate3d(0, 8px, 0) scale(0.96)";

      animation = element.animate(
        [
          { transform: initialTransform, opacity: 0, filter: "blur(2px)" },
          {
            transform: "translate3d(0, 0, 0) scale(1)",
            opacity: 1,
            filter: "blur(0)",
          },
        ],
        {
          duration: reduceMotion ? 1 : 300,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        }
      );
    } else {
      if (!transitionTarget?.width || !transitionTarget.height) return;
      const finalTransform = rectTransformToCss(
        calculateRectTransform(windowRect, transitionTarget)
      );

      animation = element.animate(
        [
          {
            transform: "translate3d(0, 0, 0) scale(1)",
            opacity: 1,
            filter: "blur(0)",
          },
          { transform: finalTransform, opacity: 0, filter: "blur(2px)" },
        ],
        {
          duration: reduceMotion ? 1 : 300,
          easing: "cubic-bezier(0.7, 0, 0.84, 0)",
          fill: "both",
        }
      );
    }

    let cancelled = false;
    void animation.finished
      .then(() => {
        if (!cancelled) transitionCompleteRef.current();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      animation.cancel();
    };
  }, [
    fullscreen,
    origin,
    transitionPhase,
    transitionTarget,
  ]);

  useLayoutEffect(() => {
    const element = panelRef.current;
    const resizeOrigin = resizeOriginRef.current;
    if (!element || !resizeOrigin) return;
    resizeOriginRef.current = null;

    const currentRect = toViewportRect(element.getBoundingClientRect());
    const initialTransform = rectTransformToCss(
      calculateRectTransform(currentRect, resizeOrigin)
    );
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animation = element.animate(
      [
        { transform: initialTransform },
        { transform: "translate3d(0, 0, 0) scale(1)" },
      ],
      {
        duration: reduceMotion ? 1 : 300,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      }
    );

    return () => animation.cancel();
  }, [fullscreen]);

  useLayoutEffect(() => {
    const element = panelRef.current;
    if (!element || fullscreen) return;

    const clampCurrentPosition = () => {
      const nextPosition = clampToViewport(
        position,
        element.offsetWidth,
        element.offsetHeight
      );
      if (nextPosition.x !== position.x || nextPosition.y !== position.y) {
        onMove(nextPosition);
      }
    };

    clampCurrentPosition();
    window.addEventListener('resize', clampCurrentPosition);
    return () => window.removeEventListener('resize', clampCurrentPosition);
  }, [fullscreen, onMove, position]);

  useEffect(() => {
    if (!dragging) return;

    function onPointerMove(e: globalThis.PointerEvent) {
      const state = dragState.current;
      const element = panelRef.current;
      if (!state || !element) return;
      const nextX = state.originX + (e.clientX - state.startX);
      const nextY = state.originY + (e.clientY - state.startY);
      onMove(
        clampToViewport(
          { x: nextX, y: nextY },
          element.offsetWidth,
          element.offsetHeight
        )
      );
    }
    function onPointerUp() {
      setDragging(false);
      dragState.current = null;
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragging, onMove]);

  function startDrag(e: PointerEvent) {
    if (fullscreen || transitionLocked) return;
    onFocus();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };
    setDragging(true);
  }

  function toggleMaximizeAnimated() {
    const element = panelRef.current;
    if (!element || transitionLocked) return;
    resizeOriginRef.current = toViewportRect(element.getBoundingClientRect());
    onToggleMaximize();
  }

  return (
    <div
      ref={panelRef}
      className={`fixed max-h-[calc(100vh-3rem)] border border-line bg-background flex flex-col ${
        transitionLocked ? "pointer-events-none" : ""
      } ${fullscreen ? "inset-x-3 top-12 bottom-3" : windowClassName}`}
      style={fullscreen ? { zIndex } : { left: position.x, top: position.y, zIndex }}
      onPointerDown={transitionLocked ? undefined : onFocus}
    >
      <div
        className="flex items-center justify-between border-b border-line px-3 py-2 select-none"
        onPointerDown={startDrag}
        onDoubleClick={toggleMaximizeAnimated}
      >
        <span className="text-xs tracking-[0.1em] uppercase text-foreground/90">
          {title}
        </span>
        <div className="flex items-center gap-1" onDoubleClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize window"
            className="w-5 h-5 flex items-center justify-center border border-line text-xs leading-none text-dim hover:text-accent hover:border-accent transition-colors"
          >
            <span className="translate-y-[2px]">-</span>
          </button>
          <button
            type="button"
            onClick={toggleMaximizeAnimated}
            aria-label={maximized ? "Restore window" : "Maximize window"}
            className="w-5 h-5 flex items-center justify-center border border-line text-xs leading-none text-dim hover:text-accent hover:border-accent transition-colors"
          >
            {maximized ? "[]" : "□"}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close window"
            className="w-5 h-5 flex items-center justify-center border border-line text-xs leading-none text-dim hover:text-accent hover:border-accent transition-colors"
          >
            x
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className={`retro-scrollbar h-full overflow-y-auto text-xs text-foreground/80 leading-relaxed ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
