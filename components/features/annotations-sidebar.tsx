"use client";

import React, { useCallback, useState } from "react";
import { useResizeHandle } from "@/lib/hooks/use-resize-handle";
import { Highlighter, X } from "@/components/ui/icons";
import { AnnotationsPanel } from "@/components/features/annotations-panel";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";

/**
 * Annotations sidebar using the unified Sidebar component.
 * Desktop: fixed sidebar sliding from the right as overlay.
 * Mobile: Sheet drawer from the right (handled automatically by Sidebar).
 */
export function AnnotationsSidebar({
  open,
  onOpenChange,
  openMobile,
  onOpenMobileChange,
  articleUrl,
  articleTitle,
  noteEditId,
  sidebarOffsetStyle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openMobile?: boolean;
  onOpenMobileChange?: (open: boolean) => void;
  articleUrl?: string;
  articleTitle?: string;
  noteEditId?: string | null;
  sidebarOffsetStyle?: React.CSSProperties;
}) {
  const [width, setWidth] = useState(320);
  const { onPointerDown } = useResizeHandle({
    width,
    onWidthChange: setWidth,
    minWidth: 280,
    maxWidth: 600,
    side: "right",
  });

  const handleClose = useCallback(() => {
    onOpenChange(false);
    onOpenMobileChange?.(false);
  }, [onOpenChange, onOpenMobileChange]);

  return (
    <SidebarProvider
      open={open}
      onOpenChange={onOpenChange}
      openMobile={openMobile}
      onOpenMobileChange={onOpenMobileChange}
      className="!min-h-0 !w-auto absolute inset-0 z-30 pointer-events-none"
      style={{ "--sidebar-width": `${width}px` } as React.CSSProperties}
    >
      <Sidebar
        side="right"
        collapsible="offcanvas"
        className="pointer-events-auto border-l-0!"
        style={sidebarOffsetStyle}
      >
        {/* Resize handle — wide hit area, thin visible line */}
        <div
          className="absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize z-20 group touch-none"
          onPointerDown={onPointerDown}
        >
          <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border transition-colors group-hover:bg-border group-active:bg-border" />
        </div>

        <SidebarHeader className="flex-row items-center justify-between px-3 py-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Highlighter className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Annotations</span>
          </div>
          <button
            onClick={handleClose}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close annotations"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </SidebarHeader>

        <SidebarContent>
          <AnnotationsPanel
            articleUrl={articleUrl}
            articleTitle={articleTitle}
            noteEditId={noteEditId}
          />
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
