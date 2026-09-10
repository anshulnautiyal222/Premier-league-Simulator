-- ==============================================================================
-- Migration: 20260910180000_add_p2p_trade_rpc.sql
-- Description: Atomic P2P trade execution RPC function with roster swaps and
--              purse adjustments in a single transaction
-- ==============================================================================

-- Atomic P2P Trade Acceptance Function
CREATE OR REPLACE FUNCTION accept_p2p_trade(p_trade_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    trade_record RECORD;
    proposer_purse NUMERIC(14, 2);
    recipient_purse NUMERIC(14, 2);
    proposer_squad_value NUMERIC(14, 2);
    recipient_squad_value NUMERIC(14, 2);
    player_value NUMERIC(12, 2);
    cash_adj NUMERIC(12, 2);
    result JSONB;
BEGIN
    -- 1. Lock and fetch the trade record
    SELECT * INTO trade_record
    FROM p2p_trades
    WHERE id = p_trade_id AND status = 'PENDING'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Trade not found or not pending'
        );
    END IF;

    -- 2. Check expiry
    IF trade_record.expires_at < NOW() THEN
        UPDATE p2p_trades
        SET status = 'EXPIRED', resolved_at = NOW()
        WHERE id = p_trade_id;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Trade has expired'
        );
    END IF;

    -- 3. Fetch current club balances
    SELECT virtual_purse_balance, total_squad_value
    INTO proposer_purse, proposer_squad_value
    FROM clubs
    WHERE id = trade_record.proposer_club_id
    FOR UPDATE;

    SELECT virtual_purse_balance, total_squad_value
    INTO recipient_purse, recipient_squad_value
    FROM clubs
    WHERE id = trade_record.recipient_club_id
    FOR UPDATE;

    -- 4. Validate roster constraints (11-25 players)
    DECLARE
        proposer_count INT;
        recipient_count INT;
    BEGIN
        SELECT COUNT(*) INTO proposer_count
        FROM club_roster
        WHERE club_id = trade_record.proposer_club_id;
        
        SELECT COUNT(*) INTO recipient_count
        FROM club_roster
        WHERE club_id = trade_record.recipient_club_id;
        
        proposer_count := proposer_count - array_length(trade_record.offered_player_ids, 1) + array_length(trade_record.requested_player_ids, 1);
        recipient_count := recipient_count - array_length(trade_record.requested_player_ids, 1) + array_length(trade_record.offered_player_ids, 1);
        
        IF proposer_count < 11 OR proposer_count > 25 THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Trade would violate proposer squad size constraints'
            );
        END IF;
        
        IF recipient_count < 11 OR recipient_count > 25 THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Trade would violate recipient squad size constraints'
            );
        END IF;
    END;

    -- 5. Validate cash balance
    cash_adj := trade_record.cash_adjustment;
    
    IF cash_adj > 0 AND proposer_purse < cash_adj THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Proposer has insufficient funds for cash adjustment'
        );
    END IF;
    
    IF cash_adj < 0 AND recipient_purse < ABS(cash_adj) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Recipient has insufficient funds for cash adjustment'
        );
    END IF;

    -- 6. Validate all offered players still belong to proposer
    IF EXISTS (
        SELECT 1 FROM unnest(trade_record.offered_player_ids) AS pid
        WHERE NOT EXISTS (
            SELECT 1 FROM club_roster
            WHERE club_id = trade_record.proposer_club_id AND player_id = pid
        )
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'One or more offered players no longer in proposer roster'
        );
    END IF;

    -- 7. Validate all requested players still belong to recipient
    IF EXISTS (
        SELECT 1 FROM unnest(trade_record.requested_player_ids) AS pid
        WHERE NOT EXISTS (
            SELECT 1 FROM club_roster
            WHERE club_id = trade_record.recipient_club_id AND player_id = pid
        )
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'One or more requested players no longer in recipient roster'
        );
    END IF;

    -- 8. Execute roster transfers
    -- Remove offered players from proposer
    DELETE FROM club_roster
    WHERE club_id = trade_record.proposer_club_id
    AND player_id = ANY(trade_record.offered_player_ids);

    -- Remove requested players from recipient
    DELETE FROM club_roster
    WHERE club_id = trade_record.recipient_club_id
    AND player_id = ANY(trade_record.requested_player_ids);

    -- Add offered players to recipient
    INSERT INTO club_roster (club_id, player_id, acquisition_price, acquired_at, in_starting_xi)
    SELECT 
        trade_record.recipient_club_id,
        player_id,
        current_market_value,
        NOW(),
        FALSE
    FROM players
    WHERE id = ANY(trade_record.offered_player_ids);

    -- Add requested players to proposer
    INSERT INTO club_roster (club_id, player_id, acquisition_price, acquired_at, in_starting_xi)
    SELECT 
        trade_record.proposer_club_id,
        player_id,
        current_market_value,
        NOW(),
        FALSE
    FROM players
    WHERE id = ANY(trade_record.requested_player_ids);

    -- 9. Adjust purses and recalculate squad values
    proposer_purse := proposer_purse - cash_adj;
    recipient_purse := recipient_purse + cash_adj;

    -- Recalculate squad values
    SELECT COALESCE(SUM(p.current_market_value), 0)
    INTO proposer_squad_value
    FROM club_roster cr
    JOIN players p ON cr.player_id = p.id
    WHERE cr.club_id = trade_record.proposer_club_id;

    SELECT COALESCE(SUM(p.current_market_value), 0)
    INTO recipient_squad_value
    FROM club_roster cr
    JOIN players p ON cr.player_id = p.id
    WHERE cr.club_id = trade_record.recipient_club_id;

    -- Update clubs
    UPDATE clubs
    SET 
        virtual_purse_balance = proposer_purse,
        total_squad_value = proposer_squad_value,
        updated_at = NOW()
    WHERE id = trade_record.proposer_club_id;

    UPDATE clubs
    SET 
        virtual_purse_balance = recipient_purse,
        total_squad_value = recipient_squad_value,
        updated_at = NOW()
    WHERE id = trade_record.recipient_club_id;

    -- 10. Record transaction
    INSERT INTO market_transactions (buyer_club_id, seller_club_id, player_id, fee, transaction_type)
    SELECT 
        trade_record.recipient_club_id,
        trade_record.proposer_club_id,
        unnest(trade_record.offered_player_ids),
        0,
        'P2P_TRADE';

    INSERT INTO market_transactions (buyer_club_id, seller_club_id, player_id, fee, transaction_type)
    SELECT 
        trade_record.proposer_club_id,
        trade_record.recipient_club_id,
        unnest(trade_record.requested_player_ids),
        0,
        'P2P_TRADE';

    -- 11. Update trade status
    UPDATE p2p_trades
    SET status = 'ACCEPTED', resolved_at = NOW()
    WHERE id = p_trade_id;

    -- 12. Return success
    result := jsonb_build_object(
        'success', true,
        'trade_id', p_trade_id,
        'proposer_new_purse', proposer_purse,
        'recipient_new_purse', recipient_purse,
        'proposer_squad_value', proposer_squad_value,
        'recipient_squad_value', recipient_squad_value
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION accept_p2p_trade(UUID) TO authenticated;
