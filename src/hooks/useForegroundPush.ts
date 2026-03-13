import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export function useForegroundPush() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const listenerAttached = useRef(false);

  useEffect(() => {
    if (!user || listenerAttached.current) return;
    if (!("serviceWorker" in navigator)) return;

    listenerAttached.current = true;

    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "PUSH_FOREGROUND") return;

      const { payload } = event.data;
      const title = payload.title || "Yeni Bildirim";
      const body = payload.body || "";
      const url = payload.data?.athleteUrl || payload.data?.url || "/";

      toast(title, {
        description: body,
        action: {
          label: "Görüntüle",
          onClick: () => navigate(url),
        },
        duration: 5000,
      });
    };

    navigator.serviceWorker.addEventListener("message", handler);

    return () => {
      listenerAttached.current = false;
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, [user, navigate]);
}
