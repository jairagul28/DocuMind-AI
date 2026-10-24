import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_upload_valid_txt_document():
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


def test_upload_unsupported_file_extension():
    """Verify 400 error when uploading unsupported file format."""
    files = {"file": ("image.png", io.BytesIO(b"dummy png bytes"), "image/png")}
    response = client.post("/api/documents/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "Unsupported file type" in data["error"]["message"]


def test_upload_empty_file():
    """Verify 400 error when uploading empty file."""
    files = {"file": ("empty.txt", io.BytesIO(b""), "text/plain")}
    response = client.post("/api/documents/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "empty" in data["error"]["message"].lower()


def test_document_lifecycle_upload_get_delete():
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


def test_sample_resumes_endpoints():
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

