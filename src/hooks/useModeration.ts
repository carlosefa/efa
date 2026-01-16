import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useModerationCases(filters?: { status?: string; countryCode?: string }) {
  return useQuery({
    queryKey: ["moderation_cases", filters],
    queryFn: async () => {
      let query = supabase.from("moderation_cases").select(`*, reporter:profiles!moderation_cases_reporter_id_fkey(username, display_name), reported_user:profiles!moderation_cases_reported_user_id_fkey(username, display_name), assigned:profiles!moderation_cases_assigned_to_fkey(username, display_name)`).order("created_at", { ascending: false });
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.countryCode) query = query.eq("country_code", filters.countryCode);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (report: { reported_user_id?: string; reported_content_type: string; reason: string; description?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("moderation_cases").insert({ ...report, reporter_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["moderation_cases"] }),
  });
}

export function useUserRestrictions(userId?: string) {
  return useQuery({
    queryKey: ["user_restrictions", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from("user_restrictions").select("*").eq("user_id", userId).eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
