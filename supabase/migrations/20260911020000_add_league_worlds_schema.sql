-- ==============================================================================
-- Migration: 20260911020000_add_league_worlds_schema.sql
-- Description: League Worlds Schema (SPEC v2):
--              1. public.users table with is_admin flag and auth sync trigger
--              2. leagues table (status: drafting, live, completed)
--              3. league_members table with 16-member ceiling enforcement trigger
--              4. league_rosters table with UNIQUE(league_id, player_id) constraint
--              5. league_draft_bids table (status: pending, won, lost)
--              6. clubs table: adds draft_budget_remaining column
--              7. league_gameweek_scores table (matchday points tracking)
--              8. league_rewards table (podium/rank reward distributions)
--              9. Row Level Security (RLS) policies scoped to league membership
--                 with full moderation read bypass for is_admin users
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. USERS & ADMIN ROLE FLAG
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function to check if a user is an administrator
-- Checks public.users.is_admin OR auth.jwt() app_metadata
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = p_user_id AND is_admin = TRUE
    ) OR (
        COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, FALSE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically synchronize new auth.users into public.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, is_admin)
    VALUES (NEW.id, FALSE)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill any existing users from auth.users
INSERT INTO public.users (id, is_admin)
SELECT id, FALSE FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 2. LEAGUES
-- Isolated 16-club universe with drafting, live, and completed phases
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'drafting' 
        CHECK (status IN ('drafting', 'live', 'completed')),
    draft_opens_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    draft_closes_at TIMESTAMPTZ NOT NULL,
    season_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leagues_status ON public.leagues(status);
CREATE INDEX IF NOT EXISTS idx_leagues_draft_closes_at ON public.leagues(draft_closes_at);

-- ==============================================================================
-- 3. LEAGUE_MEMBERS
-- Enforce exactly 16 members per league via application + trigger
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.league_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_league_user UNIQUE (league_id, user_id),
    CONSTRAINT unique_league_club UNIQUE (league_id, club_id)
);

CREATE INDEX IF NOT EXISTS idx_league_members_league ON public.league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON public.league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_league_members_club ON public.league_members(club_id);

-- Trigger: enforce exactly 16 members maximum per league
CREATE OR REPLACE FUNCTION public.check_league_member_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_member_count INT;
BEGIN
    SELECT COUNT(*) INTO current_member_count
    FROM public.league_members
    WHERE league_id = NEW.league_id;

    IF current_member_count >= 16 THEN
        RAISE EXCEPTION 'League % is full. Exactly 16 members allowed per league.', NEW.league_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_league_member_limit ON public.league_members;
CREATE TRIGGER trigger_league_member_limit
    BEFORE INSERT ON public.league_members
    FOR EACH ROW EXECUTE FUNCTION public.check_league_member_limit();

-- ==============================================================================
-- 4. LEAGUE_ROSTERS
-- Unique ownership per league: a player can NEVER be owned twice in the same league
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.league_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    acquired_via VARCHAR(32) NOT NULL 
        CHECK (acquired_via IN ('draft_bid', 'auto_fill')),
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_league_player UNIQUE (league_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_league_rosters_league_club ON public.league_rosters(league_id, club_id);
CREATE INDEX IF NOT EXISTS idx_league_rosters_player ON public.league_rosters(player_id);

-- ==============================================================================
-- 5. LEAGUE_DRAFT_BIDS
-- Sealed-bid blind auction bids during the draft phase
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.league_draft_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    bid_amount INT NOT NULL CHECK (bid_amount >= 1),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'won', 'lost')),
    CONSTRAINT unique_league_club_player_bid UNIQUE (league_id, club_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_league_draft_bids_league_status ON public.league_draft_bids(league_id, status);
CREATE INDEX IF NOT EXISTS idx_league_draft_bids_club ON public.league_draft_bids(club_id);
CREATE INDEX IF NOT EXISTS idx_league_draft_bids_player ON public.league_draft_bids(player_id);

-- ==============================================================================
-- 6. CLUBS: ADD DRAFT_BUDGET_REMAINING
-- Tracks remaining draft credit budget (starting at 500)
-- ==============================================================================
ALTER TABLE public.clubs
ADD COLUMN IF NOT EXISTS draft_budget_remaining INT NOT NULL DEFAULT 500 CHECK (draft_budget_remaining >= 0);

-- ==============================================================================
-- 7. LEAGUE_GAMEWEEK_SCORES
-- Tracks weekly matchday fantasy points for each club in a league
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.league_gameweek_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    gameweek INT NOT NULL CHECK (gameweek >= 1),
    points NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_league_club_gameweek UNIQUE (league_id, club_id, gameweek)
);

CREATE INDEX IF NOT EXISTS idx_league_gameweek_scores_lookup ON public.league_gameweek_scores(league_id, gameweek);
CREATE INDEX IF NOT EXISTS idx_league_gameweek_scores_club ON public.league_gameweek_scores(club_id);

-- ==============================================================================
-- 8. LEAGUE_REWARDS
-- Season and milestone reward distributions per club rank
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.league_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    rank INT NOT NULL CHECK (rank BETWEEN 1 AND 16),
    currency_type VARCHAR(32) NOT NULL 
        CHECK (currency_type IN ('champion_coins', 'virtual_purse', 'draft_credits')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_league_rewards_league_rank ON public.league_rewards(league_id, rank);
CREATE INDEX IF NOT EXISTS idx_league_rewards_club ON public.league_rewards(club_id);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- Users read/write rows where league_id matches a league they belong to (via league_members).
-- Users with is_admin = TRUE have full read access across all leagues for moderation.
-- ==============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_draft_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_gameweek_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_rewards ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 9.1 USERS RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users view own profile or admins view all"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can update user status"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9.2 LEAGUES RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Leagues viewable by members or admins"
    ON public.leagues
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = leagues.id AND lm.user_id = auth.uid()
        ) OR
        status = 'drafting' -- Allow browsing open drafting leagues to join
    );

CREATE POLICY "Authenticated users can create leagues"
    ON public.leagues
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "League updates restricted to admins or members"
    ON public.leagues
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = leagues.id AND lm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = leagues.id AND lm.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 9.3 LEAGUE_MEMBERS RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "League members viewable by league peers or admins"
    ON public.league_members
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = league_members.league_id AND lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join a league for their own club"
    ON public.league_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() OR (
            auth.uid() = user_id AND
            EXISTS (
                SELECT 1 FROM public.clubs c
                WHERE c.id = club_id AND c.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can leave or admins can manage members"
    ON public.league_members
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 9.4 LEAGUE_ROSTERS RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "League rosters viewable by league members or admins"
    ON public.league_rosters
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = league_rosters.league_id AND lm.user_id = auth.uid()
        )
    );

CREATE POLICY "League rosters modifiable by club owner or admins"
    ON public.league_rosters
    FOR ALL
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = league_rosters.league_id 
              AND lm.club_id = league_rosters.club_id 
              AND lm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = league_rosters.league_id 
              AND lm.club_id = league_rosters.club_id 
              AND lm.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 9.5 LEAGUE_DRAFT_BIDS RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Bids viewable by owning club or admins"
    ON public.league_draft_bids
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = league_draft_bids.league_id 
              AND lm.club_id = league_draft_bids.club_id 
              AND lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Bids insertable by owning club"
    ON public.league_draft_bids
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = league_draft_bids.league_id 
              AND lm.club_id = league_draft_bids.club_id 
              AND lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Bids updatable by owning club or admins"
    ON public.league_draft_bids
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = league_draft_bids.league_id 
              AND lm.club_id = league_draft_bids.club_id 
              AND lm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = league_draft_bids.league_id 
              AND lm.club_id = league_draft_bids.club_id 
              AND lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Bids deletable by owning club or admins"
    ON public.league_draft_bids
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = league_draft_bids.league_id 
              AND lm.club_id = league_draft_bids.club_id 
              AND lm.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 9.6 LEAGUE_GAMEWEEK_SCORES RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Gameweek scores viewable by league members or admins"
    ON public.league_gameweek_scores
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = league_gameweek_scores.league_id AND lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Gameweek scores manageable by admins or service_role"
    ON public.league_gameweek_scores
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9.7 LEAGUE_REWARDS RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "League rewards viewable by league members or admins"
    ON public.league_rewards
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.league_members lm
            WHERE lm.league_id = league_rewards.league_id AND lm.user_id = auth.uid()
        )
    );

CREATE POLICY "League rewards manageable by admins or service_role"
    ON public.league_rewards
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
