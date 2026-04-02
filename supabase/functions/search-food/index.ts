const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const USER_AGENT = "DynabolicApp/1.0 - Web - (Contact: hello@dynabolic.com)";

const OFF_USER = Deno.env.get("OFF_USERNAME") || "";
const OFF_PASS = Deno.env.get("OFF_PASSWORD") || "";
const BASIC_AUTH = btoa(`${OFF_USER}:${OFF_PASS}`);

async function offFetch(url: string): Promise<any> {
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json",
  };
  if (OFF_USER) {
    headers["Authorization"] = `Basic ${BASIC_AUTH}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    console.error(`OFF API error ${res.status} for ${url}: ${text.substring(0, 200)}`);
    throw new Error(`OFF ${res.status}`);
  }
  return res.json();
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

interface NormalizedFood {
  id: string;
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
}

function normalizeProduct(product: any): NormalizedFood | null {
  const n = product.nutriments;
  if (!n) return null;

  const calories = Math.round(n["energy-kcal_100g"] || n["energy-kcal"] || 0);
  const protein = round1(n.proteins_100g || n.proteins || 0);
  const carbs = round1(n.carbohydrates_100g || n.carbohydrates || 0);
  const fat = round1(n.fat_100g || n.fat || 0);

  if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) return null;

  const name = product.product_name_tr || product.product_name || "";
  if (!name.trim()) return null;

  return {
    id: String(product.code || product._id || ""),
    name,
    brand: product.brands || "",
    calories,
    protein,
    carbs,
    fat,
    serving_size: "100g",
  };
}

async function searchByText(query: string): Promise<NormalizedFood[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=code,product_name,product_name_tr,brands,nutriments`;
  const data = await offFetch(url);
  const products = data?.products;
  if (!Array.isArray(products)) return [];
  return products.map(normalizeProduct).filter(Boolean) as NormalizedFood[];
}

async function searchByBarcode(barcode: string): Promise<NormalizedFood[]> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,product_name_tr,brands,nutriments`;
  const data = await offFetch(url);
  if (data?.status !== 1 || !data?.product) return [];
  const item = normalizeProduct(data.product);
  return item ? [item] : [];
}

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

    let products: NormalizedFood[];
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
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
