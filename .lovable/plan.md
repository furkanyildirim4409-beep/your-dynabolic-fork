

## Plan: Gemini AI Integration for Bloodwork OCR & Analysis

### Architecture

The project already has `LOVABLE_API_KEY` configured — we'll use the **Lovable AI Gateway** with `google/gemini-2.5-flash` (supports multimodal: images + PDFs) instead of requiring a separate Google API key. This is the recommended approach.

```text
User uploads PDF/Image
        │
        ▼
BloodTestUploaderModal ──► useBloodTests.uploadTest()
        │
        ├─1─► Upload file to Supabase Storage (blood-test-pdfs)
        │
        ├─2─► supabase.functions.invoke('analyze-bloodwork', { fileUrl, fileName })
        │         │
        │         ▼
        │     Edge Function downloads file from storage
        │     Converts to base64, sends to Lovable AI Gateway
        │     Gemini extracts biomarkers as structured JSON
        │         │
        │         ▼
        │     Returns { biomarkers: [...] }
        │
        └─3─► INSERT into blood_tests with real extracted_data
```

### 1. Create Edge Function: `supabase/functions/analyze-bloodwork/index.ts`

- Accepts `{ fileUrl, fileName }` in request body
- Downloads the file from `blood-test-pdfs` bucket using service role key
- Converts to base64 and sends as multimodal content to `https://ai.gateway.lovable.dev/v1/chat/completions`
- Uses `google/gemini-2.5-flash` model (best balance of speed + multimodal capability)
- System prompt instructs Gemini to act as a sports medicine doctor and extract biomarkers using the exact Turkish names the app expects (Testosteron, Kortizol, Vitamin D, etc.)
- Parses the JSON response, validates structure, filters invalid entries
- Handles 429 (rate limit) and 402 (credits) errors gracefully
- Returns `{ biomarkers: [...] }` matching the `BloodTestBiomarker` interface

### 2. Update `supabase/config.toml`

Add the new function entry with `verify_jwt = false`.

### 3. Update `src/hooks/useBloodTests.ts`

- **Remove** `generateMockBiomarkers()` function entirely (lines 27-61)
- In `uploadTest()`:
  - Keep the storage upload step
  - Replace mock biomarker generation with: `supabase.functions.invoke('analyze-bloodwork', { body: { fileUrl: filePath, fileName: file.name } })`
  - If AI returns biomarkers, insert with `status: "analyzed"`
  - If AI fails (parse error, rate limit), insert with `status: "pending"` and empty `extracted_data`, show appropriate error toast
  - Remove the hardcoded 3-second delay

### 4. Update `src/components/BloodTestUploaderModal.tsx`

- Remove the fake `await new Promise((r) => setTimeout(r, 3000))` delay (line 58)
- Update the loading text from "PDF analiz ediliyor..." to "🤖 Yapay Zeka Tahlilinizi Okuyor..." with a secondary line "Gemini AI biyobelirteçleri çıkarıyor..."
- Add a subtle pulsing animation to the loading state for premium feel

### Files

- **Create**: `supabase/functions/analyze-bloodwork/index.ts`
- **Modify**: `supabase/config.toml` — add function entry
- **Modify**: `src/hooks/useBloodTests.ts` — remove mock, call edge function
- **Modify**: `src/components/BloodTestUploaderModal.tsx` — remove fake delay, update loading UI

No database changes needed. No new secrets needed (`LOVABLE_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` already exist).

