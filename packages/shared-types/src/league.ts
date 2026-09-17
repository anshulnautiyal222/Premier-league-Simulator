export type LeagueStatus = 'DRAFT_ACTIVE' | 'LIVE' | 'COMPLETED' | 'ARCHIVED';

export interface LeagueWorld {
  id: string;
  name: string;
  inviteCode: string;
  status: LeagueStatus;
  maxClubs: number; // 16 clubs per SPEC v2
  currentGameweek: number;
  draftCreditBudget: number; // 500
  draftDeadline: string;
  createdAt: string;
  updatedAt: string;
}

export type DraftBidStatus = 'PENDING' | 'WON' | 'OUTBID' | 'CANCELLED';

export interface DraftBid {
  id: string;
  leagueId: string;
  clubId: string;
  playerId: string;
  bidAmount: number;
  round: number;
  status: DraftBidStatus;
  createdAt: string;
}

export interface GameweekScoreBreakdown {
  goals?: number;
  assists?: number;
  cleanSheet?: boolean;
  minutesPlayed?: number;
  goalsConceded?: number;
  yellowCards?: number;
  redCards?: number;
  ratingBonus?: number;
  playerScores?: Array<{
    playerId: string;
    playerName: string;
    points: number;
  }>;
}

export interface GameweekScore {
  id: string;
  leagueId: string;
  clubId: string;
  gameweek: number;
  totalPoints: number;
  breakdown: GameweekScoreBreakdown;
  createdAt: string;
}

export type LeaderboardSortOption =
  | 'TOTAL_POINTS'
  | 'LAST_5_GW'
  | 'HIGH_GW'
  | 'TOP_SCORER'
  | 'DRAFT_EFFICIENCY';

export interface LeagueLeaderboardEntry {
  rank: number;
  clubId: string;
  clubName: string;
  badgeUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  totalPoints: number;
  last5Points: number;
  highestSingleGw: number;
  topScorerName: string;
  topScorerPoints: number;
  draftCreditsSpent: number;
  draftEfficiency: number; // total points / draft credits spent
  championCoins: number;
}
