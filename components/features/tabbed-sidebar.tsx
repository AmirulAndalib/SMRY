"use client";

import React, { useState, forwardRef, useImperativeHandle, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, Plus, History, ArrowLeft, MoreHorizontal, Trash2, Pin, Pencil, MessageSquare, Smartphone, Zap, LogIn } from "@/components/ui/icons";
import { ArticleChat, ArticleChatHandle } from "@/components/features/article-chat";
import { type ChatThread, formatRelativeTime } from "@/lib/hooks/use-chat-threads";
import type { GravityAd as GravityAdType } from "@/lib/hooks/use-gravity-ad";
import type { UIMessage } from "ai";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { buildUrlWithReturn } from "@/lib/hooks/use-return-url";
import {
  Popover,
  PopoverTrigger,
  PopoverPopup,
  PopoverClose,
} from "@/components/ui/popover";

export type SidebarTab = "chat" | "history";

export interface TabbedSidebarHandle extends ArticleChatHandle {
  setActiveTab: (tab: SidebarTab) => void;
  activeTab: SidebarTab;
  setQuotedText: (text: string | null) => void;
}

interface TabbedSidebarProps {
  articleContent: string;
  articleTitle?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isPremium?: boolean;
  initialMessages?: UIMessage[];
  onMessagesChange?: (messages: UIMessage[]) => void;
  activeThreadTitle?: string;
  // Ads
  headerAd?: GravityAdType | null;
  headerAdPlacement?: string;
  onHeaderAdVisible?: () => void;
  onHeaderAdClick?: () => void;
  ad?: GravityAdType | null;
  adPlacement?: string;
  onAdVisible?: () => void;
  onAdClick?: () => void;
  microAd?: GravityAdType | null;
  onMicroAdVisible?: () => void;
  onMicroAdClick?: () => void;
  // Tab/view control
  defaultTab?: SidebarTab;
  onTabChange?: (tab: SidebarTab) => void;
  // Chat history
  onNewChat?: () => void;
  threads?: ChatThread[];
  activeThreadId?: string | null;
  onSelectThread?: (threadId: string) => void;
  onDeleteThread?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onRenameThread?: (id: string, title: string) => void;
  groupedThreads?: () => { label: string; threads: ChatThread[] }[];
}

const KNOWN_LABELS = new Set(["Pinned", "This Article", "Today", "Yesterday", "Last 7 Days", "Last 30 Days", "Older"]);

/** Single thread item — Perplexity-inspired compact design */
function ThreadCard({
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

  return (
    <div className="group relative">
      {isEditing ? (
        <div className="px-2 py-1">
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
            className="w-full bg-background rounded px-2 py-1 text-[13px] text-foreground border border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      ) : (
        <button
          onClick={onSelect}
          className={cn(
            "w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors",
            isActive
              ? "bg-accent/60"
              : "hover:bg-accent/30"
          )}
        >
          {/* Icon */}
          <div className={cn(
            "shrink-0 flex items-center justify-center size-7 rounded-md",
            isActive ? "bg-primary/10" : "bg-muted/60"
          )}>
            {thread.isPinned ? (
              <Pin className={cn("size-3", isActive ? "text-primary" : "text-muted-foreground")} />
            ) : (
              <MessageSquare className={cn("size-3", isActive ? "text-primary" : "text-muted-foreground")} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <span className="block text-[13px] font-medium truncate text-foreground">
              {displayTitle}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {formatRelativeTime(thread.updatedAt)}
              </span>
              {messageCount > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  · {messageCount} msg{messageCount !== 1 ? "s" : ""}
                </span>
              )}
              {thread.articleDomain && (
                <span className="text-[11px] text-muted-foreground truncate">
                  · {thread.articleDomain}
                </span>
              )}
            </div>
          </div>
        </button>
      )}

      {/* More menu — fade-in on hover */}
      {!isEditing && (
        <div className={cn(
          "absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center",
          "opacity-0 group-hover:opacity-100 transition-opacity z-10"
        )}>
          <div
            className={cn(
              "absolute -left-5 w-5 h-full pointer-events-none",
              isActive
                ? "bg-gradient-to-l from-accent/60 to-transparent"
                : "bg-gradient-to-l from-card to-transparent group-hover:from-accent/30"
            )}
          />
          <Popover>
            <PopoverTrigger
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            >
              <MoreHorizontal className="size-3.5" />
            </PopoverTrigger>
            <PopoverPopup side="left" align="start" sideOffset={4} className="min-w-[140px] !w-auto">
              <div className="py-1">
                <PopoverClose
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-foreground/80 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3" /> Delete
                </PopoverClose>
                <PopoverClose
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditValue(thread.title); setIsEditing(true); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-foreground/80 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <Pencil className="size-3" /> Rename
                </PopoverClose>
                <PopoverClose
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); onTogglePin(); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-foreground/80 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <Pin className="size-3" /> {thread.isPinned ? "Unpin" : "Pin"}
                </PopoverClose>
              </div>
            </PopoverPopup>
          </Popover>
        </div>
      )}
    </div>
  );
}

/** Empty state for history view — shows upgrade CTA for free users, friendly prompt for premium */
function HistoryEmptyState({ isPremium, onNewChat }: { isPremium: boolean; onNewChat: () => void }) {
  const { isSignedIn } = useAuth();

  // Premium user with no threads yet
  if (isPremium) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="flex items-center justify-center size-10 rounded-full bg-primary/5 mb-3">
          <MessageSquare className="size-5 text-primary/60" />
        </div>
        <p className="text-[13px] font-medium text-foreground mb-1">Start your first conversation</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-4" style={{ textWrap: "balance" }}>
          Ask questions about the article and your chats will be saved here.
        </p>
        <button
          onClick={onNewChat}
          className="flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-3.5" />
          New Chat
        </button>
      </div>
    );
  }

  // Not signed in — prompt to log in
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center max-w-[260px] mx-auto">
        <div className="flex items-center justify-center size-9 rounded-full bg-muted/50 mb-3">
          <History className="size-4.5 text-muted-foreground/60" />
        </div>
        <h3 className="text-[13px] font-semibold text-foreground mb-1">
          Your conversations disappear
        </h3>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-4" style={{ textWrap: "balance" }}>
          Sign in to keep every chat saved and pick up right where you left off.
        </p>
        <SignInButton
          mode="modal"
          fallbackRedirectUrl={buildUrlWithReturn("/auth/redirect")}
        >
          <button className="flex items-center justify-center gap-1.5 h-8 px-5 rounded-lg text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <LogIn className="size-3" />
            Sign in to save history
          </button>
        </SignInButton>
      </div>
    );
  }

  // Signed in but free — upgrade prompt
  const features = [
    { icon: Smartphone, text: "Synced across all your devices" },
    { icon: MessageSquare, text: "Pick up any conversation instantly" },
    { icon: Zap, text: "Unlimited AI-powered chats" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center max-w-[260px] mx-auto">
      <div className="flex items-center justify-center size-9 rounded-full bg-muted/50 mb-3">
        <History className="size-4.5 text-muted-foreground/60" />
      </div>
      <h3 className="text-[13px] font-semibold text-foreground mb-1">
        Don&apos;t lose your conversations
      </h3>
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-4" style={{ textWrap: "balance" }}>
        Every question you ask is valuable. Upgrade to save and revisit all your chats.
      </p>

      <div className="space-y-2 mb-4 text-left">
        {features.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2">
            <div className="flex size-4.5 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Icon className="size-2.5 text-primary" aria-hidden="true" />
            </div>
            <span className="text-[11px] text-foreground/80">{text}</span>
          </div>
        ))}
      </div>

      <Link
        href="/pricing"
        className="flex items-center justify-center h-8 px-5 rounded-lg text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Start free trial
      </Link>
      <p className="text-[10px] text-muted-foreground/50 mt-2">
        7 days free &middot; Cancel anytime
      </p>
    </div>
  );
}

export const TabbedSidebar = forwardRef<TabbedSidebarHandle, TabbedSidebarProps>(
  function TabbedSidebar(
    {
      articleContent, articleTitle, isOpen, onOpenChange,
      isPremium = false, initialMessages, onMessagesChange, activeThreadTitle,
      headerAd, headerAdPlacement, onHeaderAdVisible, onHeaderAdClick,
      ad, adPlacement, onAdVisible, onAdClick,
      microAd, onMicroAdVisible, onMicroAdClick,
      defaultTab = "chat", onTabChange, onNewChat,
      threads: _threads = [], activeThreadId, onSelectThread,
      onDeleteThread, onTogglePin, onRenameThread, groupedThreads,
    },
    ref
  ) {
    const [activeTab, setActiveTabInternal] = useState<SidebarTab>(defaultTab);
    const activeTabRef = useRef<SidebarTab>(defaultTab);

    const setActiveTab = useCallback((tab: SidebarTab) => {
      activeTabRef.current = tab;
      setActiveTabInternal(tab);
      onTabChange?.(tab);
    }, [onTabChange]);

    const chatRef = useRef<ArticleChatHandle>(null);

    useImperativeHandle(ref, () => ({
      clearMessages: () => chatRef.current?.clearMessages(),
      setMessages: (messages: UIMessage[]) => chatRef.current?.setMessages(messages),
      get hasMessages() { return chatRef.current?.hasMessages ?? false; },
      focusInput: () => chatRef.current?.focusInput(),
      stopGeneration: () => chatRef.current?.stopGeneration(),
      copyLastResponse: () => chatRef.current?.copyLastResponse(),
      setQuotedText: (text: string | null) => chatRef.current?.setQuotedText(text),
      setActiveTab,
      get activeTab() { return activeTabRef.current; },
    }));

    const groups = useMemo(() => groupedThreads?.() ?? [], [groupedThreads]);

    const handleSelectThread = useCallback((threadId: string) => {
      onSelectThread?.(threadId);
      setActiveTab("chat");
    }, [onSelectThread, setActiveTab]);

    const handleNewChat = useCallback(() => {
      onNewChat?.();
      setActiveTab("chat");
    }, [onNewChat, setActiveTab]);

    return (
      <div className={cn(
        "flex h-full w-full flex-col bg-background",
        !isOpen && "hidden"
      )}>
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-border/40">
          {activeTab === "history" ? (
            <>
              <button
                onClick={() => setActiveTab("chat")}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Back to chat"
              >
                <ArrowLeft className="size-3.5" />
              </button>
              <span className="text-xs font-semibold text-foreground">Session History</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="New thread"
                >
                  <Plus className="size-3" />
                  <span>New Thread</span>
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Close sidebar"
                >
                  <X className="size-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-xs font-semibold text-foreground pl-1">Chat</span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setActiveTab("history")}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Session history"
                >
                  <History className="size-3.5" />
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Close sidebar"
                >
                  <X className="size-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Content — chat recedes, history slides over (iOS-style push) */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {/* Chat view — recedes with scale+dim when history is open */}
          <div className={cn(
            "absolute inset-0 z-0 bg-background",
            "transition-[transform,opacity] duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,opacity]",
            activeTab === "history"
              ? "scale-[0.97] opacity-40 pointer-events-none"
              : "scale-100 opacity-100"
          )}>
            <ArticleChat
              ref={chatRef}
              articleContent={articleContent}
              articleTitle={articleTitle}
              isOpen={isOpen}
              onOpenChange={onOpenChange}
              variant="sidebar"
              isPremium={isPremium}
              initialMessages={initialMessages}
              onMessagesChange={onMessagesChange}
              activeThreadTitle={activeThreadTitle}
              headerAd={headerAd}
              headerAdPlacement={headerAdPlacement}
              onHeaderAdVisible={onHeaderAdVisible}
              onHeaderAdClick={onHeaderAdClick}
              ad={ad}
              adPlacement={adPlacement}
              onAdVisible={onAdVisible}
              onAdClick={onAdClick}
              microAd={microAd}
              onMicroAdVisible={onMicroAdVisible}
              onMicroAdClick={onMicroAdClick}
            />
          </div>

          {/* History view — slides in from right with iOS drawer curve */}
          <div className={cn(
            "absolute inset-0 z-10 bg-background overflow-y-auto scrollbar-hide",
            "transition-[transform,opacity,visibility] duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[transform,opacity]",
            activeTab === "history"
              ? "translate-x-0 opacity-100 visible"
              : "translate-x-full opacity-0 invisible"
          )}>
            {groups.length > 0 ? (
              <div className="py-1 px-1.5">
                {groups.map((group) => {
                  const isTimeLabel = KNOWN_LABELS.has(group.label);
                  return (
                    <div key={group.label} className="mb-0.5">
                      <div className="px-2.5 pt-3 pb-1.5">
                        {isTimeLabel ? (
                          <span className="text-[10px] font-medium tracking-wider text-muted-foreground/80 uppercase">
                            {group.label}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-muted-foreground block leading-snug" title={group.label}>
                            {group.label}
                          </span>
                        )}
                      </div>
                      <div className="space-y-px">
                        {group.threads.map((thread) => (
                          <ThreadCard
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
                    </div>
                  );
                })}
              </div>
            ) : (
              <HistoryEmptyState isPremium={isPremium} onNewChat={handleNewChat} />
            )}
          </div>
        </div>
      </div>
    );
  }
);
