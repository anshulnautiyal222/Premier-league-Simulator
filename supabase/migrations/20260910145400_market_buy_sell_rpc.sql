-- ==============================================================================
-- Migration: 20260910145400_market_buy_sell_rpc.sql
-- Description: Atomic PostgreSQL functions for buy_player and sell_player,
--              updating transaction_type constraints, purse balance, roster,
--              and audit transactions in a single atomic transaction.
-- ==============================================================================

-- Update transaction_type constraint on market_transactions to allow 'market_buy' and 'market_sell'
ALTER TABLE public.market_transactions 
DROP CONSTRAINT IF EXISTS market_transactions_transaction_type_check;

ALTER TABLE public.market_transactions 
ADD CONSTRAINT market_transactions_transaction_type_check 
CHECK (transaction_type IN ('market_buy', 'market_sell', 'AMM_BUY', 'AMM_SELL', 'P2P_TRADE', 'ACADEMY_MINT', 'DIVIDEND_PAYOUT'));

-- ==============================================================================
-- RPC: buy_player
-- Executes atomic purchase of a player:
-- 1. Checks sufficient purse balance
-- 2. Deducts fee from purse
-- 3. Inserts into club_roster
-- 4. Inserts into market_transactions (type: 'market_buy')
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.buy_player(p_player_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_club_id UUID;
    v_purse NUMERIC(14, 2);
    v_squad_value NUMERIC(14, 2);
    v_squad_count INT;
    v_player RECORD;
    v_new_purse NUMERIC(14, 2);
BEGIN
    -- 1. Identify authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to buy players.';
    END IF;

    -- 2. Lock and retrieve user's club
    SELECT id, virtual_purse_balance, total_squad_value
    INTO v_club_id, v_purse, v_squad_value
    FROM public.clubs
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF v_club_id IS NULL THEN
        RAISE EXCEPTION 'No club found for current user. Please found a club first.';
    END IF;

    -- 3. Check squad size limit (max 25 players)
    SELECT COUNT(*) INTO v_squad_count FROM public.club_roster WHERE club_id = v_club_id;
    IF v_squad_count >= 25 THEN
        RAISE EXCEPTION 'Squad limit reached (maximum 25 players). Please sell a player first.';
    END IF;

    -- 4. Check if player already in club roster
    IF EXISTS (SELECT 1 FROM public.club_roster WHERE club_id = v_club_id AND player_id = p_player_id) THEN
        RAISE EXCEPTION 'Player is already in your club roster.';
    END IF;

    -- 5. Retrieve player market valuation
    SELECT id, name, current_market_value
    INTO v_player
    FROM public.players
    WHERE id = p_player_id;

    IF v_player.id IS NULL THEN
        RAISE EXCEPTION 'Player not found in catalog.';
    END IF;

    -- 6. Check sufficient purse balance
    IF v_purse < v_player.current_market_value THEN
        RAISE EXCEPTION 'Insufficient purse balance (£%) to purchase % (£%).',
            to_char(v_purse, 'FM999,999,999.00'),
            v_player.name,
            to_char(v_player.current_market_value, 'FM999,999,999.00');
    END IF;

    -- 7. Deduct fee from club purse and update squad value
    v_new_purse := v_purse - v_player.current_market_value;
    UPDATE public.clubs
    SET 
        virtual_purse_balance = v_new_purse,
        total_squad_value = v_squad_value + v_player.current_market_value,
        updated_at = NOW()
    WHERE id = v_club_id;

    -- 8. Insert into club_roster
    INSERT INTO public.club_roster (
        club_id,
        player_id,
        acquisition_price,
        acquired_at,
        in_starting_xi
    ) VALUES (
        v_club_id,
        v_player.id,
        v_player.current_market_value,
        NOW(),
        FALSE
    );

    -- 9. Insert into market_transactions audit ledger
    INSERT INTO public.market_transactions (
        buyer_club_id,
        seller_club_id,
        player_id,
        fee,
        transaction_type,
        created_at
    ) VALUES (
        v_club_id,
        NULL,
        v_player.id,
        v_player.current_market_value,
        'market_buy',
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'action', 'market_buy',
        'player_id', v_player.id,
        'player_name', v_player.name,
        'fee', v_player.current_market_value,
        'remaining_purse', v_new_purse
    );
END;
$$;

-- ==============================================================================
-- RPC: sell_player
-- Executes atomic liquidation of a player:
-- 1. Checks player is in user's roster
-- 2. Calculates 3% platform broker fee
-- 3. Adds net proceeds to club's purse
-- 4. Removes from club_roster
-- 5. Inserts into market_transactions (type: 'market_sell')
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sell_player(p_player_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_club_id UUID;
    v_purse NUMERIC(14, 2);
    v_squad_value NUMERIC(14, 2);
    v_roster_id UUID;
    v_acquisition_price NUMERIC(12, 2);
    v_player RECORD;
    v_broker_fee NUMERIC(12, 2);
    v_net_proceeds NUMERIC(12, 2);
    v_new_purse NUMERIC(14, 2);
BEGIN
    -- 1. Identify authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to sell players.';
    END IF;

    -- 2. Lock and retrieve user's club
    SELECT id, virtual_purse_balance, total_squad_value
    INTO v_club_id, v_purse, v_squad_value
    FROM public.clubs
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF v_club_id IS NULL THEN
        RAISE EXCEPTION 'No club found for current user.';
    END IF;

    -- 3. Verify player is owned by club
    SELECT id, acquisition_price
    INTO v_roster_id, v_acquisition_price
    FROM public.club_roster
    WHERE club_id = v_club_id AND player_id = p_player_id
    FOR UPDATE;

    IF v_roster_id IS NULL THEN
        RAISE EXCEPTION 'Player is not in your club roster.';
    END IF;

    -- 4. Retrieve current player market valuation
    SELECT id, name, current_market_value
    INTO v_player
    FROM public.players
    WHERE id = p_player_id;

    IF v_player.id IS NULL THEN
        RAISE EXCEPTION 'Player record not found in catalog.';
    END IF;

    -- 5. Calculate 3% broker fee deduction (Section 9 currency sink)
    v_broker_fee := ROUND(v_player.current_market_value * 0.03, 2);
    v_net_proceeds := v_player.current_market_value - v_broker_fee;

    -- 6. Credit net proceeds to club purse and decrement squad value
    v_new_purse := v_purse + v_net_proceeds;
    UPDATE public.clubs
    SET 
        virtual_purse_balance = v_new_purse,
        total_squad_value = GREATEST(0.00, v_squad_value - v_player.current_market_value),
        updated_at = NOW()
    WHERE id = v_club_id;

    -- 7. Remove player card from roster
    DELETE FROM public.club_roster
    WHERE id = v_roster_id;

    -- 8. Insert into market_transactions audit ledger
    INSERT INTO public.market_transactions (
        buyer_club_id,
        seller_club_id,
        player_id,
        fee,
        transaction_type,
        created_at
    ) VALUES (
        NULL,
        v_club_id,
        v_player.id,
        v_net_proceeds,
        'market_sell',
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'action', 'market_sell',
        'player_id', v_player.id,
        'player_name', v_player.name,
        'gross_value', v_player.current_market_value,
        'broker_fee', v_broker_fee,
        'net_proceeds', v_net_proceeds,
        'new_purse', v_new_purse
    );
END;
$$;
