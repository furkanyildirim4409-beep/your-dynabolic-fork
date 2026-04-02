

# Nutrition Epic 4A: Authenticated OpenFoodFacts

## Problem
OFF returns 503 from cloud IPs for unauthenticated requests.

## Fix
Add Basic Auth header to all OFF API calls using stored secrets.

## Steps

### 1. Add secrets `OFF_USERNAME` and `OFF_PASSWORD`
Request these two new secrets from the user via the add_secret tool.

### 2. Update `supabase/functions/search-food/index.ts`
One change — update the `offFetch` helper (lines 9-22) to read credentials and include Basic Auth:

```typescript
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
```

Everything else (normalizer, text/barcode search, CORS, error fallback) stays identical.

### 3. Deploy & test
Deploy the function and test with a query like `{"query":"tavuk"}` to confirm 503 is resolved.

## Prerequisites
The user needs an OpenFoodFacts account. They can register free at https://world.openfoodfacts.org/cgi/user.pl — then provide their username and password as secrets.

