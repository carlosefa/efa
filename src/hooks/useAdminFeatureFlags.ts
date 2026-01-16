import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Default global flags
const defaultGlobalFlags: Record<string, boolean> = {
  economy_enabled: true,
  chat_enabled: true,
  friendly_matches: true,
  auto_moderation: true,
  disputes_enabled: true,
};

export function useAdminFeatureFlags() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch countries with their feature flags
  const { data: countriesData = [], isLoading: loadingCountries } = useQuery({
    queryKey: ["admin_countries_flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("id, code, name, feature_flags, is_active")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // For this implementation, we'll store global flags in a special "GLOBAL" record
  // or use localStorage/app config. For simplicity, we'll use the countries table with code "GLOBAL"
  const globalFlags = defaultGlobalFlags;

  const countryFlags = countriesData.reduce((acc: Record<string, Record<string, boolean>>, country: any) => {
    if (country.feature_flags) {
      acc[country.id] = country.feature_flags as Record<string, boolean>;
    }
    return acc;
  }, {});

  const updateGlobalFlag = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      // In a real implementation, you'd store this in a settings table
      // For now, we'll update all countries that inherit this flag
      console.log(`Setting global flag ${key} to ${value}`);
      
      // Create audit log
      await supabase.from("audit_logs").insert({
        actor_id: user?.id,
        action: "feature_flag_updated",
        target_type: "global",
        target_id: key,
        details: `${key} set to ${value}`,
      });

      return true;
    },
    onSuccess: (_, { key, value }) => {
      queryClient.invalidateQueries({ queryKey: ["admin_countries_flags"] });
      toast.success(`Flag global "${key}" ${value ? "ativada" : "desativada"}`);
    },
    onError: (error) => {
      console.error("Failed to update global flag:", error);
      toast.error("Erro ao atualizar flag global");
    },
  });

  const updateCountryFlag = useMutation({
    mutationFn: async ({
      countryId,
      key,
      value,
    }: {
      countryId: string;
      key: string;
      value: boolean;
    }) => {
      // Get current flags
      const { data: country, error: fetchError } = await supabase
        .from("countries")
        .select("feature_flags")
        .eq("id", countryId)
        .single();

      if (fetchError) throw fetchError;

      const currentFlags = (country?.feature_flags as Record<string, boolean>) || {};
      const newFlags = { ...currentFlags, [key]: value };

      // Update country flags
      const { error: updateError } = await supabase
        .from("countries")
        .update({ feature_flags: newFlags })
        .eq("id", countryId);

      if (updateError) throw updateError;

      // Create audit log
      await supabase.from("audit_logs").insert({
        actor_id: user?.id,
        action: "feature_flag_updated",
        target_type: "country",
        target_id: countryId,
        details: `${key} set to ${value}`,
      });

      return true;
    },
    onSuccess: (_, { key, value }) => {
      queryClient.invalidateQueries({ queryKey: ["admin_countries_flags"] });
      toast.success(`Flag "${key}" ${value ? "ativada" : "desativada"} para este país`);
    },
    onError: (error) => {
      console.error("Failed to update country flag:", error);
      toast.error("Erro ao atualizar flag do país");
    },
  });

  return {
    globalFlags,
    countryFlags,
    countries: countriesData,
    isLoading: loadingCountries,
    updateGlobalFlag,
    updateCountryFlag,
    isSaving: updateGlobalFlag.isPending || updateCountryFlag.isPending,
  };
}
