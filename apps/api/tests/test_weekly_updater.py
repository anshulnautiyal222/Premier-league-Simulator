"""Unit tests for the weekly market update job and price history snapshots."""

import pytest
import asyncio
from app.jobs.weekly_updater import run_weekly_update_job, STANDALONE_PLAYERS


def test_run_weekly_update_job_execution():
    """Verify that weekly update job successfully runs, updates all 30 players, and adheres to bounds."""
    result = asyncio.run(run_weekly_update_job())

    assert result["status"] == "completed"
    assert result["players_updated"] == len(STANDALONE_PLAYERS)
    assert result["history_snapshots_recorded"] == len(STANDALONE_PLAYERS)
    assert "timestamp" in result

    # Verify preview entries
    for preview in result["results"]:
        assert "player_name" in preview
        assert "new_price" in preview
        assert "form_factor" in preview
        # Check safety bounds
        base = preview["base_value"]
        assert preview["new_price"] >= base * 0.40
        assert preview["new_price"] <= base * 2.50
