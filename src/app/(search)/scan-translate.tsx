import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

import { LanguageChipRow } from "@/features/search/components/language-chip-row";
import { TranslationResult } from "@/features/search/components/translation-result";
import { translateDetailedImage } from "@/features/search/services/translation-ai-service";
import {
  SOURCE_LANGUAGE_OPTIONS,
  TARGET_LANGUAGE_OPTIONS,
  type TranslationAnalysis,
  type TranslationLanguage,
  type TranslationSourceLanguage,
} from "@/features/search/types";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface PickedImage {
  uri: string;
  mimeType: string;
}

const IMAGE_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: false,
  quality: 0.9,
};

async function ensureLibraryPermission() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Permesso libreria negato");
  }
}

async function ensureCameraPermission() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Permesso fotocamera negato");
  }
}

function mapPickedImage(
  result: ImagePicker.ImagePickerResult,
): PickedImage | null {
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
}

function StepPill({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  const { colors, textStyles } = useAppTheme();

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 999,
        borderCurve: "continuous",
        backgroundColor: active ? colors.accent : colors.cream,
      }}
    >
      <Text
        style={{
          fontFamily: textStyles.mono.fontFamily,
          fontSize: 11,
          fontWeight: "600",
          color: active ? colors.onAccent : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function MiniAction({
  label,
  onPress,
  primary = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const { colors, textStyles } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: primary ? colors.accent : colors.cream,
        borderRadius: 14,
        borderCurve: "continuous",
        paddingVertical: 14,
        paddingHorizontal: 12,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: textStyles.heading.fontFamily,
          fontSize: 15,
          fontWeight: "600",
          color: primary ? colors.onAccent : colors.textPrimary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ScanTranslateScreen() {
  const { colors, textStyles } = useAppTheme();
  const router = useRouter();
  const [sourceLanguage, setSourceLanguage] =
    useState<TranslationSourceLanguage>("auto");
  const [targetLanguage, setTargetLanguage] =
    useState<TranslationLanguage>("de");
  const [selectedImage, setSelectedImage] = useState<PickedImage | null>(null);
  const [analysis, setAnalysis] = useState<TranslationAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStep = useMemo(() => {
    if (analysis) return 3;
    if (selectedImage) return 2;
    return 1;
  }, [analysis, selectedImage]);

  const handlePickFromLibrary = async () => {
    try {
      await ensureLibraryPermission();
      const result = await ImagePicker.launchImageLibraryAsync(IMAGE_OPTIONS);
      const image = mapPickedImage(result);
      if (!image) return;
      setSelectedImage(image);
      setAnalysis(null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossibile aprire la libreria foto",
      );
    }
  };

  const handleTakePhoto = async () => {
    try {
      await ensureCameraPermission();
      const result = await ImagePicker.launchCameraAsync(IMAGE_OPTIONS);
      const image = mapPickedImage(result);
      if (!image) return;
      setSelectedImage(image);
      setAnalysis(null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossibile aprire la fotocamera",
      );
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const file = new File(selectedImage.uri);
      const bytes = await file.bytes();
      const result = await translateDetailedImage({
        imageBytes: bytes,
        mediaType: selectedImage.mimeType,
        sourceLanguage,
        targetLanguage,
      });
      setAnalysis(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossibile analizzare l'immagine",
      );
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        style={{ backgroundColor: colors.bg }}
      >
        <View style={{ gap: 8 }}>
          <Text style={textStyles.monoLabel}>Scansiona</Text>
          <Text
            style={[
              textStyles.word,
              { fontSize: 34, lineHeight: 34, maxWidth: 260 },
            ]}
          >
            Foto.
          </Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <StepPill label="Foto" active={activeStep === 1} />
          <StepPill label="OCR" active={activeStep === 2} />
          <StepPill label="Esito" active={activeStep === 3} />
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

          <View style={{ flexDirection: "row", gap: 10 }}>
            <MiniAction
              label="Scatta foto"
              onPress={handleTakePhoto}
              primary
            />
            <MiniAction
              label="Apri foto"
              onPress={handlePickFromLibrary}
            />
          </View>

          <View
            style={{
              borderRadius: 22,
              borderCurve: "continuous",
              borderWidth: 1.5,
              borderStyle: selectedImage ? "solid" : "dashed",
              borderColor: "rgba(196,148,58,0.40)",
              backgroundColor: colors.cream,
              padding: 14,
              gap: 12,
            }}
          >
            {selectedImage ? (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={textStyles.monoLabel}>Preview</Text>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderCurve: "continuous",
                      backgroundColor: colors.card,
                    }}
                  >
                    <Text
                      style={[
                        textStyles.mono,
                        { color: colors.textSecondary, fontWeight: "600" },
                      ]}
                    >
                      {analysis ? "Dettagli pronti" : "OCR in attesa"}
                    </Text>
                  </View>
                </View>

                <Image
                  source={{ uri: selectedImage.uri }}
                  contentFit="cover"
                  style={{
                    width: "100%",
                    height: 240,
                    borderRadius: 18,
                    backgroundColor: colors.card,
                  }}
                />

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <MiniAction
                    label={isLoading ? "Analizzo..." : "Analizza"}
                    onPress={handleAnalyze}
                    primary
                  />
                  <MiniAction
                    label="Sostituisci"
                    onPress={handlePickFromLibrary}
                  />
                </View>
              </>
            ) : (
              <View style={{ gap: 6, alignItems: "flex-start" }}>
                <Text style={textStyles.monoLabel}>Anteprima</Text>
                <Text
                  style={[
                    textStyles.body,
                    { color: colors.textSecondary, lineHeight: 21 },
                  ]}
                >
                  Nessuna immagine selezionata.
                </Text>
              </View>
            )}
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
          title: "Scansiona",
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="text.alignleft"
          onPress={() => router.push("/translate")}
        />
      </Stack.Toolbar>
    </>
  );
}
