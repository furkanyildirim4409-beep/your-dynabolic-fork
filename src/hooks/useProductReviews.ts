import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  author: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface ProductReviewsSummary {
  reviews: ProductReview[];
  averageRating: number;
  totalCount: number;
  userReview: ProductReview | null;
}

export function useProductReviews(productId: string | null) {
  const { user } = useAuth();

  return useQuery<ProductReviewsSummary>({
    queryKey: ["product-reviews", productId],
    enabled: !!productId,
    queryFn: async () => {
      if (!productId) {
        return { reviews: [], averageRating: 0, totalCount: 0, userReview: null };
      }
      const { data: rows, error } = await (supabase as any)
        .from("product_reviews")
        .select("id, product_id, user_id, rating, comment, created_at")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const reviewsRaw = (rows ?? []) as any[];
      const userIds = Array.from(new Set(reviewsRaw.map((r) => r.user_id))).filter(Boolean);
      let profileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);
        (profiles ?? []).forEach((p: any) => {
          profileMap[p.id] = {
            full_name: p.full_name ?? "Kullanıcı",
            avatar_url: p.avatar_url ?? null,
          };
        });
      }

      const reviews: ProductReview[] = reviewsRaw.map((row) => ({
        id: row.id,
        product_id: row.product_id,
        user_id: row.user_id,
        rating: row.rating,
        comment: row.comment,
        created_at: row.created_at,
        author: profileMap[row.user_id] ?? { full_name: "Kullanıcı", avatar_url: null },
      }));

      const totalCount = reviews.length;
      const averageRating =
        totalCount === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount;
      const userReview = user ? reviews.find((r) => r.user_id === user.id) ?? null : null;

      return { reviews, averageRating, totalCount, userReview };
    },
  });
}

export function useSubmitProductReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      productId,
      rating,
      comment,
    }: {
      productId: string;
      rating: number;
      comment: string;
    }) => {
      if (!user) throw new Error("Giriş yapmanız gerekiyor");
      const { data, error } = await (supabase as any)
        .from("product_reviews")
        .upsert(
          {
            product_id: productId,
            user_id: user.id,
            rating,
            comment: comment.trim() || null,
          },
          { onConflict: "product_id,user_id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", vars.productId] });
    },
  });
}
