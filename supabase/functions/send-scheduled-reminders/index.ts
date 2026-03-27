import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Scheduled Reminders Edge Function
 *
 * Called by pg_cron twice a day (Europe/Istanbul timezone):
 *   - 09:00 → daily check-in nudge
 *   - 18:00 → workout reminder for today
 *
 * Query param ?type=checkin or ?type=workout to target a specific nudge.
 * Without a type, both are processed.
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
    const url = new URL(req.url);
    const nudgeType = url.searchParams.get("type"); // "checkin" | "workout" | null (both)

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

    // Today in Istanbul timezone
    const istanbulNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }),
    );
    const todayStr = istanbulNow.toISOString().split("T")[0]; // YYYY-MM-DD

    // Day of week: 1 (Monday) - 7 (Sunday) matching ISO standard
    const jsDay = istanbulNow.getDay(); // 0=Sun
    const isoDow = jsDay === 0 ? 7 : jsDay;

    let totalSent = 0;
    let totalFailed = 0;
    let totalCleaned = 0;

    // ─── CHECK-IN NUDGE ──────────────────────────────────────────
    if (!nudgeType || nudgeType === "checkin") {
      // Find users who have push subs but NO daily_checkins row for today
      const { data: allSubs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth, user_id, profiles!inner(role, notification_preferences)")
        .eq("profiles.role", "athlete");

      // Filter out users who opted out of check-in reminders
      const filteredSubs = (allSubs || []).filter((s: any) => {
        const prefs = s.profiles?.notification_preferences;
        if (prefs && typeof prefs === "object" && prefs.checkin_reminders === false) return false;
        return true;
      });

      if (filteredSubs.length > 0) {
        const uniqueUserIds = [...new Set(filteredSubs.map((s: PushSub) => s.user_id))];

        // Get users who already checked in today
        const { data: checkins } = await supabaseAdmin
          .from("daily_checkins")
          .select("user_id")
          .gte("created_at", `${todayStr}T00:00:00`)
          .lte("created_at", `${todayStr}T23:59:59`)
          .in("user_id", uniqueUserIds);

        const checkedInIds = new Set((checkins || []).map((c: { user_id: string }) => c.user_id));
        const needNudge = filteredSubs.filter((s: PushSub) => !checkedInIds.has(s.user_id));

        if (needNudge.length > 0) {
          const payload = JSON.stringify({
            title: "🌅 Günaydın! Check-in zamanı",
            body: "Bugünkü uyku, ruh hali ve enerji durumunu kaydet. 30 saniye sürer!",
            data: { url: "/" },
          });

          const result = await sendPushBatch(supabaseAdmin, needNudge, payload);
          totalSent += result.sent;
          totalFailed += result.failed;
          totalCleaned += result.cleaned;
        }
      }
    }

    // ─── WORKOUT REMINDER ────────────────────────────────────────
    if (!nudgeType || nudgeType === "workout") {
      // Find users with assigned workouts for today (by scheduled_date OR day_of_week)
      // who have NOT logged a workout today
      const { data: todayWorkouts } = await supabaseAdmin
        .from("assigned_workouts")
        .select("athlete_id, workout_name")
        .or(`scheduled_date.eq.${todayStr},day_of_week.eq.${isoDow}`);

      if (todayWorkouts && todayWorkouts.length > 0) {
        const athleteIds = [...new Set(todayWorkouts.map((w: { athlete_id: string }) => w.athlete_id).filter(Boolean))] as string[];

        // Check who already logged a workout today
        const { data: todayLogs } = await supabaseAdmin
          .from("workout_logs")
          .select("user_id")
          .gte("logged_at", `${todayStr}T00:00:00`)
          .lte("logged_at", `${todayStr}T23:59:59`)
          .in("user_id", athleteIds);

        const loggedIds = new Set((todayLogs || []).map((l: { user_id: string }) => l.user_id));
        const needReminder = athleteIds.filter((id) => !loggedIds.has(id));

        if (needReminder.length > 0) {
          // Get push subs for these users
          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth, user_id, profiles!inner(role, notification_preferences)")
            .eq("profiles.role", "athlete")
            .in("user_id", needReminder);

          // Filter out users who opted out of workout reminders
          const filteredWorkoutSubs = (subs || []).filter((s: any) => {
            const prefs = s.profiles?.notification_preferences;
            if (prefs && typeof prefs === "object" && prefs.workout_reminders === false) return false;
            return true;
          });

          if (filteredWorkoutSubs.length > 0) {
            // Build personalized payloads grouped by user
            const userWorkoutMap = new Map<string, string>();
            for (const w of todayWorkouts) {
              if (w.athlete_id && needReminder.includes(w.athlete_id)) {
                userWorkoutMap.set(w.athlete_id, w.workout_name);
              }
            }

            // Send push to each subscription
            const results = await Promise.allSettled(
              subs.map((sub: PushSub) => {
                const workoutName = userWorkoutMap.get(sub.user_id) || "Antrenman";
                const payload = JSON.stringify({
                  title: `💪 ${workoutName} seni bekliyor!`,
                  body: "Bugünkü antrenmanını henüz tamamlamadın. Haydi başla!",
                  data: { url: "/antrenman" },
                });
                return webpush.sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                  },
                  payload,
                );
              }),
            );

            const expired = results
              .map((r, i) =>
                r.status === "rejected" && r.reason?.statusCode === 410
                  ? subs[i].endpoint
                  : null,
              )
              .filter(Boolean);

            if (expired.length > 0) {
              await supabaseAdmin
                .from("push_subscriptions")
                .delete()
                .in("endpoint", expired);
            }

            totalSent += results.filter((r) => r.status === "fulfilled").length;
            totalFailed += results.filter((r) => r.status === "rejected").length;
            totalCleaned += expired.length;
          }
        }
      }
    }

    console.log(
      `Scheduled reminders done: sent=${totalSent}, failed=${totalFailed}, cleaned=${totalCleaned}`,
    );

    return new Response(
      JSON.stringify({
        sent: totalSent,
        failed: totalFailed,
        cleaned: totalCleaned,
        type: nudgeType || "both",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("Scheduled reminders error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/** Helper: send push to a batch of subscriptions and clean expired */
async function sendPushBatch(
  supabaseAdmin: ReturnType<typeof createClient>,
  subs: PushSub[],
  payload: string,
) {
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      ),
    ),
  );

  const expired = results
    .map((r, i) =>
      r.status === "rejected" && r.reason?.statusCode === 410
        ? subs[i].endpoint
        : null,
    )
    .filter(Boolean);

  if (expired.length > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expired);
  }

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
    cleaned: expired.length,
  };
}
