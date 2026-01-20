// chat/screens/chat.screen.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useAuth } from "@/contexts/AuthContext";
import { useChatThreads, useChatMessages, useSendMessage } from "@/hooks/useChat";

import { MessageSquare, RefreshCw, Search, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

/**
 * chat/screens/chat.screen.tsx (HUDSON-SCHEMA)
 * - Aligns to current generated Database types:
 *   - chat_threads: { id, type, name, team_id, tournament_id, created_at, updated_at, created_by }
 *   - chat_messages: { id, thread_id, sender_id, content, type, created_at, edited_at, deleted_at, file_url, reply_to_id }
 * - No message_kind/severity/author (they are NOT in current schema types)
 * - No any; robust parsing supports possible "view" payloads that include extra fields.
 */

// ----------------------------------------------------------------------------
// Types (UI-level, compatible with Hudson schema, tolerant to extra fields)
// ----------------------------------------------------------------------------

type chat_kind = "support" | "tournament" | "friendly" | "system" | "admin" | "unknown";

type send_message_payload = {
  threadId: string;
  content: string;
  replyToId?: string | null;
  fileUrl?: string | null;
};

type chat_thread = {
  id: string;
  kind: chat_kind;

  title: string;

  created_at: string | null;
  updated_at: string | null;

  // optional extras if your query returns them (views/RPC)
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;

  // raw context fields (from Hudson schema)
  team_id: string | null;
  tournament_id: string | null;
  created_by: string | null;
};

type chat_message = {
  id: string;
  thread_id: string;

  content: string;
  type: string;

  sender_id: string | null;

  created_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;

  file_url: string | null;
  reply_to_id: string | null;
};

type query_like = {
  data?: unknown;
  isLoading?: unknown;
  isError?: unknown;
  error?: unknown;
  refetch?: unknown;
};

type mutation_like = {
  mutate?: unknown;
  mutateAsync?: unknown;
  isLoading?: unknown;
  isPending?: unknown;
  isError?: unknown;
  error?: unknown;
};

// ----------------------------------------------------------------------------
// Helpers (no any)
// ----------------------------------------------------------------------------

function is_record(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function as_string(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return null;
}

function as_number(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function as_boolean(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  return null;
}

function safe_relative_time(dateLike: string | null): string {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  return formatDistanceToNow(d, { addSuffix: true, locale: enUS });
}

function normalize_kind(v: unknown): chat_kind {
  const s = (as_string(v) ?? "").toLowerCase().trim();
  if (s === "support") return "support";
  if (s === "tournament") return "tournament";
  if (s === "friendly") return "friendly";
  if (s === "system") return "system";
  if (s === "admin") return "admin";
  return "unknown";
}

function kind_badge(kind: chat_kind): { text: string; className: string } {
  const base = "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium border";
  const text = kind === "unknown" ? "unknown" : kind;
  return { text, className: `${base} border-border text-foreground/80` };
}

function get_query_like(v: unknown): {
  data: unknown;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: (() => void) | null;
} {
  if (!is_record(v)) return { data: [], isLoading: false, isError: false, error: null, refetch: null };
  const q = v as query_like;

  const data = q.data ?? [];
  const isLoading = as_boolean(q.isLoading) ?? false;
  const isError = as_boolean(q.isError) ?? false;
  const error = q.error ?? null;
  const refetch = typeof q.refetch === "function" ? (q.refetch as () => void) : null;

  return { data, isLoading, isError, error, refetch };
}

function get_mutation_like(v: unknown): {
  mutate: ((payload: send_message_payload, opts?: { onSuccess?: () => void; onError?: () => void }) => void) | null;
  mutateAsync: ((payload: send_message_payload) => Promise<unknown>) | null;
  isSending: boolean;
  isError: boolean;
  error: unknown;
} {
  if (!is_record(v)) return { mutate: null, mutateAsync: null, isSending: false, isError: false, error: null };
  const m = v as mutation_like;

  const mutate =
    typeof m.mutate === "function"
      ? (m.mutate as (payload: send_message_payload, opts?: { onSuccess?: () => void; onError?: () => void }) => void)
      : null;

  const mutateAsync =
    typeof m.mutateAsync === "function"
      ? (m.mutateAsync as (payload: send_message_payload) => Promise<unknown>)
      : null;

  const isPending = as_boolean(m.isPending);
  const isLoading = as_boolean(m.isLoading);
  const isSending = Boolean(isPending ?? isLoading ?? false);

  const isError = as_boolean(m.isError) ?? false;
  const error = m.error ?? null;

  return { mutate, mutateAsync, isSending, isError, error };
}

function is_dev_env(): boolean {
  try {
    const meta = import.meta as unknown as { env?: { DEV?: boolean } };
    return meta?.env?.DEV === true;
  } catch {
    return false;
  }
}

function error_to_text(err: unknown): { primary: string; debug?: string } {
  const dev = is_dev_env();

  if (err == null) return { primary: "unknown error" };
  if (typeof err === "string") return { primary: err };

  if (err instanceof Error) {
    return { primary: err.message || "error", debug: dev ? err.stack ?? undefined : undefined };
  }

  if (is_record(err)) {
    const message = as_string(err.message) ?? as_string(err.error_description);
    const details = as_string(err.details) ?? as_string(err.hint) ?? as_string(err.code);
    const primary = message ?? details ?? "unknown error";

    if (!dev) return { primary };

    let debug: string | undefined;
    try {
      debug = JSON.stringify(err);
    } catch {
      debug = undefined;
    }
    return { primary, debug };
  }

  if (dev) {
    try {
      return { primary: "unknown error", debug: JSON.stringify(err) };
    } catch {
      return { primary: "unknown error" };
    }
  }

  return { primary: "unknown error" };
}

// ----------------------------------------------------------------------------
// Parsers (tolerant to extra fields / view payloads)
// ----------------------------------------------------------------------------

function parse_threads(input: unknown): chat_thread[] {
  if (!Array.isArray(input)) return [];

  const out: chat_thread[] = [];

  for (const raw of input) {
    if (!is_record(raw)) continue;

    const id = as_string(raw.id);
    if (!id) continue;

    // Hudson: thread.type (string) is the kind
    const kind = normalize_kind(raw.type ?? raw.kind);

    // Hudson: name (nullable). Some views may provide title.
    const title = (as_string(raw.title) ?? as_string(raw.name) ?? "conversation").trim() || "conversation";

    const created_at = as_string(raw.created_at);
    const updated_at = as_string(raw.updated_at);

    const team_id = as_string(raw.team_id);
    const tournament_id = as_string(raw.tournament_id);
    const created_by = as_string(raw.created_by);

    // extras if present
    const unread_count = as_number(raw.unread_count) ?? 0;
    const last_message_at = as_string(raw.last_message_at);
    const last_message_preview = as_string(raw.last_message_preview);

    out.push({
      id,
      kind,
      title,
      created_at,
      updated_at,
      unread_count,
      last_message_at,
      last_message_preview,
      team_id,
      tournament_id,
      created_by,
    });
  }

  return out;
}

function parse_messages(input: unknown): chat_message[] {
  if (!Array.isArray(input)) return [];

  const out: chat_message[] = [];

  for (const raw of input) {
    if (!is_record(raw)) continue;

    const id = as_string(raw.id);
    if (!id) continue;

    const thread_id = as_string(raw.thread_id) ?? "";
    const content = (as_string(raw.content) ?? "").toString();
    const type = (as_string(raw.type) ?? "text").trim() || "text";

    const sender_id = as_string(raw.sender_id);

    const created_at = as_string(raw.created_at);
    const edited_at = as_string(raw.edited_at);
    const deleted_at = as_string(raw.deleted_at);

    const file_url = as_string(raw.file_url);
    const reply_to_id = as_string(raw.reply_to_id);

    out.push({
      id,
      thread_id,
      content,
      type,
      sender_id,
      created_at,
      edited_at,
      deleted_at,
      file_url,
      reply_to_id,
    });
  }

  // hide soft-deleted messages by default
  return out.filter((m) => !m.deleted_at);
}

function display_author_label(sender_id: string | null, selfUserId: string | null): string {
  if (selfUserId && sender_id && sender_id === selfUserId) return "[you]";
  return "[participant]";
}

// ----------------------------------------------------------------------------
// UI
// ----------------------------------------------------------------------------

const base_filters: Array<{ key: "all" | chat_kind; label: string }> = [
  { key: "all", label: "all" },
  { key: "support", label: "support" },
  { key: "tournament", label: "tournaments" },
  { key: "friendly", label: "friendlies" },
  { key: "system", label: "system" },
  { key: "admin", label: "admin" },
];

export default function ChatScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const selfUserId = user?.id != null ? String(user.id) : null;

  // admin visibility: show admin tab only if user is admin-ish OR there are admin threads
  const isAdminUser = useMemo(() => {
    const u = user as unknown;
    if (!is_record(u)) return false;
    const role = as_string(u.role);
    if (!role) return false;
    const r = role.toLowerCase();
    return r === "admin" || r === "super_admin" || r === "moderator" || r === "platform_admin";
  }, [user]);

  const threadsQuery = get_query_like(useChatThreads() as unknown);
  const threads = useMemo(() => parse_threads(threadsQuery.data), [threadsQuery.data]);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof base_filters)[number]["key"]>("all");
  const [search, setSearch] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");

  const composingRef = useRef<boolean>(false);

  const hasAdminThreads = useMemo(() => threads.some((t) => t.kind === "admin"), [threads]);

  const visibleFilters = useMemo(() => {
    return base_filters.filter((f) => {
      if (f.key !== "admin") return true;
      return isAdminUser || hasAdminThreads;
    });
  }, [isAdminUser, hasAdminThreads]);

  // keep filter valid if "admin" disappears
  useEffect(() => {
    const stillVisible = visibleFilters.some((f) => f.key === filter);
    if (!stillVisible) setFilter("all");
  }, [visibleFilters, filter]);

  const selectedThread = useMemo(() => {
    if (!selectedThreadId) return null;
    return threads.find((t) => t.id === selectedThreadId) ?? null;
  }, [threads, selectedThreadId]);

  const messagesQuery = get_query_like(useChatMessages(selectedThreadId || undefined) as unknown);
  const messages = useMemo(() => parse_messages(messagesQuery.data), [messagesQuery.data]);

  const sendMutation = get_mutation_like(useSendMessage() as unknown);

  // auto-select first thread
  useEffect(() => {
    if (selectedThreadId) {
      const exists = threads.some((t) => t.id === selectedThreadId);
      if (!exists) setSelectedThreadId(null);
      return;
    }
    if (threads.length > 0) setSelectedThreadId(threads[0].id);
  }, [threads, selectedThreadId]);

  const hasAnyThreads = threads.length > 0;

  // scroll to bottom on thread change / new messages
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const t = window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 20);
    return () => window.clearTimeout(t);
  }, [selectedThreadId, messages.length]);

  const threadsErrorText = useMemo(() => error_to_text(threadsQuery.error), [threadsQuery.error]);
  const messagesErrorText = useMemo(() => error_to_text(messagesQuery.error), [messagesQuery.error]);
  const sendErrorText = useMemo(() => error_to_text(sendMutation.error), [sendMutation.error]);

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();

    const base = threads
      .filter((t) => (filter === "all" ? true : t.kind === filter))
      .filter((t) => {
        if (!q) return true;
        const hay = [
          t.title,
          t.kind,
          t.last_message_preview ?? "",
          t.team_id ?? "",
          t.tournament_id ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        const ta = new Date(a.last_message_at ?? a.updated_at ?? a.created_at ?? 0).getTime();
        const tb = new Date(b.last_message_at ?? b.updated_at ?? b.created_at ?? 0).getTime();
        return tb - ta;
      });

    return base;
  }, [threads, filter, search]);

  const listNonSystem = useMemo(() => filteredThreads.filter((t) => t.kind !== "system"), [filteredThreads]);
  const listSystem = useMemo(() => filteredThreads.filter((t) => t.kind === "system"), [filteredThreads]);

  const handleSend = () => {
    if (!selectedThreadId) return;
    if (sendMutation.isSending) return;

    const content = newMessage.trim();
    if (!content) return;

    const payload: send_message_payload = {
      threadId: selectedThreadId,
      content,
      replyToId: null,
      fileUrl: null,
    };

    if (sendMutation.mutate) {
      sendMutation.mutate(payload, { onSuccess: () => setNewMessage("") });
      return;
    }

    if (sendMutation.mutateAsync) {
      sendMutation
        .mutateAsync(payload)
        .then(() => setNewMessage(""))
        .catch(() => {
          // shown below via sendMutation.isError
        });
    }
  };

  const renderThreadRow = (t: chat_thread) => {
    const active = t.id === selectedThreadId;
    const badge = kind_badge(t.kind);

    const time = safe_relative_time(t.last_message_at) || safe_relative_time(t.updated_at) || safe_relative_time(t.created_at);
    const preview = (t.last_message_preview ?? "").trim();

    return (
      <button
        key={t.id}
        onClick={() => setSelectedThreadId(t.id)}
        className={[
          "w-full p-4 text-left transition-colors border-b",
          "hover:bg-muted/50",
          active ? "bg-muted" : "",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{t.title}</span>
              <span className={badge.className}>{badge.text}</span>
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              {time}
              {t.tournament_id ? ` • tournament` : ""}
              {t.team_id ? ` • team` : ""}
            </div>

            {preview ? <div className="mt-1 text-xs text-muted-foreground/80 truncate">{preview}</div> : null}
          </div>

          <div className="flex-shrink-0">
            {t.unread_count > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-[11px]">
                {t.unread_count > 99 ? "99+" : t.unread_count}
              </span>
            ) : null}
          </div>
        </div>
      </button>
    );
  };

  const rightPanelEmpty = () => {
    if (!hasAnyThreads) {
      return (
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="max-w-md text-center space-y-3">
            <div className="text-sm text-muted-foreground">no conversations yet</div>
            <div className="text-xs text-muted-foreground">
              chats are created automatically from support, tournaments, and friendlies.
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setFilter("support")}>
                support
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/tournaments")}>
                browse tournaments
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/friendlies")}>
                friendlies
              </Button>
            </div>
          </div>
        </CardContent>
      );
    }

    return (
      <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
        select a conversation
      </CardContent>
    );
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* threads list */}
      <Card className="w-80 flex-shrink-0 flex flex-col min-h-0">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              chat
            </CardTitle>

            {threadsQuery.refetch ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="refresh"
                title="refresh"
                onClick={() => threadsQuery.refetch?.()}
                disabled={threadsQuery.isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 opacity-60" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search..." className="pl-8" />
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleFilters.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={[
                    "px-2.5 py-1 rounded text-xs border transition-colors",
                    active ? "bg-muted" : "hover:bg-muted/50",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0">
          <ScrollArea className="h-full">
            {threadsQuery.isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">loading conversations...</div>
            ) : threadsQuery.isError ? (
              <div className="p-4 space-y-3">
                <div className="text-sm text-muted-foreground">failed to load conversations</div>
                <div className="text-xs text-muted-foreground break-words">{threadsErrorText.primary}</div>
                {threadsErrorText.debug ? <div className="text-xs opacity-60 break-words">{threadsErrorText.debug}</div> : null}
                {threadsQuery.refetch ? (
                  <Button size="sm" onClick={() => threadsQuery.refetch?.()}>
                    try again
                  </Button>
                ) : null}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-4 space-y-2">
                <div className="text-sm text-muted-foreground">no conversations</div>
                <div className="text-xs text-muted-foreground">tip: chats are created by platform events</div>
              </div>
            ) : (
              <div className="py-1">
                {filter === "all" ? (
                  <>
                    <div className="px-4 pt-2 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                      conversations
                    </div>
                    {listNonSystem.map(renderThreadRow)}

                    {listSystem.length > 0 ? (
                      <>
                        <div className="px-4 pt-4 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                          system
                        </div>
                        {listSystem.map(renderThreadRow)}
                      </>
                    ) : null}
                  </>
                ) : (
                  <>{filteredThreads.map(renderThreadRow)}</>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* messages */}
      <Card className="flex-1 flex flex-col min-h-0">
        {!selectedThread ? (
          rightPanelEmpty()
        ) : (
          <>
            {/* header */}
            <div className="border-b p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{selectedThread.title}</span>
                    <span className={kind_badge(selectedThread.kind).className}>{kind_badge(selectedThread.kind).text}</span>
                    {selectedThread.tournament_id ? (
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] border text-foreground/80">
                        tournament
                      </span>
                    ) : null}
                    {selectedThread.team_id ? (
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] border text-foreground/80">
                        team
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    official communication • messages may be audited • keep it on-platform
                  </div>
                </div>

                {messagesQuery.refetch ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="refresh messages"
                    title="refresh messages"
                    onClick={() => messagesQuery.refetch?.()}
                    disabled={messagesQuery.isLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>

            {/* message list */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full p-4">
                {messagesQuery.isLoading ? (
                  <div className="text-sm text-muted-foreground">loading messages...</div>
                ) : messagesQuery.isError ? (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">failed to load messages</div>
                    <div className="text-xs text-muted-foreground break-words">{messagesErrorText.primary}</div>
                    {messagesErrorText.debug ? <div className="text-xs opacity-60 break-words">{messagesErrorText.debug}</div> : null}
                    {messagesQuery.refetch ? (
                      <Button size="sm" onClick={() => messagesQuery.refetch?.()}>
                        try again
                      </Button>
                    ) : null}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">no messages yet</div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m) => {
                      const self = Boolean(selfUserId && m.sender_id && m.sender_id === selfUserId);
                      const label = display_author_label(m.sender_id, selfUserId);
                      const time = safe_relative_time(m.created_at);

                      return (
                        <div key={m.id} className={`flex ${self ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[78%] space-y-1">
                            <div className={`text-[11px] ${self ? "text-right" : "text-left"} text-muted-foreground`}>
                              {label}
                              {m.type && m.type !== "text" ? ` • ${m.type}` : ""}
                            </div>
                            <div
                              className={[
                                "rounded-lg p-3 border break-words",
                                self ? "bg-primary text-primary-foreground" : "bg-muted",
                              ].join(" ")}
                            >
                              <div className="text-sm whitespace-pre-wrap">{m.content}</div>

                              {m.file_url ? (
                                <div className="mt-2 text-xs underline opacity-90 break-all">{m.file_url}</div>
                              ) : null}

                              <div className={`mt-1 text-[11px] opacity-70 ${self ? "text-right" : "text-left"}`}>{time}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* composer */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder={
                    selectedThread.kind === "support"
                      ? "describe your issue..."
                      : selectedThread.kind === "tournament"
                      ? "message (official)..."
                      : selectedThread.kind === "friendly"
                      ? "propose time/date..."
                      : "type your message..."
                  }
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onCompositionStart={() => {
                    composingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    composingRef.current = false;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      if (composingRef.current) return;
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={sendMutation.isSending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sendMutation.isSending}
                  aria-label="send message"
                  title="send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {sendMutation.isError ? (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-muted-foreground break-words">failed to send message</div>
                  <div className="text-xs text-muted-foreground break-words">{sendErrorText.primary}</div>
                  {sendErrorText.debug ? <div className="text-xs opacity-60 break-words">{sendErrorText.debug}</div> : null}
                </div>
              ) : null}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
