# WortSchatz — Smart Push Notifications (Duolingo-style)

## Overview

Replace the single fixed daily reminder with streak-aware, context-driven push notifications in German. Messages escalate based on days without study, include dynamic word counts, and skip if the user already studied today.

## Problem

Current system sends one identical notification every day ("Zeit zum Üben!") regardless of whether the user already studied. No urgency, no variety — users ignore it after a few days.

## Solution

### Message Pool (German)

3 escalation levels, 6 messages each. Messages include placeholders for dynamic data.

**Level 0 — Motivante (studied yesterday, reminder for today):**
1. "Du hast {count} Wörter zu wiederholen. Los geht's!"
2. "{count} Wörter warten auf dich. Eine kurze Runde?"
3. "Dein Streak: {streak} Tage! Mach weiter so."
4. "Übung macht den Meister! {count} Wörter stehen an."
5. "Nur 5 Minuten — dein Gehirn wird es dir danken."
6. "Heute schon geübt? {count} Wörter sind fällig."

**Level 1 — Streak warning (1 day missed):**
1. "Dein Streak ist in Gefahr! Nur 5 Minuten reichen."
2. "Du hast gestern nicht geübt. Heute noch Zeit?"
3. "Ein Tag Pause — kein Problem. Aber heute ran!"
4. "{count} Wörter warten seit gestern. Kurz reinschauen?"
5. "Vergiss nicht zu üben! Dein Streak steht auf dem Spiel."
6. "Deine Wörter vermissen dich. Komm zurück!"

**Level 2 — Urgente (2+ days missed):**
1. "Du hast seit {days} Tagen nicht geübt. Deine Wörter warten."
2. "Dein Streak ist verloren. Starte einen neuen — jetzt!"
3. "{count} Wörter werden langsam vergessen. Noch kannst du sie retten."
4. "Lange nicht gesehen! {count} Wörter brauchen dich."
5. "Jeder Meister hat mal pausiert. Zeit, weiterzumachen."
6. "Die Vergessenskurve arbeitet gegen dich. 5 Minuten helfen."

### Scheduling Logic

On every app open, `rescheduleSmartNotifications()`:

1. Query `activity_log` for last study date
2. Query `words` for count of due words (`sr_due <= now`)
3. Query streak from `activity_log`
4. Calculate `daysMissed = today - lastStudyDate`
5. Select escalation level (0, 1, or 2)
6. Pick random message from that level's pool (avoid repeating last used)
7. Replace placeholders `{count}`, `{streak}`, `{days}`
8. Cancel all existing scheduled notifications
9. Schedule primary notification at user's configured hour
10. If `daysMissed >= 2`: schedule second notification 4 hours later

### Smart Skip

The scheduled notification uses `expo-notifications` local trigger. Since we reschedule on every app open:
- If user studies at 10am and app reschedules → notification at 8pm won't fire (cancelled and rescheduled for tomorrow)
- If user doesn't open the app → yesterday's scheduled notification fires with yesterday's context (still relevant)

### Settings Integration

Existing settings remain unchanged:
- `reviewReminder: boolean` — master toggle
- `reviewReminderHour: number` — primary notification hour
- `reviewReminderMinute: number` — primary notification minute

New setting key:
- `lastNotificationMessage: string` — tracks last message to avoid repetition

### File Structure

```
src/features/review/services/
  review-notifications.ts      — rewrite: rescheduleSmartNotifications()
  notification-messages.ts     — new: message pools + placeholder replacement
```

### No Backend Required

All scheduling is local via `expo-notifications`. The app reschedules on every open, using fresh data from SQLite. No push notification server needed.

## Acceptance Criteria

- [ ] Notifications are in German with dynamic word count and streak
- [ ] No notification if user already studied today
- [ ] Escalation: motivante (0 days) → warning (1 day) → urgente (2+ days)
- [ ] Second notification after 4h only when 2+ days missed
- [ ] Messages vary — never same message twice in a row
- [ ] Existing settings (toggle, hour) still work
- [ ] Reschedule happens on every app open
- [ ] `npx tsc --noEmit` passes
