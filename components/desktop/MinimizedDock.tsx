"use client";

import { useLayoutEffect, useRef } from "react";

export type MinimizedDockItem = {
  id: string;
  title: string;
};

export default function MinimizedDock({
  items,
  onRestore,
}: {
  items: MinimizedDockItem[];
  onRestore: (id: string, element: HTMLButtonElement) => void;
}) {
  const dockRef = useRef<HTMLDivElement>(null);
  const previousDockRectRef = useRef<DOMRect | null>(null);
  const previousItemRectsRef = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduceMotion ? 1 : 280;
    const easing = "cubic-bezier(0.16, 1, 0.3, 1)";
    const currentDockRect = dock.getBoundingClientRect();
    const previousDockRect = previousDockRectRef.current;
    const currentItemRects = new Map<string, DOMRect>();
    const animations: Animation[] = [];

    dock.querySelectorAll<HTMLButtonElement>("[data-minimize-target]").forEach((button) => {
      const id = button.dataset.minimizeTarget;
      if (!id) return;

      const currentRect = button.getBoundingClientRect();
      const previousRect = previousItemRectsRef.current.get(id);
      currentItemRects.set(id, currentRect);

      if (previousRect) {
        const translateX = previousRect.left - currentRect.left;
        if (Math.abs(translateX) > 0.5) {
          animations.push(
            button.animate(
              [
                { transform: `translate3d(${translateX}px, 0, 0)` },
                { transform: "translate3d(0, 0, 0)" },
              ],
              { duration, easing }
            )
          );
        }
      } else {
        animations.push(
          button.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: reduceMotion ? 1 : 180,
            easing: "ease-out",
          })
        );
      }
    });

    if (previousDockRect && currentDockRect.width > previousDockRect.width) {
      const inset = (currentDockRect.width - previousDockRect.width) / 2;
      animations.push(
        dock.animate(
          [
            { clipPath: `inset(0 ${inset}px 0 ${inset}px)` },
            { clipPath: "inset(0 0 0 0)" },
          ],
          { duration, easing }
        )
      );
    }

    previousDockRectRef.current = currentDockRect;
    previousItemRectsRef.current = currentItemRects;
    return () => animations.forEach((animation) => animation.cancel());
  }, [items.length]);

  return (
    <div
      ref={dockRef}
      className="fixed bottom-3 left-1/2 z-[9999] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center border border-line bg-background p-1"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          data-minimize-target={item.id}
          onClick={(event) => onRestore(item.id, event.currentTarget)}
          className="border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] text-foreground hover:border-accent hover:bg-accent hover:text-background active:bg-accent-dim transition-colors"
        >
          {item.title}
        </button>
      ))}
    </div>
  );
}