"""External API services and data ingestion."""
from .football_api import FootballDataService, get_football_service

__all__ = ["FootballDataService", "get_football_service"]
