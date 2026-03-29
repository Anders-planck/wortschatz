interface MessageContext {
  count: number;
  streak: number;
  days: number;
}

const LEVEL_0: string[] = [
  "Du hast {count} Wörter zu wiederholen. Los geht's!",
  "{count} Wörter warten auf dich. Eine kurze Runde?",
  "Dein Streak: {streak} Tage! Mach weiter so.",
  "Übung macht den Meister! {count} Wörter stehen an.",
  "Nur 5 Minuten — dein Gehirn wird es dir danken.",
  "Heute schon geübt? {count} Wörter sind fällig.",
];

const LEVEL_1: string[] = [
  "Dein Streak ist in Gefahr! Nur 5 Minuten reichen.",
  "Du hast gestern nicht geübt. Heute noch Zeit?",
  "Ein Tag Pause — kein Problem. Aber heute ran!",
  "{count} Wörter warten seit gestern. Kurz reinschauen?",
  "Vergiss nicht zu üben! Dein Streak steht auf dem Spiel.",
  "Deine Wörter vermissen dich. Komm zurück!",
];

const LEVEL_2: string[] = [
  "Du hast seit {days} Tagen nicht geübt. Deine Wörter warten.",
  "Dein Streak ist verloren. Starte einen neuen — jetzt!",
  "{count} Wörter werden langsam vergessen. Noch kannst du sie retten.",
  "Lange nicht gesehen! {count} Wörter brauchen dich.",
  "Jeder Meister hat mal pausiert. Zeit, weiterzumachen.",
  "Die Vergessenskurve arbeitet gegen dich. 5 Minuten helfen.",
];

const LEVELS = [LEVEL_0, LEVEL_1, LEVEL_2];

function replacePlaceholders(template: string, ctx: MessageContext): string {
  return template
    .replace(/\{count\}/g, String(ctx.count))
    .replace(/\{streak\}/g, String(ctx.streak))
    .replace(/\{days\}/g, String(ctx.days));
}

export function getEscalationLevel(daysMissed: number): number {
  if (daysMissed <= 0) return 0;
  if (daysMissed === 1) return 1;
  return 2;
}

export function pickMessage(
  level: number,
  ctx: MessageContext,
  lastMessage?: string,
): { title: string; body: string } {
  const pool = LEVELS[Math.min(level, 2)];
  let candidates = pool.filter((m) => m !== lastMessage);
  if (candidates.length === 0) candidates = pool;

  const template = candidates[Math.floor(Math.random() * candidates.length)];
  const body = replacePlaceholders(template, ctx);

  const titles = ["WortSchatz", "Zeit zum Üben!", "Lernzeit!"];
  const title = level === 0 ? titles[0] : level === 1 ? titles[1] : titles[2];

  return { title, body };
}
