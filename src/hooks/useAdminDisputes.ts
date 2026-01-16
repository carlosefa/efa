import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAdminDisputes(filters?: { status?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ["admin_disputes", filters],
    queryFn: async () => {
      let query = supabase
        .from("disputes")
        .select(`
          *,
          match:matches(
            id,
            home_score,
            away_score,
            status,
            home_team:teams!matches_home_team_id_fkey(id, name, tag, logo_url),
            away_team:teams!matches_away_team_id_fkey(id, name, tag, logo_url)
          ),
          opened_by_user:profiles!disputes_opened_by_fkey(username, display_name)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status as "open" | "under_review" | "resolved" | "escalated");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const resolveDispute = useMutation({
    mutationFn: async ({
      disputeId,
      matchId,
      resolution,
      reason,
      homeScore,
      awayScore,
    }: {
      disputeId: string;
      matchId: string;
      resolution: "home_win" | "away_win" | "draw" | "rematch" | "cancel";
      reason: string;
      homeScore?: number;
      awayScore?: number;
    }) => {
      // Get match details
      const { data: match } = await supabase
        .from("matches")
        .select("home_team_id, away_team_id")
        .eq("id", matchId)
        .single();

      if (!match) throw new Error("Match not found");

      let winnerId: string | null = null;
      let matchStatus = "finished";

      if (resolution === "home_win") {
        winnerId = match.home_team_id;
      } else if (resolution === "away_win") {
        winnerId = match.away_team_id;
      } else if (resolution === "rematch") {
        matchStatus = "scheduled";
      } else if (resolution === "cancel") {
        matchStatus = "cancelled";
      }

      // Update match
      const matchUpdate: any = {
        status: matchStatus,
        decided_by: user?.id,
        decision_reason: reason,
        updated_at: new Date().toISOString(),
      };

      if (homeScore !== undefined) matchUpdate.home_score = homeScore;
      if (awayScore !== undefined) matchUpdate.away_score = awayScore;
      if (winnerId) matchUpdate.winner_team_id = winnerId;

      const { error: matchError } = await supabase
        .from("matches")
        .update(matchUpdate)
        .eq("id", matchId);

      if (matchError) throw matchError;

      // Update dispute
      const { error: disputeError } = await supabase
        .from("disputes")
        .update({
          status: "resolved",
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          resolution_reason: reason,
        })
        .eq("id", disputeId);

      if (disputeError) throw disputeError;

      // Create match event
      await supabase.from("match_events").insert({
        match_id: matchId,
        event_type: "dispute_resolved",
        actor_id: user?.id,
        payload: { resolution, reason, home_score: homeScore, away_score: awayScore },
      });

      // Create audit log
      await supabase.from("audit_logs").insert({
        actor_id: user?.id,
        action: "dispute_resolved",
        target_type: "dispute",
        target_id: disputeId,
        details: `${resolution}: ${reason}`,
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_disputes"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast.success("Disputa resolvida com sucesso");
    },
    onError: (error) => {
      console.error("Failed to resolve dispute:", error);
      toast.error("Erro ao resolver disputa");
    },
  });

  const applyWO = useMutation({
    mutationFn: async ({
      disputeId,
      matchId,
      winnerId,
      reason,
    }: {
      disputeId: string;
      matchId: string;
      winnerId: string;
      reason: string;
    }) => {
      // Update match with W.O.
      const { error: matchError } = await supabase
        .from("matches")
        .update({
          status: "finished",
          winner_team_id: winnerId,
          home_score: 3,
          away_score: 0,
          decided_by: user?.id,
          decision_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      if (matchError) throw matchError;

      // Update dispute
      const { error: disputeError } = await supabase
        .from("disputes")
        .update({
          status: "resolved",
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          resolution_reason: `W.O.: ${reason}`,
        })
        .eq("id", disputeId);

      if (disputeError) throw disputeError;

      // Create match event
      await supabase.from("match_events").insert({
        match_id: matchId,
        event_type: "wo_applied",
        actor_id: user?.id,
        payload: { winner_id: winnerId, reason },
      });

      // Create audit log
      await supabase.from("audit_logs").insert({
        actor_id: user?.id,
        action: "wo_applied",
        target_type: "match",
        target_id: matchId,
        details: reason,
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_disputes"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast.success("W.O. aplicado com sucesso");
    },
    onError: (error) => {
      console.error("Failed to apply W.O.:", error);
      toast.error("Erro ao aplicar W.O.");
    },
  });

  return {
    disputes,
    isLoading,
    resolveDispute,
    applyWO,
    isResolving: resolveDispute.isPending || applyWO.isPending,
  };
}
