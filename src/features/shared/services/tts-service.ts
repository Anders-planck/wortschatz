import { File, Directory, Paths } from "expo-file-system";
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

function getAudioFileName(term: string, voice: string): string {
  return `${encodeURIComponent(term)}_${voice}.mp3`;
}

function ensureCacheDir(): Directory {
  const dir = new Directory(Paths.cache, "tts");
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

function getAudioFile(term: string, voice: string): File {
  return new File(Paths.cache, "tts", getAudioFileName(term, voice));
}

async function fetchAndCacheAudio(
  text: string,
  file: File,
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

    file.create({ overwrite: true });
    file.write(bytes);

    updateAudioUrl(text, file.uri).catch(() => {});

    return file.uri;
  } catch (e) {
    console.log("[TTS] fetchAndCacheAudio error:", e);
    return null;
  }
}

export async function getAudio(
  text: string,
  speakingRate = 1.0,
  voiceOverride?: string,
): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;

  try {
    const voice = voiceOverride ?? (await getTtsVoice());
    const file = getAudioFile(text, voice);

    if (file.exists) {
      return file.uri;
    }

    return fetchAndCacheAudio(text, file, speakingRate, voice);
  } catch (e) {
    console.log("[TTS] Error in getAudio:", e);
    return null;
  }
}
