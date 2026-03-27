

## Plan: Avatar Cropping & Upload (Epic 3 - Part 2)

### Problem
The profile page shows a static User icon. There's no way to upload or crop an avatar image. The `avatars` storage bucket exists but isn't used.

### Implementation

**1. Install `react-easy-crop`** — add to package.json dependencies.

**2. Create `src/components/profile/AvatarCropperModal.tsx`**
- Shadcn Dialog wrapping `react-easy-crop` Cropper component
- Props: `isOpen`, `imageSrc` (base64/object URL), `onClose`, `onCropComplete(blob)`
- Cropper config: `cropShape="round"`, `aspect={1}`
- Zoom slider using Shadcn Slider component
- "Onayla ve Kırp" button that extracts cropped area via canvas, converts to JPEG Blob
- Include a `getCroppedImg` helper using OffscreenCanvas/Canvas to draw the cropped region

**3. Update `src/pages/Profil.tsx`** (lines 129-134 — the User ID Card)
- Replace the static `<User>` icon with an `<Avatar>` showing `profile.avatar_url` (fallback to initials)
- Overlay a Camera icon button on the avatar
- Add hidden `<input type="file" accept="image/*">` triggered by the camera button
- On file select: read via `FileReader` → set state → open `AvatarCropperModal`
- On crop complete: upload blob to `avatars` bucket (`avatars/{userId}.jpg`), get public URL, update `profiles.avatar_url`, call `refreshProfile()`
- Show loading spinner during upload

### Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `react-easy-crop` dependency |
| `src/components/profile/AvatarCropperModal.tsx` | New — cropper modal with canvas extraction |
| `src/pages/Profil.tsx` | Replace static icon with clickable avatar + upload flow |

