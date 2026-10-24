from fastapi import APIRouter, Response

from app.sessions import session_manager

router = APIRouter(prefix="/api", tags=["Session"])


@router.post("/session")
def create_session(response: Response) -> dict[str, str | int]:
    """Create an anonymous browser session and return its bearer token once."""
    response.headers["Cache-Control"] = "no-store"
    return {
        "session_token": session_manager.create_token(),
        "expires_in": session_manager.TOKEN_TTL_SECONDS,
    }
