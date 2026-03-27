export interface Collection {
  id: number;
  name: string;
  icon: string; // SF Symbol name
  color: string; // hex
  isAiGenerated: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface CollectionWithStats extends Collection {
  wordCount: number;
  masteryPercent: number;
}

export const COLLECTION_ICONS = [
  "bolt.fill",
  "briefcase.fill",
  "airplane",
  "sun.max.fill",
  "house.fill",
  "fork.knife",
  "book.fill",
  "key.fill",
  "heart.fill",
  "star.fill",
  "flag.fill",
  "folder.fill",
] as const;

export const COLLECTION_COLORS = [
  "#D4A44A",
  "#D4B97A",
  "#E0B8AE",
  "#9DC59A",
  "#C0B8E0",
  "#A8C0D0",
] as const;
