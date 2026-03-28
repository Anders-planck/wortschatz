export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: string; // SF Symbol name
  level: string; // "A2" | "B1" | "A2-B1" | "Adaptive"
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Correction {
  wrong: string;
  right: string;
  tip: string;
}

export interface ParsedAIResponse {
  text: string;
  corrections: Correction[];
  markedWords: string[];
  suggestions: string[];
}

export interface ChatSession {
  scenario: Scenario;
  messages: ChatMessage[];
  corrections: Correction[];
  discoveredWords: string[];
  startTime: number;
}

export const SCENARIO_ICONS = [
  "text.bubble",
  "cart",
  "building.2",
  "house",
  "cross.case",
  "airplane",
  "fork.knife",
  "cup.and.saucer",
  "tram",
  "graduationcap",
  "phone",
  "music.note",
  "sportscourt",
  "theatermasks",
  "book",
  "map",
  "camera",
  "paintbrush",
  "wrench",
  "leaf",
] as const;

export const SCENARIO_LEVELS = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "Adaptive",
] as const;

export type ScenarioLevel = (typeof SCENARIO_LEVELS)[number];
