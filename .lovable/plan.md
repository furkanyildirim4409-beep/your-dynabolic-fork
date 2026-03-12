

## Plan: Real Blood Test Upload & Biomarker Tracking

### 1. Database Migration

Create `blood_tests` table:
```sql
CREATE TABLE public.blood_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  file_name text NOT NULL,
  document_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  coach_notes text,
  extracted_data jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: users manage own, coaches view via is_coach_of
```

Create `blood-test-pdfs` storage bucket (private, with RLS for user uploads and coach reads).

### 2. Create `src/hooks/useBloodTests.ts`

- `fetchTests()`: query `blood_tests` for current user, ordered by `date` desc
- `uploadTest(file, date)`: upload PDF to `blood-test-pdfs/${user.id}/${timestamp}-${name}`, insert row with mock `extracted_data` (simulated OCR with realistic biomarker values), status `'analyzed'`
- `deleteTest(id, url)`: remove storage object + DB row
- Returns `{ tests, loading, uploadTest, deleteTest, refetch }`

The mock `extracted_data` JSON structure:
```json
[
  { "name": "Testosteron", "value": 680, "unit": "ng/dL", "ref": "300-1000", "status": "normal" },
  { "name": "Vitamin D", "value": 22, "unit": "ng/mL", "ref": "30-100", "status": "low" },
  ...
]
```

### 3. Create `src/components/BloodTestUploaderModal.tsx`

Two-section modal:
- **Info Guide** (collapsible): "Sporcular İçin Önerilen Testler" with categories (Hormonlar, Organ & Metabolizma, Toparlanma, Vitamin & Mineraller)
- **Upload Section**: Date picker + drag-and-drop/click zone for PDF. On upload, show 3-second "parsing" animation, then save to storage + DB with mock extracted biomarkers

### 4. Update `BloodworkUpload.tsx`

- Remove `bloodworkReports` mock import
- Import and use `useBloodTests` hook
- Map real `tests` to the existing card list UI
- Derive `flaggedValues` dynamically from `extracted_data` (filter status !== "normal")
- "YÜKLE" button opens `BloodTestUploaderModal` instead of raw file input
- Add delete capability (trash icon on expanded card)
- Empty state when no tests exist

### 5. Update `BloodworkDetailModal.tsx`

- Accept `extractedData` prop (the JSONB array from selected test)
- Replace hardcoded `biomarkers` array with real data from prop
- Replace hardcoded `hormoneTrends` with trend data built from ALL user tests (query multiple tests' extracted_data to build time-series for Testosterone/Cortisol)
- Show coach_notes from the test record if available

### Files
- **Migration**: `blood_tests` table + `blood-test-pdfs` bucket + RLS
- **Create**: `src/hooks/useBloodTests.ts`
- **Create**: `src/components/BloodTestUploaderModal.tsx`
- **Modify**: `src/components/BloodworkUpload.tsx`
- **Modify**: `src/components/BloodworkDetailModal.tsx`

