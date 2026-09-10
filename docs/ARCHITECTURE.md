# 🏗️ GafferDex System Architecture & Database Design

This document details the technical blueprints, component boundaries, relational database schemas, and data pipelines for **GafferDex**.

---

## 1. High-Level System Architecture

```
                                  ┌─────────────────────────────────────────┐
                                  │               Client Tier               │
                                  │   Next.js 15 (App Router) + Tailwind    │
                                  │   Framer Motion + Tremor / Recharts     │
                                  └────────────────────┬────────────────────┘
                                                       │ HTTPS / WSS
                                                       ▼
                                  ┌─────────────────────────────────────────┐
                                  │            API Gateway Tier             │
                                  │       Next.js API / FastAPI Backend     │
                                  │      JWT Auth + Rate Limiter Guard      │
                                  └───────┬─────────────────────────┬───────┘
                                          │                         │
                     ┌────────────────────┴────────┐       ┌────────┴────────────────────┐
                     ▼                             ▼       ▼                             ▼
       ┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
       │     Trading & AMM Engine  │ │   Rumor Terminal Engine   │ │     Club Progression    │
       │  - Atomic Buy/Sell Desk   │ │  - Credibility Tiering    │ │  - Stadium Purse Yield  │
       │  - P2P Negotiation Flow   │ │  - Deal/Delusion Gauge    │ │  - Scouting Early Feed  │
       │  - FFP/PSR Checks         │ │  - Sentiment Aggregation  │ │  - Academy Wonderkids   │
       └─────────────┬─────────────┘ └─────────────┬─────────────┘ └─────────────┬─────────────┘
                     │                             │                             │
                     ▼                             ▼                             ▼
       ┌─────────────────────────────────────────────────────────────────────────────────────────┐
       │                                     Data Layer                                          │
       │                                                                                         │
       │   ┌───────────────────────────────┐              ┌──────────────────────────────────┐   │
       │   │    Supabase (PostgreSQL)      │              │       Redis Cache & Queue        │   │
       │   │ - Transactional Ledger        │◄────────────►│ - Live Order Book Cache          │   │
       │   │ - RLS Security Policies       │   Pub/Sub    │ - Sub-second Price Tickers       │   │
       │   │ - Realtime DB Subscriptions   │              │ - Rate-limiting & Token Buckets  │   │
       │   └───────────────────────────────┘              └──────────────────────────────────┘   │
       └─────────────────────────────────────────────────────────────────────────────────────────┘
                                                    ▲
                                                    │ Ingestion Cron
                                  ┌─────────────────┴───────────────────────┐
                                  │     External Ingestion Services         │
                                  │ - Premier League Stats API (API-Football)│
                                  │ - Journalist Transfer Feed Parser       │
                                  └─────────────────────────────────────────┘
```

> [!NOTE]
> The "Trading & AMM Engine" shown in the diagram above has been deprecated. The platform now uses
> P2P trades within private League Worlds instead of a global AMM buy/sell desk.

---

## 2. Database Schema (PostgreSQL / Supabase DDL)

### 2.1 Users & Authentication
```sql
-- Managed by Supabase Auth (auth.users), mirrored into public profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'director_pro')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Clubs & Facilities
```sql
CREATE TABLE public.clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    club_name VARCHAR(64) NOT NULL,
    club_badge_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#00FF87',
    secondary_color VARCHAR(7) DEFAULT '#0A0E17',
    home_ground_name VARCHAR(100) DEFAULT 'New Gaffer Arena',
    virtual_purse_balance NUMERIC(14, 2) NOT NULL DEFAULT 150000000.00, -- £150M starting purse
    total_squad_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    academy_level INT DEFAULT 1 CHECK (academy_level BETWEEN 1 AND 5),
    scouting_level INT DEFAULT 1 CHECK (scouting_level BETWEEN 1 AND 5),
    stadium_level INT DEFAULT 1 CHECK (stadium_level BETWEEN 1 AND 5),
    last_dividend_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Premier League Player Registry
```sql
CREATE TYPE player_position AS ENUM ('GK', 'DEF', 'MID', 'FWD');

CREATE TABLE public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_api_id VARCHAR(64) UNIQUE,
    name VARCHAR(128) NOT NULL,
    real_team VARCHAR(64) NOT NULL, -- e.g., 'Arsenal', 'Manchester City'
    position player_position NOT NULL,
    photo_url TEXT,
    base_value NUMERIC(12, 2) NOT NULL, -- Anchor value
    current_market_value NUMERIC(12, 2) NOT NULL,
    form_factor NUMERIC(5, 4) DEFAULT 0.0000, -- Form coefficient (-0.30 to +0.30)
    rumor_multiplier NUMERIC(5, 4) DEFAULT 0.0000,
    demand_factor NUMERIC(5, 4) DEFAULT 0.0000,
    real_performance_score NUMERIC(4, 2) DEFAULT 6.50, -- Real-world match rating
    contract_months_remaining INT DEFAULT 36,
    is_injured BOOLEAN DEFAULT FALSE,
    injury_desc TEXT,
    circulating_supply INT DEFAULT 0, -- Total copies held across all user clubs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_team_pos ON public.players(real_team, position);
CREATE INDEX idx_players_market_value ON public.players(current_market_value DESC);
```

### 2.4 Club Rosters (Portfolio Holdings)
```sql
CREATE TABLE public.club_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
    acquisition_price NUMERIC(12, 2) NOT NULL,
    acquired_at TIMESTAMPTZ DEFAULT NOW(),
    is_starting_xi BOOLEAN DEFAULT FALSE,
    lineup_slot VARCHAR(10) NULL, -- 'GK', 'CB1', 'CB2', 'LB', 'RB', etc.
    CONSTRAINT unique_club_player UNIQUE (club_id, player_id)
);

CREATE INDEX idx_roster_club ON public.club_rosters(club_id);
```

### 2.5 Rumor Terminal & Credibility Ledger
```sql
CREATE TABLE public.rumors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL, -- e.g. "David Ornstein", "Fabrizio Romano"
    source_tier INT NOT NULL CHECK (source_tier BETWEEN 1 AND 5),
    buying_club VARCHAR(64) NOT NULL,
    selling_club VARCHAR(64) NOT NULL,
    fee_estimate NUMERIC(12, 2),
    headline TEXT NOT NULL,
    article_url TEXT,
    votes_deal INT DEFAULT 0,
    votes_delusion INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'debunked', 'expired')),
    published_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rumors_player ON public.rumors(player_id);
CREATE INDEX idx_rumors_tier ON public.rumors(source_tier, published_at DESC);
```

### 2.6 Append-Only Market Transactions Audit Trail
```sql
CREATE TYPE tx_type AS ENUM ('AMM_BUY', 'AMM_SELL', 'P2P_TRADE', 'ACADEMY_MINT', 'DIVIDEND_PAYOUT');

CREATE TABLE public.market_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_club_id UUID REFERENCES public.clubs(id),
    seller_club_id UUID REFERENCES public.clubs(id),
    player_id UUID NOT NULL REFERENCES public.players(id),
    fee NUMERIC(12, 2) NOT NULL,
    broker_fee NUMERIC(12, 2) DEFAULT 0.00,
    transaction_type tx_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tx_player ON public.market_transactions(player_id, created_at DESC);
CREATE INDEX idx_tx_buyer ON public.market_transactions(buyer_club_id);
CREATE INDEX idx_tx_seller ON public.market_transactions(seller_club_id);
```

### 2.7 Peer-to-Peer (P2P) Trade Desks
```sql
CREATE TYPE p2p_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

CREATE TABLE public.p2p_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposer_club_id UUID NOT NULL REFERENCES public.clubs(id),
    recipient_club_id UUID NOT NULL REFERENCES public.clubs(id),
    offered_player_ids UUID[] NOT NULL,
    requested_player_ids UUID[] NOT NULL,
    cash_adjustment NUMERIC(12, 2) DEFAULT 0.00, -- Positive: proposer pays recipient; Negative: recipient pays proposer
    status p2p_status DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ NOT NULL, -- 24 hours from creation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_p2p_parties ON public.p2p_proposals(proposer_club_id, recipient_club_id, status);
```

---

## 3. Core API Endpoints

### 3.1 Clubs & Roster
- `GET /api/v1/club/me`: Retrieve authenticated user's club profile, liquid funds, squad valuation, facility tiers, and active PnL.
- `POST /api/v1/club/initialize`: Create club profile with starting purse (£150M) and custom visual theme.
- `POST /api/v1/club/lineup`: Set 11-player starting roster for upcoming weekend matchdays.
- `POST /api/v1/club/facilities/upgrade`: Upgrade Stadium, Academy, or Scouting tier.

### 3.2 ~~Automated Market Maker (AMM) Execution~~ — DEPRECATED

> [!WARNING]
> The AMM buy/sell endpoints have been removed. Player acquisition now occurs through
> P2P trades (Section 3.4) and Academy minting within private League Worlds.

### 3.3 Rumor Terminal & Community Consensus
- `GET /api/v1/rumors/feed`: Real-time streaming rumor list categorized by credibility tier.
- `POST /api/v1/rumors/:id/vote`: Submit community swipe vote ("Deal" or "Delusion").
- `GET /api/v1/rumors/psr-simulator`: Simulate amortization and wage bill compliance for hypothetical transfers.

### 3.4 P2P Negotiation Desk
- `POST /api/v1/p2p/propose`: Propose a swap/cash deal to another club owner.
- `POST /api/v1/p2p/:id/accept`: Atomically execute asset exchange with anti-collusion validation.
- `POST /api/v1/p2p/:id/reject`: Reject proposed deal.
- `POST /api/v1/p2p/:id/cancel`: Cancel an outgoing proposal.
