import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============ GAMES ============
export function useGames() {
  return useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useGameModes(gameId?: string) {
  return useQuery({
    queryKey: ["game_modes", gameId],
    queryFn: async () => {
      let query = supabase.from("game_modes").select("*, games(name, slug)").eq("is_active", true);
      if (gameId) {
        query = query.eq("game_id", gameId);
      }
      const { data, error } = await query.order("name");
      if (error) throw error;
      return data;
    },
    enabled: gameId ? !!gameId : true,
  });
}

export function useRulesets(gameModeId?: string) {
  return useQuery({
    queryKey: ["rulesets", gameModeId],
    queryFn: async () => {
      let query = supabase.from("rulesets").select("*");
      if (gameModeId) {
        query = query.eq("game_mode_id", gameModeId);
      }
      const { data, error } = await query.order("name");
      if (error) throw error;
      return data;
    },
    enabled: gameModeId ? !!gameModeId : true,
  });
}

// ============ COUNTRIES ============
export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}
