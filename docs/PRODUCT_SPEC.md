# 📋 GafferDex Product Specification
## The Fantasy Transfer & Club Exchange

---

## 1. Executive Summary & Core Concept

**GafferDex** is a gamified web platform combining real-time Premier League transfer market tracking with an interactive "Sporting Director" simulator.

Instead of passive news reading or traditional fantasy football (which focuses only on weekly player points), GafferDex puts users in the shoes of a football club owner and director. Users launch their own virtual club with an initial demo purse (e.g., £150M virtual funds), trade real Premier League players whose values fluctuate dynamically based on real-world rumors, completed deals, and match performances, and compete to build the most valuable football empire.

---

## 2–4. Core Game Loop, Feature Modules & Monetization

> [!IMPORTANT]
> **Sections 2–4 of this document have been superseded.**
> The original open-market AMM trading model described here has been fully removed.
> The current game model — **League Worlds** — uses private draft-based leagues,
> matchday scoring, and P2P transfer windows between clubs within a league.
>
> Key changes:
> - **No global AMM buy/sell**: Central automated market maker liquidity pool and 3% broker fee liquidation are removed.
> - **No unlimited player ownership**: Player cards exist uniquely within their respective League Worlds rather than having duplicate copies owned across the entire platform.
> - **P2P Transfers & Drafts**: Player acquisitions occur through league drafts and peer-to-peer club trades (cash adjustments, player swaps, loan deals).
>
> Features that carry forward:
> - Club founding & visual identity flow
> - Premier League player catalog (`players` table)
> - Algorithmic valuation engine (real-world match form, transfer rumors, community consensus)
> - Transfer Rumor Terminal & consensus voting
> - P2P negotiation desk & anti-collusion guardrails
> - Private leagues & membership system
> - Club facility progression (Youth Academy, Scouting Radar, Stadium)

---

## 5. Technical Architecture & Data Design

### Tech Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, Framer Motion (card flips & swipe decks), Tremor / Recharts (stock-style player graphs).
- **Backend**: FastAPI (Python) or Node.js (TypeScript) for market calculation engines.
- **Database & Auth**: Supabase (PostgreSQL) with Row-Level Security (RLS) and built-in Realtime subscriptions for live order books and alerts.
- **Caching & Queue**: Redis for low-latency player valuations, order matching, and in-memory rate limiting.

### Core Database Entities
- `users`: User identity and credentials (`id`, `username`, `email`, `created_at`).
- `clubs`: Club profile, balances, and facility tiers (`id`, `user_id`, `club_name`, `virtual_purse_balance`, `total_squad_value`, `facility_levels`).
- `players`: Premier League catalog (`id`, `name`, `real_team`, `position`, `base_value`, `current_market_value`, `real_performance_score`).
- `club_roster`: Portfolio holdings (`id`, `club_id`, `player_id`, `acquisition_price`, `acquired_at`, `is_starting_xi`).
- `market_transactions`: Append-only economic ledger (`id`, `buyer_club_id`, `seller_club_id`, `player_id`, `fee`, `transaction_type`, `timestamp`).
- `rumor_feed`: Ingested transfer news (`id`, `player_id`, `source_name`, `tier_rating`, `buying_club`, `fee_estimate`, `status`).

---

## 6. MVP Build Milestones (Phased Roadmap)

- **Phase 1 (MVP Core)**: User registration, initial £150M demo purse allocation, static catalog of Premier League players, basic buy/sell interface with an automated central desk.
- **Phase 2 (Market Dynamics)**: Integration of real-world football API for player stat updates and dynamic price adjustments; basic rumor feed with community voting.
- **Phase 3 (Social & P2P)**: Peer-to-peer swap proposals, friend leaderboards, and private league creation.
- **Phase 4 (Expansion)**: Club facility upgrade tree, cosmetic marketplace, and Window Showdown tournaments.

---

## 7. Database Architecture & Data Relationships

The data layer must handle high-frequency reads for real-time tickers while ensuring strict transactional consistency for financial balances and player ownership. It is organized into six core domains:

1. **Club Profiles & Balances**: Stores virtual club identity (name, colors, badge) and tracks two primary financial metrics: liquid demo purse balance and overall squad market valuation. Tracks progression tiers of Stadium, Academy, and Scouting Department.
2. **Player Catalog & Attributes**: Maintains the official registry of Premier League players. Tracks biographical details, position, real-world club, current market valuation, base launch value, weekly form scores, injury statuses, and remaining contract lengths.
3. **Club Rosters (Portfolio Holdings)**: Relational bridge between clubs and players functioning as an investment portfolio ledger. Records ownership, acquisition price, deal timestamp, and starting XI status.
4. **The Rumor Terminal Ledger**: Captures incoming transfer reports from external sports journalists and outlets with player involved, buying/selling clubs, estimated fees, credibility tier (1 to 5), and community upvote/downvote tallies.
5. **Market Transactions Audit Trail**: Append-only ledger recording every economic event on the platform: buyer, seller (or central AMM pool), player traded, final fee, transaction category, and timestamp.
6. **Peer-to-Peer (P2P) Trade Desks**: Manages direct negotiations between users: proposing club, recipient club, arrays of offered/requested player assets, balancing cash adjustments, 24-hour expiration countdown, and negotiation statuses (`Pending`, `Accepted`, `Rejected`, `Expired`, `Cancelled`).

---

## 8. Algorithmic Pricing & Dynamic Valuation Engine

$$\text{Current Price} = \text{Base Value} \times (1 + \text{Form Factor}) \times (1 + \text{Rumor Multiplier}) \times (1 + \text{Platform Demand Factor})$$

- **Real-World Form Multiplier**: Weekly baseline adjustment derived from official match ratings, goals, assists, clean sheets, and playing time.
- **Rumor Impact & Journalist Credibility Weighting**: Price shifts triggered by transfer news are proportional to the source's credibility tier (Tier 1 = high shift, Tier 5 = negligible shift).
- **Crowdsourced Sentiment Calibration**: Community sentiment dampens or amplifies rumor volatility ("Deal or Delusion" voting).
- **Real-World Contract and Health Modifiers**: Value decay for players in the final 6–12 months of contract; discount or freeze on long-term injuries.
- **Platform Supply & Demand (Logarithmic Liquidity)**: Automated market-maker formula shifting price dynamically based on net purchases across all portfolios, using a logarithmic dampener to prevent artificial pump-and-dump bubbles.
- **Safety Bounds and Volatility Caps**: Hard floors (min $40\%$ of base value) and ceilings (max $250\%$ of base value within a single gameweek).

---

## 9. API & System Interface Architecture

- **Club Onboarding & Management Services**: Account initialization, purse grants, club profile customization, squad inventory retrieval with unrealized profit/loss (PnL) metrics.
- **Market Liquidity & Execution Services**:
  - Paginated, filterable player directories sorted by position, value, and 24h percentage shifts.
  - Atomic buy-and-sell operations with the automated market-maker (AMM).
  - Platform broker fee (e.g., 3%) deducted upon selling back to liquidity pool (currency sink).
- **P2P Deal Negotiation Services**: Multi-asset transfer workflow with atomic asset & cash swaps upon acceptance.
- **Real-Time WebSocket Feeds**: Persistent browser connections streaming breaking transfer alerts, live price updates, community sentiment changes, and transaction ticker tape.

---

## 10. Anti-Exploit, Economic Balance & Risk Controls

- **Anti-Collusion & Wash-Trading Prevention**: Blocks P2P trades where cash additions deviate significantly from combined fair market value, preventing multi-account purse funneling.
- **Dynamic Transaction Frequency Caps**: Daily transaction quota (e.g., 5 trades per day during normal weeks), expanding during real-world transfer deadline days.
- **System Currency Sinks**: 3% AMM broker fees + modest weekly squad maintenance/wage allocations offset by Stadium facility upgrades.
- **Roster Size Constraints**: Mandatory 11 to 25 active players at all times, preventing total liquidation or market cornering.
