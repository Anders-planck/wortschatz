const IT_DAY_INITIALS = ["D", "L", "M", "M", "G", "V", "S"] as const;

export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function rollingWeekDays(now = new Date()): {
  label: string;
  dateStr: string;
}[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - 6 + i);
    return { label: IT_DAY_INITIALS[d.getDay()], dateStr: toLocalDateStr(d) };
  });
}
