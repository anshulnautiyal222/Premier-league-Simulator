"""
Algorithmic Pricing Engine for GafferDex (Section 8 of SPEC.md).

Master Formula:
    current_price = base_value * (1 + form_factor) * (1 + rumor_multiplier) * (1 + platform_demand_factor)

Safety Bounds:
    - Floor: 0.40 * base_value (cannot drop below 40% in a single gameweek)
    - Ceiling: 2.50 * base_value (cannot exceed 250% in a single gameweek)
"""

import math
from dataclasses import dataclass
from typing import Optional


SAFETY_FLOOR_FACTOR = 0.40
SAFETY_CEILING_FACTOR = 2.50


@dataclass
class MatchStats:
    """Real match statistics used to compute the weekly form factor."""
    minutes_played: int = 90
    goals: int = 0
    assists: int = 0
    clean_sheets: int = 0
    match_rating: float = 6.50  # Official rating (typically 0.0 to 10.0, 6.5 benchmark)
    position: str = "MID"       # 'GK', 'DEF', 'MID', 'FWD'


@dataclass
class PriceBreakdown:
    """Complete mathematical valuation output breakdown."""
    base_value: float
    form_factor: float
    rumor_multiplier: float
    platform_demand_factor: float
    raw_price: float
    bounded_price: float
    was_capped_by_floor: bool
    was_capped_by_ceiling: bool


def calculate_form_factor(stats: MatchStats) -> float:
    """
    Computes weekly-updated form factor (-0.25 to +0.30) from real match performance.

    Factors:
    1. Match rating delta vs benchmark (6.5 / 10): scaled by playing time.
    2. Event contributions:
       - Goals: +0.04 each (boosted for DEF/MID)
       - Assists: +0.02 each
       - Clean sheets: +0.03 each (for GK/DEF)
    3. Minutes penalty: Benchings (0 mins) decay form by -0.05.
    """
    if stats.minutes_played <= 0:
        return -0.05

    # 1. Rating contribution: difference from baseline 6.5
    # Normalized between -0.15 and +0.15
    rating_delta = stats.match_rating - 6.50
    rating_factor = (rating_delta / 3.5) * 0.15

    # 2. Position-adjusted event rewards
    pos = stats.position.upper()
    if pos in ("GK", "DEF"):
        goal_weight = 0.06
        assist_weight = 0.03
        clean_sheet_weight = 0.04
    elif pos == "MID":
        goal_weight = 0.05
        assist_weight = 0.03
        clean_sheet_weight = 0.01
    else:  # FWD
        goal_weight = 0.04
        assist_weight = 0.02
        clean_sheet_weight = 0.00

    events_score = (
        stats.goals * goal_weight +
        stats.assists * assist_weight +
        stats.clean_sheets * clean_sheet_weight
    )

    # 3. Playing time multiplier (scaled by minutes played / 90)
    time_multiplier = min(1.0, stats.minutes_played / 90.0)

    total_form = (rating_factor + events_score) * time_multiplier

    # Safety clamps for form factor: bounded between -0.25 and +0.30
    return max(-0.25, min(0.30, round(total_form, 4)))


def calculate_rumor_multiplier(
    tier: int,
    upvotes: int = 0,
    downvotes: int = 0,
    is_positive_rumor: bool = True
) -> float:
    """
    Computes rumor multiplier scaled by journalist source tier and dampened
    by community sentiment (net upvote/downvote ratio).

    Journalist Tiers:
    - Tier 1 (e.g. Ornstein, Romano): base impact up to +25% (+0.25)
    - Tier 2–3 (Regional / Broadsheets): base impact up to +10% (+0.10)
    - Tier 4–5 (Tabloids / Aggregates): base impact up to +2% (+0.02)

    Community Sentiment Dampening ("Deal or Delusion" gauge):
    - Net ratio: upvotes / (upvotes + downvotes)
    - Dampener multiplier: 0.5 + (0.5 * sentiment_ratio)
      * If 100% upvoted ("Deal"): dampener = 1.0 (full impact)
      * If 0% upvoted / 100% downvoted ("Delusion"): dampener = 0.5 (halves impact)
      * If no community votes yet: default dampener = 0.85
    """
    # 1. Base Tier Shock
    if tier == 1:
        base_shock = 0.25
    elif tier in (2, 3):
        base_shock = 0.10
    elif tier in (4, 5):
        base_shock = 0.02
    else:
        base_shock = 0.01

    # 2. Directional sign
    sign = 1.0 if is_positive_rumor else -0.8

    # 3. Community Sentiment Dampening
    total_votes = max(0, upvotes) + max(0, downvotes)
    if total_votes == 0:
        sentiment_dampener = 0.85
    else:
        sentiment_ratio = max(0, upvotes) / total_votes
        sentiment_dampener = 0.50 + (0.50 * sentiment_ratio)

    raw_multiplier = sign * base_shock * sentiment_dampener
    return round(raw_multiplier, 4)


def calculate_platform_demand_factor(
    net_volume_48h: int,
    k: float = 0.035
) -> float:
    """
    Computes in-game demand factor as a logarithmic function of net buy/sell
    volume over trailing 48 hours:
        net_volume_48h = buy_volume_48h - sell_volume_48h

    Formula:
        sign(net_volume) * min(0.25, k * ln(1 + |net_volume|))

    Dampener ensures organic price rises with trading interest without
    permitting predatory pump-and-dump manipulation.
    Bounds: -0.15 to +0.25
    """
    if net_volume_48h == 0:
        return 0.0

    magnitude = abs(net_volume_48h)
    log_factor = k * math.log(1.0 + magnitude)

    if net_volume_48h > 0:
        # Buying pressure capped at +25%
        return round(min(0.25, log_factor), 4)
    else:
        # Selling pressure capped at -15%
        return round(max(-0.15, -log_factor), 4)


def calculate_current_price(
    base_value: float,
    form_factor: float = 0.0,
    rumor_multiplier: float = 0.0,
    platform_demand_factor: float = 0.0
) -> PriceBreakdown:
    """
    Calculates the spot valuation of a player card:
        current_price = base_value * (1 + form_factor) * (1 + rumor_multiplier) * (1 + platform_demand_factor)

    Enforces strict safety bounds:
        - Floor: 40% of base_value (0.40 * base_value)
        - Ceiling: 250% of base_value (2.50 * base_value)

    Returns:
        PriceBreakdown with bounded price, raw calculation, and boundary status flags.
    """
    if base_value <= 0:
        raise ValueError("base_value must be greater than zero.")

    raw_price = base_value * (1.0 + form_factor) * (1.0 + rumor_multiplier) * (1.0 + platform_demand_factor)

    floor_limit = base_value * SAFETY_FLOOR_FACTOR
    ceiling_limit = base_value * SAFETY_CEILING_FACTOR

    was_capped_by_floor = raw_price < floor_limit
    was_capped_by_ceiling = raw_price > ceiling_limit

    bounded_price = max(floor_limit, min(raw_price, ceiling_limit))

    return PriceBreakdown(
        base_value=round(base_value, 2),
        form_factor=form_factor,
        rumor_multiplier=rumor_multiplier,
        platform_demand_factor=platform_demand_factor,
        raw_price=round(raw_price, 2),
        bounded_price=round(bounded_price, 2),
        was_capped_by_floor=was_capped_by_floor,
        was_capped_by_ceiling=was_capped_by_ceiling,
    )
