// Shopify Storefront API — client-side direct fetch.
// VITE_SHOPIFY_DOMAIN + VITE_SHOPIFY_STOREFRONT_TOKEN are PUBLIC (Storefront API
// is designed to be exposed to browsers). Configure via Build Secrets.

const API_VERSION = "2024-10";

// Strip protocol/trailing slash if accidentally included in env var
const RAW_DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN as string | undefined;
const DOMAIN = RAW_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/+$/, "");
const TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN as string | undefined;

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
  price: number;
  currencyCode: string;
  variantId: string;
}

async function shopifyFetch<T>(body: { query: string; variables?: Record<string, unknown> }): Promise<T> {
  if (!DOMAIN || !TOKEN) {
    throw new Error(
      "Shopify yapılandırılmamış. Build Secrets içine VITE_SHOPIFY_DOMAIN ve VITE_SHOPIFY_STOREFRONT_TOKEN ekleyin.",
    );
  }
  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    const msg = json.errors?.[0]?.message ?? `Shopify API ${res.status}`;
    throw new Error(msg);
  }
  return json.data as T;
}

const PRODUCTS_QUERY = `
  query Products($first: Int!, $query: String) {
    products(first: $first, query: $query) {
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

export async function getProducts(opts: { limit?: number; query?: string } = {}): Promise<ShopifyProduct[]> {
  const { limit = 50, query } = opts;
  const data = await shopifyFetch<{
    products: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          handle: string;
          description: string;
          images: { edges: Array<{ node: { url: string; altText: string | null } }> };
          variants: { edges: Array<{ node: { id: string; price: { amount: string; currencyCode: string } } }> };
        };
      }>;
    };
  }>({ query: PRODUCTS_QUERY, variables: { first: Math.min(limit, 50), query: query ?? null } });

  return data.products.edges.map(({ node }) => {
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
  });
}

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }`;

export async function createShopifyCart(
  lines: { merchandiseId: string; quantity: number }[],
): Promise<string> {
  if (lines.length === 0) throw new Error("Boş Shopify sepeti");
  const data = await shopifyFetch<{
    cartCreate: {
      cart: { id: string; checkoutUrl: string } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>({
    query: CART_CREATE_MUTATION,
    variables: { input: { lines: lines.map((l) => ({ merchandiseId: l.merchandiseId, quantity: l.quantity })) } },
  });
  if (data.cartCreate.userErrors?.length) {
    throw new Error(data.cartCreate.userErrors[0].message);
  }
  if (!data.cartCreate.cart?.checkoutUrl) {
    throw new Error("Shopify checkout URL alınamadı");
  }
  return data.cartCreate.cart.checkoutUrl;
}
