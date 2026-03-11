const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query.trim())}&search_simple=1&action=process&json=1&page_size=10`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`OpenFoodFacts API returned ${res.status}`);
    }

    const data = await res.json();

    const products = (data.products || [])
      .map((p: any) => {
        const n = p.nutriments || {};
        const calories = n["energy-kcal_100g"] ?? n["energy_100g"] ?? null;
        const protein = n["proteins_100g"] ?? null;
        const carbs = n["carbohydrates_100g"] ?? null;
        const fat = n["fat_100g"] ?? null;

        if (calories == null && protein == null && carbs == null && fat == null) return null;

        return {
          id: p.code || p._id || "",
          name: p.product_name || p.product_name_en || "Bilinmeyen",
          brand: p.brands || "",
          calories: Math.round(Number(calories) || 0),
          protein: Math.round((Number(protein) || 0) * 10) / 10,
          carbs: Math.round((Number(carbs) || 0) * 10) / 10,
          fat: Math.round((Number(fat) || 0) * 10) / 10,
          serving_size: p.serving_size || "100g",
        };
      })
      .filter(Boolean);

    return new Response(JSON.stringify(products), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("search-food error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
