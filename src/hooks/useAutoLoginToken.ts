import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateTokenOptions {
  userId: string;
  expiresInDays?: number;
}

export const useAutoLoginToken = () => {
  const [loading, setLoading] = useState(false);

  const createToken = async ({ userId, expiresInDays = 7 }: CreateTokenOptions) => {
    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const { data, error } = await supabase
        .from("auto_login_tokens")
        .insert({
          user_id: userId,
          created_by: (await supabase.auth.getUser()).data.user?.id!,
          expires_at: expiresAt.toISOString(),
        })
        .select("token")
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/auto-login?token=${data.token}`;
      return link;
    } catch (err: any) {
      toast.error("Token oluşturulamadı: " + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const copyTokenLink = async (opts: CreateTokenOptions) => {
    const link = await createToken(opts);
    if (link) {
      await navigator.clipboard.writeText(link);
      toast.success("Giriş linki kopyalandı!");
    }
    return link;
  };

  return { createToken, copyTokenLink, loading };
};
