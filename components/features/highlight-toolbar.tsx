"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { HighlightPopover, HIGHLIGHT_COLORS } from "@/components/features/highlight-popover";
import type { Highlight } from "@/lib/hooks/use-highlights";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import {
  CopyAction,
  NoteAction,
  ShareAction,
  AssistantAction,
} from "@/components/features/highlight-actions";

// Re-export for consumers that import from here
export { HIGHLIGHT_COLORS };

interface HighlightToolbarProps {
  onHighlight: (highlight: Omit<Highlight, "id" | "createdAt">) => void;
  containerRef: React.RefObject<HTMLElement | null>;
  onAskAI?: (text: string) => void;
  /** Original article URL for share snippet + copy attribution */
  articleUrl?: string;
}

export function HighlightToolbar({ onHighlight, containerRef, onAskAI, articleUrl }: HighlightToolbarProps) {
  const [selection, setSelection] = useState<{
    text: string;
    range: Range;
    rect: DOMRect;
  } | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");
  const [selectedColor, setSelectedColor] = useState<Highlight["color"]>("yellow");
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const lastSelectedTextRef = useRef("");
  const { track } = useAnalytics();
  const selectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced selection change handler.
  // Clearing uses a longer debounce (300ms) so the toolbar survives mobile tap
  // interactions: touchstart clears the browser selection → selectionchange fires →
  // but click fires within ~100ms and needs the toolbar to still be mounted.
  const handleSelectionChange = useCallback(() => {
    if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);

    const currentSel = window.getSelection();
    const isClearing = !currentSel || currentSel.isCollapsed || !currentSel.rangeCount;

    selectionTimerRef.current = setTimeout(() => {
      selectionTimerRef.current = null;
      const sel = window.getSelection();

      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        if (!showNoteInput) {
          setSelection(null);
          lastSelectedTextRef.current = "";
        }
        return;
      }

      const text = sel.toString().trim();
      if (text === lastSelectedTextRef.current) return;
      lastSelectedTextRef.current = text;

      const range = sel.getRangeAt(0);
      if (!containerRef.current?.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }

      if (text.length < 3) {
        setSelection(null);
        return;
      }

      // For large multi-paragraph selections, anchor the toolbar at the
      // focus point (cursor end) so it appears near the user's cursor/finger
      // instead of off-screen above the selection start.
      let rect = range.getBoundingClientRect();
      if (rect.height > 100 && sel.focusNode) {
        try {
          const caretRange = document.createRange();
          caretRange.setStart(sel.focusNode, sel.focusOffset);
          caretRange.collapse(true);
          const caretRect = caretRange.getBoundingClientRect();
          if (caretRect.top > 0 && caretRect.left > 0) {
            rect = caretRect;
          }
        } catch { /* fallback to full range rect */ }
      }

      setSelection({ text, range, rect });
      setShowNoteInput(false);
      setNote("");
    }, isClearing ? 300 : 50);
  }, [containerRef, showNoteInput]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
    };
  }, [handleSelectionChange]);

  useEffect(() => {
    if (showNoteInput && noteInputRef.current) noteInputRef.current.focus();
  }, [showNoteInput]);

  // Highlight with a specific color (instant on color click)
  const highlightWithColor = useCallback(
    (color: Highlight["color"]) => {
      if (!selection) return;

      const range = selection.range;
      const contextBefore = range.startContainer.textContent?.slice(
        Math.max(0, range.startOffset - 30),
        range.startOffset
      );
      const contextAfter = range.endContainer.textContent?.slice(
        range.endOffset,
        range.endOffset + 30
      );

      onHighlight({
        text: selection.text,
        note: note.trim() || undefined,
        color,
        contextBefore,
        contextAfter,
      });
      track("highlight_created", { text_length: selection.text.length, color });

      window.getSelection()?.removeAllRanges();
      setSelection(null);
      setShowNoteInput(false);
      setNote("");
    },
    [selection, note, onHighlight, track]
  );

  const handleAskAI = useCallback(() => {
    if (!selection) return;
    onAskAI?.(selection.text);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, [selection, onAskAI]);

  const handleSaveNote = useCallback(() => {
    highlightWithColor(selectedColor);
  }, [highlightWithColor, selectedColor]);

  const handleClose = useCallback(() => {
    setSelection(null);
    setShowNoteInput(false);
  }, []);

  if (!selection) return null;

  return (
    <HighlightPopover anchorRect={selection.rect} onClose={handleClose}>
      <div className="bg-popover border border-border rounded-2xl shadow-2xl w-56 overflow-hidden">
        {/* Color picker — click to highlight instantly, or select color when note input is open */}
        <div className="flex items-center justify-center gap-2.5 px-4 pt-3.5 pb-2.5">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => {
                const colorName = color.name as Highlight["color"];
                if (showNoteInput) {
                  setSelectedColor(colorName);
                } else {
                  highlightWithColor(colorName);
                }
              }}
              className={cn(
                "size-8 rounded-full transition-transform hover:scale-110 active:scale-95",
                color.solid,
                showNoteInput && selectedColor === color.name && "ring-2 ring-foreground/40 ring-offset-2 ring-offset-popover"
              )}
              title={`Highlight ${color.name}`}
            />
          ))}
        </div>

        <div className="mx-3 border-t border-border/50" />

        {/* Actions — shared components eliminate duplication */}
        <div className="py-1.5">
          <CopyAction text={selection.text} articleUrl={articleUrl} />
          <NoteAction onClick={() => setShowNoteInput(!showNoteInput)} active={showNoteInput} />
          <ShareAction text={selection.text} articleUrl={articleUrl} />
          <AssistantAction text={selection.text} onAskAI={onAskAI} onDone={handleAskAI} />
        </div>
      </div>

      {/* Note input */}
      {showNoteInput && (
        <div className="mt-2 bg-popover border border-border rounded-xl shadow-2xl p-3 w-56">
          <textarea
            ref={noteInputRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write a note..."
            style={{ fontSize: '16px' }}
            className="w-full bg-foreground/5 border border-border rounded-lg px-2.5 py-2 text-popover-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-foreground/20"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSaveNote();
              }
            }}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSaveNote}
              className="text-xs px-3 py-1.5 bg-foreground/15 text-popover-foreground rounded-lg hover:bg-foreground/25 transition-colors font-medium"
            >
              Save & Highlight
            </button>
          </div>
        </div>
      )}
    </HighlightPopover>
  );
}

// Get CSS class for highlight color
export function getHighlightClass(color: Highlight["color"]): string {
  const colors: Record<string, string> = {
    yellow: "bg-yellow-200/70 dark:bg-yellow-500/30",
    green: "bg-green-200/70 dark:bg-green-500/30",
    blue: "bg-blue-200/70 dark:bg-blue-500/30",
    pink: "bg-pink-200/70 dark:bg-pink-500/30",
    orange: "bg-orange-200/70 dark:bg-orange-500/30",
  };
  return colors[color] || colors.yellow;
}
