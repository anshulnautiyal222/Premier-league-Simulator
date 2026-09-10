-- ==============================================================================
-- Migration: 20260911010000_create_league_worlds_schema.sql
-- Description: Core schema for League Worlds (SPEC v2):
--              1. leagues table (isolated 16-club worlds, status lifecycle)
--              2. League scoping and multi-currency on clubs table
--              3. Scoped uniqueness on club_roster (UNIQUE(league_id, player_id))
--              4. league_draft_bids table (sealed-bid blind auction draft)
--              5. league_gameweek_scores table (matchday fantasy points)
--              6. resolve_draft_window RPC (sealed bid auction resolution)
--              7. autofill_league_rosters RPC (low-value player waiver auto-fill)
--              8. Strict League-scoped Row Level Security (RLS)
-- ==============================================================================

-- ==============================================================================
-- 1. LEAGUES (Isolated 16-Club Worlds)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    invite_code VARCHAR(16) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT_ACTIVE' 
        CHECK (status IN ('DRAFT_ACTIVE', 'LIVE', 'COMPLETED', 'ARCHIVED')),
    max_clubs INT NOT NULL DEFAULT 16,
    current_gameweek INT NOT NULL DEFAULT 1,
    draft_credit_budget INT NOT NULL DEFAULT 500,
    draft_deadline TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leagues_status ON public.leagues(status);
CREATE INDEX IF NOT EXISTS idx_leagues_invite_code ON public.leagues(invite_code);

-- ==============================================================================
-- 2. ALTER CLUBS (League Membership & Multi-Currency)
-- ==============================================================================
ALTER TABLE public.clubs
ADD COLUMN IF NOT EXISTS league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS draft_credits INT NOT NULL DEFAULT 500,
ADD COLUMN IF NOT EXISTS champion_coins INT NOT NULL DEFAULT 0;

-- Drop global 1:1 user restriction so user can belong to specific leagues
ALTER TABLE public.clubs DROP CONSTRAINT IF EXISTS clubs_user_id_key;

-- Compound index: user has at most one club per league
CREATE UNIQUE INDEX IF NOT EXISTS idx_clubs_user_league 
ON public.clubs(user_id, league_id) WHERE league_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clubs_league_id ON public.clubs(league_id);

-- ==============================================================================
-- 3. ALTER CLUB_ROSTER (League Scoped Uniqueness)
-- SPEC v2: Within a single League, a player can be owned by at most ONE club.
-- ==============================================================================
ALTER TABLE public.club_roster
ADD COLUMN IF NOT EXISTS league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE;

-- Backfill existing club_roster with club's league_id if present
UPDATE public.club_roster cr
SET league_id = c.league_id
FROM public.clubs c
WHERE cr.club_id = c.id AND cr.league_id IS NULL AND c.league_id IS NOT NULL;

-- Enforce strict intra-league uniqueness
ALTER TABLE public.club_roster DROP CONSTRAINT IF EXISTS unique_league_player;
ALTER TABLE public.club_roster 
ADD CONSTRAINT unique_league_player UNIQUE (league_id, player_id);

CREATE INDEX IF NOT EXISTS idx_roster_league_player ON public.club_roster(league_id, player_id);

-- ==============================================================================
-- 4. LEAGUE_DRAFT_BIDS (Sealed-Bid Blind Auction)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.league_draft_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    bid_amount INT NOT NULL CHECK (bid_amount > 0),
    round INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'WON', 'OUTBID', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_club_player_bid UNIQUE (league_id, club_id, player_id, round)
);

CREATE INDEX IF NOT EXISTS idx_draft_bids_league_player 
ON public.league_draft_bids(league_id, player_id, status);

CREATE INDEX IF NOT EXISTS idx_draft_bids_club 
ON public.league_draft_bids(club_id, status);

-- ==============================================================================
-- 5. LEAGUE_GAMEWEEK_SCORES (Matchday Points & Trends)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.league_gameweek_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    gameweek INT NOT NULL,
    total_points INT NOT NULL DEFAULT 0,
    breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_club_gameweek UNIQUE (league_id, club_id, gameweek)
);

CREATE INDEX IF NOT EXISTS idx_gw_scores_league_gw 
ON public.league_gameweek_scores(league_id, gameweek);

CREATE INDEX IF NOT EXISTS idx_gw_scores_club 
ON public.league_gameweek_scores(club_id);

-- ==============================================================================
-- 6. RPC: resolve_draft_window (Execute Sealed-Bid Resolution)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.resolve_draft_window(p_league_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player RECORD;
    v_winning_bid RECORD;
    v_awarded_count INT := 0;
BEGIN
    -- Verify league is in draft phase
    IF NOT EXISTS (SELECT 1 FROM public.leagues WHERE id = p_league_id AND status = 'DRAFT_ACTIVE') THEN
        RETURN jsonb_build_object('success', false, 'error', 'League is not in active draft phase.');
    END IF;

    -- Loop over every player who has pending bids in this league
    FOR v_player IN (
        SELECT DISTINCT player_id 
        FROM public.league_draft_bids 
        WHERE league_id = p_league_id AND status = 'PENDING'
    ) LOOP
        -- Select highest bid (break tie by earliest timestamp)
        SELECT * INTO v_winning_bid
        FROM public.league_draft_bids
        WHERE league_id = p_league_id 
          AND player_id = v_player.player_id 
          AND status = 'PENDING'
        ORDER BY bid_amount DESC, created_at ASC
        LIMIT 1;

        IF v_winning_bid.id IS NOT NULL THEN
            -- Check winning club has sufficient draft credits
            IF EXISTS (
                SELECT 1 FROM public.clubs 
                WHERE id = v_winning_bid.club_id AND draft_credits >= v_winning_bid.bid_amount
            ) THEN
                -- Deduct draft credits from winner
                UPDATE public.clubs
                SET draft_credits = draft_credits - v_winning_bid.bid_amount,
                    updated_at = NOW()
                WHERE id = v_winning_bid.club_id;

                -- Assign player to winner in club_roster
                INSERT INTO public.club_roster (
                    club_id,
                    player_id,
                    league_id,
                    acquisition_price,
                    acquired_at,
                    in_starting_xi
                ) VALUES (
                    v_winning_bid.club_id,
                    v_winning_bid.player_id,
                    p_league_id,
                    v_winning_bid.bid_amount,
                    NOW(),
                    FALSE
                ) ON CONFLICT (league_id, player_id) DO NOTHING;

                -- Mark winning bid
                UPDATE public.league_draft_bids
                SET status = 'WON'
                WHERE id = v_winning_bid.id;

                -- Mark competing bids as OUTBID
                UPDATE public.league_draft_bids
                SET status = 'OUTBID'
                WHERE league_id = p_league_id 
                  AND player_id = v_player.player_id 
                  AND id <> v_winning_bid.id
                  AND status = 'PENDING';

                v_awarded_count := v_awarded_count + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'league_id', p_league_id,
        'players_awarded', v_awarded_count
    );
END;
$$;

-- ==============================================================================
-- 7. RPC: autofill_league_rosters (SPEC v2 Section 3 Auto-Fill Rule)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.autofill_league_rosters(p_league_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_club RECORD;
    v_current_count INT;
    v_needed INT;
    v_unowned_player RECORD;
    v_filled_count INT := 0;
BEGIN
    FOR v_club IN (
        SELECT id FROM public.clubs WHERE league_id = p_league_id
    ) LOOP
        SELECT COUNT(*) INTO v_current_count
        FROM public.club_roster
        WHERE club_id = v_club.id AND league_id = p_league_id;

        IF v_current_count < 11 THEN
            v_needed := 11 - v_current_count;

            FOR v_unowned_player IN (
                SELECT p.id, p.base_value
                FROM public.players p
                WHERE p.id NOT IN (
                    SELECT player_id FROM public.club_roster WHERE league_id = p_league_id
                )
                ORDER BY p.base_value ASC, gen_random_uuid()
                LIMIT v_needed
            ) LOOP
                INSERT INTO public.club_roster (
                    club_id,
                    player_id,
                    league_id,
                    acquisition_price,
                    acquired_at,
                    in_starting_xi
                ) VALUES (
                    v_club.id,
                    v_unowned_player.id,
                    p_league_id,
                    v_unowned_player.base_value,
                    NOW(),
                    FALSE
                ) ON CONFLICT (league_id, player_id) DO NOTHING;

                v_filled_count := v_filled_count + 1;
            END LOOP;
        END IF;
    END LOOP;

    -- Transition league to LIVE once rosters are complete
    UPDATE public.leagues
    SET status = 'LIVE', updated_at = NOW()
    WHERE id = p_league_id;

    RETURN jsonb_build_object(
        'success', true,
        'league_id', p_league_id,
        'auto_filled_players', v_filled_count,
        'status', 'LIVE'
    );
END;
$$;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) FOR STRICT LEAGUE ISOLATION
-- ==============================================================================
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_draft_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_gameweek_scores ENABLE ROW LEVEL SECURITY;

-- Regular users view only their own league
CREATE POLICY "Users can view leagues they belong to"
    ON public.leagues FOR SELECT
    USING (
        id IN (SELECT league_id FROM public.clubs WHERE user_id = auth.uid())
        OR status = 'DRAFT_ACTIVE' -- Publicly visible to join during draft
    );

-- Draft bids viewable only within user's club/league
CREATE POLICY "Users can view draft bids for their club"
    ON public.league_draft_bids FOR SELECT
    USING (
        club_id IN (SELECT id FROM public.clubs WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert draft bids for their club"
    ON public.league_draft_bids FOR INSERT
    WITH CHECK (
        club_id IN (SELECT id FROM public.clubs WHERE user_id = auth.uid())
    );

-- Gameweek scores viewable only within user's league
CREATE POLICY "Users can view scores for their league"
    ON public.league_gameweek_scores FOR SELECT
    USING (
        league_id IN (SELECT league_id FROM public.clubs WHERE user_id = auth.uid())
    );
