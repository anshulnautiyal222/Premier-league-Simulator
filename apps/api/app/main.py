from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import redis
import time

from app.api.v1.pricing import router as pricing_router
from app.api.v1.jobs import router as jobs_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Market Calculation Engine, AMM Liquidity, and Rumor Terminal for GafferDex"
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(pricing_router, prefix="/api/v1")
app.include_router(jobs_router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint checking Redis and service status."""
    redis_status = "unconfigured"
    if settings.REDIS_URL:
        try:
            r = redis.from_url(settings.REDIS_URL, socket_timeout=2)
            r.ping()
            redis_status = "connected"
        except Exception as e:
            redis_status = f"disconnected ({str(e)})"

    return {
        "status": "healthy",
        "timestamp": int(time.time()),
        "services": {
            "api": "online",
            "redis": redis_status,
            "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY),
            "football_data_configured": bool(settings.FOOTBALL_DATA_API_KEY)
        }
    }
