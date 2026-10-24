import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        response = test_client.post("/api/session")
        assert response.status_code == 200
        test_client.headers.update(
            {"X-Session-Token": response.json()["session_token"]}
        )
        yield test_client
