export type ViewportRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function toViewportRect(rect: DOMRect): ViewportRect {
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function calculateRectTransform(from: ViewportRect, to: ViewportRect) {
  return {
    translateX: to.x + to.width / 2 - (from.x + from.width / 2),
    translateY: to.y + to.height / 2 - (from.y + from.height / 2),
    scaleX: Math.max(to.width / from.width, 0.01),
    scaleY: Math.max(to.height / from.height, 0.01),
  };
}

export function rectTransformToCss(
  transform: ReturnType<typeof calculateRectTransform>
) {
  return `translate3d(${transform.translateX}px, ${transform.translateY}px, 0) scale(${transform.scaleX}, ${transform.scaleY})`;
}

export function pointTarget(x: number, y: number, size = 12): ViewportRect {
  return {
    x: x - size / 2,
    y: y - size / 2,
    width: size,
    height: size,
  };
}