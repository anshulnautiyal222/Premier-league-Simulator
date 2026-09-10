# 🗺️ GafferDex Implementation Roadmap

This roadmap breaks down the development of **GafferDex** into progressive, testable milestones from MVP core to full seasonal expansion.

---

## 🚀 Phase 1: MVP Core Foundation (The Trading Desk)

**Objective**: A fully functioning single-user experience where a user can create a club, browse Premier League players, and execute buys/sells against the central AMM with an initial £150M demo purse.

- [ ] **Workspace & Scaffolding**:
  - Next.js 15 (App Router) + TypeScript + Tailwind CSS + Lucide Icons.
  - Supabase client integration and local environment setup.
- [ ] **Data Seed & Catalog**:
  - Premier League roster seed dataset (top 200 players across all 20 clubs, realistic base valuations, positions, team badges).
- [ ] **Club Management UI**:
  - Club founding onboarding flow (Club Name, Badge Picker, Primary/Secondary Colors).
  - Purse tracker: Real-time balance display (£150M initial), portfolio squad value, and Net Worth summary.
- [ ] **AMM Trading Engine**:
  - Player marketplace directory with filters (Position, Club, Price Range, Search).
  - Player card view with valuation breakdown and quick buy/sell action.
  - Transaction ledger: 3% broker fee deduction, squad limit guardrails ($11 \le \text{Squad} \le 25$).
- [ ] **Portfolio View**:
  - Active roster view with purchase price vs. current market value, unrealized profit/loss (PnL) in £ and %.

---

## ⚡ Phase 2: Market Dynamics & The Rumor Terminal

**Objective**: Make player prices move dynamically based on external sports news, match performances, and community consensus.

- [ ] **The Live Transfer & Rumor Terminal**:
  - Ingestion feed for transfer rumors with Tier 1 to Tier 5 journalist ratings.
  - "Deal or Delusion" interactive swipe/vote card deck with real-time sentiment percentage.
  - Breaking news ticker tape banner on top of the UI.
- [ ] **Algorithmic Pricing Engine**:
  - Master formula implementation: Form factor, rumor multiplier, sentiment dampener, and contract modifier.
  - Automated cron or simulated event generator to trigger market shocks (e.g., "Tier 1: Arsenal bid £65M for Nico Williams").
- [ ] **Financial Charting**:
  - Stock-style interactive line/candlestick price graphs (using Recharts or Tremor) showing 7-day and 30-day valuation trends.
- [ ] **PSR / FFP Visualizer**:
  - Financial simulator showing 3-year amortized transfer costs against Premier League PSR thresholds.

---

## 🤝 Phase 3: Social, P2P Negotiations & Leaderboards

**Objective**: Turn the platform into a multiplayer community where managers interact, negotiate, and compete.

- [ ] **Peer-to-Peer (P2P) Trading Desk**:
  - Deal proposal modal: Offer Player(s) + Cash in exchange for rival club's Player(s).
  - Proposal inbox: Review incoming offers, Counter-offer, Accept, or Reject.
  - Anti-collusion validation guardrail (rejects deals deviating $>20\%$ from fair market value).
  - 24-hour expiration timer for open proposals.
- [ ] **Leaderboards & Manager Standings**:
  - Global and Private League Leaderboards:
    - Overall Club Net Worth (Purse + Squad Value).
    - Transfer ROI % (Top profit generators).
  - Private Leagues with custom invite codes.
- [ ] **Real-Time WebSockets**:
  - Supabase Realtime subscriptions streaming live price fluctuations, breaking news, and market trades across the user base.

---

## 🏆 Phase 4: Progression, Facilities & Seasonal Windows

**Objective**: Deepen game progression with passive yields, academy scouting, and seasonal tournaments.

- [ ] **Club Facility Tree**:
  - **Youth Academy**: Unlock random academy wonderkid tokens with variable growth potential.
  - **Scouting Network**: Gain early access to breaking rumor indicators 15 minutes ahead of the general public.
  - **Commercial Stadium**: Upgrade stadium capacity to generate weekly purse dividends based on squad star power.
- [ ] **Weekend Fixture Simulator**:
  - Set active Starting XI (11 players).
  - Auto-resolve matchday rewards based on real-world player ratings from weekend fixtures.
- [ ] **Window Showdown Tournament**:
  - Timed Summer and Winter transfer window tournaments.
  - Manager badges, trophies, and seasonal bragging rights.
- [ ] **Director Pro & Cosmetic Marketplace**:
  - Retro kit builder, customized crest generator, and advanced portfolio analytics.
