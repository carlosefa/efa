import * as React from "react";

export type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
};

export type ChatMessagesProps = {
  messages: Message[];
};

/**
 * chat/components/chat.messages.tsx
 *
 * Responsabilidade:
 * - Renderizar a área central do chat
 * - Exibir mensagens em formato de bolhas
 * - Alinhar user à direita e assistant à esquerda
 * - Mostrar timestamp discreto
 * - Manter scroll sempre no final quando novas mensagens entram
 *
 * NÃO faz:
 * - Envio de mensagens
 * - Controle de estado global
 * - Lógica de input/footer
 */

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatMessages(props: ChatMessagesProps): JSX.Element {
  const { messages } = props;

  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[78%] space-y-1">
                <div
                  className={[
                    "rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap border border-white/5",
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-100",
                  ].join(" ")}
                >
                  {msg.content}
                </div>

                <div
                  className={`text-[11px] opacity-60 ${
                    isUser ? "text-right" : "text-left"
                  }`}
                >
                  {formatTimestamp(msg.createdAt)}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
