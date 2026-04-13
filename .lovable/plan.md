

## Plan: Purge Mock Data from CoachProfile Page (Part 4)

### Problem
`src/pages/CoachProfile.tsx` imports `getCoachById` and `coaches` from `@/lib/mockData` and renders entirely fake data (mock posts, products, highlights, packages, followers, students, rating). The page must be converted to live Supabase queries.

### Approach

**Create `src/hooks/useCoachDetail.ts`** with three hooks:

1. **`useCoachDetail(coachId)`** -- fetches single coach profile from `profiles` table (`id, full_name, avatar_url, bio, specialty, gym_name`)
2. **`useCoachPosts(coachId)`** -- fetches from `social_posts` where `coach_id = coachId`, with like counts (reuses pattern from `useSocialFeed.ts`)
3. **`useCoachDetailProducts(coachId)`** -- fetches from `coach_products` where `coach_id = coachId` and `is_active = true`

**Rewrite `src/pages/CoachProfile.tsx`:**

1. **Imports**: Remove `getCoachById, coaches` from mockData. Add hooks from `useCoachDetail`. Add `Skeleton` import. Switch toast to sonner.

2. **Profile Header**: Replace `coach.name` → `profile?.full_name`, `coach.avatar` → `profile?.avatar_url`, `coach.bio` → `profile?.bio`, `coach.specialty` → `profile?.specialty`. Stats (followers/students/rating) become `0` / `4.9` since these columns don't exist in DB yet.

3. **Highlights section**: Remove entirely (no `coach_stories` highlights structure in DB -- stories are flat media). Replace with live stories from `useCoachStories` filtered by `coachId`, shown as story ring circles.

4. **Feed Tab (AKIŞ)**: Replace `coach.posts.map(...)` with `(posts ?? []).map(...)` using the `SocialPost` interface. Map `post.content`, `post.before_image_url`, `post.after_image_url`, `post.video_thumbnail_url`. Use live `likes_count` and `user_has_liked`. Empty state: "Henüz gönderi yok."

5. **Shop Tab (MAĞAZA)**: Replace `coach.products.map(...)` with `(products ?? []).map(...)` using `CoachProduct` interface. Map `product.image_url`, `product.title`, `product.price`. Empty state: "Mağazada ürün bulunmuyor."

6. **Coaching Tab (KOÇLUK)**: Remove `coach.packages.map(...)`. Since no `coach_packages` table exists, render a placeholder: "Koçluk paketleri yakında aktif olacak."

7. **Loading states**: Show skeleton UI while any of the three hooks are loading.

8. **Cart/Product handlers**: Update field mappings (`image` → `image_url`, `coachName` → `profile?.full_name`).

### Files Changed
| File | Action |
|------|--------|
| `src/hooks/useCoachDetail.ts` | New file -- 3 hooks |
| `src/pages/CoachProfile.tsx` | Full rewrite to live data |

No database changes required. All tables (`profiles`, `social_posts`, `post_likes`, `coach_products`, `coach_stories`) already exist.

