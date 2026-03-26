import { createGoogleGenerativeAI } from "@ai-sdk/google";

// In React Native / Expo, process.env is replaced at build time
// by Metro bundler. For env vars to work, they must be prefixed
// with EXPO_PUBLIC_ or passed directly.
//
// We pass the key explicitly here since GOOGLE_GENERATIVE_AI_API_KEY
// is not exposed to the RN runtime by default.

const API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_AI_KEY ??
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
  "";

export const google = createGoogleGenerativeAI({
  apiKey: API_KEY,
});
