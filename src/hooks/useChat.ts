import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export function useChatThreads() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["chat_threads", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("chat_threads").select(`*, chat_participants!inner(user_id)`).eq("chat_participants.user_id", user.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useChatMessages(threadId?: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!threadId) return;
    const channel = supabase.channel(`messages-${threadId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${threadId}` }, () => {
      queryClient.invalidateQueries({ queryKey: ["chat_messages", threadId] });
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [threadId, queryClient]);

  return useQuery({
    queryKey: ["chat_messages", threadId],
    queryFn: async () => {
      if (!threadId) return [];
      const { data, error } = await supabase.from("chat_messages").select(`*, sender:profiles!chat_messages_sender_id_fkey(id, username, display_name, avatar_url)`).eq("thread_id", threadId).is("deleted_at", null).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!threadId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ threadId, content }: { threadId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("chat_messages").insert({ thread_id: threadId, sender_id: user.id, content }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ["chat_messages", vars.threadId] }),
  });
}

export function useCreateDirectThread() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { data: thread, error: threadError } = await supabase.from("chat_threads").insert({ type: "direct", created_by: user.id }).select().single();
      if (threadError) throw threadError;
      await supabase.from("chat_participants").insert([{ thread_id: thread.id, user_id: user.id, role: "owner" }, { thread_id: thread.id, user_id: otherUserId, role: "member" }]);
      return thread;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat_threads"] }),
  });
}
