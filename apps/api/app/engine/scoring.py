"""
Fantasy Matchday Scoring Engine for GafferDex (SPEC v2 - League Worlds).
Calculates individual player match performance points and club gameweek totals.
"""

from typing import Dict, Any, List


def calculate_player_gameweek_points(
    position: str,
    stats: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Computes standard fantasy football points for a single player in a match/gameweek.

    Rules:
    - Minutes: >=60 mins: 2 pts; 1-59 mins: 1 pt; 0 mins: 0 pts
    - Goals: FWD 4 pts, MID 5 pts, DEF/GK 6 pts
    - Assists: 3 pts each
    - Clean Sheet (>=60 mins): DEF/GK 4 pts, MID 1 pt
    - Goals Conceded: DEF/GK -1 pt per 2 goals conceded
    - Cards: Yellow -1 pt, Red -3 pts
    - Own Goals: -2 pts
    - Penalty Save: 5 pts (GK)
    - Penalty Miss: -2 pts
    - Rating Bonus: >=8.5 (+3 pts), >=7.5 (+2 pts), >=7.0 (+1 pt)
    """
    pos = position.upper()
    minutes = stats.get("minutes", 0)
    goals = stats.get("goals", 0)
    assists = stats.get("assists", 0)
    clean_sheet = stats.get("clean_sheet", False)
    goals_conceded = stats.get("goals_conceded", 0)
    yellow_cards = stats.get("yellow_cards", 0)
    red_cards = stats.get("red_cards", 0)
    own_goals = stats.get("own_goals", 0)
    penalty_saves = stats.get("penalty_saves", 0)
    penalty_misses = stats.get("penalty_misses", 0)
    rating = stats.get("rating", 6.0)

    breakdown = {}
    total = 0

    # 1. Minutes Played
    if minutes >= 60:
        breakdown["minutes_points"] = 2
    elif minutes > 0:
        breakdown["minutes_points"] = 1
    else:
        breakdown["minutes_points"] = 0
    total += breakdown["minutes_points"]

    # 2. Goals Scored
    if pos in ("DEF", "GK"):
        goal_val = 6
    elif pos == "MID":
        goal_val = 5
    else: # FWD
        goal_val = 4
    breakdown["goals_points"] = goals * goal_val
    total += breakdown["goals_points"]

    # 3. Assists
    breakdown["assists_points"] = assists * 3
    total += breakdown["assists_points"]

    # 4. Clean Sheet (only if played >= 60 mins)
    clean_sheet_pts = 0
    if clean_sheet and minutes >= 60:
        if pos in ("DEF", "GK"):
            clean_sheet_pts = 4
        elif pos == "MID":
            clean_sheet_pts = 1
    breakdown["clean_sheet_points"] = clean_sheet_pts
    total += clean_sheet_pts

    # 5. Goals Conceded (DEF / GK only)
    conceded_pts = 0
    if pos in ("DEF", "GK") and goals_conceded >= 2:
        conceded_pts = -(goals_conceded // 2)
    breakdown["goals_conceded_points"] = conceded_pts
    total += conceded_pts

    # 6. Discipline & Penalties
    breakdown["cards_points"] = (yellow_cards * -1) + (red_cards * -3)
    total += breakdown["cards_points"]

    breakdown["own_goals_points"] = own_goals * -2
    total += breakdown["own_goals_points"]

    breakdown["penalty_points"] = (penalty_saves * 5) + (penalty_misses * -2)
    total += breakdown["penalty_points"]

    # 7. Rating Bonus
    rating_bonus = 0
    if rating >= 8.5:
        rating_bonus = 3
    elif rating >= 7.5:
        rating_bonus = 2
    elif rating >= 7.0:
        rating_bonus = 1
    breakdown["rating_bonus"] = rating_bonus
    total += rating_bonus

    return {
        "total_points": total,
        "breakdown": breakdown
    }


def calculate_club_gameweek_total(
    player_scores: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Sums individual player performances into a club gameweek total.
    """
    total = sum(p.get("points", 0) for p in player_scores)
    top_performer = max(player_scores, key=lambda p: p.get("points", 0), default={})

    return {
        "total_points": total,
        "top_performer": top_performer,
        "player_count": len(player_scores),
        "player_breakdowns": player_scores
    }
