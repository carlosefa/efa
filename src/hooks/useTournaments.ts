import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type TournamentStatus = Database["public"]["Enums"]["tournament_status"];
type TournamentFormat = Database["public"]["Enums"]["tournament_format"];

// ============ TOURNAMENTS ============

export function useTournaments(filters?: {
  status?: TournamentStatus | TournamentStatus[];
  gameId?: string; // games.id
  createdBy?: string; // profiles.id (same as auth.users.id)
}) {
  return useQuery({
    queryKey: ["tournaments", filters],
    queryFn: async () => {
      let query = supabase
        .from("tournaments")
        .select(
          `
          *,
          game_modes(
            id, name, slug, team_size,
            games(id, name, slug)
          ),
          rulesets(id, name),
          creator:profiles!tournaments_created_by_fkey(id, username, online_id),
          tournament_registrations(count)
        `
        )
        .order("created_at", { ascending: false });

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in("status", filters.status);
        } else {
          query = query.eq("status", filters.status);
        }
      }

      // Filter by gameId (games.id) through game_modes relationship
      if (filters?.gameId) {
        query = query.eq("game_modes.game_id", filters.gameId);
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
        .select(
          `
          *,
          game_modes(
            id, name, slug, team_size,
            games(id, name, slug)
          ),
          rulesets(id, name, config),
          creator:profiles!tournaments_created_by_fkey(id, username, online_id)
        `
        )
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
        .select(
          `
          *,
          team:teams(id, name, tag)
        `
        )
        .eq("tournament_id", tournamentId)
        .order("registered_at");

      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
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
        .select(
          `
          *,
          game_modes(
            id, name, slug, team_size,
            games(id, name, slug)
          ),
          tournament_registrations(count)
        `
        )
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// ============ MUTATIONS ============

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

      is_international?: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // IMPORTANT: Your new DB enforces status='draft' on insert via this code.
      const { data, error } = await supabase
        .from("tournaments")
        .insert({
          ...tournament,
          created_by: user.id,
          status: "draft",
          min_teams: tournament.min_teams ?? 4,
          is_international: tournament.is_international ?? false,
          timezone: tournament.timezone ?? "America/Sao_Paulo",
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
      min_teams?: number;
      prize_description?: string;
      rules_text?: string;
      starts_at?: string;
      ends_at?: string;
      registration_starts_at?: string;
      registration_ends_at?: string;
      timezone?: string;
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
      queryClient.invalidateQueries({
        queryKey: ["tournament_registrations", variables.tournamentId],
      });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournament", variables.tournamentId] });
    },
  });
}

