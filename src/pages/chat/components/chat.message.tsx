import * as React from "react";

// ============================================================================
// Types
// ============================================================================

export type ChatRole = "user" | "assistant";

export type ChatMessageStatus =
  | "sending"
  | "sent"
  | "error";

export type ChatMessageData = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number; // unix ms
  status?: ChatMessageStatus;
};

// ============================================================================
// Utils (local, no external deps)
// ============================================================================

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// ============================================================================
// Component
// ============================================================================

type Props = {
  message: ChatMessageData;
};

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";
  const text = normalizeText(message.content);

  return (
    <div
      className={[
        "w-full flex",
        isUser ? "justify-end" : "justify-start",
      ].join(" ")}
    >
      <div
        className={[
          "max-w-[78%]",
          "rounded-lg px-3 py-2",
          "text-sm leading-relaxed",
          "whitespace-pre-wrap break-words",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-800 text-zinc-100",
        ].join(" ")}
      >
        {/* Content */}
        <div>{text || <span className="opacity-50">…</span>}</div>

        {/* Meta */}
        <div className="mt-1 flex items-center justify-end gap-2 text-[11px] opacity-70">
          <span>{formatTime(message.createdAt)}</span>

          {message.status === "sending" && (
            <span className="italic">sending</span>
          )}

          {message.status === "error" && (
            <span className="text-red-400 font-medium">error</span>
          )}
        </div>
      </div>
    </div>
  );
}
