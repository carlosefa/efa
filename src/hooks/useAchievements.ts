import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  requirement_type: string;
  requirement_value: number;
  efa_coins_reward: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  unlocked_at: string | null;
  created_at: string;
  achievement?: Achievement;
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("requirement_value");

      if (error) throw error;
      return data as Achievement[];
    },
  });
}

export function useUserAchievements(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["user_achievements", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq("user_id", targetUserId);

      if (error) throw error;
      return data as (UserAchievement & { achievement: Achievement })[];
    },
    enabled: !!targetUserId,
  });
}

export function useMyAchievementsProgress() {
  const { user } = useAuth();
  const { data: achievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();

  if (!achievements || !userAchievements) return { all: [], unlocked: [], inProgress: [], locked: [] };

  const achievementMap = new Map(userAchievements.map((ua) => [ua.achievement_id, ua]));

  const all = achievements.map((achievement) => {
    const userAchievement = achievementMap.get(achievement.id);
    return {
      ...achievement,
      progress: userAchievement?.progress || 0,
      unlocked_at: userAchievement?.unlocked_at || null,
      isUnlocked: !!userAchievement?.unlocked_at,
    };
  });

  const unlocked = all.filter((a) => a.isUnlocked);
  const inProgress = all.filter((a) => !a.isUnlocked && a.progress > 0);
  const locked = all.filter((a) => !a.isUnlocked && a.progress === 0);

  return { all, unlocked, inProgress, locked };
}

export function useUpdateAchievementProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ achievementId, progress }: { achievementId: string; progress: number }) => {
      if (!user) throw new Error("Not authenticated");

      // Check if achievement exists
      const { data: achievement } = await supabase
        .from("achievements")
        .select("requirement_value")
        .eq("id", achievementId)
        .single();

      if (!achievement) throw new Error("Achievement not found");

      const isUnlocked = progress >= achievement.requirement_value;

      const { data, error } = await supabase
        .from("user_achievements")
        .upsert({
          user_id: user.id,
          achievement_id: achievementId,
          progress,
          unlocked_at: isUnlocked ? new Date().toISOString() : null,
        }, {
          onConflict: "user_id,achievement_id",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_achievements"] });
    },
  });
}

// Tier colors for styling
export const tierColors = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-gray-300 to-gray-500",
  gold: "from-yellow-400 to-yellow-600",
  platinum: "from-cyan-300 to-cyan-500",
  diamond: "from-purple-400 to-pink-500",
};

export const tierBorderColors = {
  bronze: "border-amber-700",
  silver: "border-gray-400",
  gold: "border-yellow-500",
  platinum: "border-cyan-400",
  diamond: "border-purple-400",
};
