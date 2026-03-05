"use client";

import React, { useState } from "react";
import {
  Share2 as ShareIcon,
  Link2,
  Check,
  X,
  Copy,
  ShareIos,
  ArrowLeft,
  ChevronRight,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { generateShareUrls } from "@/lib/share-urls";
import { Button } from "@/components/ui/button";
import { ResponsiveDrawer } from "@/components/features/responsive-drawer";
import { ExportArticleContent, type ArticleExportData } from "@/components/features/export-article";

import { Source } from "@/types/api";
import { useAnalytics } from "@/lib/hooks/use-analytics";

// --- Social SVG Icons ---

const RedditIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

const XTwitterIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

/** Extract a clean display URL from the full smry URL */
function getDisplayUrl(smryUrl: string): string {
  try {
    const afterSmry = smryUrl.replace(/^https?:\/\/smry\.ai\//, "");
    if (!afterSmry) return "smry.ai";
    const innerUrl = new URL(
      afterSmry.startsWith("http") ? afterSmry : `https://${afterSmry}`
    );
    const domain = innerUrl.hostname.replace(/^www\./, "");
    return `smry.ai/${domain}`;
  } catch {
    return "smry.ai";
  }
}

interface ShareButtonDataProps {
  url: string;
  originalUrl?: string;
  articleTitle?: string;
  source?: Source;
  viewMode?: string;
  sidebarOpen?: boolean;
  articleExportData?: ArticleExportData;
}

interface ShareButtonProps extends ShareButtonDataProps {
  triggerVariant?: "text" | "icon";
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Check for native share support once at module level
const hasNativeShareSupport =
  typeof navigator !== "undefined" && "share" in navigator;

// --- Social circle button ---
function SocialButton({
  href,
  onClick,
  icon,
  label,
  bgClass,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  bgClass: string;
}) {
  const inner = (
    <>
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95",
          bgClass
        )}
      >
        {icon}
      </span>
      <span className="mt-1.5 text-[11px] text-muted-foreground">{label}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className="flex flex-col items-center"
      >
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center">
      {inner}
    </button>
  );
}

// Memoized modal content
const ShareModalContent = React.memo(function ShareModalContent({
  articleTitle,
  url,
  originalUrl,
  source: _source,
  articleExportData,
  onClose,
}: ShareButtonDataProps & { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"share" | "export">("share");
  const { track } = useAnalytics();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track("article_shared", { method: "copy_link" });
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url });
        track("article_shared", { method: "native" });
        onClose();
      } catch (error) {
        console.log("Share cancelled:", error);
      }
    }
  };

  const shareUrls = generateShareUrls(originalUrl || "", articleTitle);
  const displayUrl = getDisplayUrl(url);

  // Export view
  if (view === "export" && articleExportData) {
    return (
      <div className="flex flex-col">
        {/* Header with back button */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView("share")}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors -ml-1"
              aria-label="Back to share"
            >
              <ArrowLeft className="size-4" />
            </button>
            <h2 className="text-base font-semibold text-foreground">Export Article</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors -mr-1"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Export content */}
        <div className="px-4 pb-6">
          <ExportArticleContent data={articleExportData} />
        </div>
      </div>
    );
  }

  // Share view (default)
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-1">
        <h2 className="text-base font-semibold text-foreground">Share</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors -mr-1"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 pb-5 pt-3">
        {/* Article Preview */}
        {articleTitle && (
          <p className="text-[15px] font-medium text-foreground leading-snug line-clamp-2 mb-4">
            {articleTitle}
          </p>
        )}

        {/* Copy Link Row */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2 min-w-0">
            <Link2 className="size-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground/70 truncate select-all">
              {displayUrl}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className={cn(
              "shrink-0 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              copied
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {copied ? (
              <>
                <Check className="size-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy link
              </>
            )}
          </button>
        </div>

        {/* Social Icons Row */}
        <div className="flex items-start justify-center gap-5 mb-6">
          <SocialButton
            href={shareUrls.x}
            onClick={() => track("article_shared", { method: "x_twitter" })}
            icon={<XTwitterIcon className="size-[18px] text-white dark:text-black" />}
            label="X"
            bgClass="bg-black dark:bg-white"
          />
          <SocialButton
            href={shareUrls.linkedin}
            onClick={() => track("article_shared", { method: "linkedin" })}
            icon={<LinkedInIcon className="size-[18px] text-white" />}
            label="LinkedIn"
            bgClass="bg-[#0A66C2]"
          />
          <SocialButton
            href={shareUrls.reddit}
            onClick={() => track("article_shared", { method: "reddit" })}
            icon={<RedditIcon className="size-[18px] text-white" />}
            label="Reddit"
            bgClass="bg-[#FF4500]"
          />
          {hasNativeShareSupport && (
            <SocialButton
              onClick={handleNativeShare}
              icon={<ShareIcon className="size-[18px] text-foreground" />}
              label="More"
              bgClass="bg-muted"
            />
          )}
        </div>

        {/* Export Article */}
        {articleExportData && (
          <button
            onClick={() => setView("export")}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors group text-left"
          >
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShareIos className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Export article</p>
              <p className="text-xs text-muted-foreground">Notion, Obsidian, Markdown &amp; more</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
});

// Memoized trigger component
const ShareTrigger = React.memo(
  React.forwardRef<
    HTMLButtonElement,
    {
      variant: "text" | "icon";
      className?: string;
    } & React.ButtonHTMLAttributes<HTMLButtonElement>
  >(function ShareTrigger({ variant, className, ...props }, ref) {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size={variant === "icon" ? "icon" : "sm"}
        className={cn(
          variant === "icon"
            ? "h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent"
            : "h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground",
          className,
        )}
        aria-label="Share article"
        {...props}
      >
        <ShareIcon
          className={cn(variant === "icon" ? "size-5" : "mr-1.5 size-3.5")}
        />
        {variant === "icon" ? <span className="sr-only">Share</span> : "Share"}
      </Button>
    );
  }),
);

const ShareButton: React.FC<ShareButtonProps> = React.memo(
  function ShareButton({
    triggerVariant = "text",
    triggerClassName,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    ...shareProps
  }) {
    const [internalOpen, setInternalOpen] = useState(false);

    // Support both controlled and uncontrolled modes
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

    const handleClose = React.useCallback(() => {
      setOpen(false);
    }, [setOpen]);

    const trigger = React.useMemo(
      () => (
        <ShareTrigger variant={triggerVariant} className={triggerClassName} />
      ),
      [triggerVariant, triggerClassName],
    );

    return (
      <ResponsiveDrawer
        open={open}
        onOpenChange={setOpen}
        trigger={trigger}
        triggerId="share-modal-trigger"
        showCloseButton={false}
      >
        <ShareModalContent {...shareProps} onClose={handleClose} />
      </ResponsiveDrawer>
    );
  },
);

export default ShareButton;

// Export ShareContent for use elsewhere if needed
export const ShareContent = ShareModalContent;
