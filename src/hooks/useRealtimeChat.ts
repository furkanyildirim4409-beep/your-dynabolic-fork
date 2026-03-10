import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Tables } from "@/integrations/supabase/types";

type Message = Tables<"messages">;

interface CoachInfo {
  full_name: string | null;
  avatar_url: string | null;
}

export function useRealtimeChat() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [coachInfo, setCoachInfo] = useState<CoachInfo | null>(null);
  const subscribedRef = useRef(false);

  const coachId = profile?.coach_id;

  // Fetch coach info via RPC
  useEffect(() => {
    if (!coachId) return;
    supabase.rpc("get_coach_info", { _coach_id: coachId }).then(({ data }) => {
      if (data) setCoachInfo(data as unknown as CoachInfo);
    });
  }, [coachId]);

  // Fetch message history
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setMessages(data);
        setIsLoading(false);
      });

    // Mark unread messages as read
    supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false)
      .then(() => {});
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user || subscribedRef.current) return;
    subscribedRef.current = true;

    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Auto mark as read
          supabase
            .from("messages")
            .update({ is_read: true })
            .eq("id", newMsg.id)
            .then(() => {});
        }
      )
      .subscribe();

    return () => {
      subscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user || !coachId || !content.trim()) return;

      const optimisticMsg: Message = {
        id: crypto.randomUUID(),
        sender_id: user.id,
        receiver_id: coachId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        is_read: false,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: coachId,
        content: content.trim(),
      });

      if (error) {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        console.error("Send message error:", error.message);
      }
    },
    [user, coachId]
  );

  return { messages, isLoading, sendMessage, coachInfo, coachId };
}
