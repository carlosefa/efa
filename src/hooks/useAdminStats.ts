import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlatformStats {
  total_users: number;
  total_teams: number;
  total_tournaments: number;
  total_matches: number;
  total_organizations: number;
  active_countries: number;
  total_efa_coins: number;
  total_transactions: number;
}

interface CountryWithStats {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  timezone: string;
  feature_flags: Record<string, any> | null;
  users_count: number;
  teams_count: number;
  tournaments_count: number;
}

interface UserWithDetails {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  country_code: string | null;
  created_at: string;
  email?: string;
  teams_count: number;
  tournaments_count: number;
}

interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  target_name: string | null;
  details: string | null;
  country_code: string | null;
  created_at: string;
  actor?: {
    username: string | null;
    display_name: string | null;
  };
}

// Platform statistics
export function usePlatformStats() {
  return useQuery({
    queryKey: ["platform_stats"],
    queryFn: async () => {
      // Fetch counts manually since view may have RLS issues
      const [
        { count: usersCount },
        { count: teamsCount },
        { count: tournamentsCount },
        { count: matchesCount },
        { count: orgsCount },
        { count: countriesCount },
        { data: walletsData },
        { count: transactionsCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("teams").select("*", { count: "exact", head: true }),
        supabase.from("tournaments").select("*", { count: "exact", head: true }),
        supabase.from("matches").select("*", { count: "exact", head: true }),
        supabase.from("organizations").select("*", { count: "exact", head: true }),
        supabase.from("countries").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("wallets").select("balance"),
        supabase.from("transactions").select("*", { count: "exact", head: true }),
      ]);

      const totalCoins = walletsData?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0;

      return {
        total_users: usersCount || 0,
        total_teams: teamsCount || 0,
        total_tournaments: tournamentsCount || 0,
        total_matches: matchesCount || 0,
        total_organizations: orgsCount || 0,
        active_countries: countriesCount || 0,
        total_efa_coins: totalCoins,
        total_transactions: transactionsCount || 0,
      } as PlatformStats;
    },
  });
}

// Countries with stats
export function useCountriesWithStats() {
  return useQuery({
    queryKey: ["countries_with_stats"],
    queryFn: async () => {
      const { data: countries, error } = await supabase
        .from("countries")
        .select("*")
        .order("name");

      if (error) throw error;

      // Get stats for each country
      const countriesWithStats = await Promise.all(
        (countries || []).map(async (country) => {
          const [
            { count: usersCount },
            { count: teamsCount },
            { count: tournamentsCount },
          ] = await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }).eq("country_code", country.code),
            supabase.from("teams").select("*", { count: "exact", head: true }).eq("country_id", country.id),
            supabase.from("tournaments").select("*", { count: "exact", head: true }).eq("country_id", country.id),
          ]);

          return {
            ...country,
            users_count: usersCount || 0,
            teams_count: teamsCount || 0,
            tournaments_count: tournamentsCount || 0,
          } as CountryWithStats;
        })
      );

      return countriesWithStats;
    },
  });
}

// All users (for admin)
export function useAllUsers(options?: { limit?: number; offset?: number; search?: string; countryCode?: string }) {
  const { limit = 50, offset = 0, search = "", countryCode } = options || {};
  
  return useQuery({
    queryKey: ["admin_users", limit, offset, search, countryCode],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
      }

      if (countryCode && countryCode !== "all") {
        query = query.eq("country_code", countryCode);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const users = (data || []).map((u) => ({
        ...u,
        teams_count: 0,
        tournaments_count: 0,
      })) as UserWithDetails[];

      return { users, total: count };
    },
  });
}

// All admins
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin_users_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          *,
          user:profiles!user_roles_user_id_fkey(id, username, display_name, avatar_url)
        `)
        .in("role", ["master", "global_admin", "country_admin", "country_staff"])
        .order("granted_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// Audit logs
export function useAuditLogs(options?: { limit?: number; action?: string }) {
  const { limit = 50, action } = options || {};
  
  return useQuery({
    queryKey: ["audit_logs", limit, action],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select(`
          *,
          actor:profiles!audit_logs_actor_id_fkey(username, display_name)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (action) {
        query = query.eq("action", action);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });
}

// Games with stats
export function useGamesWithStats() {
  return useQuery({
    queryKey: ["games_with_stats"],
    queryFn: async () => {
      const { data: games, error } = await supabase
        .from("games")
        .select(`
          *,
          game_modes(count)
        `)
        .order("name");

      if (error) throw error;

      // Get additional stats
      const gamesWithStats = await Promise.all(
        (games || []).map(async (game) => {
          const { data: modes } = await supabase
            .from("game_modes")
            .select("id")
            .eq("game_id", game.id);

          const modeIds = modes?.map(m => m.id) || [];
          
          let tournamentsCount = 0;

          if (modeIds.length > 0) {
            const { count: tCount } = await supabase
              .from("tournaments")
              .select("*", { count: "exact", head: true })
              .in("game_mode_id", modeIds);
            tournamentsCount = tCount || 0;
          }
          
          return {
            ...game,
            modes_count: modeIds.length,
            teams_count: 0,
            tournaments_count: tournamentsCount,
          };
        })
      );

      return gamesWithStats;
    },
  });
}

// Team rankings
export function useTeamRankings(limit = 50) {
  return useQuery({
    queryKey: ["team_rankings", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_team_rankings", { limit_count: limit });
      if (error) throw error;
      return data || [];
    },
  });
}
