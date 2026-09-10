-- ==============================================================================
-- Migration: 20260910145200_seed_players.sql
-- Description: Seed 30 Premier League players across all positions (GK, DEF, MID, FWD)
--              with realistic base valuations, current market values, and form scores.
-- ==============================================================================

INSERT INTO public.players (id, name, real_team, position, base_value, current_market_value, form_score, injury_status, contract_months_remaining)
VALUES
    -- Goalkeepers (5)
    ('10000000-0000-0000-0000-000000000001', 'David Raya', 'Arsenal', 'GK', 40000000.00, 46000000.00, 7.60, 'fit', 36),
    ('10000000-0000-0000-0000-000000000002', 'Ederson', 'Manchester City', 'GK', 35000000.00, 38000000.00, 7.20, 'fit', 24),
    ('10000000-0000-0000-0000-000000000003', 'Alisson Becker', 'Liverpool', 'GK', 42000000.00, 40000000.00, 7.40, 'minor_knock', 24),
    ('10000000-0000-0000-0000-000000000004', 'Emiliano Martínez', 'Aston Villa', 'GK', 38000000.00, 42000000.00, 7.50, 'fit', 36),
    ('10000000-0000-0000-0000-000000000005', 'Guglielmo Vicario', 'Tottenham Hotspur', 'GK', 32000000.00, 35000000.00, 7.10, 'fit', 42),

    -- Defenders (10)
    ('10000000-0000-0000-0000-000000000006', 'William Saliba', 'Arsenal', 'DEF', 75000000.00, 85000000.00, 7.90, 'fit', 36),
    ('10000000-0000-0000-0000-000000000007', 'Gabriel Magalhães', 'Arsenal', 'DEF', 65000000.00, 72000000.00, 7.70, 'fit', 36),
    ('10000000-0000-0000-0000-000000000008', 'Trent Alexander-Arnold', 'Liverpool', 'DEF', 70000000.00, 75000000.00, 7.60, 'fit', 12),
    ('10000000-0000-0000-0000-000000000009', 'Virgil van Dijk', 'Liverpool', 'DEF', 45000000.00, 48000000.00, 7.80, 'fit', 12),
    ('10000000-0000-0000-0000-000000000010', 'Joško Gvardiol', 'Manchester City', 'DEF', 75000000.00, 80000000.00, 7.50, 'fit', 48),
    ('10000000-0000-0000-0000-000000000011', 'Rúben Dias', 'Manchester City', 'DEF', 70000000.00, 72000000.00, 7.40, 'fit', 36),
    ('10000000-0000-0000-0000-000000000012', 'Cristian Romero', 'Tottenham Hotspur', 'DEF', 60000000.00, 65000000.00, 7.30, 'fit', 36),
    ('10000000-0000-0000-0000-000000000013', 'Pedro Porro', 'Tottenham Hotspur', 'DEF', 45000000.00, 50000000.00, 7.40, 'fit', 40),
    ('10000000-0000-0000-0000-000000000014', 'Micky van de Ven', 'Tottenham Hotspur', 'DEF', 55000000.00, 62000000.00, 7.50, 'fit', 46),
    ('10000000-0000-0000-0000-000000000015', 'Levi Colwill', 'Chelsea', 'DEF', 50000000.00, 54000000.00, 7.20, 'fit', 48),

    -- Midfielders (10)
    ('10000000-0000-0000-0000-000000000016', 'Bukayo Saka', 'Arsenal', 'MID', 110000000.00, 125000000.00, 8.20, 'fit', 36),
    ('10000000-0000-0000-0000-000000000017', 'Martin Ødegaard', 'Arsenal', 'MID', 90000000.00, 95000000.00, 7.80, 'fit', 40),
    ('10000000-0000-0000-0000-000000000018', 'Declan Rice', 'Arsenal', 'MID', 95000000.00, 105000000.00, 7.90, 'fit', 44),
    ('10000000-0000-0000-0000-000000000019', 'Rodri', 'Manchester City', 'MID', 115000000.00, 100000000.00, 8.40, 'severe_injury', 36),
    ('10000000-0000-0000-0000-000000000020', 'Kevin De Bruyne', 'Manchester City', 'MID', 60000000.00, 55000000.00, 7.70, 'fit', 12),
    ('10000000-0000-0000-0000-000000000021', 'Phil Foden', 'Manchester City', 'MID', 110000000.00, 118000000.00, 7.80, 'fit', 36),
    ('10000000-0000-0000-0000-000000000022', 'Cole Palmer', 'Chelsea', 'MID', 85000000.00, 110000000.00, 8.50, 'fit', 60),
    ('10000000-0000-0000-0000-000000000023', 'Bruno Fernandes', 'Manchester United', 'MID', 65000000.00, 68000000.00, 7.50, 'fit', 36),
    ('10000000-0000-0000-0000-000000000024', 'Kobbie Mainoo', 'Manchester United', 'MID', 45000000.00, 55000000.00, 7.40, 'fit', 40),
    ('10000000-0000-0000-0000-000000000025', 'Alexis Mac Allister', 'Liverpool', 'MID', 70000000.00, 78000000.00, 7.60, 'fit', 40),

    -- Forwards (5)
    ('10000000-0000-0000-0000-000000000026', 'Erling Haaland', 'Manchester City', 'FWD', 150000000.00, 180000000.00, 8.80, 'fit', 36),
    ('10000000-0000-0000-0000-000000000027', 'Mohamed Salah', 'Liverpool', 'FWD', 80000000.00, 85000000.00, 8.40, 'fit', 12),
    ('10000000-0000-0000-0000-000000000028', 'Alexander Isak', 'Newcastle United', 'FWD', 75000000.00, 85000000.00, 7.80, 'fit', 40),
    ('10000000-0000-0000-0000-000000000029', 'Ollie Watkins', 'Aston Villa', 'FWD', 65000000.00, 72000000.00, 7.60, 'fit', 44),
    ('10000000-0000-0000-0000-000000000030', 'Son Heung-min', 'Tottenham Hotspur', 'FWD', 50000000.00, 52000000.00, 7.50, 'fit', 18)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    real_team = EXCLUDED.real_team,
    position = EXCLUDED.position,
    base_value = EXCLUDED.base_value,
    current_market_value = EXCLUDED.current_market_value,
    form_score = EXCLUDED.form_score,
    injury_status = EXCLUDED.injury_status,
    contract_months_remaining = EXCLUDED.contract_months_remaining,
    updated_at = NOW();
