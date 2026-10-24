import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_root_endpoint(client):
    """Verify root endpoint is reachable."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "DocuMind" in data["name"]
    assert data["health_check"] == "/api/health"


def test_health_endpoint_structure(client):
    """Verify health endpoint responds with required schema fields."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ("ok", "degraded")
    assert data["service"] == "DocuMind AI"
    assert "version" in data
    assert "timestamp" in data
    assert "python_version" in data
    assert "database" in data
    assert "connected" in data["database"]
    assert set(data["database"]) == {"connected", "fallback_active"}


@pytest.mark.parametrize(
    "origin",
    [
        "https://documind-ai-platform.vercel.app",
        "https://documind-ai-ashy.vercel.app",
        "http://localhost:5173",
    ],
)
def test_health_endpoint_allows_frontend_origins(client, origin):
    response = client.get(
        "/api/health",
        headers={"Origin": origin},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


def test_document_upload_cors_preflight(client):
    response = client.options(
        "/api/documents/upload",
        headers={
            "Origin": "https://documind-ai-platform.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,x-session-token",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "https://documind-ai-platform.vercel.app"
    )
    assert "POST" in response.headers["access-control-allow-methods"]
    allowed_headers = response.headers["access-control-allow-headers"].lower()
    assert "content-type" in allowed_headers
    assert "x-session-token" in allowed_headers
    assert "access-control-allow-credentials" not in response.headers


def test_404_error_handling(client):
    """Verify 404 routes return centralized error format."""
    response = client.get("/api/non-existent-endpoint")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"


def test_documents_list_endpoint(client):
    """Verify documents list endpoint responds without crashing."""
    response = client.get("/api/documents")
    assert response.status_code == 200
    data = response.json()
    assert "documents" in data
    assert isinstance(data["documents"], list)


def test_documents_require_valid_session():
    with TestClient(app) as anonymous_client:
        response = anonymous_client.get("/api/documents")

    assert response.status_code == 401


def test_expired_session_token_is_rejected():
    from app.sessions import AnonymousSessionManager

    manager = AnonymousSessionManager()
    manager.TOKEN_TTL_SECONDS = -1
    token = manager.create_token()

    assert manager.validate_token(token) is None
    assert manager.validate_token("not-a-session-token") is None
