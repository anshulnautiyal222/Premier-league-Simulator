import pytest
from app.engine.scoring import calculate_player_gameweek_points, calculate_club_gameweek_total


def test_fwd_scoring_two_goals_with_assist():
    stats = {
        "minutes": 88,
        "goals": 2,
        "assists": 1,
        "rating": 8.6
    }
    result = calculate_player_gameweek_points("FWD", stats)
    # 2 mins + 8 (2*4 goals) + 3 assist + 3 rating bonus = 16 pts
    assert result["total_points"] == 16
    assert result["breakdown"]["goals_points"] == 8
    assert result["breakdown"]["assists_points"] == 3
    assert result["breakdown"]["rating_bonus"] == 3


def test_mid_scoring_goal_clean_sheet():
    stats = {
        "minutes": 90,
        "goals": 1,
        "clean_sheet": True,
        "rating": 7.8
    }
    result = calculate_player_gameweek_points("MID", stats)
    # 2 mins + 5 (1*5 goal) + 1 clean sheet + 2 rating bonus = 10 pts
    assert result["total_points"] == 10
    assert result["breakdown"]["clean_sheet_points"] == 1


def test_def_clean_sheet_and_goal():
    stats = {
        "minutes": 90,
        "goals": 1,
        "clean_sheet": True,
        "rating": 8.0
    }
    result = calculate_player_gameweek_points("DEF", stats)
    # 2 mins + 6 goal + 4 clean sheet + 2 rating bonus = 14 pts
    assert result["total_points"] == 14
    assert result["breakdown"]["goals_points"] == 6
    assert result["breakdown"]["clean_sheet_points"] == 4


def test_def_conceding_four_goals():
    stats = {
        "minutes": 90,
        "goals_conceded": 4,
        "yellow_cards": 1,
        "rating": 5.5
    }
    result = calculate_player_gameweek_points("DEF", stats)
    # 2 mins - 2 (4//2 conceded) - 1 card = -1 pt
    assert result["total_points"] == -1
    assert result["breakdown"]["goals_conceded_points"] == -2
    assert result["breakdown"]["cards_points"] == -1


def test_sub_under_60_minutes_no_clean_sheet_points():
    stats = {
        "minutes": 35,
        "clean_sheet": True,
        "rating": 6.5
    }
    result = calculate_player_gameweek_points("DEF", stats)
    # 1 min pt, 0 clean sheet pts because <60 mins
    assert result["total_points"] == 1
    assert result["breakdown"]["clean_sheet_points"] == 0


def test_club_gameweek_total_aggregation():
    player_scores = [
        {"player_id": "p1", "name": "Haaland", "points": 16},
        {"player_id": "p2", "name": "Saka", "points": 10},
        {"player_id": "p3", "name": "Saliba", "points": 14},
    ]
    club_total = calculate_club_gameweek_total(player_scores)
    assert club_total["total_points"] == 40
    assert club_total["top_performer"]["name"] == "Haaland"
    assert club_total["player_count"] == 3
