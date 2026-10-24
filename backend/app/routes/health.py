import sys
from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import settings
from app.database import db_manager
from app.models.document import HealthResponse
from app.services.groq_service import groq_service

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Check health status of the API, MongoDB connectivity, and Groq LLM availability."""
    db_status = db_manager.check_connection()
    groq_status = groq_service.get_status()

    # Overall cluster status
    is_db_ok = db_status.get("connected", False)
    is_groq_ok = groq_status.get("status") in ("ready", "configured")

    if is_db_ok and is_groq_ok:
        overall_status = "ok"
    elif not is_db_ok:
        overall_status = "degraded"
    else:
        overall_status = "ok"

    return HealthResponse(
        status=overall_status,
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
        python_version=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        database=db_status,
        groq_status=groq_status,
    )
