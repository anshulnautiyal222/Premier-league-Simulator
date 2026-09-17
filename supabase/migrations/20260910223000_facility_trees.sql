-- Facility progression: last_dividend_at, upgrade_facility RPC, stadium yield claim.

ALTER TABLE public.clubs
    ADD COLUMN IF NOT EXISTS last_dividend_at TIMESTAMPTZ DEFAULT NOW();

-- Seed academy rookie catalog (discounted young-player tokens)
INSERT INTO public.players (id, name, real_team, position, base_value, current_market_value, form_score, injury_status, contract_months_remaining)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'Callum Hargreaves', 'Academy', 'GK', 8000000, 8500000, 6.40, 'fit', 48),
    ('30000000-0000-0000-0000-000000000002', 'Noah Fletcher', 'Academy', 'DEF', 9000000, 9500000, 6.50, 'fit', 48),
    ('30000000-0000-0000-0000-000000000003', 'Luis Navarro', 'Academy', 'DEF', 10000000, 10500000, 6.60, 'fit', 48),
    ('30000000-0000-0000-0000-000000000004', 'Jamie Okafor', 'Academy', 'MID', 11000000, 12000000, 6.70, 'fit', 48),
    ('30000000-0000-0000-0000-000000000005', 'Theo Marchand', 'Academy', 'MID', 10000000, 11000000, 6.55, 'fit', 48),
    ('30000000-0000-0000-0000-000000000006', 'Ryan Coles', 'Academy', 'FWD', 12000000, 13000000, 6.80, 'fit', 48),
    ('30000000-0000-0000-0000-000000000007', 'Mateo Ricci', 'Academy', 'DEF', 8500000, 9000000, 6.45, 'fit', 48),
    ('30000000-0000-0000-0000-000000000008', 'Kian Brooks', 'Academy', 'MID', 9500000, 10000000, 6.50, 'fit', 48),
    ('30000000-0000-0000-0000-000000000009', 'Elián Vargas', 'Academy', 'MID', 18000000, 22000000, 7.10, 'fit', 54),
    ('30000000-0000-0000-0000-000000000010', 'Aisha Rahman', 'Academy', 'FWD', 20000000, 24000000, 7.20, 'fit', 54),
    ('30000000-0000-0000-0000-000000000011', 'Oscar Lindqvist', 'Academy', 'DEF', 19000000, 23000000, 7.05, 'fit', 54),
    ('30000000-0000-0000-0000-000000000012', 'Malik Touré', 'Academy', 'MID', 22000000, 26000000, 7.30, 'fit', 54),
    ('30000000-0000-0000-0000-000000000013', 'Finn Gallagher', 'Academy', 'GK', 16000000, 19000000, 7.00, 'fit', 54),
    ('30000000-0000-0000-0000-000000000014', 'Soren Blake', 'Academy', 'FWD', 21000000, 25000000, 7.15, 'fit', 54),
    ('30000000-0000-0000-0000-000000000015', 'Luka Petrovic', 'Academy', 'MID', 32000000, 40000000, 7.70, 'fit', 60),
    ('30000000-0000-0000-0000-000000000016', 'Amara Diallo', 'Academy', 'FWD', 36000000, 45000000, 7.85, 'fit', 60),
    ('30000000-0000-0000-0000-000000000017', 'Enzo Moretti', 'Academy', 'DEF', 30000000, 38000000, 7.60, 'fit', 60),
    ('30000000-0000-0000-0000-000000000018', 'Yusuf Demir', 'Academy', 'MID', 34000000, 42000000, 7.75, 'fit', 60)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.upgrade_facility(p_facility TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_club public.clubs%ROWTYPE;
    v_level INT;
    v_cost NUMERIC;
    v_new_level INT;
    v_new_purse NUMERIC;
BEGIN
    SELECT * INTO v_club
    FROM public.clubs
    WHERE user_id = auth.uid()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Club not found';
    END IF;

    IF p_facility = 'academy' THEN
        v_level := v_club.academy_level;
        v_cost := CASE v_level
            WHEN 1 THEN 8000000
            WHEN 2 THEN 18000000
            WHEN 3 THEN 32000000
            WHEN 4 THEN 55000000
            ELSE NULL
        END;
    ELSIF p_facility = 'scouting' THEN
        v_level := v_club.scouting_level;
        v_cost := CASE v_level
            WHEN 1 THEN 6000000
            WHEN 2 THEN 14000000
            WHEN 3 THEN 26000000
            WHEN 4 THEN 45000000
            ELSE NULL
        END;
    ELSIF p_facility = 'stadium' THEN
        v_level := v_club.stadium_level;
        v_cost := CASE v_level
            WHEN 1 THEN 10000000
            WHEN 2 THEN 22000000
            WHEN 3 THEN 38000000
            WHEN 4 THEN 65000000
            ELSE NULL
        END;
    ELSE
        RAISE EXCEPTION 'Unknown facility';
    END IF;

    IF v_cost IS NULL OR v_level >= 5 THEN
        RAISE EXCEPTION 'Facility already at maximum tier';
    END IF;

    IF v_club.virtual_purse_balance < v_cost THEN
        RAISE EXCEPTION 'Insufficient purse';
    END IF;

    v_new_level := v_level + 1;
    v_new_purse := v_club.virtual_purse_balance - v_cost;

    IF p_facility = 'academy' THEN
        UPDATE public.clubs
        SET academy_level = v_new_level,
            virtual_purse_balance = v_new_purse,
            updated_at = NOW()
        WHERE id = v_club.id;
    ELSIF p_facility = 'scouting' THEN
        UPDATE public.clubs
        SET scouting_level = v_new_level,
            virtual_purse_balance = v_new_purse,
            updated_at = NOW()
        WHERE id = v_club.id;
    ELSE
        UPDATE public.clubs
        SET stadium_level = v_new_level,
            virtual_purse_balance = v_new_purse,
            updated_at = NOW()
        WHERE id = v_club.id;
    END IF;

    RETURN jsonb_build_object(
        'facility', p_facility,
        'new_level', v_new_level,
        'cost', v_cost,
        'new_purse', v_new_purse
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_stadium_dividend(p_payout NUMERIC DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_club public.clubs%ROWTYPE;
    v_top11 NUMERIC;
    v_bps INT;
    v_payout NUMERIC;
    v_new_purse NUMERIC;
BEGIN
    SELECT * INTO v_club
    FROM public.clubs
    WHERE user_id = auth.uid()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Club not found';
    END IF;

    IF v_club.last_dividend_at IS NOT NULL
       AND v_club.last_dividend_at > NOW() - INTERVAL '7 days' THEN
        RAISE EXCEPTION 'Weekly commercial yield is not due yet';
    END IF;

    SELECT COALESCE(SUM(mv), 0) INTO v_top11
    FROM (
        SELECT p.current_market_value AS mv
        FROM public.club_roster r
        JOIN public.players p ON p.id = r.player_id
        WHERE r.club_id = v_club.id
        ORDER BY p.current_market_value DESC
        LIMIT 11
    ) ranked;

    v_bps := CASE v_club.stadium_level
        WHEN 1 THEN 8
        WHEN 2 THEN 12
        WHEN 3 THEN 18
        WHEN 4 THEN 26
        WHEN 5 THEN 36
        ELSE 8
    END;

    v_payout := ROUND((250000 * v_club.stadium_level) + (v_top11 * v_bps / 10000.0), 2);
    IF p_payout IS NOT NULL THEN
        v_payout := p_payout;
    END IF;

    v_new_purse := v_club.virtual_purse_balance + v_payout;

    UPDATE public.clubs
    SET virtual_purse_balance = v_new_purse,
        last_dividend_at = NOW(),
        updated_at = NOW()
    WHERE id = v_club.id;

    RETURN jsonb_build_object(
        'payout', v_payout,
        'new_purse', v_new_purse,
        'last_dividend_at', NOW(),
        'top11_appeal', v_top11
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.upgrade_facility(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_stadium_dividend(NUMERIC) TO authenticated;
