import * as Notifications from "expo-notifications";
import { getDatabase } from "@/features/shared/db/database";
import { getEscalationLevel, pickMessage } from "./notification-messages";

const REVIEW_CHANNEL_ID = "review-reminder";
const PRIMARY_ID = "smart-review-primary";
const SECONDARY_ID = "smart-review-secondary";

let handlerConfigured = false;

function ensureHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

async function getNotificationContext(): Promise<{
  dueCount: number;
  streak: number;
  daysMissed: number;
  lastMessage: string | undefined;
}> {
  const db = await getDatabase();

  // Count due words
  const dueRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM words WHERE sr_due IS NULL OR sr_due <= ?`,
    [new Date().toISOString()],
  );
  const dueCount = dueRow?.count ?? 0;

  // Last study date from activity_log
  const lastRow = await db.getFirstAsync<{ last_date: string }>(
    `SELECT DATE(created_at, 'localtime') as last_date
     FROM activity_log ORDER BY created_at DESC LIMIT 1`,
  );

  const today = new Date().toISOString().slice(0, 10);
  let daysMissed = 0;
  if (lastRow?.last_date) {
    const lastDate = new Date(lastRow.last_date);
    const todayDate = new Date(today);
    daysMissed = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );
  } else {
    daysMissed = 1;
  }

  // Streak
  let streak = 0;
  const rows = await db.getAllAsync<{ day: string }>(
    `SELECT DISTINCT DATE(created_at, 'localtime') as day
     FROM activity_log ORDER BY day DESC LIMIT 30`,
  );
  if (rows.length > 0) {
    const d = new Date(today);
    // If studied today, start from today; otherwise from yesterday
    if (rows[0].day !== today) {
      d.setDate(d.getDate() - 1);
    }
    for (const row of rows) {
      if (row.day === d.toISOString().slice(0, 10)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Last notification message
  const msgRow = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'lastNotificationMessage'`,
  );

  return {
    dueCount,
    streak,
    daysMissed,
    lastMessage: msgRow?.value,
  };
}

async function saveLastMessage(message: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('lastNotificationMessage', ?)`,
    [message],
  );
}

export async function rescheduleSmartNotifications(
  hour: number,
  minute: number,
): Promise<boolean> {
  ensureHandler();

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  // Cancel existing
  await Notifications.cancelScheduledNotificationAsync(PRIMARY_ID).catch(
    () => {},
  );
  await Notifications.cancelScheduledNotificationAsync(SECONDARY_ID).catch(
    () => {},
  );

  if (process.env.EXPO_OS === "android") {
    await Notifications.setNotificationChannelAsync(REVIEW_CHANNEL_ID, {
      name: "Review Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const ctx = await getNotificationContext();

  // If studied today and daysMissed is 0, schedule for tomorrow as level 0
  const level =
    ctx.daysMissed === 0
      ? getEscalationLevel(0)
      : getEscalationLevel(ctx.daysMissed);

  const { title, body } = pickMessage(
    level,
    {
      count: ctx.dueCount,
      streak: ctx.streak,
      days: ctx.daysMissed,
    },
    ctx.lastMessage,
  );

  await saveLastMessage(body);

  // Primary notification
  await Notifications.scheduleNotificationAsync({
    identifier: PRIMARY_ID,
    content: {
      title,
      body,
      sound: true,
      data: { screen: "/(review)" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  // Secondary notification (4h later) only if 2+ days missed
  if (ctx.daysMissed >= 2) {
    const secondHour = (hour + 4) % 24;
    const { title: title2, body: body2 } = pickMessage(
      2,
      {
        count: ctx.dueCount,
        streak: ctx.streak,
        days: ctx.daysMissed,
      },
      body,
    );

    await Notifications.scheduleNotificationAsync({
      identifier: SECONDARY_ID,
      content: {
        title: title2,
        body: body2,
        sound: true,
        data: { screen: "/(review)" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: secondHour,
        minute,
      },
    });
  }

  return true;
}

// Legacy API — kept for settings compatibility
export async function scheduleReviewReminder(
  hour: number,
  minute: number,
): Promise<boolean> {
  return rescheduleSmartNotifications(hour, minute);
}

export async function cancelReviewReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(PRIMARY_ID).catch(
    () => {},
  );
  await Notifications.cancelScheduledNotificationAsync(SECONDARY_ID).catch(
    () => {},
  );
}
