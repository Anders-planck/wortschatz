export const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_AI_KEY ??
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
  "";

export const TTS_API_URL =
  "https://texttospeech.googleapis.com/v1/text:synthesize";
export const TTS_DEFAULT_VOICE = "de-DE-WaveNet-D";
export const TTS_LANGUAGE = "de-DE";
