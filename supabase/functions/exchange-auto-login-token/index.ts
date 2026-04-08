import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Token gerekli" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Find valid token
    const { data: tokenRow, error: tokenError } = await admin
      .from("auto_login_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (tokenError || !tokenRow) {
      return new Response(JSON.stringify({ error: "Geçersiz veya süresi dolmuş token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark token as used
    await admin
      .from("auto_login_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenRow.id);

    // Generate a magic link for the user (OTP-based)
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(tokenRow.user_id);
    if (userError || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: "Kullanıcı bulunamadı" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a magic link
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: userData.user.email,
    });

    if (linkError || !linkData) {
      return new Response(JSON.stringify({ error: "Oturum oluşturulamadı" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract the hashed_token from the generated link for OTP verification
    const url = new URL(linkData.properties.action_link);
    const hashedToken = url.searchParams.get("token");
    const type = url.searchParams.get("type");

    return new Response(
      JSON.stringify({
        hashed_token: hashedToken,
        type,
        email: userData.user.email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Sunucu hatası" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
