import io
import logging
from typing import Any, Dict, Tuple
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


class ExtractionError(Exception):
    """Custom exception raised when document text extraction fails."""

    def __init__(self, message: str, code: str = "EXTRACTION_FAILED"):
        super().__init__(message)
        self.message = message
        self.code = code


def extract_text_from_pdf(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Extract text and metadata from PDF bytes using PyMuPDF.

    Handles:
    - Empty PDFs (0 bytes or 0 pages)
    - Corrupted PDFs
    - Encrypted / password-protected PDFs
    - Scanned / image-only PDFs
    """
    if not file_bytes or len(file_bytes) == 0:
        raise ExtractionError("The uploaded PDF file is empty (0 bytes).", code="EMPTY_FILE")

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as err:
        logger.warning("Corrupted or unreadable PDF: %s (%s)", filename, err)
        raise ExtractionError(
            f"Unable to read PDF file '{filename}'. The file appears corrupted or not in standard PDF format.",
            code="CORRUPTED_PDF",
        )

    # Check for encryption
    if doc.is_encrypted:
        doc.close()
        raise ExtractionError(
            f"The PDF file '{filename}' is password-protected or encrypted. Please upload an unlocked PDF.",
            code="ENCRYPTED_PDF",
        )

    page_count = doc.page_count
    if page_count == 0:
        doc.close()
        raise ExtractionError(f"PDF '{filename}' contains 0 pages.", code="EMPTY_PDF")

    extracted_pages = []
    total_chars = 0

    for page_idx in range(page_count):
        try:
            page = doc.load_page(page_idx)
            # Extract plain text preserving reading order
            page_text = page.get_text("text") or ""
            cleaned_text = page_text.strip()
            total_chars += len(cleaned_text)
            extracted_pages.append(cleaned_text)
        except Exception as page_err:
            logger.warning("Error reading page %d of %s: %s", page_idx + 1, filename, page_err)
            extracted_pages.append("")

    doc.close()

    full_text = "\n\n".join(extracted_pages).strip()
    word_count = len(full_text.split()) if full_text else 0

    # Detect scanned / image-only PDFs
    is_scanned = False
    warning_message = None

    if total_chars < 20 and page_count > 0:
        is_scanned = True
        warning_message = (
            "This PDF appears to be a scanned or image-only document with no embedded digital text layer. "
            "Optical Character Recognition (OCR) is required to process non-digital scans."
        )

    return {
        "text": full_text,
        "page_count": page_count,
        "word_count": word_count,
        "char_count": total_chars,
        "is_scanned": is_scanned,
        "warning_message": warning_message,
    }


def extract_text_from_txt(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Extract text and metadata from TXT bytes.

    Handles:
    - Empty files
    - UTF-8 decoding
    - Fallback encodings (latin-1, utf-16)
    """
    if not file_bytes or len(file_bytes) == 0:
        raise ExtractionError("The uploaded text file is empty (0 bytes).", code="EMPTY_FILE")

    decoded_text = ""
    encodings_to_try = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "utf-16"]

    for enc in encodings_to_try:
        try:
            decoded_text = file_bytes.decode(enc)
            break
        except (UnicodeDecodeError, LookupError):
            continue

    if not decoded_text:
        raise ExtractionError(
            f"Could not decode text file '{filename}'. Invalid or unsupported character encoding.",
            code="INVALID_ENCODING",
        )

    cleaned_text = decoded_text.strip()
    if not cleaned_text:
        raise ExtractionError(
            f"The text file '{filename}' contains only whitespace characters.",
            code="EMPTY_CONTENT",
        )

    word_count = len(cleaned_text.split())

    return {
        "text": cleaned_text,
        "page_count": 1,
        "word_count": word_count,
        "char_count": len(cleaned_text),
        "is_scanned": False,
        "warning_message": None,
    }


def process_document_buffer(
    file_bytes: bytes,
    filename: str,
    content_type: str = "",
) -> Dict[str, Any]:
    """
    Unified extraction router based on file extension and mime type.
    """
    lower_name = filename.lower()

    if lower_name.endswith(".pdf") or "pdf" in content_type:
        result = extract_text_from_pdf(file_bytes, filename)
        result["file_type"] = "pdf"
        return result

    if lower_name.endswith(".txt") or "text/plain" in content_type:
        result = extract_text_from_txt(file_bytes, filename)
        result["file_type"] = "txt"
        return result

    raise ExtractionError(
        f"Unsupported file format for '{filename}'. Supported types are PDF (.pdf) and TXT (.txt).",
        code="UNSUPPORTED_FORMAT",
    )

