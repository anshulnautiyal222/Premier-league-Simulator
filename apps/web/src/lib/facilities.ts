export type FacilityKey = 'academy' | 'scouting' | 'stadium';
export type RookieRarity = 'common' | 'rare' | 'wonderkid';

export const RUMOR_PUBLIC_EMBARGO_MINUTES = 15;

/** Minutes of early access vs the public rumor embargo, by scouting level. */
export const SCOUTING_EARLY_MINUTES: Record<number, number> = {
  1: 3,
  2: 6,
  3: 9,
  4: 12,
  5: 15,
};

/** Cost in demo purse to upgrade FROM this level TO the next. */
export const UPGRADE_COST: Record<FacilityKey, Record<number, number>> = {
  academy: { 1: 8_000_000, 2: 18_000_000, 3: 32_000_000, 4: 55_000_000 },
  scouting: { 1: 6_000_000, 2: 14_000_000, 3: 26_000_000, 4: 45_000_000 },
  stadium: { 1: 10_000_000, 2: 22_000_000, 3: 38_000_000, 4: 65_000_000 },
};

/** Weekly yield in basis points of top-11 squad market appeal. */
export const STADIUM_YIELD_BPS: Record<number, number> = {
  1: 8,
  2: 12,
  3: 18,
  4: 26,
  5: 36,
};

export const ACADEMY_PACK_LIST_PRICE = 8_000_000;

export const ACADEMY_ODDS: Record<number, Record<RookieRarity, number>> = {
  1: { common: 80, rare: 18, wonderkid: 2 },
  2: { common: 70, rare: 25, wonderkid: 5 },
  3: { common: 55, rare: 35, wonderkid: 10 },
  4: { common: 40, rare: 42, wonderkid: 18 },
  5: { common: 25, rare: 45, wonderkid: 30 },
};

export const FACILITY_META: Record<
  FacilityKey,
  { name: string; short: string; column: 'academy_level' | 'scouting_level' | 'stadium_level' }
> = {
  academy: { name: 'Youth Academy', short: 'Academy', column: 'academy_level' },
  scouting: { name: 'Scouting Department', short: 'Scouting', column: 'scouting_level' },
  stadium: { name: 'Commercial Stadium', short: 'Stadium', column: 'stadium_level' },
};

export function clampFacilityLevel(level: number | undefined | null): number {
  const n = Number(level) || 1;
  return Math.min(5, Math.max(1, n));
}

export function upgradeCost(facility: FacilityKey, currentLevel: number): number | null {
  const level = clampFacilityLevel(currentLevel);
  if (level >= 5) return null;
  return UPGRADE_COST[facility][level] ?? null;
}

export function academyPackPrice(level: number): number {
  const discount = 0.08 * clampFacilityLevel(level);
  return Math.round(ACADEMY_PACK_LIST_PRICE * (1 - discount));
}

export function academyOdds(level: number): Record<RookieRarity, number> {
  return ACADEMY_ODDS[clampFacilityLevel(level)];
}

export function scoutingEarlyMinutes(level: number): number {
  return SCOUTING_EARLY_MINUTES[clampFacilityLevel(level)] ?? 3;
}

export function rumorPublicAt(createdAt: string): number {
  return new Date(createdAt).getTime() + RUMOR_PUBLIC_EMBARGO_MINUTES * 60 * 1000;
}

export function rumorVisibleAt(createdAt: string, scoutingLevel: number): number {
  const waitMinutes = RUMOR_PUBLIC_EMBARGO_MINUTES - scoutingEarlyMinutes(scoutingLevel);
  return new Date(createdAt).getTime() + waitMinutes * 60 * 1000;
}

export function isRumorVisible(
  createdAt: string,
  scoutingLevel: number,
  now = Date.now()
): boolean {
  return now >= rumorVisibleAt(createdAt, scoutingLevel);
}

export function isRumorEarlyAccess(
  createdAt: string,
  scoutingLevel: number,
  now = Date.now()
): boolean {
  return isRumorVisible(createdAt, scoutingLevel, now) && now < rumorPublicAt(createdAt);
}

export function stadiumWeeklyIncome(top11Appeal: number, level: number): number {
  const lv = clampFacilityLevel(level);
  const floor = 250_000 * lv;
  const bps = STADIUM_YIELD_BPS[lv] ?? 8;
  return Math.round(floor + (top11Appeal * bps) / 10_000);
}

export function top11SquadAppeal(values: number[]): number {
  return [...values]
    .sort((a, b) => b - a)
    .slice(0, 11)
    .reduce((sum, v) => sum + v, 0);
}

export const DIVIDEND_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export function isDividendDue(lastDividendAt: string | undefined | null, now = Date.now()): boolean {
  if (!lastDividendAt) return true;
  const last = new Date(lastDividendAt).getTime();
  if (Number.isNaN(last)) return true;
  return now - last >= DIVIDEND_INTERVAL_MS;
}

export function nextDividendAt(lastDividendAt: string | undefined | null): Date {
  if (!lastDividendAt) return new Date();
  const last = new Date(lastDividendAt).getTime();
  if (Number.isNaN(last)) return new Date();
  return new Date(last + DIVIDEND_INTERVAL_MS);
}

export function rollRarity(level: number, rng: () => number = Math.random): RookieRarity {
  const odds = academyOdds(level);
  const roll = rng() * 100;
  if (roll < odds.wonderkid) return 'wonderkid';
  if (roll < odds.wonderkid + odds.rare) return 'rare';
  return 'common';
}
