/** Builder ranks, earned with XP. The last one needs nearly the whole course. */
export const RANKS = [
  { xp: 0, name: "Pebble Pusher" },
  { xp: 300, name: "Stone Setter" },
  { xp: 900, name: "Bridge Builder" },
  { xp: 2000, name: "Tailor of Stone" },
  { xp: 3600, name: "Flex Foreman" },
  { xp: 6000, name: "Script Weaver" },
  { xp: 9500, name: "Master Builder" },
  { xp: 14000, name: "Architect of the Web" },
] as const;

export const XP = {
  firstClear: 100,
  firstGold: 50,
  /** The first lesson finished on a new day of a streak. */
  streakDay: 25,
};

export function rankFor(xp: number) {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].xp) index = i;
  const rank = RANKS[index];
  const next = RANKS[index + 1];
  const progress = next ? (xp - rank.xp) / (next.xp - rank.xp) : 1;
  return { index, name: rank.name, next: next ?? null, progress };
}

/** Local calendar day, as YYYY-MM-DD. */
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isYesterday(key: string, today = new Date()) {
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  return key === dayKey(y);
}
