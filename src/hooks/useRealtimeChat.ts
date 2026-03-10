import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Message = Tables<"messages">;

interface CoachInfo {
  full_name: string | null;
  avatar_url: string | null;
}

interface RealtimeChatOptions {
  isOpen?: boolean;
  isMuted?: boolean;
}

export function useRealtimeChat(options: RealtimeChatOptions = {}) {
  const { isOpen, isMuted } = options;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [coachInfo, setCoachInfo] = useState<CoachInfo | null>(null);
  const [resolvedCoachId, setResolvedCoachId] = useState<string | null>(null);
  const subscribedRef = useRef(false);

  // Force fetch coach_id directly from profiles table
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("coach_id")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to fetch coach_id:", error.message);
          return;
        }
        if (data?.coach_id) {
          setResolvedCoachId(data.coach_id);
        }
      });
  }, [user]);

  // Fetch coach info via RPC
  useEffect(() => {
    if (!resolvedCoachId) return;
    supabase.rpc("get_coach_info", { _coach_id: resolvedCoachId }).then(({ data }) => {
      if (data) setCoachInfo(data as unknown as CoachInfo);
    });
  }, [resolvedCoachId]);

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
  }, [user]);

  // Mark messages as read only when chat is opened
  useEffect(() => {
    if (!user || !isOpen) return;
    supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false)
      .then(() => {});
  }, [user, isOpen]);

  // Request notification permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Refs to access latest values inside realtime callback
  const isOpenRef = useRef(isOpen);
  const isMutedRef = useRef(isMuted);
  const coachInfoRef = useRef(coachInfo);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { coachInfoRef.current = coachInfo; }, [coachInfo]);

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
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Browser notification: only if chat closed & not muted
          if (
            newMsg.sender_id !== user.id &&
            !isOpenRef.current &&
            !isMutedRef.current &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const senderName = coachInfoRef.current?.full_name || "Koç";
            new Notification(`Yeni Mesaj: ${senderName}`, {
              body: newMsg.content,
              icon: "/favicon.ico",
            });
          }
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
      if (!user || !content.trim()) return;

      if (!resolvedCoachId) {
        toast.error("Hata: Koç bağlantısı kurulamadı!");
        return;
      }

      const optimisticMsg: Message = {
        id: crypto.randomUUID(),
        sender_id: user.id,
        receiver_id: resolvedCoachId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        is_read: false,
        media_type: null,
        media_url: null,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: resolvedCoachId,
        content: content.trim(),
      });

      if (error) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        toast.error("Mesaj gönderilemedi: " + error.message);
        console.error("Send message error:", error.message);
      }
    },
    [user, resolvedCoachId]
  );

  return { messages, isLoading, sendMessage, coachInfo, resolvedCoachId };
}
