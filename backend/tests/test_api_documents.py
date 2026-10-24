import io
from fastapi.testclient import TestClient

from app.main import app
from app.models.document import (
    AnalysisResult,
    CompletenessScore,
    StructuredResume,
)


def issue_session(client):
    response = client.post("/api/session")
    assert response.status_code == 200
    client.headers.update({"X-Session-Token": response.json()["session_token"]})


def test_upload_valid_txt_document(client):
    """Verify upload endpoint parses TXT document and returns document metadata."""
    txt_content = b"Candidate: Sarah Connor\nEmail: sarah@skynet-resistance.org\nSkills: Leadership, Survival"
    files = {"file": ("sarah_resume.txt", io.BytesIO(txt_content), "text/plain")}

    response = client.post("/api/documents/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "document" in data
    doc = data["document"]
    assert doc["filename"] == "sarah_resume.txt"
    assert doc["file_type"] == "txt"
    assert doc["word_count"] > 0
    assert "Sarah Connor" in doc["preview"]


def test_upload_unsupported_file_extension(client):
    """Verify 400 error when uploading unsupported file format."""
    files = {"file": ("image.png", io.BytesIO(b"dummy png bytes"), "image/png")}
    response = client.post("/api/documents/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "Unsupported file type" in data["error"]["message"]


def test_upload_empty_file(client):
    """Verify 400 error when uploading empty file."""
    files = {"file": ("empty.txt", io.BytesIO(b""), "text/plain")}
    response = client.post("/api/documents/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "empty" in data["error"]["message"].lower()


def test_document_lifecycle_upload_get_delete(client):
    """Verify complete CRUD lifecycle: upload -> get by id -> delete -> verify 404."""
    # 1. Upload
    content = b"Candidate: Lifecycle Test\nEmail: life@cycle.com\nSkills: Testing"
    files = {"file": ("lifecycle.txt", io.BytesIO(content), "text/plain")}
    upload_res = client.post("/api/documents/upload", files=files)
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["document"]["id"]

    # 2. Get by ID
    get_res = client.get(f"/api/documents/{doc_id}")
    assert get_res.status_code == 200
    assert get_res.json()["document"]["id"] == doc_id
    assert get_res.json()["document"]["filename"] == "lifecycle.txt"

    # 3. Delete
    del_res = client.delete(f"/api/documents/{doc_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 4. Verify 404
    get_again = client.get(f"/api/documents/{doc_id}")
    assert get_again.status_code == 404


def test_sample_resumes_endpoints(client):
    """Verify sample list and load endpoints."""
    # 1. List samples
    list_res = client.get("/api/documents/samples/list")
    assert list_res.status_code == 200
    samples = list_res.json()["samples"]
    assert len(samples) == 3
    sample_ids = [s["id"] for s in samples]
    assert "complete" in sample_ids
    assert "missing_contact" in sample_ids
    assert "limited_experience" in sample_ids

    # 2. Load complete sample
    load_res = client.post("/api/documents/samples/load/complete")
    assert load_res.status_code == 200
    data = load_res.json()
    assert data["success"] is True
    assert "document" in data
    assert data["document"]["word_count"] > 50
    client.delete(f"/api/documents/{data['document']['id']}")


def test_documents_are_isolated_between_sessions(client):
    content = b"Private resume belonging only to session A."
    files = {"file": ("private_resume.txt", io.BytesIO(content), "text/plain")}
    upload = client.post("/api/documents/upload", files=files)
    assert upload.status_code == 201
    document_id = upload.json()["document"]["id"]

    with TestClient(app) as session_b:
        issue_session(session_b)

        assert session_b.get("/api/documents").json()["documents"] == []
        assert session_b.get(f"/api/documents/{document_id}").status_code == 404

        analysis_response = session_b.post(
            f"/api/documents/{document_id}/analyze",
            json={"summary_style": "brief", "analysis_level": "basic"},
        )
        assert analysis_response.status_code == 404
        assert session_b.delete(f"/api/documents/{document_id}").status_code == 404

    owner_documents = client.get("/api/documents").json()["documents"]
    assert len(owner_documents) == 1
    assert "owner_session" not in owner_documents[0]
    owner_detail = client.get(f"/api/documents/{document_id}")
    assert owner_detail.status_code == 200
    assert "owner_session" not in owner_detail.json()["document"]
    client.delete(f"/api/documents/{document_id}")


def test_document_analysis_is_available_only_to_owner(client, monkeypatch):
    files = {
        "file": (
            "analysis_resume.txt",
            io.BytesIO(b"Candidate: Session Owner\nSkills: Privacy testing"),
            "text/plain",
        )
    }
    upload = client.post("/api/documents/upload", files=files)
    assert upload.status_code == 201
    document_id = upload.json()["document"]["id"]

    result = AnalysisResult(
        summary_style="brief",
        analysis_level="basic",
        selected_fields=["name"],
        ai_summary="Private analysis",
        structured_data=StructuredResume(name="Session Owner"),
        completeness=CompletenessScore(completeness_percentage=20),
        missing_fields=[],
        uncertain_fields=[],
        model_used="test",
        analyzed_at="2026-01-01T00:00:00Z",
        execution_time_ms=1,
    )
    monkeypatch.setattr(
        "app.routes.documents.groq_service.analyze_document",
        lambda extracted_text, request: result,
    )
    analysis_request = {
        "summary_style": "brief",
        "analysis_level": "basic",
        "selected_fields": ["name"],
    }
    response = client.post(
        f"/api/documents/{document_id}/analyze", json=analysis_request
    )
    assert response.status_code == 200
    assert response.json()["analysis"]["ai_summary"] == "Private analysis"
    assert client.get("/api/documents").json()["documents"][0]["analysis"][
        "ai_summary"
    ] == "Private analysis"

    with TestClient(app) as session_b:
        issue_session(session_b)
        assert session_b.get("/api/documents").json()["documents"] == []
        denied = session_b.post(
            f"/api/documents/{document_id}/analyze", json=analysis_request
        )
        assert denied.status_code == 404

    client.delete(f"/api/documents/{document_id}")


def test_sample_document_is_owned_and_analyzable_by_loading_session(
    client, monkeypatch
):
    loaded = client.post("/api/documents/samples/load/complete")
    assert loaded.status_code == 200
    document_id = loaded.json()["document"]["id"]

    result = AnalysisResult(
        summary_style="brief",
        analysis_level="basic",
        selected_fields=["name"],
        ai_summary="Private sample analysis",
        structured_data=StructuredResume(name="Priya Sharma"),
        completeness=CompletenessScore(completeness_percentage=100),
        missing_fields=[],
        uncertain_fields=[],
        model_used="test",
        analyzed_at="2026-01-01T00:00:00Z",
        execution_time_ms=1,
    )
    monkeypatch.setattr(
        "app.routes.documents.groq_service.analyze_document",
        lambda extracted_text, request: result,
    )

    with TestClient(app) as session_b:
        issue_session(session_b)
        assert session_b.get("/api/documents").json()["documents"] == []
        assert session_b.get(f"/api/documents/{document_id}").status_code == 404

    analysis = client.post(
        f"/api/documents/{document_id}/analyze",
        json={"summary_style": "brief", "analysis_level": "basic"},
    )
    assert analysis.status_code == 200
    assert analysis.json()["analysis"]["ai_summary"] == "Private sample analysis"
    assert client.get("/api/documents").json()["count"] == 1
    client.delete(f"/api/documents/{document_id}")
