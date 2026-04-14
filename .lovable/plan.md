

## Plan: Hotfix Discovery Feed Media (Epic 6 - Part 1)

### Problem
The `social_posts` table lacks a generic `image_url` column. Currently only `transformation` (before/after) and `video` (thumbnail) types render media. A coach posting a single image has no column to store it and no rendering path in the UI.

### Solution

**Step 1 -- Database Migration: Add `image_url` column**

```sql
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS image_url text;
```

Update `src/integrations/supabase/types.ts` to include `image_url` in the `social_posts` Row/Insert/Update types.

**Step 2 -- Update `SocialPost` type in `src/types/shared-models.ts`**

Add `image_url: string | null;` to the `SocialPost` interface.

**Step 3 -- Update `useSocialFeed.ts` mapping**

Include `image_url: p.image_url` in the post mapping inside `useSocialPosts`.

**Step 4 -- Add image rendering in `Kesfet.tsx`**

After the existing `transformation` and `video` blocks (line 316), add a new block for single-image posts:

```tsx
{post.type === "image" && post.image_url && (
  <div className="aspect-square mx-4 bg-muted rounded-lg overflow-hidden">
    <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
  </div>
)}
```

Also add a fallback for any post type that has `before_image_url` but not `after_image_url` (single image reusing the before field):

```tsx
{post.type !== "transformation" && post.type !== "video" && !post.image_url && post.before_image_url && (
  <div className="aspect-square mx-4 bg-muted rounded-lg overflow-hidden">
    <img src={post.before_image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
  </div>
)}
```

### Files Changed
| File | Action |
|------|--------|
| Migration SQL | Add `image_url` column to `social_posts` |
| `src/integrations/supabase/types.ts` | Add `image_url` to social_posts types |
| `src/types/shared-models.ts` | Add `image_url` to `SocialPost` |
| `src/hooks/useSocialFeed.ts` | Map `image_url` field |
| `src/pages/Kesfet.tsx` | Render single-image and fallback media blocks |

