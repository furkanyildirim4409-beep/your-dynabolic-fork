

## Pivot Ticketing to Admin/App Support (Phase 2 - Epic 5 Hotfix)

### Summary
Repurpose the ticket system from coach-directed support to app/admin support. Two files changed, one migration.

### Changes

**1. Migration: Make `coach_id` nullable on `tickets`**

```sql
ALTER TABLE public.tickets ALTER COLUMN coach_id DROP NOT NULL;
```

**2. `src/hooks/useTickets.ts`**

- Remove `profile` from auth destructuring and `coach_id` guard
- Remove `coach_id` from insert payload
- Rename `coach_reply` to `admin_reply` in the Ticket interface (or keep DB column name but alias in UI)

Specifically:
- Line 42: Change guard from `if (!user || !profile?.coach_id)` to `if (!user)`
- Line 44-45: Remove `coach_id: profile.coach_id` from insert payload
- Interface: Rename `coach_reply` field display name (keep DB column as-is to avoid migration)

**3. `src/pages/Destek.tsx`**

- Line 58: `"Koçunuza bilet gönderin"` → `"Uygulama destek ekibine ulaşın"`
- Line 38: `"Koçunuz en kısa sürede yanıtlayacak."` → `"Destek ekibimiz en kısa sürede yanıtlayacak."`
- Line 86: `"Koçunuza soru veya talep göndermek için yeni bilet oluşturun."` → `"Teknik destek veya bildirimleriniz için yeni bilet oluşturun."`
- Line 117: `"Koç Yanıtı"` → `"Destek Ekibi Yanıtı"`
- Lines 143-148: Replace subject options:
  - `🐛 Teknik Hata / Bug`
  - `💳 Ödeme & Faturalandırma`
  - `💡 Öneri & Geri Bildirim`
  - `🛡️ Hesap Güvenliği`
  - `📝 Diğer`

### Files Changed
| File | Action |
|------|--------|
| Migration SQL | `ALTER COLUMN coach_id DROP NOT NULL` |
| `src/hooks/useTickets.ts` | Remove coach_id dependency |
| `src/pages/Destek.tsx` | Update copy and subject options |

