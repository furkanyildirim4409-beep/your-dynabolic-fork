import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("serviceWorker" in navigator && "PushManager" in window);
  }, []);

  useEffect(() => {
    if (!isSupported || !user) return;

    // Register service worker and check existing subscription
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    });
  }, [isSupported, user]);

  const subscribe = async () => {
    if (!isSupported || !user) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      const reg = await navigator.serviceWorker.ready;

      // Fetch VAPID public key from env
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("VAPID public key not configured");
        return false;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      });

      const subJson = sub.toJSON();

      // Save to Supabase
      const { error } = await supabase.from("push_subscriptions" as any).upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh || "",
          auth: subJson.keys?.auth || "",
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) {
        console.error("Push subscription save error:", error.message);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      return false;
    }
  };

  return { isSupported, isSubscribed, subscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
