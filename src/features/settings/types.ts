export interface AppSettings {
  autoPlayOnReveal: boolean;
  speechRate: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoPlayOnReveal: false,
  speechRate: 0.9,
};

export const SPEECH_RATE_MIN = 0.5;
export const SPEECH_RATE_MAX = 2.0;
export const SPEECH_RATE_STEP = 0.1;
