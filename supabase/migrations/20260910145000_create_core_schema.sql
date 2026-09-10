-- ==============================================================================
-- Migration: 20260910145000_create_core_schema.sql
-- Description: Core tables for clubs, players, club_roster, market_transactions,
--              rumor_feed, and p2p_trades based on Section 7 of SPEC.md.
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. CLUBS
-- Virtual club identity, facilities, demo purse balance, and overall squad valuation
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    club_name VARCHAR(64) NOT NULL,
    badge_url TEXT,
    colors JSONB NOT NULL DEFAULT '{"primary": "#00FF87", "secondary": "#0A0E17"}'::jsonb,
    virtual_purse_balance NUMERIC(14, 2) NOT NULL DEFAULT 150000000.00,
    total_squad_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    academy_level INT NOT NULL DEFAULT 1 CHECK (academy_level BETWEEN 1 AND 5),
    scouting_level INT NOT NULL DEFAULT 1 CHECK (scouting_level BETWEEN 1 AND 5),
    stadium_level INT NOT NULL DEFAULT 1 CHECK (stadium_level BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clubs_user_id ON public.clubs(user_id);
CREATE INDEX IF NOT EXISTS idx_clubs_net_worth ON public.clubs((virtual_purse_balance + total_squad_value) DESC);

-- ==============================================================================
-- 2. PLAYERS
-- Official catalog of Premier League players with valuations, form, and injury status
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    real_team VARCHAR(64) NOT NULL,
    position VARCHAR(10) NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
    base_value NUMERIC(12, 2) NOT NULL,
    current_market_value NUMERIC(12, 2) NOT NULL,
    form_score NUMERIC(4, 2) NOT NULL DEFAULT 6.50,
    injury_status VARCHAR(32) NOT NULL DEFAULT 'fit' CHECK (injury_status IN ('fit', 'minor_knock', 'moderate_injury', 'severe_injury')),
    contract_months_remaining INT NOT NULL DEFAULT 36,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for marketplace browsing & filtering
CREATE INDEX IF NOT EXISTS idx_players_position ON public.players(position);
CREATE INDEX IF NOT EXISTS idx_players_real_team ON public.players(real_team);
CREATE INDEX IF NOT EXISTS idx_players_market_value ON public.players(current_market_value DESC);

-- ==============================================================================
-- 3. CLUB_ROSTER
-- Portfolio holdings linking clubs to their owned player cards
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.club_roster (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
    acquisition_price NUMERIC(12, 2) NOT NULL,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    in_starting_xi BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT unique_club_player UNIQUE (club_id, player_id)
);

-- Indexes for fast roster and starting-XI queries
CREATE INDEX IF NOT EXISTS idx_roster_club_id ON public.club_roster(club_id);
CREATE INDEX IF NOT EXISTS idx_roster_player_id ON public.club_roster(player_id);
CREATE INDEX IF NOT EXISTS idx_roster_starting_xi ON public.club_roster(club_id, in_starting_xi);

-- ==============================================================================
-- 4. MARKET_TRANSACTIONS
-- Append-only audit trail recording every economic transaction on the exchange
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.market_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    seller_club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
    fee NUMERIC(12, 2) NOT NULL,
    transaction_type VARCHAR(32) NOT NULL CHECK (transaction_type IN ('AMM_BUY', 'AMM_SELL', 'P2P_TRADE', 'ACADEMY_MINT', 'DIVIDEND_PAYOUT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for player transaction history & ledger queries
CREATE INDEX IF NOT EXISTS idx_tx_player_created ON public.market_transactions(player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_buyer ON public.market_transactions(buyer_club_id);
CREATE INDEX IF NOT EXISTS idx_tx_seller ON public.market_transactions(seller_club_id);

-- ==============================================================================
-- 5. RUMOR_FEED
-- Breaking transfer reports categorized by journalist credibility tier
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rumor_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL,
    tier_rating INT NOT NULL CHECK (tier_rating BETWEEN 1 AND 5),
    buying_club VARCHAR(64) NOT NULL,
    fee_estimate NUMERIC(12, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'debunked', 'expired')),
    upvotes INT NOT NULL DEFAULT 0,
    downvotes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for rumor ranking and player links
CREATE INDEX IF NOT EXISTS idx_rumors_player_id ON public.rumor_feed(player_id);
CREATE INDEX IF NOT EXISTS idx_rumors_tier_created ON public.rumor_feed(tier_rating, created_at DESC);

-- ==============================================================================
-- 6. P2P_TRADES
-- Peer-to-peer negotiation desk for direct club-to-club trade proposals
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.p2p_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposer_club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    recipient_club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    offered_player_ids UUID[] NOT NULL,
    requested_player_ids UUID[] NOT NULL,
    cash_adjustment NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for active trade proposals
CREATE INDEX IF NOT EXISTS idx_p2p_proposer ON public.p2p_trades(proposer_club_id, status);
CREATE INDEX IF NOT EXISTS idx_p2p_recipient ON public.p2p_trades(recipient_club_id, status);
