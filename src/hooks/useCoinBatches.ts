import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CoinBatch {
  id: string;
  wallet_id: string;
  original_amount: number;
  remaining_amount: number;
  source_type: string;
  source_reference: string | null;
  expires_at: string;
  created_at: string;
  consumed_at: string | null;
}

export function useCoinBatches() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["coin_batches", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First get the wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (!wallet) return [];
      
      const { data, error } = await supabase
        .from("coin_batches")
        .select("*")
        .eq("wallet_id", wallet.id)
        .gt("remaining_amount", 0)
        .order("expires_at", { ascending: true });
      
      if (error) throw error;
      return data as CoinBatch[];
    },
    enabled: !!user,
  });
}

export function useCoinPackages() {
  return useQuery({
    queryKey: ["coin_packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}
