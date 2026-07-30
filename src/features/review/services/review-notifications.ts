import * as Notifications from "expo-notifications";
import { getDatabase } from "@/features/shared/db/database";
import { toLocalDateStr } from "@/features/shared/utils/date";
import {
  getLastStudyDate,
  getStudyStreak,
} from "./study-sessions-repository";
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

  const [lastStudyDate, streak] = await Promise.all([
    getLastStudyDate(),
    getStudyStreak(),
  ]);
  const today = toLocalDateStr(new Date());
  let daysMissed = 0;
  if (lastStudyDate) {
    const lastDate = new Date(`${lastStudyDate}T00:00:00`);
    const todayDate = new Date(`${today}T00:00:00`);
    daysMissed = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );
  } else {
    daysMissed = 1;
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
