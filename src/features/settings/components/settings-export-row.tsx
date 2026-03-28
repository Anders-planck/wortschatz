import { useState } from "react";
import { Pressable, Text, View, ActivityIndicator } from "react-native";
import { SymbolView } from "expo-symbols";
import { fonts } from "@/features/shared/theme/typography";
import { useThemeColors } from "@/features/shared/theme/theme-context";
import {
  hapticLight,
  hapticSuccess,
} from "@/features/shared/hooks/use-haptics";
import { exportVocabulary } from "@/features/vocabulary/services/export-vocabulary";

export function SettingsExportRow() {
  const colors = useThemeColors();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "csv" | "json") => {
    hapticLight();
    setIsExporting(true);
    try {
      await exportVocabulary(format);
      hapticSuccess();
    } catch {
      // User cancelled share sheet or export failed
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.textPrimary,
        }}
      >
        Esporta vocabolario
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["csv", "json"] as const).map((format) => (
          <Pressable
            key={format}
            onPress={() => handleExport(format)}
            disabled={isExporting}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 10,
              backgroundColor: pressed ? colors.accentLight : colors.cream,
              borderRadius: 10,
              borderCurve: "continuous",
              opacity: isExporting ? 0.5 : 1,
            })}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <SymbolView
                  name="square.and.arrow.up"
                  size={14}
                  tintColor={colors.accent}
                  resizeMode="scaleAspectFit"
                />
                <Text
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.accent,
                    textTransform: "uppercase",
                  }}
                >
                  {format}
                </Text>
              </>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
