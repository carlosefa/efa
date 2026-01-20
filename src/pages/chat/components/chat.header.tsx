import * as React from "react";

export type ChatHeaderProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
};

/**
 * chat/components/chat.header.tsx
 *
 * Responsabilidade:
 * - Header superior do chat (título + subtítulo opcional)
 * - Slot à direita para ações (ex: refresh, status)
 *
 * NÃO faz:
 * - lógica de mensagens
 * - fetch
 * - navegação
 */

export default function ChatHeader(props: ChatHeaderProps): JSX.Element {
  const { title = "Chat", subtitle, rightSlot } = props;

  return (
    <header className="shrink-0 border-b border-white/10 px-4 py-3">
      <div className="mx-auto w-full max-w-4xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate">{title}</h1>
          {subtitle ? (
            <div className="text-xs text-slate-300/60 truncate">{subtitle}</div>
          ) : null}
        </div>

        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </header>
  );
}
