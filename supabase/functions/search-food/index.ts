const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_URL = "https://platform.fatsecret.com/rest/server.api";

// --- OAuth 1.0 HMAC-SHA1 helpers ---

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function signedRequest(params: Record<string, string>): Promise<any> {
  const consumerKey = Deno.env.get("FATSECRET_CLIENT_ID");
  const consumerSecret = Deno.env.get("FATSECRET_CLIENT_SECRET");
  if (!consumerKey || !consumerSecret) {
    throw new Error("FatSecret credentials not configured");
  }

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
    format: "json",
    ...params,
  };

  // Build signature base string
  const allParams = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&");

  const baseString = `GET&${percentEncode(API_URL)}&${percentEncode(allParams)}`;
  const signingKey = `${percentEncode(consumerSecret)}&`; // no token secret

  const signature = await hmacSha1(signingKey, baseString);
  oauthParams["oauth_signature"] = signature;

  const qs = Object.keys(oauthParams)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`)
    .join("&");

  const res = await fetch(`${API_URL}?${qs}`);
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw { status: 429, message: "rate_limit", detail: text };
    throw new Error(`FatSecret API ${res.status}: ${text}`);
  }
  return res.json();
}

// --- Description parser ---

function parseFatSecretDescription(desc: string) {
  // Support both English and Turkish description labels
  const cal = desc.match(/(?:Calories|Kalori):\s*([\d.]+)/i);
  const fat = desc.match(/(?:Fat|Yağ):\s*([\d.]+)/i);
  const carbs = desc.match(/(?:Carbs|Karb):\s*([\d.]+)/i);
  const protein = desc.match(/(?:Protein|Prot):\s*([\d.]+)/i);
  const servingMatch = desc.match(/^(?:Per|Porsiyon başına:?)\s+(.+?)\s*-/i);

  return {
    calories: Math.round(parseFloat(cal?.[1] || "0")),
    protein: Math.round(parseFloat(protein?.[1] || "0") * 10) / 10,
    carbs: Math.round(parseFloat(carbs?.[1] || "0") * 10) / 10,
    fat: Math.round(parseFloat(fat?.[1] || "0") * 10) / 10,
    serving_size: servingMatch ? servingMatch[1].trim() : "100g",
  };
}

// --- Search handlers ---

async function searchByText(query: string) {
  const data = await signedRequest({
    method: "foods.search",
    search_expression: query,
    max_results: "15",
    region: "TR",
    language: "tr",
  });

  console.log("RAW FatSecret response:", JSON.stringify(data).slice(0, 2000));
  const foodList = data?.foods?.food;
  if (!foodList) return [];

  const foods = Array.isArray(foodList) ? foodList : [foodList];

  return foods
    .map((f: any) => {
      const desc = f.food_description || "";
      const parsed = parseFatSecretDescription(desc);
      if (parsed.calories === 0 && parsed.protein === 0 && parsed.carbs === 0 && parsed.fat === 0) return null;

      return {
        id: String(f.food_id || ""),
        name: f.food_name || "Bilinmeyen",
        brand: f.brand_name || "",
        ...parsed,
      };
    })
    .filter(Boolean);
}

async function searchByBarcode(barcode: string) {
  // Get food_id from barcode
  const barcodeData = await signedRequest({
    method: "food.find_id_for_barcode",
    barcode,
    region: "TR",
    language: "tr",
  });

  const foodId = barcodeData?.food_id?.value;
  if (!foodId) return [];

  // Get full food details
  const detail = await signedRequest({
    method: "food.get.v4",
    food_id: foodId,
    region: "TR",
    language: "tr",
  });

  const food = detail?.food;
  if (!food) return [];

  const servings = food.servings?.serving;
  if (!servings) return [];

  const servingList = Array.isArray(servings) ? servings : [servings];
  const serving =
    servingList.find((s: any) => s.metric_serving_unit === "g" && String(s.metric_serving_amount) === "100.000") ||
    servingList[0];

  return [
    {
      id: String(food.food_id || ""),
      name: food.food_name || "Bilinmeyen",
      brand: food.brand_name || "",
      calories: Math.round(parseFloat(serving.calories || "0")),
      protein: Math.round(parseFloat(serving.protein || "0") * 10) / 10,
      carbs: Math.round(parseFloat(serving.carbohydrate || "0") * 10) / 10,
      fat: Math.round(parseFloat(serving.fat || "0") * 10) / 10,
      serving_size: serving.metric_serving_amount
        ? `${Math.round(parseFloat(serving.metric_serving_amount))}${serving.metric_serving_unit || "g"}`
        : serving.serving_description || "1 serving",
    },
  ];
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { query, barcode } = body;

    if (!query && !barcode) {
      return new Response(JSON.stringify({ error: "query or barcode is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let products;
    if (barcode && typeof barcode === "string" && barcode.trim()) {
      products = await searchByBarcode(barcode.trim());
    } else if (query && typeof query === "string" && query.trim()) {
      products = await searchByText(query.trim());
    } else {
      products = [];
    }

    return new Response(JSON.stringify(products), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("search-food error:", err);

    if (err?.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limit" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
