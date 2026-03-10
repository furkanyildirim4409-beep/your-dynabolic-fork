import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const subscribedRef = useRef(false);

  // Fetch initial unread count
  useEffect(() => {
    if (!user) return;

    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false)
      .then(({ count }) => {
        setUnreadCount(count ?? 0);
      });
  }, [user]);

  // Realtime subscription for new messages & read updates
  useEffect(() => {
    if (!user || subscribedRef.current) return;
    subscribedRef.current = true;

    const channel = supabase
      .channel("unread-messages-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const msg = payload.new as { is_read: boolean };
            if (!msg.is_read) setUnreadCount((prev) => prev + 1);
          } else if (payload.eventType === "UPDATE") {
            const msg = payload.new as { is_read: boolean };
            const old = payload.old as { is_read: boolean };
            if (!old.is_read && msg.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = () => setUnreadCount(0);

  return { unreadCount, markAllRead };
}
