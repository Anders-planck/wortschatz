import { generateText, Output } from "ai";
import { google } from "@/features/shared/config/ai-provider";
import { trackAiCall } from "@/features/shared/services/ai-usage-tracker";
import { TranslationAnalysisSchema } from "../schemas/translation-schema";
import type {
  TranslationAnalysis,
  TranslationLanguage,
  TranslationSourceLanguage,
} from "../types";

const AI_MODEL = "gemini-2.5-flash-lite";

function buildTranslationPrompt({
  sourceLanguage,
  targetLanguage,
  fromImage,
}: {
  sourceLanguage: TranslationSourceLanguage;
  targetLanguage: TranslationLanguage;
  fromImage: boolean;
}) {
  const sourceInstruction =
    sourceLanguage === "auto"
      ? "Detect the source language between Italian, French, and German."
      : `The source language is ${sourceLanguage}.`;
  const inputModeInstruction = fromImage
    ? "The user will attach an image. First extract all visible text faithfully. Preserve punctuation and line breaks when possible."
    : "The user will provide text directly.";

  return `You are an expert German/French/Italian translation tutor for an Italian-speaking learner.

${sourceInstruction}
Translate into ${targetLanguage}.
${inputModeInstruction}

Return a structured analysis with these goals:
- Provide one natural final translation.
- Provide a second "naturalTranslation" if the direct translation needs smoothing for native usage.
- Explain EVERYTHING in Italian.
- Split the input into meaningful phrases or clauses, not random word chunks.
- For each phrase, provide:
  - sourcePhrase
  - translatedPhrase
  - literalMeaning
  - a detailed explanation in Italian
  - grammarNotes: concrete grammar points, case/preposition/tense/register/order issues
  - tokens: word or mini-expression breakdowns with source, target, role, explanation
- Include usageNotes with stylistic or register notes, traps, false friends, idiomatic details.
- If the input came from an image, put the recognized text in extractedText. If OCR is uncertain, mention it in extractionNotes.
- Never invent hidden text not present in the image.
- Keep the translation accurate first, then pedagogical.
- If the text is already in the target language, explain that and still produce a polished target-language version.
- Do not omit articles, pronouns, particles, or contractions in the token explanation when they matter.
- Avoid repetition across fields: overallExplanation should cover the big picture, phrase explanations should stay local to that phrase.
- Keep overallExplanation dense but readable, ideally 1 short paragraph plus actionable detail.
- Keep phrase explanation focused and compact, usually 2-4 sentences.
- Keep grammarNotes short, concrete, and ready to be shown as bullets.
- Keep token explanations short and precise, usually 1-2 sentences.
`;
}

export async function translateDetailedText(params: {
  text: string;
  sourceLanguage: TranslationSourceLanguage;
  targetLanguage: TranslationLanguage;
}): Promise<TranslationAnalysis> {
  const trimmed = params.text.trim();
  if (!trimmed) {
    throw new Error("Inserisci una frase da tradurre");
  }

  const result = await trackAiCall("translation", () =>
    generateText({
      model: google(AI_MODEL),
      output: Output.object({ schema: TranslationAnalysisSchema }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildTranslationPrompt({
                sourceLanguage: params.sourceLanguage,
                targetLanguage: params.targetLanguage,
                fromImage: false,
              }),
            },
            {
              type: "text",
              text: `Text to analyze and translate:\n${trimmed}`,
            },
          ],
        },
      ],
    }),
  );

  if (!result.output) {
    throw new Error("Traduzione non disponibile");
  }

  return result.output;
}

export async function translateDetailedImage(params: {
  imageBytes: Uint8Array;
  mediaType: string;
  sourceLanguage: TranslationSourceLanguage;
  targetLanguage: TranslationLanguage;
}): Promise<TranslationAnalysis> {
  const result = await trackAiCall("ocr_translation", () =>
    generateText({
      model: google(AI_MODEL),
      output: Output.object({ schema: TranslationAnalysisSchema }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildTranslationPrompt({
                sourceLanguage: params.sourceLanguage,
                targetLanguage: params.targetLanguage,
                fromImage: true,
              }),
            },
            {
              type: "image",
              image: params.imageBytes,
              mediaType: params.mediaType,
            },
          ],
        },
      ],
    }),
  );

  if (!result.output) {
    throw new Error("Analisi immagine non disponibile");
  }

  return result.output;
}
