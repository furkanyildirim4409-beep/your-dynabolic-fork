import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchCount();

    const channelName = `unread-msg-${user.id}`;
    // Remove any stale channel with the same name (StrictMode / HMR)
    supabase.getChannels()
      .filter((c) => c.topic === `realtime:${channelName}`)
      .forEach((c) => supabase.removeChannel(c));

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchCount]);

  const markAllRead = () => setUnreadCount(0);

  return { unreadCount, markAllRead };
}
