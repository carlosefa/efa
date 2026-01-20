import * as React from "react";

export type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
};

export type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;

  onSend: () => void;

  sending: boolean;

  placeholder?: string;
};

/**
 * chat/components/chat.input.tsx
 *
 * Responsabilidade:
 * - Footer fixo do chat (textarea + botão)
 * - Enter envia
 * - Shift+Enter quebra linha
 * - Não enviar durante IME/composição (e.nativeEvent.isComposing)
 * - Estado visual "Sending..."
 * - Desabilitar envio se vazio/whitespace ou sending=true (race)
 *
 * NÃO faz:
 * - gerar IDs
 * - empurrar mensagens para o state (isso é do chat.screen)
 */

function normalizeText(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function canSend(text: string, sending: boolean): boolean {
  if (sending) return false;
  return normalizeText(text).trim().length > 0;
}

export default function ChatInput(props: ChatInputProps): JSX.Element {
  const { value, onChange, onSend, sending, placeholder } = props;

  const sendDisabled = !canSend(value, sending);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key !== "Enter") return;

    // Shift+Enter = newline
    if (e.shiftKey) return;

    // IME/composition active -> do not send
    if (e.nativeEvent.isComposing) return;

    // Enter -> send
    e.preventDefault();
    if (sendDisabled) return;
    onSend();
  };

  const handleClick = (): void => {
    if (sendDisabled) return;
    onSend();
  };

  return (
    <div className="shrink-0 border-t border-white/10 px-4 py-3 bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/10">
      <div className="mx-auto w-full max-w-4xl flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onChange(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ?? "Type a message... (Enter to send, Shift+Enter for newline)"
          }
          rows={2}
          disabled={sending}
          className="min-h-[48px] max-h-40 w-full resize-none rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
        />

        <button
          type="button"
          onClick={handleClick}
          disabled={sendDisabled}
          aria-label="send"
          className={[
            "inline-flex h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors",
            sendDisabled
              ? "cursor-not-allowed opacity-60 border border-white/10"
              : "bg-indigo-600 text-white hover:bg-indigo-500",
          ].join(" ")}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
