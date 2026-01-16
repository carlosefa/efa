import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFriendlyInvites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["friendly_invites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("friendly_invites")
        .select(`*, from_user:profiles!friendly_invites_from_user_id_fkey(id, username, display_name, avatar_url), to_user:profiles!friendly_invites_to_user_id_fkey(id, username, display_name, avatar_url), game:games(name, slug)`)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useFriendlyMatches() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["friendly_matches", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("friendly_matches")
        .select(`*, player1:profiles!friendly_matches_player1_id_fkey(id, username, display_name, avatar_url), player2:profiles!friendly_matches_player2_id_fkey(id, username, display_name, avatar_url), game:games(name, slug)`)
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useSendFriendlyInvite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ toUserId, gameId, message }: { toUserId: string; gameId: string; message?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("friendly_invites").insert({ from_user_id: user.id, to_user_id: toUserId, game_id: gameId, message }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friendly_invites"] }),
  });
}

export function useRespondToInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ inviteId, accept }: { inviteId: string; accept: boolean }) => {
      const { data, error } = await supabase.from("friendly_invites").update({ status: accept ? "accepted" : "declined" }).eq("id", inviteId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friendly_invites"] }),
  });
}
