from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
from app.engine.pricing import (
    calculate_form_factor,
    calculate_rumor_multiplier,
    calculate_platform_demand_factor,
    calculate_current_price,
    MatchStats,
    PriceBreakdown
)

router = APIRouter(prefix="/pricing", tags=["Pricing Engine"])


class MatchStatsInput(BaseModel):
    minutes_played: int = Field(default=90, ge=0, le=120)
    goals: int = Field(default=0, ge=0)
    assists: int = Field(default=0, ge=0)
    clean_sheets: int = Field(default=0, ge=0)
    match_rating: float = Field(default=6.50, ge=0.0, le=10.0)
    position: str = Field(default="MID")


class RumorInput(BaseModel):
    tier: int = Field(default=1, ge=1, le=5)
    upvotes: int = Field(default=0, ge=0)
    downvotes: int = Field(default=0, ge=0)
    is_positive: bool = True


class ValuationRequest(BaseModel):
    base_value: float = Field(..., gt=0)
    match_stats: Optional[MatchStatsInput] = None
    rumor: Optional[RumorInput] = None
    net_volume_48h: int = 0


class ValuationResponse(BaseModel):
    base_value: float
    form_factor: float
    rumor_multiplier: float
    platform_demand_factor: float
    raw_price: float
    bounded_price: float
    floor_bound: float
    ceiling_bound: float
    was_capped_by_floor: bool
    was_capped_by_ceiling: bool


@router.post("/calculate", response_model=ValuationResponse)
def calculate_player_valuation(req: ValuationRequest):
    """Calculates a player's valuation using the master pricing algorithm with safety bounds."""
    # 1. Form factor
    form = 0.0
    if req.match_stats:
        stats = MatchStats(
            minutes_played=req.match_stats.minutes_played,
            goals=req.match_stats.goals,
            assists=req.match_stats.assists,
            clean_sheets=req.match_stats.clean_sheets,
            match_rating=req.match_stats.match_rating,
            position=req.match_stats.position,
        )
        form = calculate_form_factor(stats)

    # 2. Rumor multiplier
    rumor = 0.0
    if req.rumor:
        rumor = calculate_rumor_multiplier(
            tier=req.rumor.tier,
            upvotes=req.rumor.upvotes,
            downvotes=req.rumor.downvotes,
            is_positive_rumor=req.rumor.is_positive,
        )

    # 3. Demand factor
    demand = calculate_platform_demand_factor(req.net_volume_48h)

    # 4. Master price
    breakdown = calculate_current_price(
        base_value=req.base_value,
        form_factor=form,
        rumor_multiplier=rumor,
        platform_demand_factor=demand,
    )

    return ValuationResponse(
        base_value=breakdown.base_value,
        form_factor=breakdown.form_factor,
        rumor_multiplier=breakdown.rumor_multiplier,
        platform_demand_factor=breakdown.platform_demand_factor,
        raw_price=breakdown.raw_price,
        bounded_price=breakdown.bounded_price,
        floor_bound=round(req.base_value * 0.40, 2),
        ceiling_bound=round(req.base_value * 2.50, 2),
        was_capped_by_floor=breakdown.was_capped_by_floor,
        was_capped_by_ceiling=breakdown.was_capped_by_ceiling,
    )


@router.get("/simulate", response_model=ValuationResponse)
def simulate_valuation(
    base_value: float = Query(..., gt=0),
    form_factor: float = Query(0.0, ge=-0.5, le=0.5),
    tier: Optional[int] = Query(None, ge=1, le=5),
    upvotes: int = Query(0, ge=0),
    downvotes: int = Query(0, ge=0),
    net_volume: int = Query(0)
):
    """Convenience simulation GET endpoint for testing pricing factors."""
    rumor = 0.0
    if tier is not None:
        rumor = calculate_rumor_multiplier(tier, upvotes, downvotes)

    demand = calculate_platform_demand_factor(net_volume)

    breakdown = calculate_current_price(
        base_value=base_value,
        form_factor=form_factor,
        rumor_multiplier=rumor,
        platform_demand_factor=demand
    )

    return ValuationResponse(
        base_value=breakdown.base_value,
        form_factor=breakdown.form_factor,
        rumor_multiplier=breakdown.rumor_multiplier,
        platform_demand_factor=breakdown.platform_demand_factor,
        raw_price=breakdown.raw_price,
        bounded_price=breakdown.bounded_price,
        floor_bound=round(base_value * 0.40, 2),
        ceiling_bound=round(base_value * 2.50, 2),
        was_capped_by_floor=breakdown.was_capped_by_floor,
        was_capped_by_ceiling=breakdown.was_capped_by_ceiling,
    )
