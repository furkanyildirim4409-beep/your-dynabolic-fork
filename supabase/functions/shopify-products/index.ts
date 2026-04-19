// Shopify Storefront API proxy — secrets stay server-side
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const API_VERSION = "2024-10";

const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          images(first: 1) { edges { node { url altText } } }
          variants(first: 1) { edges { node { id price { amount currencyCode } } } }
        }
      }
    }
  }`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SHOPIFY_DOMAIN = Deno.env.get("SHOPIFY_DOMAIN");
  const SHOPIFY_STOREFRONT_TOKEN = Deno.env.get("SHOPIFY_STOREFRONT_TOKEN");

  if (!SHOPIFY_DOMAIN || !SHOPIFY_STOREFRONT_TOKEN) {
    return new Response(
      JSON.stringify({ error: "Shopify secrets not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const url = new URL(req.url);
    const limit = Math.min(
      Number(url.searchParams.get("limit") ?? 20) || 20,
      50,
    );

    const shopRes = await fetch(
      `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
          query: PRODUCTS_QUERY,
          variables: { first: limit },
        }),
      },
    );

    const json = await shopRes.json();
    if (!shopRes.ok || json.errors) {
      const msg = json.errors?.[0]?.message ?? `Shopify API ${shopRes.status}`;
      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const products = (json.data?.products?.edges ?? []).map(
      ({ node }: { node: any }) => {
        const img = node.images.edges[0]?.node;
        const variant = node.variants.edges[0]?.node;
        return {
          id: node.id,
          title: node.title,
          handle: node.handle,
          description: node.description,
          imageUrl: img?.url ?? null,
          imageAlt: img?.altText ?? node.title,
          price: variant ? parseFloat(variant.price.amount) : 0,
          currencyCode: variant?.price.currencyCode ?? "TRY",
          variantId: variant?.id ?? "",
        };
      },
    );

    return new Response(JSON.stringify({ products }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
