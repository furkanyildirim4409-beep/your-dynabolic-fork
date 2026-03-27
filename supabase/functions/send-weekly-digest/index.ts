import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Weekly Digest — sends every Sunday at 10:00 Europe/Istanbul.
 *
 * For each athlete with a push subscription, it summarizes the past 7 days:
 *   • check-in count  (daily_checkins)
 *   • meals logged    (nutrition_logs)
 *   • workouts done   (workout_logs, completed=true)
 *
 * Respects notification_preferences.push opt-out.
 */

interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    webpush.setVapidDetails(
      "mailto:noreply@dynabolic.app",
      vapidPublicKey,
      vapidPrivateKey,
    );

    // 1. Get all push subscriptions
    const { data: subs, error: subsErr } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, user_id");
    if (subsErr) throw subsErr;
    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Filter to athletes only via user_roles
    const userIds = [...new Set((subs as PushSub[]).map((s) => s.user_id))];
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("user_id", userIds)
      .eq("role", "athlete");
    const athleteIds = new Set((roles || []).map((r: any) => r.user_id));

    // 3. Check notification preferences — respect push opt-out
    const { data: prefs } = await supabaseAdmin
      .from("profiles")
      .select("id, notification_preferences")
      .in("id", userIds);
    const prefMap = new Map<string, any>();
    for (const p of prefs || []) {
      prefMap.set(p.id, p.notification_preferences);
    }

    const eligibleSubs = (subs as PushSub[]).filter((s) => {
      if (!athleteIds.has(s.user_id)) return false;
      const np = prefMap.get(s.user_id);
      if (np && np.push === false) return false;
      return true;
    });

    if (eligibleSubs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No eligible athletes", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Compute the 7-day window (Istanbul timezone)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const since = sevenDaysAgo.toISOString();

    const eligibleUserIds = [...new Set(eligibleSubs.map((s) => s.user_id))];

    // 5. Fetch aggregated data for all eligible athletes in parallel
    const [checkinsRes, mealsRes, workoutsRes] = await Promise.all([
      supabaseAdmin
        .from("daily_checkins")
        .select("user_id")
        .in("user_id", eligibleUserIds)
        .gte("created_at", since),
      supabaseAdmin
        .from("nutrition_logs")
        .select("user_id")
        .in("user_id", eligibleUserIds)
        .gte("logged_at", since),
      supabaseAdmin
        .from("workout_logs")
        .select("user_id")
        .in("user_id", eligibleUserIds)
        .eq("completed", true)
        .gte("logged_at", since),
    ]);

    // Count per user
    const countBy = (rows: any[] | null) => {
      const map = new Map<string, number>();
      for (const r of rows || []) {
        map.set(r.user_id, (map.get(r.user_id) || 0) + 1);
      }
      return map;
    };

    const checkinCounts = countBy(checkinsRes.data);
    const mealCounts = countBy(mealsRes.data);
    const workoutCounts = countBy(workoutsRes.data);

    // 6. Send notifications
    let sent = 0;
    let failed = 0;
    let cleaned = 0;

    for (const sub of eligibleSubs) {
      const checkins = checkinCounts.get(sub.user_id) || 0;
      const meals = mealCounts.get(sub.user_id) || 0;
      const workouts = workoutCounts.get(sub.user_id) || 0;

      const adherenceScore = Math.min(
        100,
        Math.round(((checkins / 7) * 30 + (meals / 21) * 40 + (workouts / 5) * 30)),
      );

      const body =
        `📊 Check-in: ${checkins}/7 • 🍽️ Öğün: ${meals} • 💪 Antrenman: ${workouts}\n` +
        `Haftalık uyum puanın: %${adherenceScore}`;

      const payload = JSON.stringify({
        title: "📋 Haftalık Özetin Hazır!",
        body,
        data: { url: "/profil?showSummary=true" },
      });

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
          cleaned++;
        } else {
          failed++;
          console.error(`Push failed for ${sub.user_id}:`, err.message);
        }
      }
    }

    return new Response(
      JSON.stringify({ sent, failed, cleaned, eligible: eligibleSubs.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("Weekly digest error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
