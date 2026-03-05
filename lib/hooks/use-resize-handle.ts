import { useRef, useCallback } from "react";

interface UseResizeHandleOptions {
  /** Current width */
  width: number;
  /** Callback to set the width */
  onWidthChange: (width: number) => void;
  /** Minimum width in px */
  minWidth: number;
  /** Maximum width in px */
  maxWidth: number;
  /** Which side the panel is on — determines drag direction */
  side: "left" | "right";
}

/**
 * Smooth resize handle hook.
 * - Uses RAF to throttle updates (no per-pixel re-renders)
 * - Updates CSS variable directly on the element during drag for zero-lag visual feedback
 * - Only commits final width to React state on mouseup
 */
export function useResizeHandle({
  width,
  onWidthChange,
  minWidth,
  maxWidth,
  side,
}: UseResizeHandleOptions) {
  const rafRef = useRef<number>(0);
  const isDragging = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);

      const startX = e.clientX;
      const startWidth = width;
      isDragging.current = true;

      // Find the sidebar provider element to update CSS variable directly
      const sidebarProvider =
        target.closest("[style*='--sidebar-width']") as HTMLElement | null;

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      let latestWidth = startWidth;

      const onPointerMove = (ev: PointerEvent) => {
        if (!isDragging.current) return;

        const delta =
          side === "right" ? startX - ev.clientX : ev.clientX - startX;
        latestWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta));

        // Update CSS variable directly — no React re-render, instant visual feedback
        if (sidebarProvider) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
            sidebarProvider.style.setProperty(
              "--sidebar-width",
              `${latestWidth}px`
            );
          });
        }
      };

      const onPointerUp = () => {
        isDragging.current = false;
        cancelAnimationFrame(rafRef.current);

        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        target.releasePointerCapture(e.pointerId);
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);

        // Commit final width to React state (single re-render)
        onWidthChange(latestWidth);
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [width, onWidthChange, minWidth, maxWidth, side]
  );

  return { onPointerDown };
}
