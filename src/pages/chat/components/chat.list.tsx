import * as React from "react";

export type ChatKind = "support" | "tournament" | "friendly" | "system" | "admin" | "unknown";

export type ChatListFilterKey = "all" | Exclude<ChatKind, "unknown"> | "unknown";

export type ChatThreadListItem = {
  id: string;
  kind: ChatKind;
  title: string;
  contextLabel?: string | null;
  lastMessageAt?: string | null;
  updatedAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount?: number | null;
};

export type ChatListError = {
  primary: string;
  debug?: string;
};

export type ChatListFilter = {
  key: ChatListFilterKey;
  label: string;
  visible: boolean;
};

export type ChatListProps = {
  headerTitle?: string;

  // search + filters (UI is controlled by parent)
  searchValue: string;
  onSearchChange: (value: string) => void;

  filters: ChatListFilter[];
  activeFilter: ChatListFilterKey;
  onFilterChange: (key: ChatListFilterKey) => void;

  // data + selection
  threads: ChatThreadListItem[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string) => void;

  // states
  isLoading: boolean;
  isError: boolean;
  error: ChatListError | null;
  onRetry?: () => void;
  onRefresh?: () => void;

  // behavior
  splitSystemSection?: boolean; // when activeFilter="all", show non-system then system section
};

function safeRelativeTime(dateLike?: string | null): string {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: undefined,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeKind(kind: ChatKind): ChatKind {
  if (kind === "support" || kind === "tournament" || kind === "friendly" || kind === "system" || kind === "admin") {
    return kind;
  }
  return "unknown";
}

function kindBadge(kind: ChatKind): { text: string; className: string } {
  const base = "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium border";
  const k = normalizeKind(kind);
  return {
    text: k,
    className: `${base} border-white/10 text-slate-200/80`,
  };
}

function toCount(n?: number | null): number {
  if (typeof n !== "number") return 0;
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function sectionLabel(label: string): React.ReactElement {
  return (
    <div className="px-4 pt-2 pb-1 text-[11px] uppercase tracking-wide text-slate-300/60">
      {label}
    </div>
  );
}

function renderThreadRow(
  t: ChatThreadListItem,
  selectedThreadId: string | null,
  onSelectThread: (threadId: string) => void
): React.ReactElement {
  const active = t.id === selectedThreadId;
  const badge = kindBadge(t.kind);
  const unread = toCount(t.unreadCount);

  const time = safeRelativeTime(t.lastMessageAt) || safeRelativeTime(t.updatedAt);
  const preview = (t.lastMessagePreview ?? "").trim();

  return (
    <button
      key={t.id}
      type="button"
      onClick={() => onSelectThread(t.id)}
      className={cx(
        "w-full p-4 text-left transition-colors border-b border-white/5",
        "hover:bg-white/5",
        active && "bg-white/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate text-slate-100">{t.title}</span>
            <span className={badge.className}>{badge.text}</span>
          </div>

          <div className="mt-1 text-xs text-slate-300/60">
            {time}
            {t.contextLabel ? ` • ${t.contextLabel}` : ""}
          </div>

          {preview ? <div className="mt-1 text-xs text-slate-300/70 truncate">{preview}</div> : null}
        </div>

        <div className="flex-shrink-0">
          {unread > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-white/10 px-1.5 text-[11px] text-slate-100">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default function ChatList(props: ChatListProps): React.ReactElement {
  const {
    headerTitle = "chat",
    searchValue,
    onSearchChange,
    filters,
    activeFilter,
    onFilterChange,
    threads,
    selectedThreadId,
    onSelectThread,
    isLoading,
    isError,
    error,
    onRetry,
    onRefresh,
    splitSystemSection = true,
  } = props;

  const visibleFilters = React.useMemo(() => filters.filter((f) => f.visible), [filters]);

  const listNonSystem = React.useMemo(() => threads.filter((t) => t.kind !== "system"), [threads]);
  const listSystem = React.useMemo(() => threads.filter((t) => t.kind === "system"), [threads]);

  return (
    <div className="w-80 flex-shrink-0 flex flex-col min-h-0 rounded-2xl border border-white/10 bg-black/20">
      {/* header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-100 font-semibold">{headerTitle}</span>
          </div>

          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className={cx(
                "h-9 w-9 rounded-lg border border-white/10",
                "hover:bg-white/5 transition-colors",
                isLoading && "opacity-60 cursor-not-allowed"
              )}
              disabled={isLoading}
              aria-label="refresh"
              title="refresh"
            >
              <span className="sr-only">refresh</span>
              <span aria-hidden className="inline-flex h-full w-full items-center justify-center text-slate-100/80">
                ↻
              </span>
            </button>
          ) : null}
        </div>

        {/* search */}
        <div className="mt-3">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300/60">⌕</span>
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="search conversations..."
              className={cx(
                "w-full h-10 rounded-lg border border-white/10 bg-transparent",
                "pl-7 pr-3 text-sm text-slate-100",
                "outline-none focus:ring-2 focus:ring-indigo-500/40"
              )}
            />
          </div>
        </div>

        {/* filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleFilters.map((f) => {
            const active = f.key === activeFilter;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => onFilterChange(f.key)}
                className={cx(
                  "px-2.5 py-1 rounded text-xs border transition-colors",
                  "border-white/10",
                  active ? "bg-white/10 text-slate-100" : "hover:bg-white/5 text-slate-200/80"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* body */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-hidden">
          <div className="h-full overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-sm text-slate-300/70">loading conversations...</div>
            ) : isError ? (
              <div className="p-4 space-y-3">
                <div className="text-sm text-slate-300/70">failed to load conversations</div>
                <div className="text-xs text-slate-300/70 break-words">{error?.primary ?? "unknown error"}</div>
                {error?.debug ? (
                  <div className="text-xs text-slate-300/50 break-words">{error.debug}</div>
                ) : null}
                {onRetry ? (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                  >
                    try again
                  </button>
                ) : null}
              </div>
            ) : threads.length === 0 ? (
              <div className="p-4 space-y-2">
                <div className="text-sm text-slate-300/70">no conversations</div>
                <div className="text-xs text-slate-300/60">
                  tip: support, tournaments and friendlies create chats automatically
                </div>
              </div>
            ) : (
              <div className="py-1">
                {splitSystemSection && activeFilter === "all" ? (
                  <>
                    {sectionLabel("conversations")}
                    {listNonSystem.map((t) => renderThreadRow(t, selectedThreadId, onSelectThread))}
                    {listSystem.length > 0 ? (
                      <>
                        {sectionLabel("system")}
                        {listSystem.map((t) => renderThreadRow(t, selectedThreadId, onSelectThread))}
                      </>
                    ) : null}
                  </>
                ) : (
                  <>{threads.map((t) => renderThreadRow(t, selectedThreadId, onSelectThread))}</>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
