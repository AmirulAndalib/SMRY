"use client";

import React from "react";
import { X } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { HighlightPopover, HIGHLIGHT_COLORS } from "@/components/features/highlight-popover";
import type { Highlight } from "@/lib/hooks/use-highlights";
import {
  CopyAction,
  NoteAction,
  ShareAction,
  AssistantAction,
  DeleteAction,
} from "@/components/features/highlight-actions";

interface HighlightActionPopoverProps {
  highlight: Highlight;
  anchorRect: DOMRect;
  onChangeColor: (id: string, color: Highlight["color"]) => void;
  onAddNote: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  articleUrl?: string;
  onAskAI?: (text: string) => void;
}

export function HighlightActionPopover({
  highlight,
  anchorRect,
  onChangeColor,
  onAddNote,
  onDelete,
  onClose,
  articleUrl,
  onAskAI,
}: HighlightActionPopoverProps) {
  return (
    <HighlightPopover anchorRect={anchorRect} onClose={onClose} deferOutsideClick>
      <div className="bg-popover border border-border rounded-2xl shadow-2xl w-56 overflow-hidden">
        {/* Color picker row */}
        <div className="flex items-center justify-center gap-2.5 px-4 pt-3.5 pb-2.5">
          {HIGHLIGHT_COLORS.map((color) => {
            const isActive = highlight.color === color.name;
            return (
              <button
                key={color.name}
                onClick={() => onChangeColor(highlight.id, color.name as Highlight["color"])}
                className={cn(
                  "size-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95",
                  color.solid,
                  isActive && "ring-2 ring-foreground/40"
                )}
                title={color.name}
              >
                {isActive && (
                  <X className="size-4 text-black/60" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>

        <div className="mx-3 border-t border-border/50" />

        <div className="py-1.5">
          <CopyAction text={highlight.text} articleUrl={articleUrl} />

          <NoteAction
            onClick={() => {
              onAddNote(highlight.id);
              // Don't call onClose() — it would set activeHighlightId to null,
              // overriding the setActiveHighlightId(id) from onAddNote (React batches both).
            }}
          />

          <ShareAction text={highlight.text} articleUrl={articleUrl} onDone={onClose} />
          <AssistantAction text={highlight.text} onAskAI={onAskAI} onDone={onClose} />

          <DeleteAction onClick={() => { onDelete(highlight.id); onClose(); }} />
        </div>
      </div>
    </HighlightPopover>
  );
}
