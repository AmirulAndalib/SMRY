"use client";

import React, { useRef, useCallback, useState, forwardRef, useImperativeHandle, useMemo } from "react";
import { Drawer as DrawerPrimitive } from "vaul-base";
import { ArticleChat, ArticleChatHandle } from "@/components/features/article-chat";
import { ChevronLeft, Trash, History, Plus, ArrowLeft, Pin, MoreHorizontal, Trash2, Pencil, MessageSquare, Smartphone, Zap, LogIn } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useMobileKeyboard } from "@/lib/hooks/use-mobile-keyboard";
import type { GravityAd as GravityAdType } from "@/lib/hooks/use-gravity-ad";
import type { UIMessage } from "ai";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { buildUrlWithReturn } from "@/lib/hooks/use-return-url";
import { type ChatThread, formatRelativeTime } from "@/lib/hooks/use-chat-threads";
import {
  Popover,
  PopoverTrigger,
  PopoverPopup,
  PopoverClose,
} from "@/components/ui/popover";

interface MobileChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleContent: string;
  articleTitle?: string;
  chatAd?: GravityAdType | null;
  chatAdPlacement?: string;
  onChatAdVisible?: () => void;
  onChatAdClick?: () => void;
  onChatAdDismiss?: () => void;
  inlineChatAd?: GravityAdType | null;
  inlineChatAdPlacement?: string;
  onInlineChatAdVisible?: () => void;
  onInlineChatAdClick?: () => void;
  isPremium?: boolean;
  initialMessages?: UIMessage[];
  onMessagesChange?: (messages: UIMessage[]) => void;
  // Session history
  threads?: ChatThread[];
  activeThreadId?: string | null;
  onSelectThread?: (threadId: string) => void;
  onNewChat?: () => void;
  onDeleteThread?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onRenameThread?: (id: string, title: string) => void;
  groupedThreads?: () => { label: string; threads: ChatThread[] }[];
}

export interface MobileChatDrawerHandle {
  setQuotedText: (text: string | null) => void;
  focusInput: () => void;
  clearMessages: () => void;
  setMessages: (messages: UIMessage[]) => void;
}

type MobileView = "chat" | "history";

/** Mobile empty state for history — same logic as desktop but touch-friendly sizes */
function MobileHistoryEmptyState({ isPremium, onNewChat }: { isPremium: boolean; onNewChat: () => void }) {
  const { isSignedIn } = useAuth();

  if (isPremium) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <div className="flex items-center justify-center size-12 rounded-full bg-primary/5 mb-3">
          <MessageSquare className="size-5 text-primary/60" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">Start your first conversation</p>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-5" style={{ textWrap: "balance" }}>
          Ask questions about the article and your chats will be saved here.
        </p>
        <button
          onClick={onNewChat}
          className="flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors"
          style={{ touchAction: "manipulation" }}
        >
          <Plus className="size-4" />
          New Chat
        </button>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <div className="flex items-center justify-center size-12 rounded-full bg-muted/50 mb-3">
          <History className="size-5 text-muted-foreground/60" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Your conversations disappear
        </h3>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-5" style={{ textWrap: "balance" }}>
          Sign in to keep every chat saved and pick up right where you left off.
        </p>
        <SignInButton
          mode="modal"
          fallbackRedirectUrl={buildUrlWithReturn("/auth/redirect")}
        >
          <button
            className="flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors"
            style={{ touchAction: "manipulation" }}
          >
            <LogIn className="size-3.5" />
            Sign in to save history
          </button>
        </SignInButton>
      </div>
    );
  }

  const features = [
    { icon: Smartphone, text: "Synced across all your devices" },
    { icon: MessageSquare, text: "Pick up any conversation instantly" },
    { icon: Zap, text: "Unlimited AI-powered chats" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="flex items-center justify-center size-12 rounded-full bg-muted/50 mb-3">
        <History className="size-5 text-muted-foreground/60" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">
        Don&apos;t lose your conversations
      </h3>
      <p className="text-[13px] text-muted-foreground leading-relaxed mb-4" style={{ textWrap: "balance" }}>
        Every question you ask is valuable. Upgrade to save and revisit all your chats.
      </p>

      <div className="space-y-2.5 mb-5 text-left">
        {features.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2.5">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Icon className="size-3 text-primary" aria-hidden="true" />
            </div>
            <span className="text-[13px] text-foreground/80">{text}</span>
          </div>
        ))}
      </div>

      <Link
        href="/pricing"
        className="flex items-center justify-center h-10 px-6 rounded-xl text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors"
        style={{ touchAction: "manipulation" }}
      >
        Start free trial
      </Link>
      <p className="text-[11px] text-muted-foreground/50 mt-2">
        7 days free &middot; Cancel anytime
      </p>
    </div>
  );
}

/* ── Swipe hook ── */
const SWIPE_THRESHOLD = 50;
const ANGLE_THRESHOLD = 1.2;

function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!startRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startRef.current.x;
    const dy = t.clientY - startRef.current.y;
    startRef.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) < Math.abs(dy) * ANGLE_THRESHOLD) return;
    if (dx > 0) onSwipeRight();
    else onSwipeLeft();
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchEnd };
}

/* ── Thread item for mobile history ── */
const KNOWN_LABELS = new Set(["Pinned", "This Article", "Today", "Yesterday", "Last 7 Days", "Last 30 Days", "Older"]);

/** Strip markdown formatting to plain text for preview */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // **bold**
    .replace(/\*(.+?)\*/g, "$1")        // *italic*
    .replace(/__(.+?)__/g, "$1")        // __bold__
    .replace(/_(.+?)_/g, "$1")          // _italic_
    .replace(/~~(.+?)~~/g, "$1")        // ~~strikethrough~~
    .replace(/`(.+?)`/g, "$1")          // `code`
    .replace(/^#{1,6}\s+/gm, "")        // # headings
    .replace(/^\s*[-*+]\s+/gm, "")      // - list items
    .replace(/^\s*\d+\.\s+/gm, "")      // 1. ordered list
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [link](url)
    .replace(/\n{2,}/g, " ")            // collapse multiple newlines
    .replace(/\n/g, " ")                // single newlines to spaces
    .replace(/\s{2,}/g, " ")            // collapse whitespace
    .trim();
}

/** Get preview from last assistant message — extracted to avoid recalc in render */
function getThreadPreview(thread: ChatThread): string {
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    const msg = thread.messages[i];
    if (msg.role === "assistant") {
      const text = msg.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
      if (text) return stripMarkdown(text).slice(0, 120);
    }
  }
  return "";
}

const MobileThreadItem = React.memo(function MobileThreadItem({
  thread,
  isActive,
  onSelect,
  onDelete,
  onTogglePin,
  onRename,
}: {
  thread: ChatThread;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onRename: (title: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(thread.title);
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleSubmitRename = () => {
    if (editValue.trim() && editValue !== thread.title) onRename(editValue.trim());
    else setEditValue(thread.title);
    setIsEditing(false);
  };

  const displayTitle = thread.title || thread.articleTitle || "New Chat";
  const messageCount = thread.messages.filter((m) => m.role === "user").length;
  const preview = useMemo(() => getThreadPreview(thread), [thread]);

  return (
    <div className="group relative">
      {isEditing ? (
        <div className="px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSubmitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitRename();
              if (e.key === "Escape") { setEditValue(thread.title); setIsEditing(false); }
            }}
            className="w-full bg-background rounded-lg px-3 py-2 text-base text-foreground border border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
          className={cn(
            "w-full text-left px-4 py-3.5 transition-colors border-b border-border/20 cursor-pointer",
            isActive ? "bg-accent/50" : "active:bg-accent/30"
          )}
          style={{ touchAction: "manipulation" }}
        >
          {/* Title + more menu */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-[15px] font-medium text-foreground leading-snug line-clamp-2">
              {displayTitle}
            </span>
            {/* More button — 44px min touch target per Fitts' Law */}
            <Popover>
              <PopoverTrigger
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="shrink-0 flex items-center justify-center size-11 -mr-2 -mt-1 rounded-lg text-muted-foreground active:bg-accent/50"
              >
                <MoreHorizontal className="size-5" />
              </PopoverTrigger>
              <PopoverPopup side="left" align="start" sideOffset={4} className="min-w-[160px] !w-auto">
                <div className="py-1">
                  <PopoverClose
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(); }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[14px] text-foreground/90 active:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-4" /> Delete
                  </PopoverClose>
                  <PopoverClose
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditValue(thread.title); setIsEditing(true); }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[14px] text-foreground/90 active:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <Pencil className="size-4" /> Rename
                  </PopoverClose>
                  <PopoverClose
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); onTogglePin(); }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[14px] text-foreground/90 active:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <Pin className="size-4" /> {thread.isPinned ? "Unpin" : "Pin"}
                  </PopoverClose>
                </div>
              </PopoverPopup>
            </Popover>
          </div>

          {/* Preview */}
          {preview && (
            <p className="text-[13px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
              {preview}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 mt-1.5">
            {thread.articleDomain && (
              <span className="text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                {thread.articleDomain}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {formatRelativeTime(thread.updatedAt)}
            </span>
            {messageCount > 0 && (
              <span className="text-[11px] text-muted-foreground">
                · {messageCount} msg{messageCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export const MobileChatDrawer = forwardRef<MobileChatDrawerHandle, MobileChatDrawerProps>(function MobileChatDrawer({
  open,
  onOpenChange,
  articleContent,
  articleTitle,
  chatAd,
  chatAdPlacement,
  onChatAdVisible,
  onChatAdClick,
  onChatAdDismiss: _onChatAdDismiss,
  inlineChatAd,
  inlineChatAdPlacement,
  onInlineChatAdVisible,
  onInlineChatAdClick,
  isPremium = false,
  initialMessages: initialMessagesProp,
  onMessagesChange,
  // Session history
  threads: _threads = [],
  activeThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  onTogglePin,
  onRenameThread,
  groupedThreads,
}, ref) {
  const chatRef = useRef<ArticleChatHandle>(null);
  const drawerContentRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement | null>(null);
  const [hasMessages, setHasMessages] = useState(false);
  const [activeView, setActiveView] = useState<MobileView>("chat");

  useImperativeHandle(ref, () => ({
    setQuotedText: (text: string | null) => chatRef.current?.setQuotedText(text),
    focusInput: () => chatRef.current?.focusInput(),
    clearMessages: () => chatRef.current?.clearMessages(),
    setMessages: (messages: UIMessage[]) => chatRef.current?.setMessages(messages),
  }));
  const { isOpen: isKeyboardOpen } = useMobileKeyboard();

  const handleClearMessages = useCallback(() => {
    chatRef.current?.clearMessages();
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSelectThread = useCallback((threadId: string) => {
    onSelectThread?.(threadId);
    setActiveView("chat");
  }, [onSelectThread]);

  const handleNewChat = useCallback(() => {
    onNewChat?.();
    setActiveView("chat");
  }, [onNewChat]);

  // Reset to chat view when drawer opens
  React.useEffect(() => {
    if (open) setActiveView("chat");
  }, [open]);

  const groups = useMemo(() => groupedThreads?.() ?? [], [groupedThreads]);

  const swipeToHistory = useCallback(() => {
    setActiveView("history");
  }, []);
  const swipeToChat = useCallback(() => setActiveView("chat"), []);
  const swipeHandlers = useSwipe(swipeToHistory, swipeToChat);

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={false}
      modal={true}
      repositionInputs={false}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-background" />

        <DrawerPrimitive.Content
          ref={drawerContentRef}
          className={cn(
            "fixed inset-x-0 top-0 z-50",
            "bg-background",
            "flex flex-col",
            "outline-none",
            "pt-[env(safe-area-inset-top,0px)]",
            "pb-[env(safe-area-inset-bottom,0px)]"
          )}
          style={{ height: "100dvh" }}
        >
          {/* Header */}
          <div className="shrink-0 border-b border-border/30">
            <div className="flex items-center justify-between px-2 py-2">
              {activeView === "history" ? (
                <>
                  {/* Back to chat */}
                  <button
                    type="button"
                    onClick={() => setActiveView("chat")}
                    className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground active:bg-muted/70 transition-colors"
                    aria-label="Back to chat"
                    style={{ touchAction: "manipulation" }}
                  >
                    <ArrowLeft className="size-5" aria-hidden="true" />
                  </button>
                  <span className="text-sm font-semibold text-foreground">Session History</span>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground active:bg-muted/70 transition-colors"
                    aria-label="New thread"
                    style={{ touchAction: "manipulation" }}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    <span>New Thread</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Back */}
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70 transition-colors"
                    aria-label="Back"
                    style={{ touchAction: "manipulation" }}
                  >
                    <ChevronLeft className="size-5" aria-hidden="true" />
                  </button>

                  {/* Title */}
                  <span className="text-sm font-semibold text-foreground">Chat</span>

                  {/* Right actions */}
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setActiveView("history")}
                      className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground active:bg-muted/70 transition-colors"
                      aria-label="Session History"
                      style={{ touchAction: "manipulation" }}
                    >
                      <History className="size-4.5" aria-hidden="true" />
                    </button>
                    {hasMessages && (
                      <button
                        type="button"
                        onClick={handleClearMessages}
                        className="flex size-11 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-muted-foreground active:bg-muted/70 transition-colors"
                        aria-label="Clear chat"
                        style={{ touchAction: "manipulation" }}
                      >
                        <Trash className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content — chat recedes, history slides over (iOS-style push) */}
          <div
            className="flex-1 min-h-0 overflow-hidden relative"
            data-vaul-no-drag
            {...swipeHandlers}
          >
            {/* Chat view — recedes with scale+dim when history is open */}
            <div
              className={cn(
                "absolute inset-0 z-0",
                "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,opacity]",
                activeView === "history"
                  ? "scale-[0.94] opacity-40 pointer-events-none"
                  : "scale-100 opacity-100"
              )}
              style={{ touchAction: "pan-y", transformOrigin: "center center" }}
            >
              <div className="h-full mx-auto max-w-lg">
                <ArticleChat
                  ref={chatRef}
                  articleContent={articleContent}
                  articleTitle={articleTitle}
                  isOpen={true}
                  onOpenChange={onOpenChange}
                  variant="sidebar"
                  hideHeader
                  onHasMessagesChange={setHasMessages}
                  initialMessages={initialMessagesProp}
                  inputContainerRef={inputContainerRef}
                  onMessagesChange={onMessagesChange}
                  isKeyboardOpen={isKeyboardOpen}
                  headerAd={chatAd}
                  headerAdPlacement={chatAdPlacement}
                  onHeaderAdVisible={onChatAdVisible}
                  onHeaderAdClick={onChatAdClick}
                  ad={inlineChatAd}
                  adPlacement={inlineChatAdPlacement}
                  onAdVisible={onInlineChatAdVisible}
                  onAdClick={onInlineChatAdClick}
                />
              </div>
            </div>

            {/* History view — slides in from right with iOS drawer curve */}
            <div
              className={cn(
                "absolute inset-0 z-10 bg-background overflow-y-auto scrollbar-hide",
                "transition-[transform,opacity,visibility] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,opacity]",
                activeView === "history"
                  ? "translate-x-0 opacity-100 visible"
                  : "translate-x-full opacity-0 invisible"
              )}
              style={{ touchAction: "pan-y" }}
            >
              {groups.length > 0 ? (
                <div className="py-1">
                  {groups.map((group) => {
                    const isTimeLabel = KNOWN_LABELS.has(group.label);
                    return (
                      <div key={group.label}>
                        <div className="px-4 pt-4 pb-1.5">
                          {isTimeLabel ? (
                            <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                              {group.label}
                            </span>
                          ) : (
                            <span className="text-[12px] font-medium text-muted-foreground truncate block" title={group.label}>
                              {group.label}
                            </span>
                          )}
                        </div>
                        {group.threads.map((thread) => (
                          <MobileThreadItem
                            key={thread.id}
                            thread={thread}
                            isActive={activeThreadId === thread.id}
                            onSelect={() => handleSelectThread(thread.id)}
                            onDelete={() => onDeleteThread?.(thread.id)}
                            onTogglePin={() => onTogglePin?.(thread.id)}
                            onRename={(title) => onRenameThread?.(thread.id, title)}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <MobileHistoryEmptyState isPremium={!!isPremium} onNewChat={handleNewChat} />
              )}
            </div>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
});
