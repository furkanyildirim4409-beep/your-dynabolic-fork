import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Challenge } from "@/lib/challengeData";

interface ChallengeRow {
  id: string;
  challenger_id: string;
  opponent_id: string;
  challenge_type: string;
  exercise_name: string | null;
  wager_coins: number | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  challenger_value: number | null;
  opponent_value: number | null;
  winner_id: string | null;
}

interface ProfileSnippet {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export const useChallenges = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profilesMap, isLoading: profilesLoading } = useQuery({
    queryKey: ["challenge-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("role", "athlete");
      const map = new Map<string, ProfileSnippet>();
      (data ?? []).forEach((p) => map.set(p.id, p));
      return map;
    },
    enabled: !!user,
    staleTime: 120_000,
  });

  const { data: rawChallenges, isLoading: challengesLoading } = useQuery({
    queryKey: ["my-challenges", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .or(`challenger_id.eq.${user!.id},opponent_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ChallengeRow[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const mapToChallenge = (row: ChallengeRow): Challenge => {
    const challengerProfile = profilesMap?.get(row.challenger_id);
    const opponentProfile = profilesMap?.get(row.opponent_id);
    const isCurrentUserChallenger = row.challenger_id === user?.id;

    const statusMap: Record<string, Challenge["status"]> = {
      pending: "pending",
      accepted: "active",
      active: "active",
      completed: "completed",
      expired: "expired",
      declined: "declined",
      disputed: "disputed",
    };

    return {
      id: row.id,
      type: row.challenge_type === "streak" ? "streak" : "pr",
      status: statusMap[row.status ?? "pending"] ?? "pending",
      challengerId: row.challenger_id,
      challengerName: challengerProfile?.full_name || "Atlet",
      challengerAvatar: challengerProfile?.avatar_url || "",
      challengerValue: Number(row.challenger_value ?? 0),
      challengedId: row.opponent_id,
      challengedName: opponentProfile?.full_name || "Atlet",
      challengedAvatar: opponentProfile?.avatar_url || "",
      challengedValue: Number(row.opponent_value ?? 0),
      exercise: row.exercise_name || undefined,
      targetValue: Number(row.challenger_value ?? 0),
      deadline: row.end_date ?? new Date().toISOString(),
      createdAt: row.created_at ?? new Date().toISOString(),
      bioCoinsReward: row.wager_coins ?? 0,
      xpReward: Math.round((row.wager_coins ?? 0) * 0.2),
      winnerId: row.winner_id || undefined,
      completedAt: row.status === "completed" ? row.end_date || undefined : undefined,
      proofUrl: (row as any).proof_url || undefined,
      opponentProofUrl: (row as any).opponent_proof_url || undefined,
    };
  };

  const challenges: Challenge[] = (rawChallenges ?? []).map(mapToChallenge);

  // Remap "current" references for ChallengeCard compatibility
  const remapped = challenges.map((c) => ({
    ...c,
    challengerId: c.challengerId === user?.id ? "current" : c.challengerId,
    challengedId: c.challengedId === user?.id ? "current" : c.challengedId,
    winnerId: c.winnerId === user?.id ? "current" : c.winnerId,
  }));

  const pending = remapped.filter((c) => c.status === "pending");
  const active = remapped.filter((c) => c.status === "active" || c.status === "disputed");
  const completed = remapped.filter((c) => c.status === "completed" || c.status === "expired");

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("challenges")
        .update({ status: "accepted", start_date: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
      toast({ title: "Meydan okuma kabul edildi! ⚔️", description: "Şimdi rakibini geçme zamanı!" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("challenges")
        .update({ status: "declined" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
      toast({ title: "Meydan okuma reddedildi", description: "Belki başka zaman..." });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      opponent_id: string;
      challenge_type: string;
      exercise_name?: string;
      challenger_value: number;
      wager_coins: number;
      end_date: string;
    }) => {
      const { error } = await supabase.from("challenges").insert({
        challenger_id: user!.id,
        opponent_id: data.opponent_id,
        challenge_type: data.challenge_type,
        exercise_name: data.exercise_name || null,
        challenger_value: data.challenger_value,
        wager_coins: data.wager_coins,
        end_date: data.end_date,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
      toast({ title: "Meydan okuma gönderildi! ⚔️" });
    },
  });

  const submitResultMutation = useMutation({
    mutationFn: async ({ challengeId, value, isChallenger }: { challengeId: string; value: number; isChallenger: boolean }) => {
      const field = isChallenger ? "challenger_value" : "opponent_value";
      const { error } = await supabase
        .from("challenges")
        .update({ [field]: value } as any)
        .eq("id", challengeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
      toast({ title: "Sonuç kaydedildi! 💪" });
    },
  });

  const concludeChallengeMutation = useMutation({
    mutationFn: async ({ challengeId, winnerId }: { challengeId: string; winnerId: string }) => {
      // 1. Fetch challenge details
      const { data: challenge, error: fetchError } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();
      if (fetchError || !challenge) throw new Error("Challenge not found");

      const wager = challenge.wager_coins || 0;
      const loserId = challenge.challenger_id === winnerId
        ? challenge.opponent_id
        : challenge.challenger_id;

      // 2. Update challenge status
      const { error: updateError } = await supabase
        .from("challenges")
        .update({ status: "completed", winner_id: winnerId, end_date: new Date().toISOString() })
        .eq("id", challengeId);
      if (updateError) throw updateError;

      // 3. Process coin transfers for both participants
      if (wager > 0) {
        await supabase.from("bio_coin_transactions").insert({
          user_id: winnerId,
          amount: wager,
          type: "challenge_win",
          description: "Düello Kazancı",
        });

        await supabase.from("bio_coin_transactions").insert({
          user_id: loserId,
          amount: -wager,
          type: "challenge_loss",
          description: "Düello Kaybı",
        });

        // Update winner balance
        const { data: winnerProfile } = await supabase
          .from("profiles")
          .select("bio_coins")
          .eq("id", winnerId)
          .single();
        if (winnerProfile) {
          await supabase
            .from("profiles")
            .update({ bio_coins: (winnerProfile.bio_coins ?? 0) + wager })
            .eq("id", winnerId);
        }

        // Update loser balance
        const { data: loserProfile } = await supabase
          .from("profiles")
          .select("bio_coins")
          .eq("id", loserId)
          .single();
        if (loserProfile) {
          await supabase
            .from("profiles")
            .update({ bio_coins: Math.max(0, (loserProfile.bio_coins ?? 0) - wager) })
            .eq("id", loserId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
      toast({ title: "Düello Sonuçlandı! 🏆", description: "Ödüller dağıtıldı." });
    },
  });

  const disputeChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase
        .from("challenges")
        .update({ status: "disputed" })
        .eq("id", challengeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
      toast({ title: "İtiraz edildi ⚖️", description: "Koç incelemesi bekleniyor." });
    },
  });

  return {
    challenges: remapped,
    pending,
    active,
    completed,
    isLoading: challengesLoading || profilesLoading,
    acceptChallenge: acceptMutation.mutateAsync,
    declineChallenge: declineMutation.mutateAsync,
    createChallenge: createMutation.mutateAsync,
    concludeChallenge: concludeChallengeMutation.mutateAsync,
    submitResult: submitResultMutation.mutateAsync,
    disputeChallenge: disputeChallengeMutation.mutateAsync,
  };
};
