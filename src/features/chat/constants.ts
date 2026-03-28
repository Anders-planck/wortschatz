import type { Scenario } from "./types";

export const SCENARIOS: Scenario[] = [
  {
    id: "free",
    title: "Conversazione libera",
    description: "Parla di qualsiasi argomento",
    icon: "text.bubble",
    level: "Adaptive",
  },
  {
    id: "supermarket",
    title: "Al supermercato",
    description: "Fare la spesa, prezzi, prodotti",
    icon: "cart",
    level: "A2",
  },
  {
    id: "job-interview",
    title: "Colloquio di lavoro",
    description: "Competenze, esperienza, domande",
    icon: "building.2",
    level: "B1",
  },
  {
    id: "apartment",
    title: "Cercare un appartamento",
    description: "Affitto, stanze, quartiere",
    icon: "house",
    level: "A2-B1",
  },
  {
    id: "doctor",
    title: "Dal dottore",
    description: "Sintomi, ricette, visite",
    icon: "cross.case",
    level: "B1",
  },
];
