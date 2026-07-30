import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import { LanguageChipRow } from "@/features/search/components/language-chip-row";
import { TranslationResult } from "@/features/search/components/translation-result";
import { translateDetailedText } from "@/features/search/services/translation-ai-service";
import {
  SOURCE_LANGUAGE_OPTIONS,
  TARGET_LANGUAGE_OPTIONS,
  type TranslationAnalysis,
  type TranslationLanguage,
  type TranslationSourceLanguage,
} from "@/features/search/types";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

function paramToString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function ActionButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  icon?: React.ComponentProps<typeof SymbolView>["name"];
}) {
  const { colors, textStyles } = useAppTheme();
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flex: isPrimary ? 1 : undefined,
        minWidth: isPrimary ? undefined : 54,
        backgroundColor: disabled
          ? colors.borderLight
          : isPrimary
            ? colors.accent
            : colors.card,
        borderRadius: 14,
        borderCurve: "continuous",
        paddingHorizontal: isPrimary ? 14 : 16,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: isPrimary ? 0 : 1,
        borderColor: colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {icon ? (
          <SymbolView
            name={icon}
            size={16}
            tintColor={
              disabled
                ? colors.textHint
                : isPrimary
                  ? colors.onAccent
                  : colors.textSecondary
            }
            resizeMode="scaleAspectFit"
          />
        ) : null}
        <Text
          style={{
            fontFamily: textStyles.heading.fontFamily,
            fontSize: 15,
            fontWeight: "600",
            color: disabled
              ? colors.textMuted
              : isPrimary
                ? colors.onAccent
                : colors.textPrimary,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function TranslateScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ text?: string | string[] }>();

  const [input, setInput] = useState("");
  const [sourceLanguage, setSourceLanguage] =
    useState<TranslationSourceLanguage>("auto");
  const [targetLanguage, setTargetLanguage] =
    useState<TranslationLanguage>("de");
  const [analysis, setAnalysis] = useState<TranslationAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialText = paramToString(params.text).trim();
    if (initialText.length > 0) {
      setInput(initialText);
    }
  }, [params.text]);

  const hasInvalidDirection =
    sourceLanguage !== "auto" && sourceLanguage === targetLanguage;
  const canSubmit = input.trim().length >= 2 && !hasInvalidDirection;

  const actionLabel = useMemo(() => {
    if (hasInvalidDirection) {
      return "Scegli un'altra lingua";
    }
    return isLoading ? "Traduco..." : "Traduci";
  }, [hasInvalidDirection, isLoading]);

  const handleTranslate = async () => {
    if (!canSubmit || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await translateDetailedText({
        text: input,
        sourceLanguage,
        targetLanguage,
      });
      setAnalysis(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossibile tradurre la frase",
      );
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = () => {
    if (sourceLanguage === "auto") return;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setAnalysis(null);
    setError(null);
  };

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        style={{ backgroundColor: colors.bg }}
      >
        <View style={{ gap: 8 }}>
          <Text style={textStyles.monoLabel}>Traduci</Text>
          <Text
            style={[
              textStyles.word,
              { fontSize: 34, lineHeight: 34, maxWidth: 260 },
            ]}
          >
            Traduci.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 22,
            borderCurve: "continuous",
            padding: 16,
            gap: 16,
            boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
          }}
        >
          <LanguageChipRow
            label="Da"
            value={sourceLanguage}
            options={SOURCE_LANGUAGE_OPTIONS}
            onChange={setSourceLanguage}
          />

          <LanguageChipRow
            label="A"
            value={targetLanguage}
            options={TARGET_LANGUAGE_OPTIONS}
            onChange={setTargetLanguage}
          />

          <View style={{ gap: 10 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={textStyles.monoLabel}>Testo</Text>
              <Text style={[textStyles.mono, { color: colors.textGhost }]}>
                parola o frase intera
              </Text>
            </View>
            <TextInput
              value={input}
              onChangeText={(value) => {
                setInput(value);
                setAnalysis(null);
                setError(null);
              }}
              multiline
              textAlignVertical="top"
              placeholder="Es. J’aimerais réserver une table pour deux ce soir."
              placeholderTextColor={colors.textHint}
              style={[
                textStyles.body,
                {
                  minHeight: 150,
                  backgroundColor: colors.cream,
                  borderRadius: 18,
                  borderCurve: "continuous",
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  color: colors.textPrimary,
                  lineHeight: 22,
                },
              ]}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <ActionButton
              label={actionLabel}
              onPress={handleTranslate}
              disabled={!canSubmit || isLoading}
              icon="sparkles"
            />
            <ActionButton
              label="Scambia"
              onPress={handleSwap}
              disabled={sourceLanguage === "auto"}
              variant="secondary"
              icon="arrow.left.arrow.right"
            />
          </View>
        </View>

        {error ? (
          <View
            style={{
              backgroundColor: colors.dangerBg,
              borderRadius: 16,
              borderCurve: "continuous",
              padding: 14,
            }}
          >
            <Text style={[textStyles.body, { color: colors.danger }]}>
              {error}
            </Text>
          </View>
        ) : null}

        {analysis ? <TranslationResult analysis={analysis} /> : null}
      </ScrollView>

      <Stack.Screen
        options={{
          title: "Traduci",
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="camera.viewfinder"
          onPress={() => router.push("/scan-translate")}
        />
      </Stack.Toolbar>
    </>
  );
}
