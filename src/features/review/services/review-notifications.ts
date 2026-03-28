import * as Notifications from "expo-notifications";

const REVIEW_CHANNEL_ID = "review-reminder";
const REVIEW_NOTIFICATION_ID = "daily-review";

let handlerConfigured = false;

function ensureHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
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

export async function scheduleReviewReminder(
  hour: number,
  minute: number,
): Promise<boolean> {
  ensureHandler();
  await cancelReviewReminder();

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  if (process.env.EXPO_OS === "android") {
    await Notifications.setNotificationChannelAsync(REVIEW_CHANNEL_ID, {
      name: "Review Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: REVIEW_NOTIFICATION_ID,
    content: {
      title: "Zeit zum Üben!",
      body: "Hai parole da ripassare. Una sessione veloce rinforza la memoria.",
      sound: true,
      data: { screen: "/(review)" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return true;
}

export async function cancelReviewReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REVIEW_NOTIFICATION_ID);
}
