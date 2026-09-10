from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.jobs.weekly_updater import run_weekly_update_job, get_supabase_client, STANDALONE_PLAYERS

router = APIRouter(prefix="/jobs", tags=["Scheduled Jobs & Price History"])


class PriceHistoryPoint(BaseModel):
    player_id: str
    market_value: float
    form_factor: float
    rumor_multiplier: float
    demand_factor: float
    match_rating: float
    recorded_at: str


class WeeklyUpdateResponse(BaseModel):
    status: str
    timestamp: str
    players_updated: int
    history_snapshots_recorded: int
    sample_preview: List[dict]


@router.post("/weekly-update", response_model=WeeklyUpdateResponse)
async def trigger_weekly_update():
    """Manually triggers the weekly market valuation cron job to update form factors and prices."""
    summary = await run_weekly_update_job()
    return WeeklyUpdateResponse(
        status=summary["status"],
        timestamp=summary["timestamp"],
        players_updated=summary["players_updated"],
        history_snapshots_recorded=summary["history_snapshots_recorded"],
        sample_preview=summary["results"],
    )


@router.get("/history/{player_id}", response_model=List[PriceHistoryPoint])
def get_player_price_history(
    player_id: str,
    limit: int = Query(30, ge=1, le=100)
):
    """
    Retrieves time-series valuation history for a player to render stock/trend charts.
    """
    supabase = get_supabase_client()
    if supabase:
        try:
            res = supabase.from_("player_price_history") \
                .select("*") \
                .eq("player_id", player_id) \
                .order("recorded_at", desc=False) \
                .limit(limit) \
                .execute()
            if res.data:
                return [
                    PriceHistoryPoint(
                        player_id=r["player_id"],
                        market_value=float(r["market_value"]),
                        form_factor=float(r.get("form_factor", 0.0)),
                        rumor_multiplier=float(r.get("rumor_multiplier", 0.0)),
                        demand_factor=float(r.get("demand_factor", 0.0)),
                        match_rating=float(r.get("match_rating", 6.5)),
                        recorded_at=r["recorded_at"],
                    )
                    for r in res.data
                ]
        except Exception:
            pass

    # Fallback synthetic historical points if DB history not yet accumulated
    player = next((p for p in STANDALONE_PLAYERS if p["id"] == player_id), None)
    base_val = player["base_value"] if player else 60000000.0

    # Generate sample 7-day trailing points for instant chart rendering
    now = datetime.utcnow()
    points = []
    modifiers = [-0.04, -0.02, 0.01, 0.00, 0.03, 0.05, 0.08]
    for i, mod in enumerate(modifiers):
        t = datetime.fromtimestamp(now.timestamp() - ((6 - i) * 86400))
        val = round(base_val * (1.0 + mod), 2)
        points.append(
            PriceHistoryPoint(
                player_id=player_id,
                market_value=val,
                form_factor=mod,
                rumor_multiplier=0.0,
                demand_factor=0.0,
                match_rating=round(6.5 + (mod * 15), 2),
                recorded_at=t.isoformat(),
            )
        )

    return points
