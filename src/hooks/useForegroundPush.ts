import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useForegroundPush() {
  const { user } = useAuth();
  const seenIds = useRef(new Set<string>());
  const listenerAttached = useRef(false);

  // SW postMessage listener (primary path)
  useEffect(() => {
    if (!user || listenerAttached.current) return;
    if (!("serviceWorker" in navigator)) return;

    listenerAttached.current = true;

    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "PUSH_FOREGROUND") return;

      const { payload } = event.data;
      const messageId = payload.data?.messageId;

      // Dedupe
      if (messageId && seenIds.current.has(messageId)) return;
      if (messageId) seenIds.current.add(messageId);

      const title = payload.title || "Yeni Bildirim";
      const body = payload.body || "";

      toast(title, {
        description: body,
        action: {
          label: "Görüntüle",
          onClick: () => window.dispatchEvent(new Event("openCoachChat")),
        },
        duration: 5000,
      });
    };

    navigator.serviceWorker.addEventListener("message", handler);

    return () => {
      listenerAttached.current = false;
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, [user]);

  // Realtime fallback — catch messages even if SW relay is missed
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("foreground-push-fallback")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as {
            id: string;
            sender_id: string;
            content: string;
            media_type: string | null;
            is_read: boolean;
          };

          // Skip if already shown via SW relay
          if (seenIds.current.has(msg.id)) return;
          seenIds.current.add(msg.id);

          // Skip if already read
          if (msg.is_read) return;

          let body = msg.content;
          if (msg.media_type === "image") body = "📷 Fotoğraf gönderdi";
          else if (msg.media_type === "audio") body = "🎤 Ses kaydı gönderdi";

          toast("💬 Yeni mesaj", {
            description: body.length > 100 ? body.substring(0, 100) + "…" : body,
            action: {
              label: "Görüntüle",
              onClick: () => window.dispatchEvent(new Event("openCoachChat")),
            },
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Keep seenIds from growing unbounded
  useEffect(() => {
    const interval = setInterval(() => {
      if (seenIds.current.size > 200) {
        seenIds.current.clear();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);
}
