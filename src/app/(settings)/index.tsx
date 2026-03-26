import { ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import Constants from "expo-constants";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useSpeech } from "@/features/shared/hooks/use-speech";
import { useThemeColors } from "@/features/shared/theme/theme-context";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { fonts } from "@/features/shared/theme/typography";
import {
  SPEECH_RATE_MIN,
  SPEECH_RATE_MAX,
  SPEECH_RATE_STEP,
  DAILY_GOAL_MIN,
  DAILY_GOAL_MAX,
} from "@/features/settings/types";
import { SettingsSection } from "@/features/settings/components/settings-section";
import { SettingsToggleRow } from "@/features/settings/components/settings-toggle-row";
import { SettingsSliderRow } from "@/features/settings/components/settings-slider-row";
import { SettingsValueRow } from "@/features/settings/components/settings-value-row";
import { SettingsVoiceRow } from "@/features/settings/components/settings-voice-row";
import { SettingsThemeRow } from "@/features/settings/components/settings-theme-row";
import { SettingsExportRow } from "@/features/settings/components/settings-export-row";
import { Divider } from "@/features/shared/components/divider";
import {
  scheduleReviewReminder,
  cancelReviewReminder,
} from "@/features/review/services/review-notifications";

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { settings, updateSetting } = useSettings();
  const { speak } = useSpeech({ speechRate: settings.speechRate });

  const version = Constants.expoConfig?.version ?? "1.0.0";

  const handleReminderToggle = async (enabled: boolean) => {
    if (enabled) {
      const scheduled = await scheduleReviewReminder(
        settings.reviewReminderHour,
        settings.reviewReminderMinute,
      );
      if (scheduled) updateSetting("reviewReminder", true);
    } else {
      await cancelReviewReminder();
      updateSetting("reviewReminder", false);
    }
  };

  const reminderDate = new Date();
  reminderDate.setHours(
    settings.reviewReminderHour,
    settings.reviewReminderMinute,
    0,
  );

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 28, paddingBottom: 40 }}
        style={{ backgroundColor: colors.bg }}
      >
        <SettingsSection title="Aspetto">
          <SettingsThemeRow />
        </SettingsSection>

        <SettingsSection
          title="Voce"
          footer="Tocca una voce per selezionarla e sentire un'anteprima. Senza internet, usa la voce del dispositivo."
        >
          <SettingsVoiceRow
            value={settings.ttsVoice}
            onValueChange={(v) => updateSetting("ttsVoice", v)}
            onPreview={(text) => speak(text)}
          />
          <Divider />
          <SettingsSliderRow
            label="Velocità"
            value={settings.speechRate}
            min={SPEECH_RATE_MIN}
            max={SPEECH_RATE_MAX}
            step={SPEECH_RATE_STEP}
            onValueChange={(v) => updateSetting("speechRate", v)}
          />
        </SettingsSection>

        <SettingsSection
          title="Obiettivo"
          footer={`Cerca almeno ${settings.dailyGoal} parole al giorno. Il calendario si colora in base al progresso.`}
        >
          <SettingsSliderRow
            label="Parole al giorno"
            value={settings.dailyGoal}
            min={DAILY_GOAL_MIN}
            max={DAILY_GOAL_MAX}
            step={1}
            formatValue={(v) => `${v}`}
            onValueChange={(v) => updateSetting("dailyGoal", v)}
          />
        </SettingsSection>

        <SettingsSection
          title="Ripasso"
          footer={
            settings.reviewReminder
              ? "Riceverai un promemoria all'ora scelta."
              : undefined
          }
        >
          <SettingsToggleRow
            label="Auto-play al reveal"
            value={settings.autoPlayOnReveal}
            onValueChange={(v) => updateSetting("autoPlayOnReveal", v)}
          />
          <Divider />
          <SettingsToggleRow
            label="Promemoria giornaliero"
            value={settings.reviewReminder}
            onValueChange={handleReminderToggle}
          />
          {settings.reviewReminder && (
            <>
              <Divider />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 16,
                    color: colors.textPrimary,
                  }}
                >
                  Ora
                </Text>
                <DateTimePicker
                  value={reminderDate}
                  mode="time"
                  minuteInterval={15}
                  onChange={async (_event, selectedDate) => {
                    if (!selectedDate) return;
                    const h = selectedDate.getHours();
                    const m = selectedDate.getMinutes();
                    updateSetting("reviewReminderHour", h);
                    updateSetting("reviewReminderMinute", m);
                    await scheduleReviewReminder(h, m);
                  }}
                />
              </View>
            </>
          )}
        </SettingsSection>

        <SettingsSection
          title="Dati"
          footer="Esporta tutte le parole salvate come file CSV o JSON."
        >
          <SettingsExportRow />
        </SettingsSection>

        <SettingsSection title="Info">
          <SettingsValueRow label="Versione" value={version} />
        </SettingsSection>
      </ScrollView>

      <Stack.Screen.Title large>Impostazioni</Stack.Screen.Title>
    </>
  );
}
