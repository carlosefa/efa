// src/pages/chat/hooks/use.send.message.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type SendMessagePayload = {
  threadId: string;
  content: string;
  replyToId?: string | null;
  fileUrl?: string | null;
};

type ChatMessageRow = Tables<"chat_messages">;
type ChatMessageInsert = TablesInsert<"chat_messages">;

type OptimisticCtx = {
  threadId: string;
  prevMessages: unknown;
  tempId: string;
};

const qkMessages = (threadId: string) => ["chatMessages", threadId] as const;

// ---------------- helpers (no any) ----------------
type CryptoLike = { randomUUID?: () => string; getRandomValues?: (arr: Uint8Array) => Uint8Array };

function getCrypto(): CryptoLike | undefined {
  const g = globalThis as unknown as { crypto?: CryptoLike };
  return g.crypto;
}

function makeId(): string {
  const c = getCrypto();
  if (c?.randomUUID) return c.randomUUID();

  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  for (let i = 0; i < bytes.length; i += 1) {
    if (bytes[i] === 0) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function coerceArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function nowIso(): string {
  return new Date().toISOString();
}

// ---------------- hook ----------------
export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendMessagePayload): Promise<ChatMessageRow> => {
      const threadId = payload.threadId.trim();
      const text = payload.content.trim();

      if (!threadId) throw new Error("threadId is required");
      if (!text) throw new Error("message content is empty");

      // sender_id is REQUIRED by your generated types
      const userRes = await supabase.auth.getUser();
      const senderId = userRes.data.user?.id ?? null;
      if (!senderId) throw new Error("not authenticated");

      const insertRow: ChatMessageInsert = {
        thread_id: threadId,
        sender_id: senderId,
        content: text,

        // optional extras already present in your types
        reply_to_id: payload.replyToId ?? null,
        file_url: payload.fileUrl ?? null,

        // optional; keeps it explicit and stable
        type: "text",
      };

      const res = await supabase.from("chat_messages").insert([insertRow]).select("*").single();
      if (res.error) throw new Error(res.error.message || "failed to send message");

      return res.data as ChatMessageRow;
    },

    onMutate: async (payload): Promise<OptimisticCtx> => {
      const threadId = payload.threadId.trim();
      const text = payload.content.trim();

      await qc.cancelQueries({ queryKey: qkMessages(threadId) });

      const prevMessages = qc.getQueryData(qkMessages(threadId));
      const tempId = makeId();

      // best effort sender id for optimistic (if not available, keep a placeholder string)
      const userRes = await supabase.auth.getUser();
      const senderId = userRes.data.user?.id ?? "optimistic";

      const optimistic: ChatMessageRow = {
        id: tempId,
        thread_id: threadId,
        sender_id: senderId,
        content: text,
        type: "text",
        created_at: nowIso(),
        edited_at: null,
        deleted_at: null,
        file_url: payload.fileUrl ?? null,
        reply_to_id: payload.replyToId ?? null,
      };

      qc.setQueryData(qkMessages(threadId), (cur: unknown) => {
        const list = coerceArray<ChatMessageRow>(cur);
        return [...list, optimistic];
      });

      return { threadId, prevMessages, tempId };
    },

    onError: (_err, _payload, ctx) => {
      if (!ctx) return;
      qc.setQueryData(qkMessages(ctx.threadId), ctx.prevMessages);
    },

    onSuccess: (serverMsg, payload, ctx) => {
      if (!ctx) return;
      const threadId = payload.threadId.trim();

      // Replace temp message with server message
      qc.setQueryData(qkMessages(threadId), (cur: unknown) => {
        const list = coerceArray<ChatMessageRow>(cur);
        return list.map((m) => (m.id === ctx.tempId ? serverMsg : m));
      });
    },

    onSettled: (_data, _err, payload) => {
      const threadId = payload.threadId.trim();
      qc.invalidateQueries({ queryKey: qkMessages(threadId) });
    },
  });
}
