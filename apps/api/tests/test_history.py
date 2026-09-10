"""
Unit tests for player price history and timeframe-aware valuation charting API.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

HAALAND_ID = "10000000-0000-0000-0000-000000000026"
RODRI_ID = "10000000-0000-0000-0000-000000000019"


def test_history_7d_timeframe():
    """Verify 7-day timeframe returns exactly 7 points with day labels."""
    res = client.get(f"/api/v1/jobs/history/{HAALAND_ID}?timeframe=7d")
    assert res.status_code == 200
    points = res.json()
    assert isinstance(points, list)
    assert len(points) == 7

    for pt in points:
        assert "player_id" in pt
        assert "market_value" in pt
        assert "form_factor" in pt
        assert "recorded_at" in pt
        assert "label" in pt
        assert pt["market_value"] > 0.0


def test_history_30d_timeframe():
    """Verify 30-day timeframe returns 30 points with date labels."""
    res = client.get(f"/api/v1/jobs/history/{HAALAND_ID}?timeframe=30d")
    assert res.status_code == 200
    points = res.json()
    assert isinstance(points, list)
    assert len(points) == 30

    first = points[0]
    last = points[-1]
    # Haaland should show positive appreciation over 30 days
    assert last["market_value"] >= first["market_value"]


def test_history_season_timeframe():
    """Verify season timeframe returns 38 matchdays labeled GW 1 to GW 38."""
    res = client.get(f"/api/v1/jobs/history/{HAALAND_ID}?timeframe=season")
    assert res.status_code == 200
    points = res.json()
    assert isinstance(points, list)
    assert len(points) == 38

    assert points[0]["label"] == "GW 1"
    assert points[-1]["label"] == "GW 38"


def test_history_severe_injury_decay():
    """Verify that severe injury player (Rodri) displays valuation decline over time."""
    res = client.get(f"/api/v1/jobs/history/{RODRI_ID}?timeframe=30d")
    assert res.status_code == 200
    points = res.json()
    assert len(points) == 30

    # Injured player trajectory drops over time
    first = points[0]
    last = points[-1]
    assert last["market_value"] < first["market_value"]


def test_history_invalid_timeframe():
    """Verify that invalid timeframe string returns 422 Unprocessable Entity."""
    res = client.get(f"/api/v1/jobs/history/{HAALAND_ID}?timeframe=1year")
    assert res.status_code == 422
