"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist/types/src/display/api";

function PdfPage({
  document,
  pageNumber,
  width,
}: {
  document: PDFDocumentProxy;
  pageNumber: number;
  width: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0) return;

    let cancelled = false;
    let renderTask: RenderTask | undefined;

    void document.getPage(pageNumber).then((page) => {
      if (cancelled) return;

      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: width / baseViewport.width });
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
      return renderTask.promise;
    }).catch((error: unknown) => {
      if (!cancelled && error instanceof Error && error.name !== "RenderingCancelledException") {
        console.error("Unable to render PDF page", error);
      }
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber, width]);

  return <canvas ref={canvasRef} className="block max-w-full bg-white" />;
}

export default function PdfViewer({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => setWidth(Math.floor(container.clientWidth));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loadedDocument: PDFDocumentProxy | undefined;
    let loadingTask: PDFDocumentLoadingTask | undefined;

    void import("pdfjs-dist").then(async (pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      loadingTask = pdfjs.getDocument({ url: src });
      loadedDocument = await loadingTask.promise;
      if (cancelled) {
        await loadingTask.destroy();
        return;
      }
      setDocument(loadedDocument);
    }).catch((loadError: unknown) => {
      if (!cancelled) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load PDF");
      }
    });

    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [src]);

  return (
    <div ref={containerRef} className="w-full min-h-full bg-neutral-700">
      {error ? (
        <div className="p-4 text-red-300">{error}</div>
      ) : document && width > 0 ? (
        Array.from({ length: document.numPages }, (_, index) => (
          <PdfPage
            key={index + 1}
            document={document}
            pageNumber={index + 1}
            width={width}
          />
        ))
      ) : (
        <div className="p-4 text-foreground/70">Loading PDF...</div>
      )}
    </div>
  );
}