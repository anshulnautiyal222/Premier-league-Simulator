"""
Unit tests for the GafferDex Algorithmic Pricing Engine (Section 8 of SPEC.md).

Covers:
- Strict safety bounds (40% floor and 250% ceiling)
- Tier-1 transfer rumor spikes and community sentiment dampening
- Logarithmic demand-driven price climbs
- Form factor weekly match stat calculations
- End-to-end master pricing formula
"""

import pytest
import math
from app.engine.pricing import (
    calculate_form_factor,
    calculate_rumor_multiplier,
    calculate_platform_demand_factor,
    calculate_current_price,
    MatchStats,
    SAFETY_FLOOR_FACTOR,
    SAFETY_CEILING_FACTOR,
)


class TestSafetyBounds:
    """Tests ensuring player valuation cannot drop below 40% or exceed 250% of base value."""

    def test_safety_floor_enforcement(self):
        """Catastrophic market dump: price must clamp at exactly 40% of base value."""
        base_value = 100_000_000.0  # £100M
        # Form: -0.25, Rumor: -0.50, Demand: -0.50 -> raw would be ~18.75M (< 40M)
        result = calculate_current_price(
            base_value=base_value,
            form_factor=-0.25,
            rumor_multiplier=-0.50,
            platform_demand_factor=-0.50
        )

        assert result.was_capped_by_floor is True
        assert result.was_capped_by_ceiling is False
        assert result.raw_price < 40_000_000.0
        assert result.bounded_price == pytest.approx(40_000_000.0, rel=1e-2)
        assert result.bounded_price == pytest.approx(base_value * SAFETY_FLOOR_FACTOR, rel=1e-2)

    def test_safety_ceiling_enforcement(self):
        """Hyper-speculative bubble: price must clamp at exactly 250% of base value."""
        base_value = 50_000_000.0  # £50M
        # Form: +0.50, Rumor: +0.50, Demand: +0.30 -> raw: 50M * 1.50 * 1.50 * 1.30 = 146.25M (> 125M max)
        result = calculate_current_price(
            base_value=base_value,
            form_factor=0.50,
            rumor_multiplier=0.50,
            platform_demand_factor=0.30
        )

        assert result.was_capped_by_ceiling is True
        assert result.was_capped_by_floor is False
        assert result.raw_price > 125_000_000.0
        assert result.bounded_price == pytest.approx(125_000_000.0, rel=1e-2)
        assert result.bounded_price == pytest.approx(base_value * SAFETY_CEILING_FACTOR, rel=1e-2)

    def test_within_bounds_unaffected(self):
        """Standard fluctuations within 40%-250% should remain unchanged."""
        base_value = 80_000_000.0  # £80M
        # Form: +0.10, Rumor: +0.05, Demand: +0.02
        # raw = 80M * 1.10 * 1.05 * 1.02 = 94,248,000
        result = calculate_current_price(
            base_value=base_value,
            form_factor=0.10,
            rumor_multiplier=0.05,
            platform_demand_factor=0.02
        )

        assert result.was_capped_by_floor is False
        assert result.was_capped_by_ceiling is False
        assert result.bounded_price == result.raw_price
        assert result.bounded_price == pytest.approx(94_248_000.0, rel=1e-2)

    def test_invalid_base_value_raises_error(self):
        """Base value <= 0 must raise ValueError."""
        with pytest.raises(ValueError):
            calculate_current_price(base_value=0.0)
        with pytest.raises(ValueError):
            calculate_current_price(base_value=-10.0)


class TestTier1RumorSpike:
    """Tests covering Tier 1 journalist transfer reports and sentiment dampening."""

    def test_tier1_maximum_impact(self):
        """Tier 1 rumor with 100% community upvotes ('Deal') reaches full +25% impact."""
        multiplier = calculate_rumor_multiplier(
            tier=1,
            upvotes=500,
            downvotes=0,
            is_positive_rumor=True
        )
        # Full shock: +0.25
        assert multiplier == pytest.approx(0.25, rel=1e-2)

    def test_tier1_sentiment_dampening(self):
        """Tier 1 rumor heavily rejected by community ('Delusion') is dampened by half."""
        # 100% downvotes: sentiment_ratio = 0 -> dampener = 0.50 -> multiplier = 0.25 * 0.50 = 0.125
        dampened = calculate_rumor_multiplier(
            tier=1,
            upvotes=0,
            downvotes=1000,
            is_positive_rumor=True
        )
        assert dampened == pytest.approx(0.125, rel=1e-2)
        assert dampened < 0.25

    def test_tier_comparison_scaling(self):
        """Verify tier impact hierarchy: Tier 1 > Tier 2-3 > Tier 4-5."""
        t1 = calculate_rumor_multiplier(tier=1, upvotes=100, downvotes=0)
        t2 = calculate_rumor_multiplier(tier=2, upvotes=100, downvotes=0)
        t3 = calculate_rumor_multiplier(tier=3, upvotes=100, downvotes=0)
        t4 = calculate_rumor_multiplier(tier=4, upvotes=100, downvotes=0)
        t5 = calculate_rumor_multiplier(tier=5, upvotes=100, downvotes=0)

        assert t1 == pytest.approx(0.25, rel=1e-2)  # Up to +25%
        assert t2 == pytest.approx(0.10, rel=1e-2)  # Up to +10%
        assert t3 == pytest.approx(0.10, rel=1e-2)  # Up to +10%
        assert t4 == pytest.approx(0.02, rel=1e-2)  # Up to +2%
        assert t5 == pytest.approx(0.02, rel=1e-2)  # Up to +2%
        assert t1 > t2 >= t4


class TestDemandDrivenPriceClimb:
    """Tests covering logarithmic demand factor and volume curves."""

    def test_zero_volume_is_neutral(self):
        """Zero net volume produces exactly 0.0 demand factor."""
        demand = calculate_platform_demand_factor(net_volume_48h=0)
        assert demand == 0.0

    def test_logarithmic_price_climb(self):
        """Demand factor grows logarithmically with net buy volume."""
        d10 = calculate_platform_demand_factor(net_volume_48h=10)
        d50 = calculate_platform_demand_factor(net_volume_48h=50)
        d200 = calculate_platform_demand_factor(net_volume_48h=200)
        d1000 = calculate_platform_demand_factor(net_volume_48h=1000)

        # Monotonically increasing
        assert 0.0 < d10 < d50 < d200 < d1000
        # Diminishing returns: slope flattens due to logarithm
        growth_1 = d50 - d10
        growth_2 = d1000 - d200
        assert growth_1 > 0
        assert growth_2 > 0

    def test_demand_ceiling_cap(self):
        """Massive buy volume is bounded at +25% (+0.25)."""
        huge_demand = calculate_platform_demand_factor(net_volume_48h=1_000_000)
        assert huge_demand == 0.25

    def test_negative_demand_liquidation(self):
        """Heavy sell volume produces negative demand factor, bounded at -15% (-0.15)."""
        sell_demand = calculate_platform_demand_factor(net_volume_48h=-50)
        huge_sell = calculate_platform_demand_factor(net_volume_48h=-1_000_000)

        assert sell_demand < 0.0
        assert huge_sell == -0.15


class TestFormFactor:
    """Tests covering real match performance weekly updates."""

    def test_benched_player_decay(self):
        """0 minutes played incurs a -0.05 decay."""
        stats = MatchStats(minutes_played=0, match_rating=6.5)
        form = calculate_form_factor(stats)
        assert form == -0.05

    def test_star_performance_boost(self):
        """A forward scoring 2 goals with an 8.5 rating earns a positive form factor."""
        stats = MatchStats(
            minutes_played=90,
            goals=2,
            assists=1,
            match_rating=8.5,
            position="FWD"
        )
        form = calculate_form_factor(stats)
        # Rating delta: (8.5 - 6.5)/3.5 * 0.15 = 0.0857
        # Events: 2*0.04 + 1*0.02 = 0.10
        # Total approx: 0.1857
        assert form > 0.15
        assert form <= 0.30

    def test_defender_clean_sheet_reward(self):
        """Defenders receive higher rewards for clean sheets."""
        def_stats = MatchStats(
            minutes_played=90,
            clean_sheets=1,
            match_rating=7.5,
            position="DEF"
        )
        form = calculate_form_factor(def_stats)
        assert form > 0.05


class TestMasterPricingFormula:
    """End-to-end test of the master formula across multiple scenarios."""

    def test_haaland_superstar_scenario(self):
        """Haaland (£150M) scores a brace with a Tier 1 link and strong demand."""
        base_value = 150_000_000.0
        stats = MatchStats(minutes_played=90, goals=2, match_rating=8.8, position="FWD")
        form = calculate_form_factor(stats)  # ~+0.18
        rumor = calculate_rumor_multiplier(tier=1, upvotes=400, downvotes=50)  # ~+0.23
        demand = calculate_platform_demand_factor(net_volume_48h=150)  # ~+0.17

        result = calculate_current_price(
            base_value=base_value,
            form_factor=form,
            rumor_multiplier=rumor,
            platform_demand_factor=demand
        )

        assert result.bounded_price > base_value
        assert result.bounded_price <= base_value * SAFETY_CEILING_FACTOR
        assert result.was_capped_by_ceiling is False
        # Expected price in £200M - £270M range
        assert 200_000_000.0 < result.bounded_price < 375_000_000.0
