import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCallback } from "react";

export function useBioCoin() {
  const { user, profile, refreshProfile } = useAuth();

  const balance = profile?.bio_coins ?? 0;

  const processTransaction = useCallback(
    async (amount: number, type: string, description: string) => {
      if (!user?.id) return false;
      if (amount < 0 && balance < Math.abs(amount)) {
        toast.error("Yetersiz BioCoin bakiyesi.");
        return false;
      }

      const { error: txError } = await supabase.from("bio_coin_transactions").insert({
        user_id: user.id,
        amount,
        type,
        description,
      });
      if (txError) {
        console.error("BioCoin error:", txError.message);
        return false;
      }

      await supabase
        .from("profiles")
        .update({ bio_coins: balance + amount })
        .eq("id", user.id);

      await refreshProfile();
      if (amount > 0) toast.success(`🎉 +${amount} BioCoin Kazandın!`, { description });
      if (amount < 0) toast.success(`${Math.abs(amount)} BioCoin harcandı.`, { description });
      return true;
    },
    [user?.id, balance, refreshProfile],
  );

  // Backward-compatible wrappers
  const awardCoins = useCallback(
    async (amount: number, type: string, description: string) => {
      return processTransaction(amount, type, description);
    },
    [processTransaction],
  );

  const spendCoins = useCallback(
    async (amount: number, type: string, description: string) => {
      return processTransaction(-amount, type, description);
    },
    [processTransaction],
  );

  return { balance, processTransaction, awardCoins, spendCoins, refetch: refreshProfile };
}
