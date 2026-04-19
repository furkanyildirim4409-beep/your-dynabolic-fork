const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN as string | undefined;
const SHOPIFY_STOREFRONT_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN as string | undefined;
const API_VERSION = "2024-10";

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

export async function shopifyFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_STOREFRONT_TOKEN) {
    throw new Error(
      "Shopify env vars missing: VITE_SHOPIFY_DOMAIN / VITE_SHOPIFY_STOREFRONT_TOKEN",
    );
  }
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(json.errors?.[0]?.message ?? `Shopify API ${res.status}`);
  }
  return json.data as T;
}

export async function getProducts(limit = 10): Promise<ShopifyProduct[]> {
  const query = `
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
  const data = await shopifyFetch<{ products: { edges: Array<{ node: any }> } }>({
    query,
    variables: { first: limit },
  });
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
