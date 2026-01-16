import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CoinGrant {
  id: string;
  wallet_id: string;
  amount: number;
  reason: string;
  granted_by: string | null;
  batch_id: string | null;
  expires_in_days: number;
  created_at: string;
}

export interface AdminWalletStats {
  total_wallets: number;
  total_balance: number;
  total_earned: number;
  total_spent: number;
  expiring_soon: number;
}

export function useAdminCoinGrants() {
  return useQuery({
    queryKey: ["admin_coin_grants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_grants")
        .select(`
          *,
          wallet:wallets(
            user_id,
            user:profiles(username, display_name)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminCoinPackages() {
  return useQuery({
    queryKey: ["admin_coin_packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_packages")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useGrantCoins() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      amount, 
      reason, 
      expiresInDays = 60 
    }: { 
      userId: string; 
      amount: number; 
      reason: string; 
      expiresInDays?: number;
    }) => {
      const { data, error } = await supabase.rpc("grant_coins", {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
        p_granted_by: user?.id,
        p_expires_in_days: expiresInDays,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_coin_grants"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["coin_batches"] });
    },
  });
}

export function useCreateCoinPackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (packageData: {
      name: string;
      description?: string;
      coins: number;
      bonus_coins?: number;
      price_cents?: number;
      currency?: string;
      is_active?: boolean;
      sort_order?: number;
    }) => {
      const { data, error } = await supabase
        .from("coin_packages")
        .insert(packageData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_coin_packages"] });
      queryClient.invalidateQueries({ queryKey: ["coin_packages"] });
    },
  });
}

export function useUpdateCoinPackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: {
      id: string;
      name?: string;
      description?: string;
      coins?: number;
      bonus_coins?: number;
      price_cents?: number;
      is_active?: boolean;
      sort_order?: number;
    }) => {
      const { data, error } = await supabase
        .from("coin_packages")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_coin_packages"] });
      queryClient.invalidateQueries({ queryKey: ["coin_packages"] });
    },
  });
}

export function useSearchUsers() {
  return useMutation({
    mutationFn: async (searchTerm: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });
}
