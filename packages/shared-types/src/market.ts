export type TransactionType =
  | 'AMM_BUY'
  | 'AMM_SELL'
  | 'P2P_TRADE'
  | 'ACADEMY_MINT'
  | 'DIVIDEND_PAYOUT';

export interface MarketTransaction {
  id: string;
  buyerClubId?: string;
  sellerClubId?: string;
  playerId: string;
  fee: number;
  brokerFee: number;
  transactionType: TransactionType;
  createdAt: string;
}

export interface AMMQuote {
  playerId: string;
  spotPrice: number;
  spreadPercent: number;
  buyPrice: number;
  sellPriceNet: number;
  brokerFee: number;
  quotaRemainingToday: number;
}

export type P2PStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface P2PProposal {
  id: string;
  proposerClubId: string;
  recipientClubId: string;
  offeredPlayerIds: string[];
  requestedPlayerIds: string[];
  cashAdjustment: number;
  status: P2PStatus;
  expiresAt: string;
  createdAt: string;
  resolvedAt?: string;
}
