import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

let cachedVapidKey: string | null = null;

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);

    // Pre-warm VAPID key so it's ready before user clicks
    if (supported && !cachedVapidKey) {
      fetchVapidPublicKey().then(key => { if (key) cachedVapidKey = key; });
    }
  }, []);

  // Force SW update on boot — delayed to avoid iOS state conflicts
  useEffect(() => {
    if (!isSupported) return;
    setTimeout(() => {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          reg.update();
        }
      });
    }, 5000);
  }, [isSupported]);

  // Auto-sync existing subscription on login
  useEffect(() => {
    if (!isSupported || !user || syncedRef.current) return;
    syncedRef.current = true;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existingSub = await reg.pushManager.getSubscription();

        if (existingSub) {
          await upsertSubscription(user.id, existingSub);
          setIsSubscribed(true);
        } else if (Notification.permission === "granted") {
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
      // Pre-fetch VAPID key & SW registration BEFORE requesting permission
      const [reg, vapidKey] = await Promise.all([
        navigator.serviceWorker.ready,
        cachedVapidKey ? Promise.resolve(cachedVapidKey) : fetchVapidPublicKey(),
      ]);

      if (!vapidKey) {
        console.error("VAPID public key not available");
        return false;
      }
      cachedVapidKey = vapidKey;

      // Request permission — must be immediately followed by subscribe
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      // Subscribe immediately — pass Uint8Array directly (NOT .buffer for WebKit)
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
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
  const vapidKey = cachedVapidKey || await fetchVapidPublicKey();
  if (!vapidKey) {
    console.error("VAPID public key not available");
    return null;
  }
  cachedVapidKey = vapidKey;

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
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
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
