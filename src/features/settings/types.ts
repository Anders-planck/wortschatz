export interface AppSettings {
  autoPlayOnReveal: boolean;
  speechRate: number;
  ttsVoice: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoPlayOnReveal: false,
  speechRate: 0.9,
  ttsVoice: "de-DE-WaveNet-D",
};

export const SPEECH_RATE_MIN = 0.5;
export const SPEECH_RATE_MAX = 2.0;
export const SPEECH_RATE_STEP = 0.1;

export const TTS_VOICES = [
  { id: "de-DE-WaveNet-A", label: "Anna", gender: "F" },
  { id: "de-DE-WaveNet-B", label: "Stefan", gender: "M" },
  { id: "de-DE-WaveNet-C", label: "Klara", gender: "F" },
  { id: "de-DE-WaveNet-D", label: "Thomas", gender: "M" },
  { id: "de-DE-WaveNet-F", label: "Helena", gender: "F" },
] as const;
