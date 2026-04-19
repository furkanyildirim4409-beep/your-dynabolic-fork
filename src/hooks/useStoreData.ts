import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CoachProduct } from "@/types/shared-models";
import { getProducts, type ShopifyProduct } from "@/lib/shopify";

export function useShopifyProducts(limit = 20) {
  return useQuery<ShopifyProduct[]>({
    queryKey: ["shopify-products", limit],
    queryFn: () => getProducts(limit),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCoachProducts() {
  return useQuery<CoachProduct[]>({
    queryKey: ["coach-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_products")
        .select("*, profiles!coach_id(full_name, avatar_url)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        id: row.id,
        coach_id: row.coach_id,
        title: row.title,
        description: row.description ?? null,
        price: Number(row.price),
        image_url: row.image_url,
        is_active: row.is_active,
        created_at: row.created_at,
        coach: row.profiles
          ? { full_name: row.profiles.full_name ?? "Koç", avatar_url: row.profiles.avatar_url ?? null }
          : undefined,
      }));
    },
    staleTime: 300_000,
  });
}

export function usePurchaseProduct() {
  return useMutation({
    mutationFn: async (_payload: { productId: string; price: number }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true;
    },
  });
}
