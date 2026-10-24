import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import ValidationError

from app.database import db_manager
from app.errors import AppException, DocumentNotFoundError
from app.models.document import (
    AnalysisRequest,
    AnalysisResult,
    DocumentRecord,
)
from app.services.extractor import ExtractionError, process_document_buffer
from app.services.groq_service import GroqServiceError, groq_service
from app.sessions import get_session_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["Documents"])

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    session_id: str = Depends(get_session_id),
) -> Dict[str, Any]:
    """
    Upload and extract text from a PDF or TXT document (Max: 10 MB).
    Uses PyMuPDF for PDF documents and UTF-8 decoder for TXT documents.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename.",
        )

    # 1. Validate file extension
    lower_filename = file.filename.lower()
    allowed_exts = [".pdf", ".txt"]
    if not any(lower_filename.endswith(ext) for ext in allowed_exts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type for '{file.filename}'. Allowed formats: PDF (.pdf), TXT (.txt).",
        )

    # 2. Read bytes and enforce 10 MB maximum size
    try:
        content = await file.read()
    except Exception as err:
        logger.error("Failed to read upload stream (%s).", type(err).__name__)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {err}",
        )

    file_size = len(content)
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File '{file.filename}' ({file_size / (1024 * 1024):.2f} MB) exceeds maximum permitted size of 10 MB.",
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The uploaded file '{file.filename}' is empty (0 bytes).",
        )

    # 3. Extract text using PyMuPDF / text decoder
    try:
        extraction_data = process_document_buffer(
            file_bytes=content,
            filename=file.filename,
            content_type=file.content_type or "",
        )
    except ExtractionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Extraction error: {exc.message}",
        )
    except Exception as exc:
        logger.error(
            "Unexpected document processing error (%s).", type(exc).__name__
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal document extraction error occurred.",
        )

    doc_id = str(uuid.uuid4())
    upload_time = datetime.now(timezone.utc).isoformat()

    doc_payload: Dict[str, Any] = {
        "id": doc_id,
        "filename": file.filename,
        "file_type": extraction_data.get("file_type", "txt"),
        "file_size_bytes": file_size,
        "upload_timestamp": upload_time,
        "extracted_text": extraction_data.get("text", ""),
        "page_count": extraction_data.get("page_count", 1),
        "word_count": extraction_data.get("word_count", 0),
        "char_count": extraction_data.get("char_count", 0),
        "processing_status": "uploaded",
        "is_scanned": extraction_data.get("is_scanned", False),
        "warning_message": extraction_data.get("warning_message"),
        "analysis": None,
    }

    # 4. Save to MongoDB
    db_manager.insert_document(doc_payload, owner_session=session_id)

    # Return summary response
    preview_length = 1200
    text_preview = doc_payload["extracted_text"][:preview_length]
    if len(doc_payload["extracted_text"]) > preview_length:
        text_preview += "..."

    return {
        "success": True,
        "message": "Document uploaded and parsed successfully.",
        "document": {
            "id": doc_id,
            "filename": file.filename,
            "file_type": doc_payload["file_type"],
            "file_size_bytes": file_size,
            "upload_timestamp": upload_time,
            "page_count": doc_payload["page_count"],
            "word_count": doc_payload["word_count"],
            "char_count": doc_payload["char_count"],
            "processing_status": "uploaded",
            "is_scanned": doc_payload["is_scanned"],
            "warning_message": doc_payload["warning_message"],
            "preview": text_preview,
        },
    }


@router.get("", response_model=Dict[str, Any])
def list_documents(session_id: str = Depends(get_session_id)) -> Dict[str, Any]:
    """Retrieve all uploaded documents ordered by timestamp descending."""
    try:
        docs = db_manager.list_documents(owner_session=session_id)
        # Sanitize text preview to avoid oversized lists
        summarized_docs = []
        for d in docs:
            item = d.copy()
            item.pop("owner_session", None)
            full_text = item.pop("extracted_text", "")
            item["text_snippet"] = full_text[:200] + ("..." if len(full_text) > 200 else "")
            summarized_docs.append(item)

        return {
            "success": True,
            "count": len(summarized_docs),
            "documents": summarized_docs,
        }
    except Exception as err:
        logger.error("Failed to query documents list (%s).", type(err).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database query error.",
        )


@router.get("/{document_id}", response_model=Dict[str, Any])
def get_document(
    document_id: str,
    session_id: str = Depends(get_session_id),
) -> Dict[str, Any]:
    """Retrieve a single document by ID."""
    if not document_id or len(document_id.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid document ID is required.",
        )

    doc = db_manager.get_document(document_id.strip(), owner_session=session_id)
    if not doc:
        raise DocumentNotFoundError(document_id)

    doc.pop("owner_session", None)
    return {
        "success": True,
        "document": doc,
    }


@router.delete("/{document_id}", response_model=Dict[str, Any])
def delete_document(
    document_id: str,
    session_id: str = Depends(get_session_id),
) -> Dict[str, Any]:
    """Delete a document by ID."""
    if not document_id or len(document_id.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid document ID is required.",
        )

    deleted = db_manager.delete_document(
        document_id.strip(), owner_session=session_id
    )
    if not deleted:
        raise DocumentNotFoundError(document_id)

    return {
        "success": True,
        "message": f"Document with ID '{document_id}' was successfully deleted.",
        "id": document_id,
    }


@router.post("/{document_id}/analyze", response_model=Dict[str, Any])
def analyze_document_endpoint(
    document_id: str,
    request: AnalysisRequest,
    session_id: str = Depends(get_session_id),
) -> Dict[str, Any]:
    """
    Run Groq LLM intelligence analysis on an uploaded document.
    Generates AI summary, extracts structured JSON entities, calculates completeness,
    and updates document in MongoDB.
    """
    doc = db_manager.get_document(document_id, owner_session=session_id)
    if not doc:
        raise DocumentNotFoundError(document_id)

    extracted_text = doc.get("extracted_text", "")
    if not extracted_text or not extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot analyze document because no readable text was extracted from it.",
        )

    try:
        analysis_result = groq_service.analyze_document(
            extracted_text=extracted_text,
            request=request,
        )
    except GroqServiceError as gse:
        logger.error("Groq analysis failed with code %s.", gse.code)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq AI error: {gse.message}",
        )
    except Exception as exc:
        logger.error(
            "Unexpected document analysis error (%s).", type(exc).__name__
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal document analysis error occurred.",
        )

    # Update document in MongoDB
    analysis_dict = analysis_result.model_dump()
    db_manager.update_document(
        doc_id=document_id,
        owner_session=session_id,
        updates={
            "processing_status": "analyzed",
            "analysis": analysis_dict,
            "last_analyzed_at": analysis_result.analyzed_at,
        },
    )

    return {
        "success": True,
        "document_id": document_id,
        "analysis": analysis_dict,
    }


@router.get("/samples/list", response_model=Dict[str, Any])
def list_sample_resumes() -> Dict[str, Any]:
    """Return available sample resumes for fast testing in the UI."""
    return {
        "success": True,
        "samples": [
            {
                "id": "complete",
                "name": "Priya Sharma — Complete Senior Architect Resume",
                "description": "Full CV with Name, Email, Phone, Skills, Education, Experience, Projects, and Certifications. Expected Completeness: 100%.",
                "filename": "sample_resume_complete.pdf",
                "txt_filename": "complete_resume.txt",
            },
            {
                "id": "missing_contact",
                "name": "David Chen — Researcher (Missing Contact Details)",
                "description": "High skills and PhD education, but intentionally missing Email and Phone to test missing-field detection and completeness scoring. Expected Completeness: 80%.",
                "filename": "sample_resume_missing_contact.pdf",
                "txt_filename": "missing_contact_resume.txt",
            },
            {
                "id": "limited_experience",
                "name": "Aisha Patel — Junior Developer (Limited Experience)",
                "description": "Fresh graduate CV with contact info, skills, education, and projects, but minimal work experience (internship only).",
                "filename": "sample_resume_limited_experience.pdf",
                "txt_filename": "limited_experience_resume.txt",
            },
        ],
    }


@router.post("/samples/load/{sample_key}", response_model=Dict[str, Any])
def load_sample_document(
    sample_key: str,
    session_id: str = Depends(get_session_id),
) -> Dict[str, Any]:
    """Directly stage one of the 3 fictional sample resumes into the system."""
    sample_map = {
        "complete": ("sample_documents/sample_resume_complete.pdf", "Priya_Sharma_Resume.pdf"),
        "missing_contact": ("sample_documents/sample_resume_missing_contact.pdf", "David_Chen_Resume.pdf"),
        "limited_experience": ("sample_documents/sample_resume_limited_experience.pdf", "Aisha_Patel_Resume.pdf"),
    }

    if sample_key not in sample_map:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown sample key '{sample_key}'. Choose from: complete, missing_contact, limited_experience.",
        )

    file_rel_path, target_filename = sample_map[sample_key]
    base_dir = Path(__file__).resolve().parent.parent.parent.parent
    file_path = base_dir / file_rel_path

    if not file_path.exists():
        # Fall back to txt version if pdf not found
        txt_path = base_dir / f"sample_documents/{sample_key}_resume.txt"
        if txt_path.exists():
            file_path = txt_path
            target_filename = f"{sample_key}_resume.txt"
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sample file '{file_rel_path}' not found on server.",
            )

    content = file_path.read_bytes()
    extraction_data = process_document_buffer(
        file_bytes=content,
        filename=target_filename,
        content_type="application/pdf" if target_filename.endswith(".pdf") else "text/plain",
    )

    doc_id = str(uuid.uuid4())
    upload_time = datetime.now(timezone.utc).isoformat()

    doc_payload: Dict[str, Any] = {
        "id": doc_id,
        "filename": target_filename,
        "file_type": extraction_data.get("file_type", "pdf"),
        "file_size_bytes": len(content),
        "upload_timestamp": upload_time,
        "extracted_text": extraction_data.get("text", ""),
        "page_count": extraction_data.get("page_count", 1),
        "word_count": extraction_data.get("word_count", 0),
        "char_count": extraction_data.get("char_count", 0),
        "processing_status": "uploaded",
        "is_scanned": extraction_data.get("is_scanned", False),
        "warning_message": extraction_data.get("warning_message"),
        "analysis": None,
    }

    db_manager.insert_document(doc_payload, owner_session=session_id)

    return {
        "success": True,
        "message": f"Sample document '{target_filename}' loaded and parsed successfully.",
        "document": {
            "id": doc_id,
            "filename": target_filename,
            "file_type": doc_payload["file_type"],
            "file_size_bytes": len(content),
            "upload_timestamp": upload_time,
            "page_count": doc_payload["page_count"],
            "word_count": doc_payload["word_count"],
            "char_count": doc_payload["char_count"],
            "preview": doc_payload["extracted_text"][:1200],
        },
    }
