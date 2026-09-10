"""
Unit tests for the Rumor Terminal API (Ingestion, Voting, and Pricing Recalculation).
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_rumors_default():
    """Ensure default rumors endpoint returns active seeded rumors."""
    response = client.get("/api/v1/rumors")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 8

    # Verify key fields
    first = data[0]
    assert "id" in first
    assert "player_name" in first
    assert "tier_rating" in first
    assert "tier_label" in first
    assert "tier_color" in first
    assert "deal_percentage" in first
    assert "rumor_multiplier" in first
    assert "rumor_multiplier_pct" in first


def test_list_rumors_filter_by_tier():
    """Ensure tier filter returns only matching credibility tiers."""
    response = client.get("/api/v1/rumors?tier=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for item in data:
        assert item["tier_rating"] == 1
        assert "Tier 1" in item["tier_label"]


def test_ingest_new_rumor():
    """Test successful ingestion of a new transfer rumor."""
    payload = {
        "player_id": "10000000-0000-0000-0000-000000000016",  # Bukayo Saka
        "source_name": "David Ornstein (The Athletic)",
        "tier_rating": 1,
        "buying_club": "Real Madrid",
        "fee_estimate": 140000000.0,
        "headline": "Real Madrid prepare sensational £140M bid for Bukayo Saka"
    }

    response = client.post("/api/v1/rumors", json=payload)
    assert response.status_code == 201
    res_data = response.json()

    assert res_data["player_name"] == "Bukayo Saka"
    assert res_data["source_name"] == "David Ornstein (The Athletic)"
    assert res_data["tier_rating"] == 1
    assert res_data["tier_color"] == "emerald"
    assert res_data["fee_estimate"] == 140000000.0
    assert res_data["upvotes"] == 0
    assert res_data["downvotes"] == 0
    assert res_data["rumor_multiplier"] > 0.0  # Initial default dampener for Tier 1


def test_ingest_rumor_invalid_tier():
    """Ensure invalid tier values (<1 or >5) are rejected with 422."""
    payload = {
        "player_id": "10000000-0000-0000-0000-000000000016",
        "source_name": "Unverified Blog",
        "tier_rating": 99,  # Invalid
        "buying_club": "PSG"
    }
    response = client.post("/api/v1/rumors", json=payload)
    assert response.status_code == 422


def test_vote_deal_and_delusion():
    """Test consensus voting and dynamic recalculation of the rumor multiplier."""
    # First ingest a fresh rumor with 0 votes
    create_res = client.post("/api/v1/rumors", json={
        "player_id": "10000000-0000-0000-0000-000000000006",  # Saliba
        "source_name": "Tier 1 Reporter",
        "tier_rating": 1,
        "buying_club": "Bayern Munich",
        "fee_estimate": 90000000.0
    })
    assert create_res.status_code == 201
    rumor_id = create_res.json()["id"]

    # Vote 1: DEAL
    deal_res = client.post(f"/api/v1/rumors/{rumor_id}/vote", json={"vote": "deal"})
    assert deal_res.status_code == 200
    deal_data = deal_res.json()
    assert deal_data["upvotes"] == 1
    assert deal_data["downvotes"] == 0
    assert deal_data["deal_percentage"] == 100.0
    # 100% deal ratio gives sentiment dampener = 1.0; Tier 1 shock = 0.25 -> 0.25
    assert deal_data["rumor_multiplier"] == pytest.approx(0.25, rel=1e-2)

    # Vote 2: DELUSION
    delusion_res = client.post(f"/api/v1/rumors/{rumor_id}/vote", json={"vote": "delusion"})
    assert delusion_res.status_code == 200
    delusion_data = delusion_res.json()
    assert delusion_data["upvotes"] == 1
    assert delusion_data["downvotes"] == 1
    assert delusion_data["deal_percentage"] == 50.0
    assert delusion_data["delusion_percentage"] == 50.0
    # 50% deal ratio: dampener = 0.50 + 0.50*0.5 = 0.75; 0.25 * 0.75 = 0.1875
    assert delusion_data["rumor_multiplier"] == pytest.approx(0.1875, rel=1e-2)


def test_vote_invalid_payload():
    """Ensure invalid vote type returns 400 Bad Request."""
    rumor_id = "20000000-0000-0000-0000-000000000001"
    res = client.post(f"/api/v1/rumors/{rumor_id}/vote", json={"vote": "uncertain"})
    assert res.status_code == 400


def test_vote_nonexistent_rumor():
    """Ensure 404 is returned for unknown rumor UUID."""
    res = client.post("/api/v1/rumors/nonexistent-id/vote", json={"vote": "deal"})
    assert res.status_code == 404


def test_scouting_level_gates_embargoed_rumor_feed():
    """Public embargo is 15m; a 5-minute-old scoop is early-access only at high scouting tiers."""
    public = client.get("/api/v1/rumors?scouting_level=1")
    assert public.status_code == 200
    public_ids = {item["id"] for item in public.json()}
    assert "20000000-0000-0000-0000-000000000099" not in public_ids

    elite = client.get("/api/v1/rumors?scouting_level=5")
    assert elite.status_code == 200
    elite_rows = elite.json()
    elite_ids = {item["id"] for item in elite_rows}
    assert "20000000-0000-0000-0000-000000000099" in elite_ids
    breaking = next(item for item in elite_rows if item["id"] == "20000000-0000-0000-0000-000000000099")
    assert breaking["early_access"] is True
