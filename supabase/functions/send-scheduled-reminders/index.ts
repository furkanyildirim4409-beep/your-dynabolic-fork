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
 * Called by pg_cron (Europe/Istanbul timezone):
 *   - 09:00 → daily check-in nudge
 *   - 14:00 → meal reminder for athletes who haven't logged food
 *   - 18:00 → workout reminder for today
 *
 * Query param ?type=checkin|meal|workout to target a specific nudge.
 * Without a type, all are processed.
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
    const nudgeType = url.searchParams.get("type");

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
    const todayStr = istanbulNow.toISOString().split("T")[0];

    const jsDay = istanbulNow.getDay();
    const isoDow = jsDay === 0 ? 7 : jsDay;

    let totalSent = 0;
    let totalFailed = 0;
    let totalCleaned = 0;

    // ─── CHECK-IN NUDGE ──────────────────────────────────────────
    if (!nudgeType || nudgeType === "checkin") {
      const { data: rawSubs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth, user_id");

      

      if (rawSubs && rawSubs.length > 0) {
        const uniqueUserIds = [...new Set(rawSubs.map((s: any) => s.user_id))];
        const athleteIds = await getAthleteIds(supabaseAdmin, uniqueUserIds);
        const prefsMap = await getNotificationPrefs(supabaseAdmin, uniqueUserIds);
        

        const filteredSubs = rawSubs.filter((s: any) => {
          if (!athleteIds.has(s.user_id)) return false;
          const prefs = prefsMap.get(s.user_id);
          if (prefs && typeof prefs === "object" && prefs.checkin_reminders === false) return false;
          return true;
        });

        

        if (filteredSubs.length > 0) {
          const { data: checkins } = await supabaseAdmin
            .from("daily_checkins")
            .select("user_id")
            .gte("created_at", `${todayStr}T00:00:00`)
            .lte("created_at", `${todayStr}T23:59:59`)
            .in("user_id", [...athleteIds]);

          const checkedInIds = new Set((checkins || []).map((c: { user_id: string }) => c.user_id));
          const needNudge = filteredSubs.filter((s: PushSub) => !checkedInIds.has(s.user_id));

          console.log(`[checkin] checkedIn=${checkedInIds.size}, needNudge=${needNudge.length}`);

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
    }

    // ─── MEAL REMINDER ─────────────────────────────────────────
    if (!nudgeType || nudgeType === "meal") {
      const { data: rawMealSubs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth, user_id");

      if (rawMealSubs && rawMealSubs.length > 0) {
        const uniqueMealUserIds = [...new Set(rawMealSubs.map((s: any) => s.user_id))];
        const mealAthleteIds = await getAthleteIds(supabaseAdmin, uniqueMealUserIds);
        const mealPrefsMap = await getNotificationPrefs(supabaseAdmin, uniqueMealUserIds);

        const filteredMealSubs = rawMealSubs.filter((s: any) => {
          if (!mealAthleteIds.has(s.user_id)) return false;
          const prefs = mealPrefsMap.get(s.user_id);
          if (prefs && typeof prefs === "object" && prefs.meal_reminders === false) return false;
          return true;
        });

        if (filteredMealSubs.length > 0) {
          const { data: foodLogs } = await supabaseAdmin
            .from("consumed_foods")
            .select("athlete_id")
            .gte("logged_at", `${todayStr}T00:00:00`)
            .lte("logged_at", `${todayStr}T23:59:59`)
            .in("athlete_id", [...mealAthleteIds]);

          const loggedFoodIds = new Set((foodLogs || []).map((f: { athlete_id: string }) => f.athlete_id));
          const needMealNudge = filteredMealSubs.filter((s: PushSub) => !loggedFoodIds.has(s.user_id));

          if (needMealNudge.length > 0) {
            const mealPayload = JSON.stringify({
              title: "🍽️ Öğle yemeğini kaydetmeyi unuttun!",
              body: "Bugün henüz hiç yemek girişin yok. Makrolarını takip etmeye devam et!",
              data: { url: "/beslenme" },
            });

            const mealResult = await sendPushBatch(supabaseAdmin, needMealNudge, mealPayload);
            totalSent += mealResult.sent;
            totalFailed += mealResult.failed;
            totalCleaned += mealResult.cleaned;
          }
        }
      }
    }

    // ─── WORKOUT REMINDER ────────────────────────────────────────
    if (!nudgeType || nudgeType === "workout") {
      const { data: todayWorkouts } = await supabaseAdmin
        .from("assigned_workouts")
        .select("athlete_id, workout_name")
        .or(`scheduled_date.eq.${todayStr},day_of_week.eq.${isoDow}`);

      if (todayWorkouts && todayWorkouts.length > 0) {
        const rawAthleteIds = [...new Set(todayWorkouts.map((w: { athlete_id: string }) => w.athlete_id).filter(Boolean))] as string[];

        const { data: todayLogs } = await supabaseAdmin
          .from("workout_logs")
          .select("user_id")
          .gte("logged_at", `${todayStr}T00:00:00`)
          .lte("logged_at", `${todayStr}T23:59:59`)
          .in("user_id", rawAthleteIds);

        const loggedIds = new Set((todayLogs || []).map((l: { user_id: string }) => l.user_id));
        const needReminder = rawAthleteIds.filter((id) => !loggedIds.has(id));

        if (needReminder.length > 0) {
          const workoutAthleteIds = await getAthleteIds(supabaseAdmin, needReminder);

          const { data: rawWorkoutSubs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth, user_id")
            .in("user_id", needReminder);

          const workoutPrefsMap = await getNotificationPrefs(supabaseAdmin, needReminder);

          const filteredWorkoutSubs = (rawWorkoutSubs || []).filter((s: any) => {
            if (!workoutAthleteIds.has(s.user_id)) return false;
            const prefs = workoutPrefsMap.get(s.user_id);
            if (prefs && typeof prefs === "object" && prefs.workout_reminders === false) return false;
            return true;
          });

          if (filteredWorkoutSubs.length > 0) {
            const userWorkoutMap = new Map<string, string>();
            for (const w of todayWorkouts) {
              if (w.athlete_id && needReminder.includes(w.athlete_id)) {
                userWorkoutMap.set(w.athlete_id, w.workout_name);
              }
            }

            const results = await Promise.allSettled(
              filteredWorkoutSubs.map((sub: PushSub) => {
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
                  ? filteredWorkoutSubs[i].endpoint
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
        type: nudgeType || "all",
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

/** Helper: get user IDs that have the 'athlete' role in user_roles table */
async function getAthleteIds(
  supabaseAdmin: ReturnType<typeof createClient>,
  userIds: string[],
): Promise<Set<string>> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .in("user_id", userIds)
    .eq("role", "athlete");
  return new Set((data || []).map((r: any) => r.user_id));
}

/** Helper: get notification_preferences from profiles for a set of user IDs */
async function getNotificationPrefs(
  supabaseAdmin: ReturnType<typeof createClient>,
  userIds: string[],
): Promise<Map<string, any>> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, notification_preferences")
    .in("id", userIds);
  const map = new Map<string, any>();
  for (const row of data || []) {
    map.set(row.id, row.notification_preferences);
  }
  return map;
}

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
