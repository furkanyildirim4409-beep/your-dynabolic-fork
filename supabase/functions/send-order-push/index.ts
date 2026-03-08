import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push helpers
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<Response> {
  // Use web-push via npm for Deno
  const webpush = await import("npm:web-push@3.6.7");
  
  webpush.setVapidDetails(
    "mailto:noreply@lovable.app",
    vapidPublicKey,
    vapidPrivateKey,
  );

  const result = await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    payload,
  );

  return new Response(JSON.stringify({ statusCode: result.statusCode }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const statusLabels: Record<string, string> = {
  pending: "Hazırlanıyor",
  shipped: "Kargolandı 📦",
  delivered: "Teslim Edildi ✅",
  cancelled: "İptal Edildi ❌",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, table, record, old_record } = await req.json();

    // Only react to UPDATE on orders table
    if (type !== "UPDATE" || table !== "orders") {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only if status actually changed
    if (record.status === old_record.status) {
      return new Response(JSON.stringify({ skipped: true, reason: "status unchanged" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = record.user_id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "no user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get user's push subscriptions
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (error || !subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "no subscriptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    const statusText = statusLabels[record.status] || record.status;
    const orderId = (record.id as string).slice(0, 8).toUpperCase();
    const payload = JSON.stringify({
      title: "Sipariş Durumu Güncellendi",
      body: `#${orderId} — ${statusText}`,
      data: { url: "/odemeler", orderId: record.id },
    });

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subs.map((sub) => sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey)),
    );

    return new Response(
      JSON.stringify({ sent: results.filter((r) => r.status === "fulfilled").length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Push error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
