

## Plan: The Proof Engine (Part 2 of 4)

### Summary

Add `proof_url` and `opponent_proof_url` columns to the `challenges` table, create a `challenge-proofs` storage bucket, build a `useProofUpload` hook, and replace the static Proof tab with a functional media upload/display UI.

---

### Technical Details

#### 1. Database Migration

Add two text columns to the existing `challenges` table:

```sql
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS opponent_proof_url TEXT;
```

#### 2. Storage Bucket — `challenge-proofs`

Create a public bucket for proof media:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('challenge-proofs', 'challenge-proofs', true);

CREATE POLICY "Authenticated users can upload proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'challenge-proofs');

CREATE POLICY "Anyone can view proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'challenge-proofs');
```

#### 3. New Hook — `src/hooks/useProofUpload.ts`

- `uploadProof(file, challengeId, isChallenger)`:
  - Uploads to `challenge-proofs/${challengeId}/${Date.now()}_${file.name}`
  - Gets public URL via `supabase.storage.from('challenge-proofs').getPublicUrl()`
  - Updates `challenges` table: sets `proof_url` (if challenger) or `opponent_proof_url` (if opponent)
  - Invalidates `["my-challenges"]` query, shows success toast
- Returns `{ uploadProof, isUploading }`

#### 4. Data Flow Updates

**`src/hooks/useChallenges.ts`** — Add `proofUrl` and `opponentProofUrl` to the `Challenge` type and `mapToChallenge`:
```typescript
proofUrl: row.proof_url || undefined,
opponentProofUrl: row.opponent_proof_url || undefined,
```

**`src/lib/challengeData.ts`** — Add `proofUrl?: string` and `opponentProofUrl?: string` to the `Challenge` interface.

**`src/components/ChallengesSection.tsx`** — Pass `proofUrl` and `opponentProofUrl` to the modal props.

#### 5. Wire Proof Tab UI — `src/components/ChallengeDetailModal.tsx`

**Interface update:** Add `proofUrl?: string` and `opponentProofUrl?: string` to challenge prop type.

**Proof Tab redesign** (replaces lines 326-337):

- Determine `myProofUrl` and `opponentProofUrl` based on `isChallenger`.
- **No proof uploaded yet + status active:**
  - Dashed-border dropzone area with `UploadCloud` icon
  - Hidden `<input type="file" accept="image/*,video/*" />` triggered on click
  - Loading spinner overlay when `isUploading`
- **Proof uploaded:**
  - Image preview card with `<img>` tag (rounded, shadow)
  - Green "Kanıt Yüklendi ✓" badge
- **Opponent proof section below:**
  - If available: render opponent's proof image with their name
  - If not: muted "Rakip henüz kanıt yüklemedi" text

---

### Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/..._challenge_proofs.sql` | Add columns + storage bucket + policies |
| `src/hooks/useProofUpload.ts` | New — upload hook |
| `src/lib/challengeData.ts` | Add `proofUrl`, `opponentProofUrl` to Challenge type |
| `src/hooks/useChallenges.ts` | Map new columns in `mapToChallenge` |
| `src/components/ChallengesSection.tsx` | Pass proof URLs to modal |
| `src/components/ChallengeDetailModal.tsx` | Proof tab with upload dropzone + preview |

