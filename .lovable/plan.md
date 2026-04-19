

## Plan: Comments Drawer UX, Post Routing & Share Fallback Hotfix

### Step A — Instant Comment Drawer

Refactor `src/components/PostCommentsDrawer.tsx`:
- Remove the centered `Loader2` blocking state. Drawer opens instantly.
- When `isLoading`, render **3 skeleton rows**: `<Skeleton className="w-8 h-8 rounded-full" />` + two stacked text skeletons (name 80px, content 60% width).
- Auto-focus the input via `useRef` on drawer `open` change (effect with small `setTimeout` to wait for vaul mount). Skip on mobile via `matchMedia("(pointer: coarse)")`.
- `handleSubmit`: clear input instantly before awaiting mutation (already does this — keep).

Fix `src/hooks/usePostComments.ts` optimistic mismatch:
- Current optimistic shape already matches `PostComment` interface — verified. But `onSettled` invalidates BOTH `post-comments` and `post-comments-count`, which can cause flicker if the count query refetches and the comment list refetches separately. Ensure `onMutate` also bumps the count cache optimistically:
  ```ts
  queryClient.setQueryData<number>(["post-comments-count", postId], (old) => (old ?? 0) + 1);
  ```
- Also fix the rare silent failure: wrap insert in explicit error logging via `toast` already done in the drawer — keep.
- Ensure the SELECT query in `usePostComments` matches what's actually inserted — the join `profiles!user_id(...)` requires an FK from `post_comments.user_id` to `profiles.id`. **Will verify via supabase--read_query during implementation**; if FK is missing, switch to a manual two-step fetch (comments → profiles by user_id IN list) to avoid silent join failures.

### Step B — `/post/:id` Route (Fix 404)

Create `src/pages/PostDetail.tsx`:
- `useParams<{ id: string }>()` → fetch single post via `supabase.from("social_posts").select("*, profiles!coach_id(full_name, avatar_url)").eq("id", id).maybeSingle()`.
- Show skeleton while loading; show "Gönderi bulunamadı" if null.
- Render layout matching `Kesfet` post card (inline JSX, since `SocialPostCard` is not extracted as a shared component). Include media (image/video/before-after), content, like/comment/share row wired to same handlers.
- Top bar: back button (`navigate(-1)`) + "Gönderi" title.
- Centered mobile container: `max-w-md mx-auto`.

Wrap with `<P><AppPage>...</AppPage></P>` and register in `src/App.tsx`:
```tsx
<Route path="/post/:id" element={<P><AppPage><PostDetail /></AppPage></P>} />
```

### Step C — Share Toast Copy

In `src/pages/Kesfet.tsx` and `src/pages/CoachProfile.tsx`:
- Update fallback `toast.success("Bağlantı kopyalandı!")` → `"Bağlantı kopyalandı! (Masaüstü panosuna)"`.
- Keep silent `AbortError` handling.

### Files to change

| File | Action |
|------|--------|
| `src/components/PostCommentsDrawer.tsx` | Instant open + skeleton rows + autofocus |
| `src/hooks/usePostComments.ts` | Optimistic count bump; verify FK join (fallback to 2-step) |
| `src/pages/PostDetail.tsx` | New page |
| `src/App.tsx` | Add `/post/:id` route |
| `src/pages/Kesfet.tsx` | Update share toast copy |
| `src/pages/CoachProfile.tsx` | Update share toast copy |

No DB migration required (will only add FK if join verification fails — flagged as conditional during implementation).

