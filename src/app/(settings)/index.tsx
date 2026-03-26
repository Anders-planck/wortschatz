import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import Constants from "expo-constants";

import { useSpeech } from "@/features/shared/hooks/use-speech";
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
import { SettingsVoiceRow } from "@/features/settings/components/settings-voice-row";
import { Divider } from "@/features/shared/components/divider";

export default function SettingsScreen() {
  const { settings, updateSetting } = useSettings();
  const { speak } = useSpeech({ speechRate: settings.speechRate });

  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 28, paddingBottom: 40 }}
        style={{ backgroundColor: colors.bg }}
      >
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

        <SettingsSection title="Ripasso">
          <SettingsToggleRow
            label="Auto-play al reveal"
            value={settings.autoPlayOnReveal}
            onValueChange={(v) => updateSetting("autoPlayOnReveal", v)}
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
