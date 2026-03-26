import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  challenge_id: string;
  user_id: string;
  message: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
  media_url?: string;
  media_type?: string;
}

const MAX_CHAT_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const sanitizeFileName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .replace(/_+/g, "_");

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
        media_url: m.media_url ?? undefined,
        media_type: m.media_type ?? undefined,
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
    mutationFn: async ({ text, file }: { text: string; file?: File }) => {
      let media_url: string | undefined;
      let media_type: string | undefined;

      if (file) {
        if (file.size > MAX_CHAT_FILE_SIZE) {
          toast.error("Dosya çok büyük – maksimum 20MB.");
          throw new Error("File too large");
        }

        const sanitized = sanitizeFileName(file.name);
        const filePath = `${challengeId}/${Date.now()}_${sanitized}`;
        const { error: upErr } = await supabase.storage
          .from("chat-media")
          .upload(filePath, file);
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from("chat-media")
          .getPublicUrl(filePath);
        media_url = urlData.publicUrl;
        media_type = file.type.startsWith("video") ? "video" : "image";
      }

      const { error } = await supabase.from("challenge_messages").insert({
        challenge_id: challengeId,
        user_id: user!.id,
        message: text,
        media_url: media_url ?? null,
        media_type: media_type ?? null,
      } as any);
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
