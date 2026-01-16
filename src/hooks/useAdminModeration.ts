import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAdminModeration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const resolveCase = useMutation({
    mutationFn: async ({
      caseId,
      status,
      reason,
    }: {
      caseId: string;
      status: "resolved" | "dismissed";
      reason: string;
    }) => {
      const { error } = await supabase
        .from("moderation_cases")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", caseId);

      if (error) throw error;

      // Log the action
      await supabase.from("moderation_actions").insert({
        case_id: caseId,
        action_by: user?.id,
        action_type: status === "resolved" ? "case_resolved" : "case_dismissed",
        reason,
      });

      // Create audit log
      await supabase.from("audit_logs").insert({
        actor_id: user?.id,
        action: `moderation_${status}`,
        target_type: "moderation_case",
        target_id: caseId,
        details: reason,
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation_cases"] });
      toast.success("Caso atualizado com sucesso");
    },
    onError: (error) => {
      console.error("Failed to resolve case:", error);
      toast.error("Erro ao atualizar caso");
    },
  });

  const applyRestriction = useMutation({
    mutationFn: async ({
      userId,
      caseId,
      type,
      reason,
      durationHours,
    }: {
      userId: string;
      caseId: string;
      type: "warn" | "mute" | "ban";
      reason: string;
      durationHours: number;
    }) => {
      const expiresAt =
        durationHours === -1
          ? null
          : new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

      // Create restriction
      const { error: restrictionError } = await supabase
        .from("user_restrictions")
        .insert({
          user_id: userId,
          restriction_type: type,
          reason,
          expires_at: expiresAt,
          issued_by: user?.id,
          case_id: caseId,
        });

      if (restrictionError) throw restrictionError;

      // Log moderation action
      await supabase.from("moderation_actions").insert({
        case_id: caseId,
        action_by: user?.id,
        action_type: type,
        reason,
        duration_hours: durationHours === -1 ? null : durationHours,
        expires_at: expiresAt,
      });

      // Update case status
      await supabase
        .from("moderation_cases")
        .update({
          status: "resolved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", caseId);

      // Create audit log
      await supabase.from("audit_logs").insert({
        actor_id: user?.id,
        action: `user_${type}`,
        target_type: "user",
        target_id: userId,
        details: `${reason} (${durationHours === -1 ? "permanente" : `${durationHours}h`})`,
      });

      // Create notification for the user
      await supabase.from("notifications").insert({
        profile_id: userId,
        type: "moderation",
        title: type === "warn" ? "Advertência Recebida" : type === "mute" ? "Você foi silenciado" : "Conta Suspensa",
        body: reason,
        data: { type, duration: durationHours, case_id: caseId },
      });

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["moderation_cases"] });
      queryClient.invalidateQueries({ queryKey: ["user_restrictions"] });
      
      const messages = {
        warn: "Advertência aplicada",
        mute: "Usuário silenciado",
        ban: "Usuário banido",
      };
      toast.success(messages[variables.type]);
    },
    onError: (error) => {
      console.error("Failed to apply restriction:", error);
      toast.error("Erro ao aplicar restrição");
    },
  });

  const removeRestriction = useMutation({
    mutationFn: async ({
      restrictionId,
      reason,
    }: {
      restrictionId: string;
      reason: string;
    }) => {
      const { data: restriction, error: fetchError } = await supabase
        .from("user_restrictions")
        .select("*")
        .eq("id", restrictionId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("user_restrictions")
        .update({ is_active: false })
        .eq("id", restrictionId);

      if (error) throw error;

      // Create audit log
      await supabase.from("audit_logs").insert({
        actor_id: user?.id,
        action: "restriction_removed",
        target_type: "user",
        target_id: restriction.user_id,
        details: reason,
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_restrictions"] });
      toast.success("Restrição removida");
    },
    onError: (error) => {
      console.error("Failed to remove restriction:", error);
      toast.error("Erro ao remover restrição");
    },
  });

  return {
    resolveCase,
    applyRestriction,
    removeRestriction,
    isLoading: resolveCase.isPending || applyRestriction.isPending || removeRestriction.isPending,
  };
}
