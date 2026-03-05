"use client";

import React, { useCallback, useState } from "react";
import {
  Copy,
  StickyNote,
  Share2,
  AiMagic,
  Trash2,
  Check,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { buildSnippetUrl, buildCopyAttribution } from "@/lib/share-urls";
import { useAnalytics } from "@/lib/hooks/use-analytics";

// ─── Shared action button ───────────────────────────────────────────────────

const ACTION_BUTTON_CLASS =
  "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-popover-foreground hover:bg-foreground/10 transition-colors";

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

/** Single row in a highlight popover action list. */
export function ActionButton({ icon, label, onClick, className }: ActionButtonProps) {
  return (
    <button onClick={onClick} className={cn(ACTION_BUTTON_CLASS, className)}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ─── Reusable action hooks ──────────────────────────────────────────────────

/** Copy text with smry attribution appended. Returns { copied, handleCopy }. */
export function useCopyWithAttribution(text: string, articleUrl?: string) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      const attribution = buildCopyAttribution(articleUrl, text);
      await navigator.clipboard.writeText(text + attribution);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }, [text, articleUrl]);

  return { copied, handleCopy };
}

/** Share a snippet URL via native share (mobile) or clipboard. Returns { shared, handleShare }. */
export function useShareSnippet(text: string, articleUrl?: string) {
  const [shared, setShared] = useState(false);
  const { track } = useAnalytics();

  const handleShare = useCallback(async () => {
    if (!articleUrl) return;
    const snippetUrl = buildSnippetUrl(articleUrl, text);
    const preview = text.length > 200 ? text.slice(0, 197) + "..." : text;

    const copyFallback = async () => {
      await navigator.clipboard.writeText(snippetUrl);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
      toast.success("Snippet link copied");
      track("article_shared", { method: "snippet_copy" });
    };

    try {
      if (navigator.share) {
        await navigator.share({ text: `"${preview}"`, url: snippetUrl });
        track("article_shared", { method: "snippet_native" });
      } else {
        await copyFallback();
      }
    } catch {
      try {
        await copyFallback();
      } catch {
        toast.error("Failed to share");
      }
    }
  }, [text, articleUrl, track]);

  return { shared, handleShare };
}

// ─── Composite action rows ─────────────────────────────────────────────────
// Pre-built rows that both HighlightToolbar and HighlightActionPopover use.

export function CopyAction({ text, articleUrl }: { text: string; articleUrl?: string }) {
  const { copied, handleCopy } = useCopyWithAttribution(text, articleUrl);
  return (
    <ActionButton
      icon={
        copied
          ? <Check className="size-5 text-green-400" />
          : <Copy className="size-5 text-muted-foreground" />
      }
      label={copied ? "Copied" : "Copy"}
      onClick={handleCopy}
    />
  );
}

export function NoteAction({ onClick, active }: { onClick: () => void; active?: boolean }) {
  return (
    <ActionButton
      icon={<StickyNote className="size-5 text-muted-foreground" />}
      label="Add a Note"
      onClick={onClick}
      className={active ? "bg-foreground/10" : undefined}
    />
  );
}

export function ShareAction({ text, articleUrl, onDone }: { text: string; articleUrl?: string; onDone?: () => void }) {
  const { shared, handleShare } = useShareSnippet(text, articleUrl);
  if (!articleUrl) return null;
  return (
    <ActionButton
      icon={
        shared
          ? <Check className="size-5 text-green-400" />
          : <Share2 className="size-5 text-muted-foreground" />
      }
      label={shared ? "Link copied" : "Share snippet"}
      onClick={async () => { await handleShare(); onDone?.(); }}
    />
  );
}

export function AssistantAction({ text, onAskAI, onDone }: { text: string; onAskAI?: (t: string) => void; onDone?: () => void }) {
  if (!onAskAI) return null;
  return (
    <ActionButton
      icon={<AiMagic className="size-5 text-muted-foreground" />}
      label="Add to Assistant"
      onClick={() => { onAskAI(text); onDone?.(); }}
    />
  );
}

export function DeleteAction({ onClick }: { onClick: () => void }) {
  return (
    <ActionButton
      icon={<Trash2 className="size-5" />}
      label="Delete"
      onClick={onClick}
      className="text-red-400"
    />
  );
}
