import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useWallet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: wallet } = await supabase.from("wallets").select("id").eq("user_id", user.id).single();
      if (!wallet) return [];
      const { data, error } = await supabase.from("transactions").select("*").eq("wallet_id", wallet.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useShopItems() {
  return useQuery({
    queryKey: ["shop_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_items").select("*").eq("is_active", true).order("price", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useUserInventory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_inventory", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("user_inventory").select(`*, item:shop_items(*)`).eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
