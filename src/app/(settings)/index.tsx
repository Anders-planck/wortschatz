import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import * as Speech from "expo-speech";
import Constants from "expo-constants";

import { colors } from "@/features/shared/theme/colors";
import { useSettings } from "@/features/settings/hooks/use-settings";
import {
  SPEECH_RATE_MIN,
  SPEECH_RATE_MAX,
  SPEECH_RATE_STEP,
} from "@/features/settings/types";
import { SettingsSection } from "@/features/settings/components/settings-section";
import { SettingsToggleRow } from "@/features/settings/components/settings-toggle-row";
import { SettingsSliderRow } from "@/features/settings/components/settings-slider-row";
import { SettingsValueRow } from "@/features/settings/components/settings-value-row";
import { VoicePreviewCard } from "@/features/settings/components/voice-preview-card";
import { Divider } from "@/features/shared/components/divider";

export default function SettingsScreen() {
  const { settings, updateSetting } = useSettings();

  const handlePreview = () => {
    Speech.stop();
    Speech.speak("Willkommen bei WortSchatz", {
      language: "de-DE",
      rate: settings.speechRate,
    });
  };

  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 28, paddingBottom: 40 }}
        style={{ backgroundColor: colors.bg }}
      >
        <VoicePreviewCard onPress={handlePreview} />

        <SettingsSection
          title="Pronuncia"
          footer="La pronuncia usa la voce nativa del tuo dispositivo. Velocità più bassa aiuta a distinguere i suoni."
        >
          <SettingsToggleRow
            label="Auto-play al reveal"
            value={settings.autoPlayOnReveal}
            onValueChange={(v) => updateSetting("autoPlayOnReveal", v)}
          />
          <Divider />
          <SettingsSliderRow
            label="Velocità voce"
            value={settings.speechRate}
            min={SPEECH_RATE_MIN}
            max={SPEECH_RATE_MAX}
            step={SPEECH_RATE_STEP}
            onValueChange={(v) => updateSetting("speechRate", v)}
          />
        </SettingsSection>

        <SettingsSection title="Info">
          <SettingsValueRow label="Versione" value={version} />
        </SettingsSection>
      </ScrollView>

      <Stack.Screen options={{ title: "Impostazioni" }} />
    </>
  );
}
