import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCallback } from "react";

export function useBioCoin() {
  const { user, profile, refreshProfile } = useAuth();

  const balance = profile?.bio_coins ?? 0;

  const awardCoins = useCallback(
    async (amount: number, type: string, description: string) => {
      if (!user?.id) return;

      const { error } = await supabase.from("bio_coin_transactions").insert({
        user_id: user.id,
        amount,
        type,
        description,
      });
      if (error) {
        console.error("BioCoin award error:", error.message);
        return;
      }

      await supabase
        .from("profiles")
        .update({ bio_coins: (profile?.bio_coins ?? 0) + amount })
        .eq("id", user.id);

      await refreshProfile();
      toast.success(`🎉 +${amount} BioCoin Kazandın!`, { description });
    },
    [user?.id, profile?.bio_coins, refreshProfile],
  );

  const spendCoins = useCallback(
    async (amount: number, type: string, description: string) => {
      if (!user?.id) return false;
      if (balance < amount) {
        toast.error("Yetersiz BioCoin bakiyesi.");
        return false;
      }

      const { error } = await supabase.from("bio_coin_transactions").insert({
        user_id: user.id,
        amount: -amount,
        type,
        description,
      });
      if (error) {
        console.error("BioCoin spend error:", error.message);
        return false;
      }

      await supabase
        .from("profiles")
        .update({ bio_coins: balance - amount })
        .eq("id", user.id);

      await refreshProfile();
      return true;
    },
    [user?.id, balance, refreshProfile],
  );

  return { balance, awardCoins, spendCoins, refetch: refreshProfile };
}
