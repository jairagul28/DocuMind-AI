import os
from unittest.mock import MagicMock, patch
import pytest
from app.models.document import AnalysisRequest
from app.services.groq_service import GroqService, GroqServiceError


def test_build_system_prompt_adaptive_levels():
    """Verify that different analysis levels and styles change the system prompt."""
    service = GroqService()

    # Basic level
    prompt_basic = service._build_system_prompt(
        summary_style="brief",
        analysis_level="basic",
        selected_fields=["name", "skills"],
    )
    assert "ANALYSIS LEVEL: BASIC" in prompt_basic
    assert "concise executive summary" in prompt_basic
    assert "name, skills" in prompt_basic

    # Detailed level
    prompt_detailed = service._build_system_prompt(
        summary_style="bullet_points",
        analysis_level="detailed",
        selected_fields=["name", "email", "certifications"],
    )
    assert "ANALYSIS LEVEL: DETAILED" in prompt_detailed
    assert "bullet-point summary" in prompt_detailed
    assert "certifications" in prompt_detailed


def test_empty_content_raises_error():
    """Verify empty document text raises GroqServiceError."""
    service = GroqService()
    req = AnalysisRequest(summary_style="brief", analysis_level="standard")
    with pytest.raises(GroqServiceError) as exc_info:
        service.analyze_document("", req)
    assert exc_info.value.code == "EMPTY_CONTENT"


def test_mocked_groq_analysis_success():
    """Verify mocked successful Groq completion parses JSON, validates schema, and scores completeness."""
    service = GroqService()
    service.client = MagicMock()

    mock_json_content = """
    {
      "ai_summary": "Priya Sharma is an experienced Cloud Architect.",
      "name": "Priya Sharma",
      "email": "priya@example.com",
      "phone": "+1-555-0199",
      "skills": ["AWS", "Kubernetes", "FastAPI"],
      "education": [
        {
          "institution": "University of Washington",
          "degree": "M.S.",
          "field_of_study": "Computer Science",
          "graduation_year": "2015"
        }
      ],
      "work_experience": [
        {
          "company": "TechSphere",
          "title": "Lead Architect",
          "start_date": "2021",
          "end_date": "Present",
          "responsibilities": ["Lead team of 14"]
        }
      ],
      "projects": [],
      "certifications": ["AWS Solutions Architect"],
      "key_findings": ["Extensive distributed systems experience"],
      "uncertain_fields": []
    }
    """

    mock_choice = MagicMock()
    mock_choice.message.content = mock_json_content
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]
    service.client.chat.completions.create.return_value = mock_completion
    service.client.models.list.return_value.data = [MagicMock(id="openai/gpt-oss-20b")]

    req = AnalysisRequest(
        summary_style="detailed",
        analysis_level="standard",
        selected_fields=["name", "email", "phone", "skills", "education", "work_experience", "certifications"],
    )

    result = service.analyze_document(
        extracted_text="Resume text of Priya Sharma",
        request=req,
    )

    assert result.ai_summary == "Priya Sharma is an experienced Cloud Architect."
    assert result.structured_data.name == "Priya Sharma"
    assert result.structured_data.email == "priya@example.com"
    assert len(result.structured_data.skills) == 3
    assert result.completeness.completeness_percentage == 100.0
    assert len(result.missing_fields) == 0

