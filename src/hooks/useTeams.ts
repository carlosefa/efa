import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ============ TEAMS ============
export function useTeams(filters?: { ownerId?: string; countryId?: string }) {
  return useQuery({
    queryKey: ["teams", filters],
    queryFn: async () => {
      let query = supabase
        .from("teams")
        .select(`
          *,
          countries(name, code),
          organizations(name, slug),
          team_memberships(count)
        `)
        .order("created_at", { ascending: false });

      if (filters?.ownerId) {
        query = query.eq("owner_id", filters.ownerId);
      }
      if (filters?.countryId) {
        query = query.eq("country_id", filters.countryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useTeam(teamId?: string) {
  return useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      if (!teamId) return null;
      const { data, error } = await supabase
        .from("teams")
        .select(`
          *,
          countries(name, code, timezone),
          organizations(name, slug, logo_url),
          owner:profiles!teams_owner_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq("id", teamId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });
}

export function useTeamMembers(teamId?: string) {
  return useQuery({
    queryKey: ["team_members", teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from("team_memberships")
        .select(`
          *,
          profile:profiles(id, username, display_name, avatar_url, country_code)
        `)
        .eq("team_id", teamId)
        .order("role")
        .order("joined_at");
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });
}

export function useMyTeams() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my_teams", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("teams")
        .select(`
          *,
          countries(name, code),
          team_memberships(count)
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (team: {
      name: string;
      tag: string;
      logo_url?: string;
      country_id?: string;
      organization_id?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("teams")
        .insert({
          ...team,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as team member
      await supabase.from("team_memberships").insert({
        team_id: data.id,
        profile_id: user.id,
        role: "owner",
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["my_teams"] });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      tag?: string;
      logo_url?: string;
      country_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("teams")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", data.id] });
      queryClient.invalidateQueries({ queryKey: ["my_teams"] });
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      profileId,
      role = "player",
      jerseyNumber,
    }: {
      teamId: string;
      profileId: string;
      role?: string;
      jerseyNumber?: number;
    }) => {
      const { data, error } = await supabase
        .from("team_memberships")
        .insert({
          team_id: teamId,
          profile_id: profileId,
          role,
          jersey_number: jerseyNumber,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team_members", variables.teamId] });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ membershipId, teamId }: { membershipId: string; teamId: string }) => {
      const { error } = await supabase.from("team_memberships").delete().eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team_members", variables.teamId] });
    },
  });
}
