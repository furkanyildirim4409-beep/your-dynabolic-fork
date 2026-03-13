import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    setIsSupported("serviceWorker" in navigator && "PushManager" in window);
  }, []);

  // Force SW update on boot — busts stubborn iOS WebKit SW cache
  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        reg.update();
      }
    });
  }, [isSupported]);

  // Auto-sync existing subscription on login (if permission already granted)
  useEffect(() => {
    if (!isSupported || !user || syncedRef.current) return;
    syncedRef.current = true;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existingSub = await reg.pushManager.getSubscription();

        if (existingSub) {
          // Sync to DB in case it's missing
          await upsertSubscription(user.id, existingSub);
          setIsSubscribed(true);
        } else if (Notification.permission === "granted") {
          // Permission granted but no subscription — re-subscribe
          const sub = await createSubscription(reg);
          if (sub) {
            await upsertSubscription(user.id, sub);
            setIsSubscribed(true);
          }
        }
      } catch (err) {
        console.error("Push auto-sync error:", err);
      }
    })();
  }, [isSupported, user]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) return false;

    try {
      // iOS Safari: VAPID key ve SW registration'ı izin istemeden ÖNCE hazırla
      // Böylece izin verildikten sonra pushManager.subscribe() hemen çağrılır
      // ve user gesture zinciri kırılmaz
      const [reg, vapidKey] = await Promise.all([
        navigator.serviceWorker.ready,
        fetchVapidPublicKey(),
      ]);

      if (!vapidKey) {
        console.error("VAPID public key not available");
        return false;
      }

      // İzin iste — bu, user gesture'dan hemen sonra olmalı
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      // İzin verildi — hemen subscribe ol (artık async fetch yok)
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      await upsertSubscription(user.id, sub);
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      return false;
    }
  }, [isSupported, user]);

  return { isSupported, isSubscribed, subscribe };
}

async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("get-vapid-public-key");
    if (error) throw error;
    return data?.vapidPublicKey || null;
  } catch (err) {
    console.error("Failed to fetch VAPID key:", err);
    return null;
  }
}

async function createSubscription(reg: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  const vapidKey = await fetchVapidPublicKey();
  if (!vapidKey) {
    console.error("VAPID public key not available");
    return null;
  }

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
  });
}

async function upsertSubscription(userId: string, sub: PushSubscription) {
  const subJson = sub.toJSON();
  const { error } = await supabase.from("push_subscriptions" as any).upsert(
    {
      user_id: userId,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys?.p256dh || "",
      auth: subJson.keys?.auth || "",
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    console.error("Push subscription upsert error:", error.message);
  }
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
