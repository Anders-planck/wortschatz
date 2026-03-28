import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface ChatInputBarProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const { colors, textStyles } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");

  const hasText = text.trim().length > 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: colors.bg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: 20,
          borderCurve: "continuous",
          paddingHorizontal: 16,
          paddingVertical: 10,
          minHeight: 40,
          justifyContent: "center",
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Scrivi in tedesco..."
          placeholderTextColor={colors.textHint}
          multiline
          editable={!disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit
          style={{
            fontFamily: textStyles.body.fontFamily,
            fontSize: 15,
            color: colors.textPrimary,
            maxHeight: 100,
            lineHeight: 20,
          }}
        />
      </View>
      <Pressable
        onPress={handleSend}
        disabled={!hasText || disabled}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <SymbolView
          name="arrow.up.circle.fill"
          size={32}
          tintColor={hasText && !disabled ? colors.accent : colors.textHint}
          resizeMode="scaleAspectFit"
        />
      </Pressable>
    </View>
  );
}
