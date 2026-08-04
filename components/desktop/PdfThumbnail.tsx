"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist/types/src/display/api";

export default function PdfThumbnail({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);
  const [minDelayDone, setMinDelayDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDelayDone(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () =>
      setSize({
        width: Math.floor(container.clientWidth),
        height: Math.floor(container.clientHeight),
      });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | undefined;

    void import("pdfjs-dist").then(async (pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      loadingTask = pdfjs.getDocument({ url: src });
      const loadedDocument = await loadingTask.promise;
      if (cancelled) {
        await loadingTask.destroy();
        return;
      }
      setDocument(loadedDocument);
    }).catch((error: unknown) => {
      console.error("Unable to load PDF thumbnail", error);
    });

    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [src]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!document || !canvas || size.width <= 0 || size.height <= 0) return;

    let cancelled = false;
    let renderTask: RenderTask | undefined;

    void document
      .getPage(1)
      .then(async (page) => {
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.max(
          size.width / baseViewport.width,
          size.height / baseViewport.height
        );
        const viewport = page.getViewport({ scale });
        const pixelRatio = window.devicePixelRatio || 1;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        await renderTask.promise;
        if (!cancelled) setReady(true);
      })
      .catch((error: unknown) => {
        if (!cancelled && error instanceof Error && error.name !== "RenderingCancelledException") {
          console.error("Unable to render PDF thumbnail", error);
        }
      });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, size.width, size.height]);

  return (
    <div ref={containerRef} className="relative aspect-video w-full overflow-hidden border border-line bg-white">
      {!(ready && minDelayDone) && (
        <div className="loading-pattern absolute inset-0 flex items-center justify-center">
          <span className="border border-line bg-background px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-foreground">
            loading<span className="cursor-blink">_</span>
          </span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
}
