-- ==============================================================================
-- Rollback Migration: 20260911020000_add_league_worlds_schema_rollback.sql
-- Description: Completely reverts all schema changes from 
--              20260911020000_add_league_worlds_schema.sql
-- ==============================================================================

-- 1. Drop trigger on auth.users and user sync function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- 2. Drop trigger on league_members
DROP TRIGGER IF EXISTS trigger_league_member_limit ON public.league_members;
DROP FUNCTION IF EXISTS public.check_league_member_limit();

-- 3. Drop League Worlds tables in reverse dependency order
DROP TABLE IF EXISTS public.league_rewards CASCADE;
DROP TABLE IF EXISTS public.league_gameweek_scores CASCADE;
DROP TABLE IF EXISTS public.league_draft_bids CASCADE;
DROP TABLE IF EXISTS public.league_rosters CASCADE;
DROP TABLE IF EXISTS public.league_members CASCADE;
DROP TABLE IF EXISTS public.leagues CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 4. Remove draft_budget_remaining from clubs table
ALTER TABLE public.clubs
DROP COLUMN IF EXISTS draft_budget_remaining;
