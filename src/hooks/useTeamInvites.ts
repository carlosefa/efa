import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TeamInvite {
  id: string;
  team_id: string;
  invited_user_id: string | null;
  invited_email: string | null;
  invited_by: string;
  role: string;
  message: string | null;
  status: string;
  expires_at: string;
  responded_at: string | null;
  created_at: string;
  team?: {
    id: string;
    name: string;
    tag: string;
    logo_url: string | null;
  };
  inviter?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Get invites sent by teams I own/manage
export function useTeamOutgoingInvites(teamId?: string) {
  return useQuery({
    queryKey: ["team_invites", "outgoing", teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from("team_invites")
        .select(`
          *,
          invited_user:profiles!team_invites_invited_user_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });
}

// Get invites I received
export function useMyTeamInvites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["team_invites", "incoming", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("team_invites")
        .select(`
          *,
          team:teams(id, name, tag, logo_url),
          inviter:profiles!team_invites_invited_by_fkey(id, username, display_name, avatar_url)
        `)
        .or(`invited_user_id.eq.${user.id},invited_email.eq.${user.email}`)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TeamInvite[];
    },
    enabled: !!user,
  });
}

// Send invite to a player
export function useSendTeamInvite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      teamId,
      invitedUserId,
      invitedEmail,
      role = "player",
      message,
    }: {
      teamId: string;
      invitedUserId?: string;
      invitedEmail?: string;
      role?: string;
      message?: string;
    }) => {
      if (!user) throw new Error("Não autenticado");
      if (!invitedUserId && !invitedEmail) {
        throw new Error("Informe o ID do usuário ou email");
      }

      const { data, error } = await supabase
        .from("team_invites")
        .insert({
          team_id: teamId,
          invited_user_id: invitedUserId || null,
          invited_email: invitedEmail || null,
          invited_by: user.id,
          role,
          message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team_invites", "outgoing", variables.teamId] });
      toast({
        title: "Convite enviado!",
        description: "O jogador receberá uma notificação.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Respond to invite (accept/decline)
export function useRespondToTeamInvite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      inviteId,
      accept,
    }: {
      inviteId: string;
      accept: boolean;
    }) => {
      if (!user) throw new Error("Não autenticado");

      // Update invite status
      const { data: invite, error: updateError } = await supabase
        .from("team_invites")
        .update({
          status: accept ? "accepted" : "declined",
          responded_at: new Date().toISOString(),
        })
        .eq("id", inviteId)
        .select("*, team:teams(id, name)")
        .single();

      if (updateError) throw updateError;

      // If accepted, add to team
      if (accept && invite) {
        const { error: membershipError } = await supabase
          .from("team_memberships")
          .insert({
            team_id: invite.team_id,
            profile_id: user.id,
            role: invite.role,
          });

        if (membershipError) throw membershipError;
      }

      return invite;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team_invites"] });
      queryClient.invalidateQueries({ queryKey: ["my_teams"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      
      toast({
        title: variables.accept ? "Convite aceito!" : "Convite recusado",
        description: variables.accept 
          ? `Você agora faz parte do time ${data?.team?.name}` 
          : "O convite foi recusado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao responder convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Cancel invite
export function useCancelTeamInvite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("team_invites")
        .update({ status: "cancelled" })
        .eq("id", inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_invites"] });
      toast({
        title: "Convite cancelado",
      });
    },
  });
}
