import fitz
import pytest
from app.services.extractor import (
    ExtractionError,
    extract_text_from_pdf,
    extract_text_from_txt,
    process_document_buffer,
)


def create_dummy_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 50), text, fontsize=11)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes


def test_pdf_extraction_valid():
    """Verify PyMuPDF extracts text and computes word count from valid PDF."""
    pdf_bytes = create_dummy_pdf("Jane Doe\nSenior Python Engineer\nSkills: FastAPI, React, Docker")
    result = extract_text_from_pdf(pdf_bytes, "resume.pdf")

    assert result["page_count"] == 1
    assert "Jane Doe" in result["text"]
    assert "Senior Python Engineer" in result["text"]
    assert result["word_count"] > 5
    assert result["char_count"] > 20
    assert result["is_scanned"] is False


def test_txt_extraction_valid():
    """Verify UTF-8 text extraction from valid text buffer."""
    txt_bytes = "John Smith\nEmail: john@example.com\nSkills: Python, Go".encode("utf-8")
    result = extract_text_from_txt(txt_bytes, "resume.txt")

    assert result["page_count"] == 1
    assert "John Smith" in result["text"]
    assert "john@example.com" in result["text"]
    assert result["word_count"] == 7


def test_empty_pdf_raises_error():
    """Verify empty PDF buffer raises clean ExtractionError."""
    with pytest.raises(ExtractionError) as exc_info:
        extract_text_from_pdf(b"", "empty.pdf")
    assert exc_info.value.code == "EMPTY_FILE"


def test_corrupted_pdf_raises_error():
    """Verify corrupted non-PDF bytes raise CORRUPTED_PDF error."""
    corrupted_bytes = b"This is definitely not a real PDF file header."
    with pytest.raises(ExtractionError) as exc_info:
        extract_text_from_pdf(corrupted_bytes, "broken.pdf")
    assert exc_info.value.code == "CORRUPTED_PDF"


def test_empty_txt_raises_error():
    """Verify empty TXT buffer raises clean ExtractionError."""
    with pytest.raises(ExtractionError) as exc_info:
        extract_text_from_txt(b"", "empty.txt")
    assert exc_info.value.code == "EMPTY_FILE"


def test_scanned_pdf_detection():
    """Verify PDFs with no embedded text are flagged as scanned/image-only."""
    # Create empty page without text
    doc = fitz.open()
    doc.new_page(width=595, height=842)
    pdf_bytes = doc.write()
    doc.close()

    result = extract_text_from_pdf(pdf_bytes, "scanned.pdf")
    assert result["is_scanned"] is True
    assert "Optical Character Recognition (OCR) is required" in result["warning_message"]


def test_process_document_buffer_unsupported_format():
    """Verify unsupported formats raise UNSUPPORTED_FORMAT error."""
    with pytest.raises(ExtractionError) as exc_info:
        process_document_buffer(b"some content", "document.xyz")
    assert exc_info.value.code == "UNSUPPORTED_FORMAT"

