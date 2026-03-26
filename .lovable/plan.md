

## Plan: Media Sanitization & Storage Limits (Hotfix 2.1)

### Summary

Fix two bugs in `src/hooks/useProofUpload.ts`: add a 50MB file size guard before upload, and sanitize filenames to strip Turkish characters and spaces that cause S3 "Invalid Key" errors.

### Technical Details

#### Single file change: `src/hooks/useProofUpload.ts`

1. **Size limit** — Before `setIsUploading(true)`, check `file.size > 50 * 1024 * 1024`. If exceeded, show a destructive toast and `return` early.

2. **Filename sanitization** — Replace line 13's raw `file.name` usage with a sanitized version:
   - `normalize("NFD")` + strip combining marks (converts Ü→U, ç→c)
   - Replace non-alphanumeric chars (spaces, special) with `_`
   - Collapse consecutive underscores

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useProofUpload.ts` | Add size guard + filename sanitizer |

