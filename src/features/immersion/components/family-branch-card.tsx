import { Pressable, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SpeakerButton } from "@/features/shared/components/speaker-button";
import type { FamilyWord } from "../types";

interface FamilyBranchCardProps {
  word: FamilyWord;
  onSave?: () => void;
  isSaved?: boolean;
}

export function FamilyBranchCard({
  word,
  onSave,
  isSaved,
}: FamilyBranchCardProps) {
  const { colors, textStyles } = useAppTheme();

  const genderColor = word.gender
    ? (colors[word.gender as keyof typeof colors] as string)
    : colors.textMuted;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        borderCurve: "continuous",
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Gender/type indicator */}
      <View
        style={{
          width: 4,
          height: 36,
          borderRadius: 2,
          backgroundColor: genderColor,
        }}
      />

      {/* Content */}
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {word.gender && (
            <Text
              style={{
                fontFamily: textStyles.mono.fontFamily,
                fontSize: 12,
                color: genderColor,
                fontWeight: "600",
              }}
            >
              {word.gender}
            </Text>
          )}
          <Text style={[textStyles.heading, { fontSize: 16 }]}>
            {word.term}
          </Text>
          {word.prefix && (
            <Text
              style={[
                textStyles.mono,
                { fontSize: 10, color: colors.textHint },
              ]}
            >
              {word.prefix}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text
            style={[textStyles.mono, { fontSize: 11, color: colors.textGhost }]}
          >
            {word.type}
          </Text>
          <Text style={[textStyles.bodyLight, { fontSize: 13 }]}>
            {word.translation}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <SpeakerButton text={word.term} size="sm" />
      {onSave && (
        <Pressable onPress={onSave} hitSlop={8}>
          <SymbolView
            name={isSaved ? "checkmark.circle.fill" : "plus.circle"}
            size={22}
            tintColor={isSaved ? colors.success : colors.accent}
            resizeMode="scaleAspectFit"
          />
        </Pressable>
      )}
    </View>
  );
}
