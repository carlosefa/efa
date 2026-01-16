import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAdminRBAC() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all user roles with user details
  const { data: userRoles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ["admin_user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          *,
          user:profiles!user_roles_user_id_fkey(id, username, display_name, avatar_url),
          granted_by_user:profiles!user_roles_granted_by_fkey(username, display_name)
        `)
        .order("granted_at", { ascending: false });

      if (error) throw error;

      // Enrich with scope names
      const enriched = await Promise.all(
        data.map(async (ur: any) => {
          if (ur.scope_type === "country" && ur.scope_id) {
            const { data: country } = await supabase
              .from("countries")
              .select("name")
              .eq("id", ur.scope_id)
              .single();
            return { ...ur, scope_name: country?.name };
          }
          if (ur.scope_type === "organization" && ur.scope_id) {
            const { data: org } = await supabase
              .from("organizations")
              .select("name")
              .eq("id", ur.scope_id)
              .single();
            return { ...ur, scope_name: org?.name };
          }
          return ur;
        })
      );

      return enriched;
    },
  });

  // Fetch countries for scope selection
  const { data: countries = [] } = useQuery({
    queryKey: ["admin_countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("id, code, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch organizations for scope selection
  const { data: organizations = [] } = useQuery({
    queryKey: ["admin_organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({
      email,
      role,
      scopeType,
      scopeId,
    }: {
      email: string;
      role: string;
      scopeType?: string;
      scopeId?: string;
    }) => {
      // Use the RPC function to assign role by email
      const { data, error } = await supabase.rpc("assign_role_by_email", {
        target_email: email,
        target_role: role as "master" | "global_admin" | "country_admin" | "country_staff" | "org_admin" | "team_owner" | "coach" | "player",
        granter_id: user?.id,
      });

      if (error) throw error;
      if (!data) throw new Error("Usuário não encontrado com este email");

      // If scope is specified, update the role record
      if (scopeType && scopeId) {
        // Find the user first
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", email.split("@")[0])
          .limit(1);

        if (profiles && profiles.length > 0) {
          await supabase
            .from("user_roles")
            .update({
              scope_type: scopeType,
              scope_id: scopeId,
            })
            .eq("user_id", profiles[0].id)
            .eq("role", role as "master" | "global_admin" | "country_admin" | "country_staff" | "org_admin" | "team_owner" | "coach" | "player");
        }
      }

      // Create audit log
      await supabase.from("audit_logs").insert({
        actor_id: user?.id,
        action: "role_assigned",
        target_type: "user",
        target_name: email,
        details: `Role ${role} assigned${scopeType ? ` with scope ${scopeType}` : ""}`,
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_user_roles"] });
      toast.success("Role atribuída com sucesso");
    },
    onError: (error: any) => {
      console.error("Failed to assign role:", error);
      toast.error(error.message || "Erro ao atribuir role");
    },
  });

  const revokeRole = useMutation({
    mutationFn: async (roleId: string) => {
      // Get role info before deleting
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("id", roleId)
        .single();

      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      // Create audit log
      await supabase.from("audit_logs").insert({
        actor_id: user?.id,
        action: "role_revoked",
        target_type: "user",
        target_id: roleData?.user_id,
        details: `Role ${roleData?.role} revoked`,
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_user_roles"] });
      toast.success("Role removida com sucesso");
    },
    onError: (error) => {
      console.error("Failed to revoke role:", error);
      toast.error("Erro ao remover role");
    },
  });

  return {
    userRoles,
    countries,
    organizations,
    isLoading: loadingRoles,
    assignRole,
    revokeRole,
    isAssigning: assignRole.isPending,
  };
}
