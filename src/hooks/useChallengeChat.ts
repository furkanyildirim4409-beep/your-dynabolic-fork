import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface ChatMessage {
  id: string;
  challenge_id: string;
  user_id: string;
  message: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
}

export const useChallengeChat = (challengeId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["challenge-chat", challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_messages")
        .select("*, profiles(full_name, avatar_url)")
        .eq("challenge_id", challengeId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((m: any) => ({
        id: m.id,
        challenge_id: m.challenge_id,
        user_id: m.user_id,
        message: m.message,
        created_at: m.created_at,
        sender_name: m.profiles?.full_name || "Atlet",
        sender_avatar: m.profiles?.avatar_url || "",
      })) as ChatMessage[];
    },
    enabled: !!user && !!challengeId,
    staleTime: 10_000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!challengeId) return;
    const channel = supabase
      .channel(`challenge-chat-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "challenge_messages",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["challenge-chat", challengeId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [challengeId, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const { error } = await supabase.from("challenge_messages").insert({
        challenge_id: challengeId,
        user_id: user!.id,
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge-chat", challengeId] });
    },
  });

  return {
    messages,
    sendMessage: sendMessageMutation.mutateAsync,
    isLoading,
  };
};
