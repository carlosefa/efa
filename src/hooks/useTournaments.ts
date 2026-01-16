import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type TournamentStatus = Database["public"]["Enums"]["tournament_status"];
type TournamentFormat = Database["public"]["Enums"]["tournament_format"];

// ============ TOURNAMENTS ============
export function useTournaments(filters?: {
  status?: TournamentStatus | TournamentStatus[];
  gameId?: string;
  countryId?: string;
  createdBy?: string;
}) {
  return useQuery({
    queryKey: ["tournaments", filters],
    queryFn: async () => {
      let query = supabase
        .from("tournaments")
        .select(`
          *,
          game_modes(name, slug, team_size, games(name, slug, icon_url)),
          countries(name, code),
          organizations(name, slug, logo_url),
          creator:profiles!tournaments_created_by_fkey(username, display_name),
          tournament_registrations(count)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in("status", filters.status);
        } else {
          query = query.eq("status", filters.status);
        }
      }

      if (filters?.gameId) {
        query = query.eq("game_modes.game_id", filters.gameId);
      }

      if (filters?.countryId) {
        query = query.eq("country_id", filters.countryId);
      }

      if (filters?.createdBy) {
        query = query.eq("created_by", filters.createdBy);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useTournament(tournamentId?: string) {
  return useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return null;
      const { data, error } = await supabase
        .from("tournaments")
        .select(`
          *,
          game_modes(id, name, slug, team_size, stat_fields, games(id, name, slug, icon_url)),
          rulesets(id, name, config),
          countries(id, name, code, timezone),
          organizations(id, name, slug, logo_url),
          creator:profiles!tournaments_created_by_fkey(id, username, display_name, avatar_url)
        `)
        .eq("id", tournamentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
  });
}

export function useTournamentRegistrations(tournamentId?: string) {
  return useQuery({
    queryKey: ["tournament_registrations", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      const { data, error } = await supabase
        .from("tournament_registrations")
        .select(`
          *,
          team:teams(id, name, tag, logo_url, countries(name, code))
        `)
        .eq("tournament_id", tournamentId)
        .order("registered_at");
      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
  });
}

export function useTournamentStages(tournamentId?: string) {
  return useQuery({
    queryKey: ["tournament_stages", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("stage_order");
      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
  });
}

export function useStageFixtures(stageId?: string) {
  return useQuery({
    queryKey: ["stage_fixtures", stageId],
    queryFn: async () => {
      if (!stageId) return [];
      const { data, error } = await supabase
        .from("fixtures")
        .select(`
          *,
          home_team:teams!fixtures_home_team_id_fkey(id, name, tag, logo_url),
          away_team:teams!fixtures_away_team_id_fkey(id, name, tag, logo_url),
          matches(*)
        `)
        .eq("stage_id", stageId)
        .order("round")
        .order("match_number");
      if (error) throw error;
      return data;
    },
    enabled: !!stageId,
  });
}

export function useStageStandings(stageId?: string) {
  return useQuery({
    queryKey: ["stage_standings", stageId],
    queryFn: async () => {
      if (!stageId) return [];
      const { data, error } = await supabase
        .from("standings")
        .select(`
          *,
          team:teams(id, name, tag, logo_url)
        `)
        .eq("stage_id", stageId)
        .order("group_number")
        .order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!stageId,
  });
}

export function useMyTournaments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my_tournaments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tournaments")
        .select(`
          *,
          game_modes(name, games(name, icon_url)),
          tournament_registrations(count)
        `)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (tournament: {
      name: string;
      slug: string;
      description?: string;
      game_mode_id: string;
      ruleset_id?: string;
      format: TournamentFormat;
      max_teams: number;
      min_teams?: number;
      prize_description?: string;
      rules_text?: string;
      starts_at?: string;
      ends_at?: string;
      registration_starts_at?: string;
      registration_ends_at?: string;
      timezone?: string;
      country_id?: string;
      organization_id?: string;
      is_international?: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tournaments")
        .insert({
          ...tournament,
          created_by: user.id,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["my_tournaments"] });
    },
  });
}

export function useUpdateTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      description?: string;
      status?: TournamentStatus;
      max_teams?: number;
      prize_description?: string;
      rules_text?: string;
      starts_at?: string;
      ends_at?: string;
      registration_starts_at?: string;
      registration_ends_at?: string;
    }) => {
      const { data, error } = await supabase
        .from("tournaments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournament", data.id] });
      queryClient.invalidateQueries({ queryKey: ["my_tournaments"] });
    },
  });
}

export function useRegisterTeam() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      tournamentId,
      teamId,
    }: {
      tournamentId: string;
      teamId: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tournament_registrations")
        .insert({
          tournament_id: tournamentId,
          team_id: teamId,
          registered_by: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tournament_registrations", variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}
