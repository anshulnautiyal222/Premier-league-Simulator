"""
Transfer Rumor Terminal API for GafferDex.
Provides rumor ingestion, community consensus voting ("Deal or Delusion"),
credibility tier classification, and real-time rumor_multiplier recalculation.
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.engine.pricing import calculate_rumor_multiplier
from app.jobs.weekly_updater import STANDALONE_PLAYERS

router = APIRouter(prefix="/rumors", tags=["Rumor Terminal"])

# Map player lookup for fast enrichment
PLAYERS_MAP = {p["id"]: p for p in STANDALONE_PLAYERS}

PUBLIC_EMBARGO_MINUTES = 15


def scouting_early_minutes(level: int) -> int:
    clamped = max(1, min(5, int(level or 1)))
    return clamped * 3


def _parse_created(created_at: str) -> datetime:
    raw = str(created_at).replace("Z", "+00:00")
    dt = datetime.fromisoformat(raw)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def is_rumor_visible(created_at: str, scouting_level: int, now: Optional[datetime] = None) -> bool:
    now = now or datetime.now(timezone.utc)
    wait = PUBLIC_EMBARGO_MINUTES - scouting_early_minutes(scouting_level)
    return now >= _parse_created(created_at) + timedelta(minutes=wait)


def is_rumor_early_access(created_at: str, scouting_level: int, now: Optional[datetime] = None) -> bool:
    now = now or datetime.now(timezone.utc)
    public_at = _parse_created(created_at) + timedelta(minutes=PUBLIC_EMBARGO_MINUTES)
    return is_rumor_visible(created_at, scouting_level, now) and now < public_at

TIER_METADATA = {
    1: {
        "label": "Tier 1 • Definitive / Elite Source",
        "description": "God tier. Verified club statements, Ornstein, Romano.",
        "color": "emerald",
        "badge_bg": "bg-emerald-500/10",
        "badge_text": "text-emerald-400",
        "badge_border": "border-emerald-500/30",
    },
    2: {
        "label": "Tier 2 • Highly Reliable Beat Reporter",
        "description": "The Athletic, BBC Sport, Tier 1 club specialists.",
        "color": "sky",
        "badge_bg": "bg-sky-500/10",
        "badge_text": "text-sky-400",
        "badge_border": "border-sky-500/30",
    },
    3: {
        "label": "Tier 3 • Mainstream Broadcaster / Press",
        "description": "The Telegraph, Guardian, Sky Sports News.",
        "color": "amber",
        "badge_bg": "bg-amber-500/10",
        "badge_text": "text-amber-400",
        "badge_border": "border-amber-500/30",
    },
    4: {
        "label": "Tier 4 • Speculative Tabloid Gossip",
        "description": "Daily Mail, Mirror, tabloid transfer columns.",
        "color": "orange",
        "badge_bg": "bg-orange-500/10",
        "badge_text": "text-orange-400",
        "badge_border": "border-orange-500/30",
    },
    5: {
        "label": "Tier 5 • Unverified Rumor Mill / Delusion",
        "description": "Clickbait blogs, Twitter ITKs, Don Balón.",
        "color": "rose",
        "badge_bg": "bg-rose-500/10",
        "badge_text": "text-rose-400",
        "badge_border": "border-rose-500/30",
    },
}

# In-memory store initialized with 8 realistic Premier League rumors
SEED_RUMORS: List[Dict[str, Any]] = [
    {
        "id": "20000000-0000-0000-0000-000000000001",
        "player_id": "10000000-0000-0000-0000-000000000008",  # Trent Alexander-Arnold
        "source_name": "David Ornstein (The Athletic)",
        "tier_rating": 1,
        "buying_club": "Real Madrid",
        "fee_estimate": 75000000.0,
        "headline": "Real Madrid open direct contract negotiations for Trent Alexander-Arnold",
        "status": "active",
        "upvotes": 842,
        "downvotes": 158,
        "created_at": "2026-09-10T14:30:00Z"
    },
    {
        "id": "20000000-0000-0000-0000-000000000002",
        "player_id": "10000000-0000-0000-0000-000000000022",  # Cole Palmer
        "source_name": "Fabrizio Romano",
        "tier_rating": 1,
        "buying_club": "Paris Saint-Germain",
        "fee_estimate": 130000000.0,
        "headline": "Paris Saint-Germain prepare record £130M bid to test Chelsea resolve on Cole Palmer",
        "status": "active",
        "upvotes": 620,
        "downvotes": 480,
        "created_at": "2026-09-10T11:15:00Z"
    },
    {
        "id": "20000000-0000-0000-0000-000000000003",
        "player_id": "10000000-0000-0000-0000-000000000028",  # Alexander Isak
        "source_name": "The Athletic UK",
        "tier_rating": 2,
        "buying_club": "Arsenal",
        "fee_estimate": 100000000.0,
        "headline": "Mikel Arteta identifies Alexander Isak as marquee £100M summer striker target",
        "status": "active",
        "upvotes": 915,
        "downvotes": 210,
        "created_at": "2026-09-10T08:45:00Z"
    },
    {
        "id": "20000000-0000-0000-0000-000000000004",
        "player_id": "10000000-0000-0000-0000-000000000027",  # Mohamed Salah
        "source_name": "Paul Joyce (The Times)",
        "tier_rating": 2,
        "buying_club": "Al-Ittihad",
        "fee_estimate": 95000000.0,
        "headline": "Saudi Pro League delegation readies £95M package for Mohamed Salah",
        "status": "active",
        "upvotes": 730,
        "downvotes": 340,
        "created_at": "2026-09-10T04:20:00Z"
    },
    {
        "id": "20000000-0000-0000-0000-000000000005",
        "player_id": "10000000-0000-0000-0000-000000000020",  # Kevin De Bruyne
        "source_name": "The Telegraph",
        "tier_rating": 3,
        "buying_club": "San Diego FC",
        "fee_estimate": 40000000.0,
        "headline": "MLS expansion franchise San Diego FC pitch Designated Player offer to De Bruyne",
        "status": "active",
        "upvotes": 510,
        "downvotes": 490,
        "created_at": "2026-09-09T22:10:00Z"
    },
    {
        "id": "20000000-0000-0000-0000-000000000006",
        "player_id": "10000000-0000-0000-0000-000000000029",  # Ollie Watkins
        "source_name": "The Guardian Sport",
        "tier_rating": 3,
        "buying_club": "Chelsea",
        "fee_estimate": 70000000.0,
        "headline": "Chelsea lodge enquiry with Aston Villa over £70M valuation for Ollie Watkins",
        "status": "active",
        "upvotes": 390,
        "downvotes": 610,
        "created_at": "2026-09-09T16:00:00Z"
    },
    {
        "id": "20000000-0000-0000-0000-000000000007",
        "player_id": "10000000-0000-0000-0000-000000000023",  # Bruno Fernandes
        "source_name": "Daily Mail Secret Scout",
        "tier_rating": 4,
        "buying_club": "Bayern Munich",
        "fee_estimate": 65000000.0,
        "headline": "Bayern Munich monitoring Manchester United captaincy unrest for cut-price bid",
        "status": "active",
        "upvotes": 210,
        "downvotes": 790,
        "created_at": "2026-09-09T10:30:00Z"
    },
    {
        "id": "20000000-0000-0000-0000-000000000008",
        "player_id": "10000000-0000-0000-0000-000000000026",  # Erling Haaland
        "source_name": "El Chiringuito / Rumor ITK",
        "tier_rating": 5,
        "buying_club": "Barcelona",
        "fee_estimate": 200000000.0,
        "headline": "Laporta plots blockbuster cash-plus-player offer to bring Haaland to Camp Nou",
        "status": "active",
        "upvotes": 140,
        "downvotes": 1120,
        "created_at": "2026-09-08T18:00:00Z"
    }
]

# Mutable store for live demo and offline operation
RUMORS_STORE: Dict[str, Dict[str, Any]] = {r["id"]: dict(r) for r in SEED_RUMORS}


# ==============================================================================
# Pydantic Schemas
# ==============================================================================

class RumorCreate(BaseModel):
    player_id: str = Field(..., description="UUID of the targeted Premier League player")
    source_name: str = Field(..., min_length=2, max_length=100, description="Journalist or outlet name")
    tier_rating: int = Field(..., ge=1, le=5, description="Credibility tier: 1 (elite) to 5 (clickbait)")
    buying_club: str = Field(..., min_length=2, max_length=64, description="Prospective buying club")
    fee_estimate: Optional[float] = Field(default=None, gt=0, description="Estimated transfer fee in GBP")
    headline: Optional[str] = Field(default=None, max_length=255, description="Optional custom report headline")
    status: Optional[str] = Field(default="active", pattern="^(active|confirmed|debunked|expired)$")


class RumorVoteRequest(BaseModel):
    vote: str = Field(..., description="Vote type: 'deal' (upvote/credible) or 'delusion' (downvote/nonsense)")


class RumorResponse(BaseModel):
    id: str
    player_id: str
    player_name: str
    real_team: str
    position: str
    current_market_value: float
    source_name: str
    tier_rating: int
    tier_label: str
    tier_color: str
    buying_club: str
    fee_estimate: Optional[float]
    headline: str
    status: str
    upvotes: int
    downvotes: int
    total_votes: int
    deal_percentage: float
    delusion_percentage: float
    rumor_multiplier: float
    rumor_multiplier_pct: str
    created_at: str
    early_access: bool = False
    public_at: Optional[str] = None


class RumorVoteResponse(BaseModel):
    rumor_id: str
    vote: str
    upvotes: int
    downvotes: int
    total_votes: int
    deal_percentage: float
    delusion_percentage: float
    rumor_multiplier: float
    rumor_multiplier_pct: str
    impact_summary: str


def format_rumor_response(r: Dict[str, Any], scouting_level: int = 1) -> RumorResponse:
    """Enriches a raw rumor dictionary with player metadata, community sentiment, and pricing impact."""
    pid = r.get("player_id", "")
    player = PLAYERS_MAP.get(pid, {
        "name": "Premier League Player",
        "real_team": "Premier League",
        "position": "MID",
        "base_value": 50000000.0,
    })

    upvotes = int(r.get("upvotes", 0))
    downvotes = int(r.get("downvotes", 0))
    total_votes = upvotes + downvotes

    if total_votes > 0:
        deal_pct = round((upvotes / total_votes) * 100.0, 1)
        delusion_pct = round((downvotes / total_votes) * 100.0, 1)
    else:
        deal_pct = 50.0
        delusion_pct = 50.0

    tier = int(r.get("tier_rating", 3))
    multiplier = calculate_rumor_multiplier(
        tier=tier,
        upvotes=upvotes,
        downvotes=downvotes,
        is_positive_rumor=True
    )

    tier_meta = TIER_METADATA.get(tier, TIER_METADATA[3])

    # Fee estimate formatting
    fee = r.get("fee_estimate")
    headline = r.get("headline")
    if not headline:
        if fee:
            headline = f"{r.get('source_name')}: {r.get('buying_club')} prepare £{fee/1e6:.1f}M bid for {player.get('name')}"
        else:
            headline = f"{r.get('source_name')}: {r.get('buying_club')} showing serious interest in {player.get('name')}"

    # Current market value enriched with rumor shock
    base_val = player.get("base_value", 50000000.0)
    adjusted_market_val = round(base_val * (1.0 + multiplier), 2)

    sign = "+" if multiplier >= 0 else ""
    mult_pct = f"{sign}{multiplier * 100:.1f}%"

    created_at = str(r.get("created_at", datetime.now(timezone.utc).isoformat()))
    public_at = (_parse_created(created_at) + timedelta(minutes=PUBLIC_EMBARGO_MINUTES)).isoformat()

    return RumorResponse(
        id=r["id"],
        player_id=pid,
        player_name=player.get("name", "Unknown Player"),
        real_team=player.get("real_team", "Premier League"),
        position=player.get("position", "MID"),
        current_market_value=adjusted_market_val,
        source_name=r.get("source_name", "Anonymous"),
        tier_rating=tier,
        tier_label=tier_meta["label"],
        tier_color=tier_meta["color"],
        buying_club=r.get("buying_club", "Undisclosed"),
        fee_estimate=fee,
        headline=headline,
        status=r.get("status", "active"),
        upvotes=upvotes,
        downvotes=downvotes,
        total_votes=total_votes,
        deal_percentage=deal_pct,
        delusion_percentage=delusion_pct,
        rumor_multiplier=multiplier,
        rumor_multiplier_pct=mult_pct,
        created_at=created_at,
        early_access=is_rumor_early_access(created_at, scouting_level),
        public_at=public_at,
    )


# ==============================================================================
# Endpoints
# ==============================================================================

@router.post("", response_model=RumorResponse, status_code=status.HTTP_201_CREATED)
def ingest_rumor(req: RumorCreate):
    """
    Ingests a breaking transfer rumor entry into the rumor terminal.
    Calculates initial credibility tier weighting and registers community sentiment counters.
    """
    new_id = str(uuid.uuid4())

    headline = req.headline
    if not headline:
        player_name = PLAYERS_MAP.get(req.player_id, {}).get("name", "Player")
        if req.fee_estimate:
            headline = f"{req.source_name}: {req.buying_club} prepare £{req.fee_estimate/1e6:.1f}M bid for {player_name}"
        else:
            headline = f"{req.source_name}: {req.buying_club} make official approach for {player_name}"

    created_iso = datetime.now(timezone.utc).isoformat()

    rumor_data = {
        "id": new_id,
        "player_id": req.player_id,
        "source_name": req.source_name.strip(),
        "tier_rating": req.tier_rating,
        "buying_club": req.buying_club.strip(),
        "fee_estimate": req.fee_estimate,
        "headline": headline,
        "status": req.status or "active",
        "upvotes": 0,
        "downvotes": 0,
        "created_at": created_iso,
    }

    # Store in memory
    RUMORS_STORE[new_id] = rumor_data

    # Synchronize with Supabase if configured
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        try:
            from supabase import create_client
            client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            client.table("rumor_feed").insert({
                "id": new_id,
                "player_id": req.player_id,
                "source_name": req.source_name.strip(),
                "tier_rating": req.tier_rating,
                "buying_club": req.buying_club.strip(),
                "fee_estimate": req.fee_estimate,
                "status": req.status or "active",
                "upvotes": 0,
                "downvotes": 0,
            }).execute()
        except Exception:
            # Fall back smoothly to memory store
            pass

    return format_rumor_response(rumor_data)


@router.get("", response_model=List[RumorResponse])
def list_rumors(
    player_id: Optional[str] = Query(None, description="Filter by player UUID"),
    tier: Optional[int] = Query(None, ge=1, le=5, description="Filter by source tier (1-5)"),
    status: str = Query("active", description="Filter by status (active, confirmed, debunked)"),
    scouting_level: int = Query(1, ge=1, le=5, description="Club scouting tier; gates early-access rumor_feed rows"),
):
    """
    Retrieves transfer rumors visible to a club's scouting level.
    Public embargo is 15 minutes; each scouting tier unlocks 3 extra minutes of early access.
    """
    live_breaking = {
        "id": "20000000-0000-0000-0000-000000000099",
        "player_id": "10000000-0000-0000-0000-000000000016",
        "source_name": "Fabrizio Romano",
        "tier_rating": 1,
        "buying_club": "Real Madrid",
        "fee_estimate": 140000000.0,
        "headline": "BREAKING: Real Madrid make concrete enquiry for Bukayo Saka — here we go pending",
        "status": "active",
        "upvotes": 12,
        "downvotes": 3,
        "created_at": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat(),
    }

    results = []
    for r in list(RUMORS_STORE.values()) + [live_breaking]:
        if status and r.get("status") != status:
            continue
        if player_id and r.get("player_id") != player_id:
            continue
        if tier is not None and r.get("tier_rating") != tier:
            continue
        created_at = str(r.get("created_at", datetime.now(timezone.utc).isoformat()))
        if not is_rumor_visible(created_at, scouting_level):
            continue
        results.append(format_rumor_response(r, scouting_level))

    results.sort(key=lambda x: x.created_at, reverse=True)
    return results


@router.get("/{rumor_id}", response_model=RumorResponse)
def get_rumor(rumor_id: str):
    """Retrieves a single transfer rumor by ID."""
    if rumor_id not in RUMORS_STORE:
        raise HTTPException(status_code=404, detail=f"Rumor with ID '{rumor_id}' not found.")
    return format_rumor_response(RUMORS_STORE[rumor_id])


@router.post("/{rumor_id}/vote", response_model=RumorVoteResponse)
def vote_on_rumor(rumor_id: str, req: RumorVoteRequest):
    """
    Casts a community vote on a transfer rumor:
    - 'deal' (upvote): Users consider the scoop credible.
    - 'delusion' (downvote): Users consider the scoop sensationalized tabloid fiction.

    Updates upvotes/downvotes and dynamically recalculates the rumor's multiplier
    contribution to player valuation.
    """
    if rumor_id not in RUMORS_STORE:
        raise HTTPException(status_code=404, detail=f"Rumor with ID '{rumor_id}' not found.")

    v = req.vote.strip().lower()
    if v not in ("deal", "delusion"):
        raise HTTPException(
            status_code=400,
            detail="Invalid vote type. Must be either 'deal' or 'delusion'."
        )

    rumor = RUMORS_STORE[rumor_id]

    if v == "deal":
        rumor["upvotes"] = rumor.get("upvotes", 0) + 1
    else:
        rumor["downvotes"] = rumor.get("downvotes", 0) + 1

    upvotes = rumor["upvotes"]
    downvotes = rumor["downvotes"]
    total_votes = upvotes + downvotes

    deal_pct = round((upvotes / total_votes) * 100.0, 1)
    delusion_pct = round((downvotes / total_votes) * 100.0, 1)

    tier = rumor.get("tier_rating", 3)
    multiplier = calculate_rumor_multiplier(
        tier=tier,
        upvotes=upvotes,
        downvotes=downvotes,
        is_positive_rumor=True
    )

    sign = "+" if multiplier >= 0 else ""
    mult_pct = f"{sign}{multiplier * 100:.1f}%"

    # Synchronize with Supabase if configured
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        try:
            from supabase import create_client
            client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            client.table("rumor_feed").update({
                "upvotes": upvotes,
                "downvotes": downvotes
            }).eq("id", rumor_id).execute()
        except Exception:
            pass

    impact_summary = (
        f"Vote recorded! {deal_pct}% consensus considers this deal credible. "
        f"Market multiplier updated to {mult_pct} for Tier {tier} source."
    )

    return RumorVoteResponse(
        rumor_id=rumor_id,
        vote=v,
        upvotes=upvotes,
        downvotes=downvotes,
        total_votes=total_votes,
        deal_percentage=deal_pct,
        delusion_percentage=delusion_pct,
        rumor_multiplier=multiplier,
        rumor_multiplier_pct=mult_pct,
        impact_summary=impact_summary,
    )
