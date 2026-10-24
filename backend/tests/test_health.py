import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify root endpoint is reachable."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "DocuMind" in data["name"]
    assert data["health_check"] == "/api/health"


def test_health_endpoint_structure():
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
    assert "database" in data["database"]
    assert data["database"]["database"] == "document_intelligence"


def test_404_error_handling():
    """Verify 404 routes return centralized error format."""
    response = client.get("/api/non-existent-endpoint")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"


def test_documents_list_endpoint():
    """Verify documents list endpoint responds without crashing."""
    response = client.get("/api/documents")
    assert response.status_code == 200
    data = response.json()
    assert "documents" in data
    assert isinstance(data["documents"], list)

