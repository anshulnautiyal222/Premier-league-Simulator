-- ==============================================================================
-- Migration: 20260910185000_create_private_leagues.sql
-- Description: Private leagues table for user-hosted custom leagues with
--              adjustable budgets, salary caps, and invite-only membership
-- ==============================================================================

-- ==============================================================================
-- 1. PRIVATE_LEAGUES
-- User-hosted custom leagues with invite codes and custom rules
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.private_leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    budget_cap NUMERIC(14, 2) DEFAULT 150000000.00, -- £150M default starting budget
    salary_cap NUMERIC(14, 2) DEFAULT 500000000.00, -- £500M max squad value cap
    member_club_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    max_members INT DEFAULT 20 CHECK (max_members BETWEEN 2 AND 50),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for league lookup and invite code validation
CREATE INDEX IF NOT EXISTS idx_private_leagues_owner ON public.private_leagues(owner_club_id);
CREATE INDEX IF NOT EXISTS idx_private_leagues_invite_code ON public.private_leagues(invite_code);
CREATE INDEX IF NOT EXISTS idx_private_leagues_members ON public.private_leagues USING GIN(member_club_ids);

-- ==============================================================================
-- 2. LEAGUE_MEMBERSHIP
-- Track individual club membership in private leagues with join timestamps
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.league_membership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES public.private_leagues(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_league_club UNIQUE (league_id, club_id)
);

-- Indexes for member lookups
CREATE INDEX IF NOT EXISTS idx_league_membership_league ON public.league_membership(league_id);
CREATE INDEX IF NOT EXISTS idx_league_membership_club ON public.league_membership(club_id);
