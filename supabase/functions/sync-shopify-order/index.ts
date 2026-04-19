// Sync a Supabase order to Shopify Admin REST API.
// Fire-and-forget from client; failures logged for manual reconciliation.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ItemSchema = z.object({
  shopifyVariantId: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  title: z.string().min(1),
});

const AddressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(5),
  city: z.string().min(2),
  district: z.string().min(2),
  address: z.string().min(5),
});

const BodySchema = z.object({
  orderId: z.string().uuid(),
  shippingAddress: AddressSchema,
  items: z.array(ItemSchema).min(1),
});

function gidToNumeric(gid: string): string {
  // gid://shopify/ProductVariant/12345 -> "12345"
  const tail = gid.split("/").pop() ?? gid;
  return tail.replace(/\D/g, "") || tail;
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts.at(-1) ?? "" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SHOPIFY_DOMAIN = Deno.env.get("SHOPIFY_DOMAIN");
    const SHOPIFY_ADMIN_TOKEN = Deno.env.get("SHOPIFY_ADMIN_TOKEN");

    if (!SHOPIFY_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: "Shopify Admin not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Validate body
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid body", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { orderId, shippingAddress, items } = parsed.data;

    // Confirm order ownership (service role)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: orderRow, error: orderErr } = await admin
      .from("orders")
      .select("id, user_id, external_reference_id")
      .eq("id", orderId)
      .single();

    if (orderErr || !orderRow) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (orderRow.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: if already synced (external_reference_id is a numeric Shopify id), skip
    const existingRef = orderRow.external_reference_id ?? "";
    if (/^\d{6,}$/.test(existingRef)) {
      return new Response(JSON.stringify({ ok: true, alreadySynced: true, shopifyOrderId: existingRef }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { first, last } = splitName(shippingAddress.fullName);
    const shopifyPayload = {
      order: {
        line_items: items.map((i) => ({
          variant_id: Number(gidToNumeric(i.shopifyVariantId)),
          quantity: i.quantity,
        })),
        shipping_address: {
          first_name: first,
          last_name: last,
          address1: shippingAddress.address,
          city: shippingAddress.district,
          province: shippingAddress.city,
          country: "Turkey",
          country_code: "TR",
          phone: shippingAddress.phone,
          zip: "",
        },
        customer: {
          first_name: first,
          last_name: last,
          phone: shippingAddress.phone,
        },
        financial_status: "paid",
        send_receipt: false,
        send_fulfillment_receipt: false,
        tags: "lovable-app",
      },
    };

    const cleanDomain = SHOPIFY_DOMAIN.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    const shopifyRes = await fetch(
      `https://${cleanDomain}/admin/api/2024-10/orders.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
        },
        body: JSON.stringify(shopifyPayload),
      },
    );

    const shopifyJson = await shopifyRes.json().catch(() => ({}));
    if (!shopifyRes.ok) {
      console.error("Shopify Admin error", shopifyRes.status, shopifyJson);
      return new Response(
        JSON.stringify({ error: "Shopify Admin rejected order", details: shopifyJson, status: shopifyRes.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const shopifyOrderId: number | string | undefined = shopifyJson?.order?.id;
    if (shopifyOrderId) {
      await admin
        .from("orders")
        .update({ external_reference_id: String(shopifyOrderId), status: "processing" })
        .eq("id", orderId);
    }

    return new Response(
      JSON.stringify({ ok: true, shopifyOrderId, orderName: shopifyJson?.order?.name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("sync-shopify-order fatal", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
