# 📋 GafferDex Product Specification
## The Fantasy Transfer & Club Exchange

---

## 1. Executive Summary & Core Concept

**GafferDex** is a gamified web platform combining real-time Premier League transfer market tracking with an interactive "Sporting Director" simulator.

Instead of passive news reading or traditional fantasy football (which focuses only on weekly player points), GafferDex puts users in the shoes of a football club owner and director. Users launch their own virtual club with an initial demo purse (e.g., £150M virtual funds), trade real Premier League players whose values fluctuate dynamically based on real-world rumors, completed deals, and match performances, and compete to build the most valuable football empire.

---

## 2. Core Game Loop

```
  ┌────────────────────────────────────────────────────────┐
  │                 1. Club Founding                       │
  │  Register -> Name Club -> Design Crest -> £150M Purse  │
  └──────────────────────────┬─────────────────────────────┘
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │               2. Squad Acquisition                     │
  │  Open Market Trading -> FFP / PSR Limits (11-25 squad) │
  └──────────────────────────┬─────────────────────────────┘
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │           3. Dynamic Valuation Shocks                  │
  │  Real Match Form + Tier-1 Transfer Rumors + AMM Demand │
  └──────────────────────────┬─────────────────────────────┘
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │               4. Active Dealmaking                     │
  │  P2P Swaps + AMM Liquidations + 24-hr Deal Window      │
  └──────────────────────────┬─────────────────────────────┘
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │            5. Growth & Infrastructure                  │
  │  Reinvest Profits -> Academy, Scouting & Stadium       │
  └──────────────────────────┬─────────────────────────────┘
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │             6. Leaderboards & Seasons                  │
  │  Net Worth Leaderboard + Window Showdowns + Fixtures   │
  └────────────────────────────────────────────────────────┘
```

1. **Club Founding**: User registers, chooses a club identity (name, badge, home ground, club colors), and receives a starting demo purse (e.g., £150M virtual funds).
2. **Squad Acquisition**: User signs an initial roster from the open market, balancing stars, high-upside wonderkids, and value veterans under strict Financial Fair Play (FFP/PSR) limits.
3. **Dynamic Valuation & Market Shocks**: Player prices rise or fall in real time based on:
   - **Real-world performance**: Goals, assists, clean sheets, and match ratings.
   - **Real-world transfer dynamics**: Verified Tier-1 rumors (+15%), completed record transfers (+25%), contract expirations (-20%), or injury setbacks.
   - **In-game user supply & demand**: Active buying and selling within the platform.
4. **Active Dealmaking**: Users can buy, sell, loan, or offer player-plus-cash swaps to other users or back to the automated central market maker.
5. **Growth & Progression**: Profits from timely trades can be reinvested into expanding the squad, upgrading club infrastructure (e.g., Academy, Scouting Network, Stadium capacity) to generate passive weekly purse yield.
6. **Leaderboards & Seasons**: Users compete on seasonal leaderboards based on Club Net Worth, Trading Return on Investment (ROI), and Head-to-Head Squad Battles.

---

## 3. Key Feature Modules

### Module A: The Live Transfer & Rumor Terminal
- **Real-Time Rumor Ticker**: Ingests and categorizes breaking rumors using an automated credibility scale:
  - **Tier 1**: David Ornstein, Fabrizio Romano, BBC Sport, The Athletic (High market impact: $\pm 15\%$).
  - **Tier 2–3**: Regional correspondents, established dailies (Moderate impact: $\pm 5-8\%$).
  - **Tier 4–5**: Tabloids, unverified aggregate feeds (Volatile / High risk of false flag: minimal baseline impact).
- **Consensus Gauge ("Deal or Delusion")**: Community voting mechanic where users swipe right/left on rumors, displaying community sentiment percentages alongside journalist credibility.
- **PSR / FFP Visualizer**: Educational financial module showing how real Premier League clubs manage amortization and wage bills, letting fans simulate whether a prospective real-life transfer violates league rules.

### Module B: The Demo Club & Transfer Simulator
- **Dynamic Automated Market Maker (AMM)**: Ensures instant liquidity so users can always buy or liquidate players without waiting for an exact peer match, adjusting spreads based on market volatility.
- **Peer-to-Peer (P2P) Trading Desk**:
  - Direct trade proposals between friends: Cash, Player Swaps, or Player + Cash.
  - Counter-offers and 24-hour expiration windows.
- **Club Facility Progression (Passive Boosters)**:
  - **Youth Academy Level**: Yields discounted randomized rookie tokens with variable market trajectories.
  - **Scouting Department**: Unlocks early rumor alerts and predictive market indicators 15 minutes before the public feed.
  - **Commercial Stadium**: Generates weekly demo currency based on squad market appeal.

### Module C: Gamified Competition Modes
- **Window Showdown (Seasonal Mode)**: Timed tournaments running alongside the Summer and Winter transfer windows. The manager with the highest percentage portfolio return when the deadline passes wins exclusive trophies and seasonal badges.
- **Simulated Weekend Fixtures**: Auto-resolving match days where users set their 11-player lineup; real-world player ratings determine match outcome rewards (bonus purse money).
- **Private Leagues**: User-hosted custom leagues with adjustable budgets, custom salary caps, and friends-only draft desks.

---

## 4. Monetization Strategy

To preserve competitive fairness while generating sustainable revenue:

1. **"Director Pro" Subscription (Freemium Model)**:
   - Advanced financial charts, historical player price graphs, and volatility indicators.
   - Unlimited private leagues and priority push notifications for breaking Tier-1 news.
   - **Strict Rule**: No pay-to-win purse injections; competitive integrity is strictly maintained.
2. **Cosmetic Marketplace**:
   - Custom club crest builders, retro kit templates, 3D stadium card designs, and animated club showcase banners.
3. **Sponsored Private Leagues & Brand Integrations**:
   - Partnered tournaments hosted by sports apparel, gaming, or media brands with real-world physical prizes (signed kits, match tickets).
4. **Seasonal "Window Pass"**:
   - Free and premium progression tracks earning aesthetic club customizations, historical player badges, and profile flairs during active transfer windows.

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
