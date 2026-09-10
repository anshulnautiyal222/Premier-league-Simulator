export type JournalistTier = 1 | 2 | 3 | 4 | 5;

export type RumorStatus = 'active' | 'confirmed' | 'debunked' | 'expired';

export interface Rumor {
  id: string;
  playerId: string;
  sourceName: string;
  sourceTier: JournalistTier;
  buyingClub: string;
  sellingClub: string;
  feeEstimate?: number;
  headline: string;
  articleUrl?: string;
  votesDeal: number;
  votesDelusion: number;
  status: RumorStatus;
  publishedAt: string;
  createdAt: string;
}

export interface ConsensusVote {
  rumorId: string;
  userId: string;
  vote: 'deal' | 'delusion';
  votedAt: string;
}
