"""Unit tests for the football stats ingestion service."""

import pytest
from app.services.football_api import FootballDataService
from app.engine.pricing import MatchStats


def test_fit_forward_stats_generation():
    service = FootballDataService()
    stats = service.get_weekly_stats(
        player_name="Erling Haaland",
        real_team="Manchester City",
        position="FWD",
        injury_status="fit",
        seed_value=42
    )

    assert isinstance(stats, MatchStats)
    assert stats.position == "FWD"
    assert stats.minutes_played > 60
    assert 6.0 <= stats.match_rating <= 10.0
    assert stats.clean_sheets == 0  # Forwards do not get clean sheets


def test_severe_injury_zero_minutes():
    service = FootballDataService()
    stats = service.get_weekly_stats(
        player_name="Rodri",
        real_team="Manchester City",
        position="MID",
        injury_status="severe_injury"
    )

    assert stats.minutes_played == 0
    assert stats.goals == 0
    assert stats.assists == 0
    assert stats.clean_sheets == 0
    assert stats.match_rating == 6.00


def test_defender_clean_sheet_potential():
    service = FootballDataService()
    stats = service.get_weekly_stats(
        player_name="William Saliba",
        real_team="Arsenal",
        position="DEF",
        injury_status="fit",
        seed_value=123
    )

    assert stats.position == "DEF"
    assert stats.minutes_played >= 60
    assert stats.clean_sheets in (0, 1)
    assert 6.0 <= stats.match_rating <= 10.0
