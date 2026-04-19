import { supabase } from "@/integrations/supabase/client";

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
  price: number;
  currencyCode: string;
  variantId: string;
}

export async function getProducts(limit = 20): Promise<ShopifyProduct[]> {
  const { data, error } = await supabase.functions.invoke("shopify-products", {
    body: { limit },
  });

  if (error) {
    throw new Error(error.message ?? "Shopify products fetch failed");
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return (data?.products ?? []) as ShopifyProduct[];
}
