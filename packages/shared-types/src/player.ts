export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  externalApiId?: string;
  name: string;
  realTeam: string;
  position: PlayerPosition;
  photoUrl?: string;
  baseValue: number;
  currentMarketValue: number;
  formFactor: number; // e.g. -0.25 to +0.30
  rumorMultiplier: number; // e.g. -0.20 to +0.35
  demandFactor: number; // e.g. -0.15 to +0.25
  realPerformanceScore: number; // Official rating out of 10
  contractMonthsRemaining: number;
  isInjured: boolean;
  injuryDesc?: string;
  circulatingSupply: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerValuationBreakdown {
  playerId: string;
  baseValue: number;
  formAdjustment: number;
  rumorAdjustment: number;
  demandAdjustment: number;
  contractAdjustment: number;
  finalPrice: number;
  twentyFourHourChangePercent: number;
}
