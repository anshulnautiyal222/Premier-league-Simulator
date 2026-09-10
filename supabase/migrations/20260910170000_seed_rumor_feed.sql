-- ==============================================================================
-- Seed Rumor Feed Migration
-- Adds realistic Premier League transfer rumors mapped to seeded players
-- ==============================================================================

INSERT INTO public.rumor_feed (
    id,
    player_id,
    source_name,
    tier_rating,
    buying_club,
    fee_estimate,
    status,
    upvotes,
    downvotes,
    created_at
) VALUES
    -- Tier 1: Ornstein on Trent Alexander-Arnold -> Real Madrid
    (
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000008',
        'David Ornstein (The Athletic)',
        1,
        'Real Madrid',
        75000000.00,
        'active',
        842,
        158,
        NOW() - INTERVAL '2 hours'
    ),
    -- Tier 1: Romano on Cole Palmer -> Paris Saint-Germain
    (
        '20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000022',
        'Fabrizio Romano',
        1,
        'Paris Saint-Germain',
        130000000.00,
        'active',
        620,
        480,
        NOW() - INTERVAL '5 hours'
    ),
    -- Tier 2: The Athletic on Alexander Isak -> Arsenal
    (
        '20000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000028',
        'The Athletic UK',
        2,
        'Arsenal',
        100000000.00,
        'active',
        915,
        210,
        NOW() - INTERVAL '8 hours'
    ),
    -- Tier 2: Paul Joyce on Mohamed Salah -> Al-Ittihad
    (
        '20000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000027',
        'Paul Joyce (The Times)',
        2,
        'Al-Ittihad',
        95000000.00,
        'active',
        730,
        340,
        NOW() - INTERVAL '12 hours'
    ),
    -- Tier 3: The Telegraph on Kevin De Bruyne -> San Diego FC
    (
        '20000000-0000-0000-0000-000000000005',
        '10000000-0000-0000-0000-000000000020',
        'The Telegraph',
        3,
        'San Diego FC',
        40000000.00,
        'active',
        510,
        490,
        NOW() - INTERVAL '18 hours'
    ),
    -- Tier 3: The Guardian on Ollie Watkins -> Chelsea
    (
        '20000000-0000-0000-0000-000000000006',
        '10000000-0000-0000-0000-000000000029',
        'The Guardian Sport',
        3,
        'Chelsea',
        70000000.00,
        'active',
        390,
        610,
        NOW() - INTERVAL '1 day'
    ),
    -- Tier 4: Daily Mail on Bruno Fernandes -> Bayern Munich
    (
        '20000000-0000-0000-0000-000000000007',
        '10000000-0000-0000-0000-000000000023',
        'Daily Mail Secret Scout',
        4,
        'Bayern Munich',
        65000000.00,
        'active',
        210,
        790,
        NOW() - INTERVAL '1 day 6 hours'
    ),
    -- Tier 5: Don Balon / Twitter ITK on Erling Haaland -> Barcelona
    (
        '20000000-0000-0000-0000-000000000008',
        '10000000-0000-0000-0000-000000000026',
        'El Chiringuito / Rumor ITK',
        5,
        'Barcelona',
        200000000.00,
        'active',
        140,
        1120,
        NOW() - INTERVAL '2 days'
    )
ON CONFLICT (id) DO NOTHING;
