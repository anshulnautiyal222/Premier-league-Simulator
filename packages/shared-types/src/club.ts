export interface FacilityLevels {
  academy: number; // 1 - 5
  scouting: number; // 1 - 5
  stadium: number; // 1 - 5
}

export interface Club {
  id: string;
  userId: string;
  leagueId?: string;
  clubName: string;
  clubBadgeUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  homeGroundName: string;
  virtualPurseBalance: number;
  totalSquadValue: number;
  draftCredits?: number;
  championCoins?: number;
  facilityLevels: FacilityLevels;
  lastDividendAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClubRosterEntry {
  id: string;
  clubId: string;
  leagueId?: string;
  playerId: string;
  acquisitionPrice: number;
  acquiredAt: string;
  isStartingXi: boolean;
  lineupSlot?: string; // e.g. 'GK', 'CB1', 'ST'
}

export interface ClubFinancialSummary {
  clubId: string;
  liquidPurse: number;
  squadMarketValue: number;
  netWorth: number;
  totalUnrealizedPnL: number;
  roiPercent: number;
  activeSquadCount: number; // 11 to 25
}
