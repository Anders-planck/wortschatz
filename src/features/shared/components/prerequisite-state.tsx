import { Pressable, Text, View } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface PrerequisiteStateProps {
  icon: SFSymbol;
  title: string;
  description: string;
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}

export function PrerequisiteState({
  icon,
  title,
  description,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
}: PrerequisiteStateProps) {
  const { colors, textStyles } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderCurve: "continuous",
        padding: 24,
        gap: 16,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          borderCurve: "continuous",
          backgroundColor: colors.accentLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SymbolView
          name={icon}
          size={28}
          tintColor={colors.accent}
          resizeMode="scaleAspectFit"
        />
      </View>

      <View style={{ gap: 8, alignItems: "center" }}>
        <Text style={[textStyles.heading, { fontSize: 18 }]}>{title}</Text>
        <Text
          style={[
            textStyles.bodyLight,
            {
              color: colors.textMuted,
              textAlign: "center",
              lineHeight: 22,
            },
          ]}
        >
          {description}
        </Text>
      </View>

      <View style={{ width: "100%", gap: 10 }}>
        <Pressable
          onPress={onPrimaryPress}
          style={({ pressed }) => ({
            backgroundColor: colors.accent,
            borderRadius: 12,
            borderCurve: "continuous",
            paddingVertical: 15,
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={[
              textStyles.body,
              { color: colors.onAccent, fontWeight: "600", fontSize: 15 },
            ]}
          >
            {primaryLabel}
          </Text>
        </Pressable>

        {secondaryLabel && onSecondaryPress ? (
          <Pressable
            onPress={onSecondaryPress}
            style={({ pressed }) => ({
              backgroundColor: colors.cream,
              borderRadius: 12,
              borderCurve: "continuous",
              paddingVertical: 15,
              alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={[
                textStyles.body,
                { color: colors.textSecondary, fontWeight: "500", fontSize: 15 },
              ]}
            >
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
