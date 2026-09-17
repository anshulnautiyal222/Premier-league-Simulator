# GafferDex SPEC v2 — "League Worlds" Addendum

**Status: this supersedes the original open-market trading model from SPEC.md
sections 2-4. Sections 5, 7-10 (tech stack, DB philosophy, anti-exploit
principles) still broadly apply but are extended below. Read this file
FIRST in any AI tool session; treat original SPEC.md as background only.**

---

## 1. Core Concept Change

The platform no longer runs one continuous global market. Instead:

- Users are grouped into **Leagues** of exactly 16 clubs ("a World").
- All 16 clubs in a League draft from the **same real-EPL player pool**.
- **Uniqueness constraint:** within a single League, a real player can be
  owned by at most ONE club. The same player CAN be owned by different
  clubs in different Leagues — Leagues are fully isolated universes.
- Draft/acquisition happens in a **time-boxed Draft Phase**, not endless
  open trading.
- After the Draft Phase deadline, any club below the minimum roster size
  gets auto-filled with randomly assigned low-rated players from the
  remaining pool.
- Once all 16 clubs are complete, the League "goes live" and tracks real
  EPL match performance for the rest of the real season/window.
- At the end of the tracked period, a multi-attribute leaderboard is
  finalized, rewards (in-game currency) are distributed, and the League
  is archived.
- Multiple Leagues run concurrently across the user base. Regular users
  only ever see their own League. Only admin/mod roles can see across
  all Leagues.

## 2. Draft Phase Mechanic (MVP: Sealed-Bid Blind Auction)

- Each club gets a fixed **Draft Budget** (e.g. 500 draft credits — separate
  currency from purse balance).
- During the Draft Window, users submit sealed bids on any player(s) they
  want, up to their remaining budget.
- At Draft Window close, resolve all bids simultaneously per player:
  highest bid wins that player; budget is deducted from the winner only.
  Ties broken randomly (or by earliest bid timestamp — pick one and be
  consistent).
- A club may win zero, one, or many players depending on bidding strategy.
- Repeat bidding rounds are allowed until either (a) all clubs hit the
  minimum roster size, or (b) the Draft Window's hard deadline passes.
- **Future upgrade path (v3):** replace with a live turn-based auction room
  (nomination + real-time counter-bidding) — same underlying schema
  (league_draft_bids), just add a real-time bidding UI and WebSocket layer.

## 3. Auto-Fill Rule

If the Draft Window closes and a club has fewer than the minimum roster
size (reuse the 11-player minimum from original SPEC section 10):
- Randomly assign remaining unowned players from the League's available
  pool (weighted toward lower base_value / lower-rated players) until
  that club reaches the minimum.
- This must respect the uniqueness constraint — never assign a player
  already owned in that League.

## 4. Scoring Engine

- Once a League is "live," a scheduled job pulls real EPL gameweek stats
  (goals, assists, clean sheets, ratings, etc. — same external API as
  original SPEC section 8's form_factor).
- For each gameweek, every club's total score = sum of point-scoring
  events for the real players it owns **in that League**, converted via
  a fixed scoring table (define point values per goal/assist/clean sheet/
  card/etc. — similar to standard fantasy football scoring rules).
- Store per-gameweek club scores (league_gameweek_scores) so the
  leaderboard can show trends, not just a final total.
- Scoring is per-League-instance: the same real player contributes
  independently to whichever different clubs own him in different Leagues.

## 5. Leaderboard (Multi-Attribute)

Attributes to support sorting/filtering on, minimum set:
- Total cumulative points
- Points in last 5 gameweeks (form)
- Highest single-gameweek score
- Best individual player performance (top scorer owned)
- Draft efficiency (points scored per draft credit spent)

## 6. Rewards & Currency

- Top 3 clubs in a League at season end receive an in-game currency
  payout (this currency is distinct from draft budget and virtual purse
  — call it "Champion Coin" or similar).
- The single best-performing individual club ("Champion") gets an
  additional bonus and a badge/trophy.
- Champion Coin is intended to gate future features (e.g. UCL League
  registration eligibility) — do not hardcode this tightly; make the
  eligibility check a simple threshold function so new competitions can
  plug in later.

## 7. Isolation & Visibility Rules

- A regular user's queries must always be scoped to `league_id` they
  belong to — enforce via RLS, not just application logic.
- An `is_admin` or `role` flag on the users table grants cross-League
  read access for a moderation/ops dashboard (not exposed to regular
  users).
- Users must never be able to enumerate or query other Leagues' rosters,
  bids, or scores through any endpoint.

## 8. Extensibility Notes (for future features — do not build yet, just don't block them)

- Multiple concurrent competition types (League Worlds now, UCL-style
  knockout later) should share a generic "Competition" concept rather
  than hardcoding "League" as the only structure.
- Currency systems (draft credits, virtual purse, Champion Coin) should
  be modeled as distinct ledgers per club, not one balance field, since
  more currencies are coming.
- Keep the real player pool and stats pipeline decoupled from League
  logic — Leagues consume the pool, they don't own it.
