"""
P2P Trade Expiration Background Job for GafferDex.

Workflow:
1. Queries all PENDING trades where expires_at < NOW()
2. Updates their status to EXPIRED and sets resolved_at
3. Returns count of expired trades

This should be run periodically (e.g., every hour) via cron or scheduler.
"""

import logging
from datetime import datetime
from typing import Dict, Any

from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("gafferdex.trade_expirer")


def get_supabase_client():
    """Returns a Supabase client if configured, otherwise None."""
    try:
        from supabase import create_client
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
            return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:
        logger.warning(f"Failed to create Supabase client: {e}")
    return None


async def expire_trades_job() -> Dict[str, Any]:
    """
    Background job to expire pending P2P trades past their expiry time.
    
    Returns:
        Dict with status, timestamp, and count of expired trades
    """
    logger.info("Starting P2P trade expiration job...")
    
    supabase = get_supabase_client()
    if not supabase:
        logger.warning("Supabase not configured, skipping trade expiration")
        return {
            "status": "skipped",
            "timestamp": datetime.utcnow().isoformat(),
            "expired_count": 0,
            "reason": "Supabase not configured"
        }
    
    try:
        # Find all pending trades that have expired
        now = datetime.utcnow().isoformat()
        
        # First, fetch expired trades
        expired_trades = supabase.table("p2p_trades") \
            .select("*") \
            .eq("status", "PENDING") \
            .lt("expires_at", now) \
            .execute()
        
        if not expired_trades.data:
            logger.info("No expired trades found")
            return {
                "status": "success",
                "timestamp": now,
                "expired_count": 0,
                "message": "No expired trades"
            }
        
        trade_ids = [t["id"] for t in expired_trades.data]
        logger.info(f"Found {len(trade_ids)} expired trades")
        
        # Update all expired trades
        update_result = supabase.table("p2p_trades") \
            .update({
                "status": "EXPIRED",
                "resolved_at": now
            }) \
            .in_("id", trade_ids) \
            .execute()
        
        logger.info(f"Successfully expired {len(trade_ids)} trades")
        
        return {
            "status": "success",
            "timestamp": now,
            "expired_count": len(trade_ids),
            "trade_ids": trade_ids,
            "message": f"Expired {len(trade_ids)} P2P trades"
        }
        
    except Exception as e:
        logger.error(f"Error expiring trades: {e}")
        return {
            "status": "error",
            "timestamp": datetime.utcnow().isoformat(),
            "expired_count": 0,
            "error": str(e)
        }


if __name__ == "__main__":
    # Allow running directly for testing
    import asyncio
    result = asyncio.run(expire_trades_job())
    print(result)
