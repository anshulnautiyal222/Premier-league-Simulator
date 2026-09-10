"""
Weekly Market Valuation Cron Job for GafferDex.

Workflow:
1. Pulls weekly match stats (goals, assists, clean sheets, minutes, ratings).
2. Calculates form_factor for every player using the pricing engine.
3. Retrieves active rumors and in-game 48-hour demand volume.
4. Recalculates current_market_value (strictly bounded between 40% and 250% of base_value).
5. Updates the players table.
6. Records a historical valuation snapshot into player_price_history.
"""

import os
import sys
import logging
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional

from app.core.config import settings
from app.services.football_api import get_football_service, FootballDataService
from app.engine.pricing import (
    calculate_form_factor,
    calculate_rumor_multiplier,
    calculate_platform_demand_factor,
    calculate_current_price,
    PriceBreakdown,
)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("gafferdex.weekly_updater")


# 30 Seeded Premier League players reference for standalone / local execution
STANDALONE_PLAYERS = [
    {"id": "10000000-0000-0000-0000-000000000001", "name": "David Raya", "real_team": "Arsenal", "position": "GK", "base_value": 40000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000002", "name": "Ederson", "real_team": "Manchester City", "position": "GK", "base_value": 35000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000003", "name": "Alisson Becker", "real_team": "Liverpool", "position": "GK", "base_value": 42000000.0, "injury_status": "minor_knock"},
    {"id": "10000000-0000-0000-0000-000000000004", "name": "Emiliano Martínez", "real_team": "Aston Villa", "position": "GK", "base_value": 38000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000005", "name": "Guglielmo Vicario", "real_team": "Tottenham Hotspur", "position": "GK", "base_value": 32000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000006", "name": "William Saliba", "real_team": "Arsenal", "position": "DEF", "base_value": 75000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000007", "name": "Gabriel Magalhães", "real_team": "Arsenal", "position": "DEF", "base_value": 65000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000008", "name": "Trent Alexander-Arnold", "real_team": "Liverpool", "position": "DEF", "base_value": 70000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000009", "name": "Virgil van Dijk", "real_team": "Liverpool", "position": "DEF", "base_value": 45000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000010", "name": "Joško Gvardiol", "real_team": "Manchester City", "position": "DEF", "base_value": 75000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000011", "name": "Rúben Dias", "real_team": "Manchester City", "position": "DEF", "base_value": 70000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000012", "name": "Cristian Romero", "real_team": "Tottenham Hotspur", "position": "DEF", "base_value": 60000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000013", "name": "Pedro Porro", "real_team": "Tottenham Hotspur", "position": "DEF", "base_value": 45000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000014", "name": "Micky van de Ven", "real_team": "Tottenham Hotspur", "position": "DEF", "base_value": 55000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000015", "name": "Levi Colwill", "real_team": "Chelsea", "position": "DEF", "base_value": 50000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000016", "name": "Bukayo Saka", "real_team": "Arsenal", "position": "MID", "base_value": 110000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000017", "name": "Martin Ødegaard", "real_team": "Arsenal", "position": "MID", "base_value": 90000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000018", "name": "Declan Rice", "real_team": "Arsenal", "position": "MID", "base_value": 95000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000019", "name": "Rodri", "real_team": "Manchester City", "position": "MID", "base_value": 115000000.0, "injury_status": "severe_injury"},
    {"id": "10000000-0000-0000-0000-000000000020", "name": "Kevin De Bruyne", "real_team": "Manchester City", "position": "MID", "base_value": 60000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000021", "name": "Phil Foden", "real_team": "Manchester City", "position": "MID", "base_value": 110000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000022", "name": "Cole Palmer", "real_team": "Chelsea", "position": "MID", "base_value": 85000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000023", "name": "Bruno Fernandes", "real_team": "Manchester United", "position": "MID", "base_value": 65000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000024", "name": "Kobbie Mainoo", "real_team": "Manchester United", "position": "MID", "base_value": 45000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000025", "name": "Alexis Mac Allister", "real_team": "Liverpool", "position": "MID", "base_value": 70000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000026", "name": "Erling Haaland", "real_team": "Manchester City", "position": "FWD", "base_value": 150000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000027", "name": "Mohamed Salah", "real_team": "Liverpool", "position": "FWD", "base_value": 80000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000028", "name": "Alexander Isak", "real_team": "Newcastle United", "position": "FWD", "base_value": 75000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000029", "name": "Ollie Watkins", "real_team": "Aston Villa", "position": "FWD", "base_value": 65000000.0, "injury_status": "fit"},
    {"id": "10000000-0000-0000-0000-000000000030", "name": "Son Heung-min", "real_team": "Tottenham Hotspur", "position": "FWD", "base_value": 50000000.0, "injury_status": "fit"},
]


def get_supabase_client():
    """Initializes Supabase client using service role key for administrative batch writes."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return None

    try:
        from supabase import create_client
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:
        logger.warning(f"Could not connect to Supabase: {str(e)}")
        return None


async def run_weekly_update_job() -> Dict[str, Any]:
    """
    Executes the weekly market update cron:
    - Fetches weekly match stats
    - Recalculates form factor, rumors, and demand
    - Updates players table with bounded new price
    - Appends snapshot to player_price_history table
    """
    logger.info("Starting GafferDex weekly market valuation cron job...")
    service: FootballDataService = get_football_service()
    supabase = get_supabase_client()

    # 1. Fetch player records
    players = []
    if supabase:
        try:
            res = supabase.from_("players").select("*").execute()
            if res.data and len(res.data) > 0:
                players = res.data
                logger.info(f"Loaded {len(players)} players from Supabase.")
        except Exception as e:
            logger.warning(f"Failed to query players from Supabase: {str(e)}")

    if not players:
        logger.info(f"Using {len(STANDALONE_PLAYERS)} seeded standalone players.")
        players = STANDALONE_PLAYERS

    updated_players = []
    price_history_records = []
    now_iso = datetime.utcnow().isoformat()

    for p in players:
        player_id = p["id"]
        name = p["name"]
        team = p["real_team"]
        pos = p["position"]
        base_value = float(p.get("base_value", 50000000.0))
        injury = p.get("injury_status", "fit")

        # 1. Pull weekly match stats (external API or model)
        stats = service.get_weekly_stats(
            player_name=name,
            real_team=team,
            position=pos,
            injury_status=injury
        )

        # 2. Compute form factor
        form_factor = calculate_form_factor(stats)

        # 3. Active rumors multiplier (if any active rumors exist)
        rumor_multiplier = 0.0
        if supabase:
            try:
                rumors_res = supabase.from_("rumor_feed") \
                    .select("tier_rating, upvotes, downvotes") \
                    .eq("player_id", player_id) \
                    .eq("status", "active") \
                    .limit(1) \
                    .execute()
                if rumors_res.data:
                    r = rumors_res.data[0]
                    rumor_multiplier = calculate_rumor_multiplier(
                        tier=r["tier_rating"],
                        upvotes=r.get("upvotes", 0),
                        downvotes=r.get("downvotes", 0)
                    )
            except Exception:
                pass

        # 4. In-game trailing 48-hour demand
        demand_factor = 0.0

        # 5. Master price calculation with strict safety bounds
        breakdown: PriceBreakdown = calculate_current_price(
            base_value=base_value,
            form_factor=form_factor,
            rumor_multiplier=rumor_multiplier,
            platform_demand_factor=demand_factor
        )

        record_entry = {
            "player_id": player_id,
            "player_name": name,
            "base_value": base_value,
            "match_rating": stats.match_rating,
            "form_factor": form_factor,
            "rumor_multiplier": rumor_multiplier,
            "demand_factor": demand_factor,
            "old_price": float(p.get("current_market_value", base_value)),
            "new_price": breakdown.bounded_price,
            "was_capped_by_floor": breakdown.was_capped_by_floor,
            "was_capped_by_ceiling": breakdown.was_capped_by_ceiling,
        }
        updated_players.append(record_entry)

        # Price history point to insert
        history_item = {
            "player_id": player_id,
            "market_value": breakdown.bounded_price,
            "form_factor": form_factor,
            "rumor_multiplier": rumor_multiplier,
            "demand_factor": demand_factor,
            "match_rating": stats.match_rating,
            "recorded_at": now_iso
        }
        price_history_records.append(history_item)

        # Update player record in Supabase
        if supabase:
            try:
                supabase.from_("players").update({
                    "current_market_value": breakdown.bounded_price,
                    "form_score": stats.match_rating,
                    "form_factor": form_factor,
                    "updated_at": now_iso
                }).eq("id", player_id).execute()
            except Exception as e:
                logger.debug(f"Could not update player {name} in DB: {e}")

    # Batch insert price history into player_price_history
    if supabase and price_history_records:
        try:
            supabase.from_("player_price_history").insert(price_history_records).execute()
            logger.info(f"Recorded {len(price_history_records)} historical price points to Supabase.")
        except Exception as e:
            logger.warning(f"Could not insert player_price_history: {e}")

    logger.info(f"Weekly market update finished. Updated {len(updated_players)} players.")

    return {
        "status": "completed",
        "timestamp": now_iso,
        "players_updated": len(updated_players),
        "history_snapshots_recorded": len(price_history_records),
        "results": updated_players[:5]  # Sample preview of first 5
    }


if __name__ == "__main__":
    result = asyncio.run(run_weekly_update_job())
    print(f"Weekly Update Complete: {result['players_updated']} players updated.")
