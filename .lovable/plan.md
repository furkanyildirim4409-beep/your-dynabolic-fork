

## Plan: Notification Preferences UI Polish

### Current State
The SettingsPanel already has a push notification toggle (lines 134-142) but it's minimal — just "Sipariş durumu güncellemeleri" with no loading state, no status indicator, and no expanded description. The user wants a more premium, informative notification preferences section.

### Changes

#### 1. Enhance the Push Notifications block in `src/components/SettingsPanel.tsx`

Replace the current single-line push toggle (lines 134-142) with an expanded, premium notification card:

- **Add loading state** to `usePushNotifications` hook and `handlePushToggle` (disable switch while subscribing)
- **Show permission status** badge (Granted/Denied/Default) using a colored dot indicator
- **Expand description** to: "Yeni düellolar, mesajlar ve koç uyarıları için anlık bildirim al."
- **Add denied-state hint**: If `Notification.permission === 'denied'`, show a muted warning text telling the user to enable notifications from browser settings
- **Visual upgrade**: Give the push section its own distinct sub-card with a gradient border accent to make it stand out from the other toggles

#### 2. Add `isLoading` state to `handlePushToggle` in SettingsPanel

- Track a local `isPushLoading` state
- Set it `true` before calling `subscribePush()`, `false` after
- Pass `disabled={isPushLoading || pushSubscribed}` to the Switch

### Files Changed

| File | Change |
|------|--------|
| `src/components/SettingsPanel.tsx` | Enhanced push notification UI with loading state, permission badge, denied hint, and premium styling |

No new files, no database changes, no hook modifications needed.

