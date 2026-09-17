-- ==============================================================================
-- Migration: 20260910230000_drop_amm_rpc_and_types.sql
-- Description: Drop deprecated AMM buy_player and sell_player RPC functions,
--              and update market_transactions constraint to only permit
--              valid modern transaction types (P2P_TRADE, ACADEMY_MINT, DIVIDEND_PAYOUT).
-- ==============================================================================

-- Drop deprecated AMM buy/sell RPC functions
DROP FUNCTION IF EXISTS public.buy_player(UUID);
DROP FUNCTION IF EXISTS public.sell_player(UUID);

-- Update transaction_type constraint on market_transactions
ALTER TABLE public.market_transactions 
DROP CONSTRAINT IF EXISTS market_transactions_transaction_type_check;

ALTER TABLE public.market_transactions 
ADD CONSTRAINT market_transactions_transaction_type_check 
CHECK (transaction_type IN ('P2P_TRADE', 'ACADEMY_MINT', 'DIVIDEND_PAYOUT'));
