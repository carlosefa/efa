import * as React from "react";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; createdAt: string };

export function normalizeText(input: string): string {
  // Normalize line endings to \n (keeps content intact; trimming happens in canSend/send)
  return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function canSend(text: string, sending: boolean): boolean {
  if (sending) return false;
  return normalizeText(text).trim().length > 0;
}

export function makeId(): string {
  // Prefer crypto.randomUUID when available. Fallback to getRandomValues (UUID v4).
  // Final fallback uses time+random (UI-safe, not cryptographic).

  const g = globalThis as unknown as Record<string, unknown>;
  const cryptoObj = g["crypto"];

  if (cryptoObj && typeof cryptoObj === "object") {
    const c = cryptoObj as Record<string, unknown>;

    const randomUUID = c["randomUUID"];
    if (typeof randomUUID === "function") {
      try {
        const fn = randomUUID as (this: unknown) => string;
        const id = fn.call(cryptoObj);
        if (typeof id === "string" && id.length > 0) return id;
      } catch {
        // fall through
      }
    }

    const getRandomValues = c["getRandomValues"];
    if (typeof getRandomValues === "function") {
      try {
        const bytes = new Uint8Array(16);
        const grv = getRandomValues as (this: unknown, arr: Uint8Array) => Uint8Array;
        grv.call(cryptoObj, bytes);

        // RFC 4122 version 4
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex: string[] = [];
        for (let i = 0; i < bytes.length; i += 1) {
          hex.push(bytes[i].toString(16).padStart(2, "0"));
        }

        return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
          .slice(6, 8)
          .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
      } catch {
        // fall through
      }
    }
  }

  const a = Date.now().toString(36);
  const b = Math.random().toString(36).slice(2);
  const c = Math.random().toString(36).slice(2);
  return `${a}-${b}-${c}`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  return d.toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function randomDelayMs(min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function clamp(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, Math.max(0, maxLen - 1))}…`;
}

function makeAssistantReply(userText: string): string {
  const clean = normalizeText(userText).trim();
  const sample = clamp(clean, 220);

  const variants: string[] = [
    `Entendi.\n\nVocê disse:\n${sample}`,
    `Ok — recebido.\n\nResumo:\n${sample}`,
    `Certo. Anotado.\n\nMensagem:\n${sample}`,
    `Perfeito.\n\nRegistrado:\n${sample}`,
  ];

  const idx = Math.floor(Math.random() * variants.length);
  return variants[idx] ?? variants[0];
}

export default function ChatScreen(): JSX.Element {
  const [messages, setMessages] = React.useState<Message[]>(() => [
    {
      id: makeId(),
      role: "assistant",
      content: "Olá! Envie uma mensagem e eu respondo.",
      createdAt: new Date().toISOString(),
    },
  ]);

  const [draft, setDraft] = React.useState<string>("");
  const [sending, setSending] = React.useState<boolean>(false);

  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const timerRef = React.useRef<number | null>(null);

  const scrollToBottom = React.useCallback((): void => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const doSend = React.useCallback((): void => {
    if (!canSend(draft, sending)) return;

    const content = normalizeText(draft).trim();
    const userMsg: Message = {
      id: makeId(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    // add user message immediately
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    setSending(true);

    // defensive: clear any pending timer
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const delay = randomDelayMs(600, 1200);
    timerRef.current = window.setTimeout(() => {
      const assistantMsg: Message = {
        id: makeId(),
        role: "assistant",
        content: makeAssistantReply(content),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setSending(false);
      timerRef.current = null;
    }, delay);
  }, [draft, sending]);

  const onTextareaKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key !== "Enter") return;

      // Shift+Enter: newline
      if (e.shiftKey) return;

      // Do not send during IME/composition
      if (e.nativeEvent.isComposing) return;

      // Enter: send (prevent newline)
      e.preventDefault();

      // If cannot send (sending or empty), keep behavior consistent: no newline, no send
      doSend();
    },
    [doSend]
  );

  const sendDisabled = !canSend(draft, sending);
  const sendLabel = sending ? "Sending..." : "Send";

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="mx-auto w-full max-w-4xl flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">Chat</h1>
          <div className="text-xs text-slate-300/60">{sending ? "assistant is typing..." : ""}</div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-4xl overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[78%] space-y-1">
                  <div
                    className={[
                      "rounded-2xl px-4 py-2 shadow-sm border border-white/5",
                      isUser ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-100",
                    ].join(" ")}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                  </div>

                  <div className={`text-[11px] opacity-60 ${isUser ? "text-right" : "text-left"}`}>
                    {formatTimestamp(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-white/10 px-4 py-3 bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/10">
        <div className="mx-auto w-full max-w-4xl flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
            onKeyDown={onTextareaKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
            rows={2}
            className="min-h-[48px] max-h-40 w-full resize-none rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          <button
            type="button"
            onClick={doSend}
            disabled={sendDisabled}
            aria-label="send"
            className={[
              "inline-flex h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors",
              sendDisabled
                ? "cursor-not-allowed opacity-60 border border-white/10"
                : "bg-indigo-600 text-white hover:bg-indigo-500",
            ].join(" ")}
          >
            {sendLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}


