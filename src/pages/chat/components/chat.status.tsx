import * as React from "react";

export type ChatStatusType =
  | "idle"
  | "typing"
  | "sending"
  | "locked"
  | "error";

export type ChatStatusProps = {
  status: ChatStatusType;
  message?: string;
};

/**
 * chat/components/chat.status.tsx
 *
 * Responsabilidade:
 * - Exibir estado atual do chat de forma discreta e institucional
 *
 * Estados suportados:
 * - idle     : nada exibido
 * - typing   : assistant digitando
 * - sending  : mensagem sendo enviada
 * - locked   : chat bloqueado (read-only)
 * - error    : erro operacional
 *
 * NÃO faz:
 * - fetch
 * - side-effects
 * - controle de estado
 */

function statusConfig(
  status: ChatStatusType,
  message?: string
): { label: string; className: string } | null {
  switch (status) {
    case "typing":
      return {
        label: message ?? "assistant is typing…",
        className: "text-slate-300/70",
      };
    case "sending":
      return {
        label: message ?? "sending…",
        className: "text-slate-300/70",
      };
    case "locked":
      return {
        label: message ?? "chat is locked",
        className: "text-amber-400/80",
      };
    case "error":
      return {
        label: message ?? "temporary error",
        className: "text-red-400/80",
      };
    case "idle":
    default:
      return null;
  }
}

export default function ChatStatus(
  props: ChatStatusProps
): JSX.Element | null {
  const cfg = statusConfig(props.status, props.message);
  if (!cfg) return null;

  return (
    <div
      className={[
        "text-xs",
        "transition-opacity",
        "duration-200",
        cfg.className,
      ].join(" ")}
      aria-live="polite"
    >
      {cfg.label}
    </div>
  );
}
