import { File, Paths } from "expo-file-system";
import {
  getAudioUrl,
  updateAudioUrl,
} from "@/features/shared/db/words-repository";
import {
  GOOGLE_API_KEY,
  TTS_API_URL,
  TTS_LANGUAGE,
} from "@/features/shared/config/google";
import { getTtsVoice } from "@/features/settings/services/settings-repository";

function getTtsCacheDir(): string {
  return `${Paths.cache}/tts`;
}

function getAudioFilePath(term: string, voice: string): string {
  return `${getTtsCacheDir()}/${encodeURIComponent(term)}_${voice}.mp3`;
}

function ensureCacheDir(): void {
  const dir = new File(getTtsCacheDir());
  if (!dir.exists) {
    dir.create();
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const file = new File(path);
    return file.exists;
  } catch {
    return false;
  }
}

async function fetchAndCacheAudio(
  text: string,
  filePath: string,
  speakingRate: number,
  voice: string,
): Promise<string | null> {
  try {
    const response = await fetch(`${TTS_API_URL}?key=${GOOGLE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: TTS_LANGUAGE, name: voice },
        audioConfig: { audioEncoding: "MP3", speakingRate },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.audioContent) return null;

    ensureCacheDir();

    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const file = new File(filePath);
    file.create({ overwrite: true });
    file.write(bytes);

    updateAudioUrl(text, filePath).catch(() => {});

    return filePath;
  } catch {
    return null;
  }
}

export async function getAudio(
  text: string,
  speakingRate = 1.0,
): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;

  try {
    const voice = await getTtsVoice();

    const filePath = getAudioFilePath(text, voice);
    if (await fileExists(filePath)) {
      return filePath;
    }

    return fetchAndCacheAudio(text, filePath, speakingRate, voice);
  } catch {
    return null;
  }
}
