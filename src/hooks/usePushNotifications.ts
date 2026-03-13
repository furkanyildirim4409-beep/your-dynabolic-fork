import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    setIsSupported("serviceWorker" in navigator && "PushManager" in window);
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      const registration = await navigator.serviceWorker.ready;

      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("VAPID public key not found in env");
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subJson = subscription.toJSON();
      await supabase.from("push_subscriptions" as any).upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh || "",
          auth: subJson.keys?.auth || "",
        },
        { onConflict: "user_id,endpoint" }
      );

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error("Push subscription error:", error);
      return false;
    }
  }, [isSupported, user]);

  useEffect(() => {
    if (!isSupported || !user || syncedRef.current) return;

    const autoSyncSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        // If permission is already granted but no subscription exists, silently create one
        if (!subscription && Notification.permission === "granted") {
          const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          if (vapidPublicKey) {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
          }
        }

        // If a subscription exists, ALWAYS sync it to Supabase on boot
        if (subscription) {
          const subJson = subscription.toJSON();
          await supabase.from("push_subscriptions").upsert(
            {
              user_id: user.id,
              endpoint: subJson.endpoint,
              p256dh: subJson.keys?.p256dh || "",
              auth: subJson.keys?.auth || "",
            },
            { onConflict: "user_id,endpoint" }
          );
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error("Push auto-sync error:", error);
      } finally {
        syncedRef.current = true;
      }
    };

    autoSyncSubscription();
  }, [isSupported, user]);

  return { isSupported, isSubscribed, subscribe };
}
