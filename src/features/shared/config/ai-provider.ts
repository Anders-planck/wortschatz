import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { GOOGLE_API_KEY } from "./google";

export const google = createGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY,
});
