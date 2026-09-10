-- ==============================================================================
-- Migration: 20260910163500_create_player_price_history.sql
-- Description: Create player_price_history table to store historical valuation
--              snapshots, form factors, and rumor/demand modifiers for price charts.
-- ==============================================================================

-- Add form_factor column to players table if it doesn't already exist
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS form_factor NUMERIC(5, 4) DEFAULT 0.0000;

-- Create player_price_history table
CREATE TABLE IF NOT EXISTS public.player_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    market_value NUMERIC(12, 2) NOT NULL,
    form_factor NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    rumor_multiplier NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    demand_factor NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    match_rating NUMERIC(4, 2) DEFAULT 6.50,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast time-series queries for stock/candlestick charts
CREATE INDEX IF NOT EXISTS idx_price_history_player ON public.player_price_history(player_id, recorded_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.player_price_history ENABLE ROW LEVEL SECURITY;

-- Public read access for historical charts
CREATE POLICY "Price history is viewable by everyone"
    ON public.player_price_history
    FOR SELECT
    USING (true);

-- Service role write access
CREATE POLICY "Service role can insert price history"
    ON public.player_price_history
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
