import { Pressable, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { SpeakerButton } from "@/features/shared/components/speaker-button";

interface WordPopupProps {
  word: string;
  translation: string | null;
  isKnown: boolean;
  onDismiss: () => void;
  onSave?: () => void;
  onLookup?: () => void;
}

export function WordPopup({
  word,
  translation,
  isKnown,
  onDismiss,
  onSave,
  onLookup,
}: WordPopupProps) {
  const { colors, textStyles } = useAppTheme();
  const { bottom } = useSafeAreaInsets();

  const hasTranslation = translation != null && translation !== "—";

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutDown.duration(150)}
      style={{
        position: "absolute",
        bottom: bottom + 60,
        left: 16,
        right: 16,
        backgroundColor: colors.card,
        borderRadius: 20,
        borderCurve: "continuous",
        padding: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      }}
    >
      <Pressable
        onPress={onDismiss}
        style={{ position: "absolute", top: 14, right: 16 }}
        hitSlop={12}
      >
        <SymbolView
          name="xmark.circle.fill"
          size={24}
          tintColor={colors.textGhost}
          resizeMode="scaleAspectFit"
        />
      </Pressable>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={[textStyles.heading, { fontSize: 22 }]}>{word}</Text>
          <SpeakerButton text={word} size="sm" />
        </View>

        {hasTranslation && (
          <Text
            style={[
              textStyles.body,
              { fontSize: 16, color: colors.textSecondary },
            ]}
          >
            {translation}
          </Text>
        )}

        {isKnown && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <SymbolView
              name="checkmark.circle.fill"
              size={16}
              tintColor={colors.success}
              resizeMode="scaleAspectFit"
            />
            <Text
              style={[textStyles.mono, { fontSize: 12, color: colors.success }]}
            >
              Già nel vocabolario
            </Text>
          </View>
        )}

        {!isKnown && hasTranslation && onSave && (
          <Pressable
            onPress={onSave}
            style={({ pressed }) => ({
              backgroundColor: colors.accent,
              borderRadius: 12,
              borderCurve: "continuous",
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <SymbolView
              name="plus.circle.fill"
              size={18}
              tintColor={colors.onAccent}
              resizeMode="scaleAspectFit"
            />
            <Text
              style={{
                fontFamily: textStyles.heading.fontFamily,
                fontSize: 15,
                fontWeight: "600",
                color: colors.onAccent,
              }}
            >
              Salva nel vocabolario
            </Text>
          </Pressable>
        )}

        {!isKnown && !hasTranslation && onLookup && (
          <Pressable
            onPress={onLookup}
            style={({ pressed }) => ({
              backgroundColor: colors.accent,
              borderRadius: 12,
              borderCurve: "continuous",
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <SymbolView
              name="magnifyingglass"
              size={16}
              tintColor={colors.onAccent}
              resizeMode="scaleAspectFit"
            />
            <Text
              style={{
                fontFamily: textStyles.heading.fontFamily,
                fontSize: 15,
                fontWeight: "600",
                color: colors.onAccent,
              }}
            >
              Cerca nel dizionario
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
