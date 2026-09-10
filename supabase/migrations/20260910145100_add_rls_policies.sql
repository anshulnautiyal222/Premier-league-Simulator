-- ==============================================================================
-- Migration: 20260910145100_add_rls_policies.sql
-- Description: Row Level Security (RLS) policies ensuring users can only modify
--              their own club and roster rows, while allowing public read access
--              for clubs, players, transactions, and leaderboard aggregation.
-- ==============================================================================

-- ==============================================================================
-- 1. CLUBS RLS
-- ==============================================================================
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Anyone can read all clubs (for leaderboards, rival profiles, and net worth rankings)
CREATE POLICY "Clubs are viewable by everyone"
    ON public.clubs
    FOR SELECT
    USING (true);

-- Authenticated users can create their own club (enforces user_id = auth.uid())
CREATE POLICY "Users can create their own club"
    ON public.clubs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can only modify their own club profile and balances
CREATE POLICY "Users can update their own club"
    ON public.clubs
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own club
CREATE POLICY "Users can delete their own club"
    ON public.clubs
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 2. PLAYERS RLS
-- ==============================================================================
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Player catalog is globally readable
CREATE POLICY "Players catalog is viewable by everyone"
    ON public.players
    FOR SELECT
    USING (true);

-- Admin / service role can manage player catalog (insert, update, delete)
CREATE POLICY "Service role manages player catalog"
    ON public.players
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 3. CLUB_ROSTER RLS
-- ==============================================================================
ALTER TABLE public.club_roster ENABLE ROW LEVEL SECURITY;

-- Squad rosters are viewable by all users (for scouting and match previews)
CREATE POLICY "Club rosters are viewable by everyone"
    ON public.club_roster
    FOR SELECT
    USING (true);

-- Users can only add players to their own club roster
CREATE POLICY "Users can insert players into their own club roster"
    ON public.club_roster
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE public.clubs.id = club_roster.club_id
              AND public.clubs.user_id = auth.uid()
        )
    );

-- Users can only update their own club roster (e.g. setting starting XI)
CREATE POLICY "Users can update their own club roster"
    ON public.club_roster
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE public.clubs.id = club_roster.club_id
              AND public.clubs.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE public.clubs.id = club_roster.club_id
              AND public.clubs.user_id = auth.uid()
        )
    );

-- Users can only remove players from their own club roster (liquidation / sales)
CREATE POLICY "Users can delete players from their own club roster"
    ON public.club_roster
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE public.clubs.id = club_roster.club_id
              AND public.clubs.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 4. MARKET_TRANSACTIONS RLS
-- ==============================================================================
ALTER TABLE public.market_transactions ENABLE ROW LEVEL SECURITY;

-- Transactions ledger is publicly readable for price charts and leaderboards
CREATE POLICY "Market transactions are viewable by everyone"
    ON public.market_transactions
    FOR SELECT
    USING (true);

-- Authenticated clubs can insert transactions they participate in
CREATE POLICY "Clubs can record transactions they participate in"
    ON public.market_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE (public.clubs.id = market_transactions.buyer_club_id OR public.clubs.id = market_transactions.seller_club_id)
              AND public.clubs.user_id = auth.uid()
        )
    );

-- Service role has full access to transactions
CREATE POLICY "Service role can record transactions"
    ON public.market_transactions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 5. RUMOR_FEED RLS
-- ==============================================================================
ALTER TABLE public.rumor_feed ENABLE ROW LEVEL SECURITY;

-- Transfer rumors are globally readable
CREATE POLICY "Rumor feed is viewable by everyone"
    ON public.rumor_feed
    FOR SELECT
    USING (true);

-- Authenticated users can vote on rumors (increment upvotes/downvotes)
CREATE POLICY "Authenticated users can vote on rumors"
    ON public.rumor_feed
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Service role manages rumor lifecycle
CREATE POLICY "Service role manages rumor feed"
    ON public.rumor_feed
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 6. P2P_TRADES RLS
-- ==============================================================================
ALTER TABLE public.p2p_trades ENABLE ROW LEVEL SECURITY;

-- Involved club owners can view trade proposals
CREATE POLICY "Involved parties can view trade proposals"
    ON public.p2p_trades
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE (public.clubs.id = p2p_trades.proposer_club_id OR public.clubs.id = p2p_trades.recipient_club_id)
              AND public.clubs.user_id = auth.uid()
        )
    );

-- Club owners can initiate trades from their own club
CREATE POLICY "Club owners can create trade proposals"
    ON public.p2p_trades
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE public.clubs.id = p2p_trades.proposer_club_id
              AND public.clubs.user_id = auth.uid()
        )
    );

-- Involved parties can update trade status (Accept, Reject, Cancel)
CREATE POLICY "Involved parties can update trade status"
    ON public.p2p_trades
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE (public.clubs.id = p2p_trades.proposer_club_id OR public.clubs.id = p2p_trades.recipient_club_id)
              AND public.clubs.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE (public.clubs.id = p2p_trades.proposer_club_id OR public.clubs.id = p2p_trades.recipient_club_id)
              AND public.clubs.user_id = auth.uid()
        )
    );
