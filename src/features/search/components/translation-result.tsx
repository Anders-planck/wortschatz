import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { Divider } from "@/features/shared/components/divider";
import { SectionTitle } from "@/features/shared/components/section-title";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import {
  LANGUAGE_LABELS,
  type PhraseBreakdown,
  type PhraseToken,
  type TranslationAnalysis,
} from "../types";

interface TranslationResultProps {
  analysis: TranslationAnalysis;
}

function compactText(text: string, maxLength = 72) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function Tag({ label }: { label: string }) {
  const { colors, textStyles } = useAppTheme();

  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        borderCurve: "continuous",
        backgroundColor: colors.cream,
      }}
    >
      <Text
        style={[
          textStyles.mono,
          { fontSize: 10, color: colors.textSecondary, fontWeight: "600" },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 22,
        borderCurve: "continuous",
        padding: 16,
        gap: 12,
        boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
      }}
    >
      <SectionTitle>{title}</SectionTitle>
      {children}
    </View>
  );
}

function BulletList({
  items,
  numbered = false,
}: {
  items: string[];
  numbered?: boolean;
}) {
  const { colors, textStyles } = useAppTheme();

  if (items.length === 0) return null;

  return (
    <View style={{ gap: 6 }}>
      {items.map((item, index) => (
        <Text
          key={`${item}-${index}`}
          style={[
            textStyles.bodyLight,
            { color: colors.textSecondary, lineHeight: 20, fontSize: 14 },
          ]}
        >
          {numbered ? `${index + 1}. ` : "• "}
          {item}
        </Text>
      ))}
    </View>
  );
}

function TokenRow({ token }: { token: PhraseToken }) {
  const { colors, textStyles } = useAppTheme();

  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[textStyles.heading, { fontSize: 16 }]}>{token.source}</Text>
          <Text style={[textStyles.mono, { color: colors.textGhost }]}>
            {token.role}
          </Text>
        </View>
        <Text
          style={[
            textStyles.heading,
            { fontSize: 16, color: colors.accent, textAlign: "right" },
          ]}
        >
          {token.target}
        </Text>
      </View>

      <Text
        style={[
          textStyles.bodyLight,
          { color: colors.textSecondary, lineHeight: 19, fontSize: 13 },
        ]}
      >
        {token.explanation}
      </Text>
    </View>
  );
}

function PhraseSection({
  phrase,
  index,
  initiallyOpen,
}: {
  phrase: PhraseBreakdown;
  index: number;
  initiallyOpen?: boolean;
}) {
  const { colors, textStyles } = useAppTheme();
  const [isOpen, setIsOpen] = useState(Boolean(initiallyOpen));

  return (
    <View style={{ gap: 10 }}>
      <Pressable
        onPress={() => setIsOpen((current) => !current)}
        style={({ pressed }) => ({
          gap: 8,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={textStyles.monoLabel}>{`Frase ${index + 1}`}</Text>
            <Text style={[textStyles.heading, { fontSize: 18, lineHeight: 22 }]}>
              {phrase.sourcePhrase}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <Text style={textStyles.monoLabel}>Resa</Text>
            <Text
              style={[
                textStyles.heading,
                { fontSize: 18, lineHeight: 22, color: colors.accent },
              ]}
            >
              {phrase.translatedPhrase}
            </Text>
            <SymbolView
              name={isOpen ? "chevron.up" : "chevron.down"}
              size={13}
              tintColor={colors.textMuted}
              resizeMode="scaleAspectFit"
            />
          </View>
        </View>

        <Text
          style={[
            textStyles.bodyLight,
            { color: colors.textSecondary, lineHeight: 20, fontSize: 14 },
          ]}
        >
          {compactText(phrase.explanation, 120)}
        </Text>
      </Pressable>

      {isOpen ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {phrase.grammarNotes.map((note) => (
              <Tag key={note} label={compactText(note, 28)} />
            ))}
          </View>

          <Text
            style={[
              textStyles.body,
              { color: colors.textPrimary, lineHeight: 23, fontSize: 15 },
            ]}
          >
            {phrase.explanation}
          </Text>

          <Text
            style={[
              textStyles.bodyLight,
              { color: colors.textMuted, lineHeight: 20, fontSize: 13 },
            ]}
          >
            Letterale: {phrase.literalMeaning}
          </Text>

          <View style={{ gap: 10 }}>
            <SectionTitle>Parole</SectionTitle>
            {phrase.tokens.map((token, tokenIndex) => (
              <View key={`${token.source}-${token.target}-${tokenIndex}`}>
                <TokenRow token={token} />
                {tokenIndex < phrase.tokens.length - 1 ? <Divider /> : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function TranslationResult({ analysis }: TranslationResultProps) {
  const { colors, textStyles } = useAppTheme();
  const showExtractedText =
    analysis.extractedText != null &&
    analysis.extractedText.trim().length > 0 &&
    analysis.extractedText.trim() !== analysis.sourceText.trim();

  return (
    <View style={{ gap: 14 }}>
      <SectionCard title="Esito">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Tag label={LANGUAGE_LABELS[analysis.detectedSourceLanguage]} />
          <Tag label={LANGUAGE_LABELS[analysis.targetLanguage]} />
        </View>

        <Text style={textStyles.monoLabel}>Originale</Text>
        <Text
          style={[
            textStyles.body,
            { color: colors.textPrimary, lineHeight: 23, fontSize: 15 },
          ]}
        >
          {analysis.sourceText}
        </Text>

        <Text
          style={[
            textStyles.word,
            { fontSize: 30, lineHeight: 32, color: colors.textPrimary },
          ]}
        >
          {analysis.translatedText}
        </Text>

        {analysis.naturalTranslation !== analysis.translatedText ? (
          <Text
            style={[
              textStyles.bodyLight,
              { color: colors.accent, lineHeight: 21, fontSize: 14 },
            ]}
          >
            Naturale: {analysis.naturalTranslation}
          </Text>
        ) : null}
      </SectionCard>

      {showExtractedText ? (
        <SectionCard title="OCR">
          <Text
            style={[
              textStyles.body,
              { color: colors.textPrimary, lineHeight: 23, fontSize: 15 },
            ]}
          >
            {analysis.extractedText}
          </Text>
        </SectionCard>
      ) : null}

      <SectionCard title="Spiegazione">
        <Text
          style={[
            textStyles.body,
            { color: colors.textPrimary, lineHeight: 23, fontSize: 15 },
          ]}
        >
          {analysis.overallExplanation}
        </Text>
        <BulletList items={analysis.usageNotes} />
      </SectionCard>

      {analysis.alternativeTranslations.length > 0 ? (
        <SectionCard title="Alternative">
          <BulletList items={analysis.alternativeTranslations} numbered />
        </SectionCard>
      ) : null}

      {analysis.extractionNotes.length > 0 ? (
        <SectionCard title="Note">
          <BulletList items={analysis.extractionNotes} />
        </SectionCard>
      ) : null}

      <SectionCard title="Analisi">
        {analysis.phraseBreakdown.map((phrase, index) => (
          <View key={`${phrase.sourcePhrase}-${index}`}>
            <PhraseSection
              phrase={phrase}
              index={index}
              initiallyOpen={index === 0}
            />
            {index < analysis.phraseBreakdown.length - 1 ? <Divider /> : null}
          </View>
        ))}
      </SectionCard>
    </View>
  );
}
