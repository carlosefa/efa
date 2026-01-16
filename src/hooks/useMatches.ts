import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type MatchStatus = Database["public"]["Enums"]["match_status"];

// ============ MATCHES ============
export function useMatches(filters?: {
  status?: MatchStatus | MatchStatus[];
  teamId?: string;
  tournamentId?: string;
}) {
  return useQuery({
    queryKey: ["matches", filters],
    queryFn: async () => {
      let query = supabase
        .from("matches")
        .select(`
          *,
          fixture:fixtures(
            id, round, match_number, scheduled_at, bracket_position,
            stage:stages(
              id, name,
              tournament:tournaments(id, name, slug)
            )
          ),
          home_team:teams!matches_home_team_id_fkey(id, name, tag, logo_url),
          away_team:teams!matches_away_team_id_fkey(id, name, tag, logo_url),
          winner:teams!matches_winner_team_id_fkey(id, name, tag)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in("status", filters.status);
        } else {
          query = query.eq("status", filters.status);
        }
      }

      if (filters?.teamId) {
        query = query.or(`home_team_id.eq.${filters.teamId},away_team_id.eq.${filters.teamId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useMatch(matchId?: string) {
  return useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      if (!matchId) return null;
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          fixture:fixtures(
            id, round, match_number, scheduled_at, bracket_position,
            stage:stages(
              id, name, format,
              tournament:tournaments(id, name, slug, timezone, game_modes(name, games(name)))
            )
          ),
          home_team:teams!matches_home_team_id_fkey(id, name, tag, logo_url, owner_id),
          away_team:teams!matches_away_team_id_fkey(id, name, tag, logo_url, owner_id),
          winner:teams!matches_winner_team_id_fkey(id, name, tag),
          reporter:profiles!matches_reported_by_fkey(username, display_name),
          confirmer:profiles!matches_confirmed_by_fkey(username, display_name),
          decider:profiles!matches_decided_by_fkey(username, display_name)
        `)
        .eq("id", matchId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });
}

export function useMatchEvents(matchId?: string) {
  return useQuery({
    queryKey: ["match_events", matchId],
    queryFn: async () => {
      if (!matchId) return [];
      const { data, error } = await supabase
        .from("match_events")
        .select(`
          *,
          actor:profiles!match_events_actor_id_fkey(username, display_name, avatar_url)
        `)
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });
}

export function useMatchDisputes(matchId?: string) {
  return useQuery({
    queryKey: ["match_disputes", matchId],
    queryFn: async () => {
      if (!matchId) return [];
      const { data, error } = await supabase
        .from("disputes")
        .select(`
          *,
          opener:profiles!disputes_opened_by_fkey(username, display_name),
          resolver:profiles!disputes_resolved_by_fkey(username, display_name)
        `)
        .eq("match_id", matchId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });
}

export function useReportResult() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      matchId,
      homeScore,
      awayScore,
    }: {
      matchId: string;
      homeScore: number;
      awayScore: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Update match
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .update({
          home_score: homeScore,
          away_score: awayScore,
          reported_by: user.id,
          status: "pending_confirm",
        })
        .eq("id", matchId)
        .select()
        .single();

      if (matchError) throw matchError;

      // Create event
      await supabase.from("match_events").insert({
        match_id: matchId,
        event_type: "result_reported",
        actor_id: user.id,
        payload: { home_score: homeScore, away_score: awayScore },
      });

      return match;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["match", data.id] });
      queryClient.invalidateQueries({ queryKey: ["match_events", data.id] });
    },
  });
}

export function useConfirmResult() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ matchId }: { matchId: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Get match to determine winner
      const { data: matchData } = await supabase
        .from("matches")
        .select("home_score, away_score, home_team_id, away_team_id")
        .eq("id", matchId)
        .single();

      if (!matchData) throw new Error("Match not found");

      let winnerId = null;
      if (matchData.home_score! > matchData.away_score!) {
        winnerId = matchData.home_team_id;
      } else if (matchData.away_score! > matchData.home_score!) {
        winnerId = matchData.away_team_id;
      }

      // Update match
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .update({
          confirmed_by: user.id,
          status: "finished",
          winner_team_id: winnerId,
          played_at: new Date().toISOString(),
        })
        .eq("id", matchId)
        .select()
        .single();

      if (matchError) throw matchError;

      // Create event
      await supabase.from("match_events").insert({
        match_id: matchId,
        event_type: "result_confirmed",
        actor_id: user.id,
        payload: { confirmed: true },
      });

      return match;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["match", data.id] });
      queryClient.invalidateQueries({ queryKey: ["match_events", data.id] });
    },
  });
}

export function useOpenDispute() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      matchId,
      reason,
      evidenceUrls,
    }: {
      matchId: string;
      reason: string;
      evidenceUrls?: string[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Update match status
      await supabase.from("matches").update({ status: "disputed" }).eq("id", matchId);

      // Create dispute
      const { data: dispute, error } = await supabase
        .from("disputes")
        .insert({
          match_id: matchId,
          opened_by: user.id,
          reason,
          evidence_urls: evidenceUrls || [],
          sla_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h
        })
        .select()
        .single();

      if (error) throw error;

      // Create event
      await supabase.from("match_events").insert({
        match_id: matchId,
        event_type: "dispute_opened",
        actor_id: user.id,
        payload: { reason, dispute_id: dispute.id },
      });

      return dispute;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["match", variables.matchId] });
      queryClient.invalidateQueries({ queryKey: ["match_events", variables.matchId] });
      queryClient.invalidateQueries({ queryKey: ["match_disputes", variables.matchId] });
    },
  });
}
