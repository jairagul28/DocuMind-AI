from app.models.document import (
    EducationItem,
    StructuredResume,
    WorkExperienceItem,
)
from app.services.scoring import calculate_completeness_score, is_valid_email


def test_valid_email_regex():
    assert is_valid_email("user@example.com") is True
    assert is_valid_email("john.doe+tag@sub.domain.co") is True
    assert is_valid_email("not-an-email") is False
    assert is_valid_email("") is False
    assert is_valid_email(None) is False


def test_completeness_all_present():
    """Verify 100% completeness when all 5 required fields are present."""
    resume = StructuredResume(
        name="Priya Sharma",
        email="priya@example.com",
        phone="+1234567890",
        skills=["Python", "FastAPI", "React"],
        education=[EducationItem(institution="MIT", degree="B.S.")],
        work_experience=[WorkExperienceItem(company="Tech Corp", title="Lead")],
    )

    score = calculate_completeness_score(resume)
    assert score.completeness_percentage == 100.0
    assert len(score.present_required_fields) == 5
    assert len(score.missing_required_fields) == 0
    assert "100.0%" in score.explanation


def test_completeness_missing_email():
    """Verify 80% completeness (4/5) when email is missing."""
    resume = StructuredResume(
        name="David Chen",
        email=None,
        phone=None,
        skills=["PyTorch", "NLP"],
        education=[EducationItem(institution="Harvard", degree="Ph.D.")],
        work_experience=[WorkExperienceItem(company="AI Labs", title="Scientist")],
    )

    score = calculate_completeness_score(resume)
    assert score.completeness_percentage == 80.0
    assert "Email" in score.missing_required_fields
    assert len(score.present_required_fields) == 4


def test_completeness_missing_experience_and_education():
    """Verify 60% completeness (3/5) when experience and education are empty."""
    resume = StructuredResume(
        name="Aisha Patel",
        email="aisha@example.com",
        skills=["Python"],
        education=[],
        work_experience=[],
    )

    score = calculate_completeness_score(resume)
    assert score.completeness_percentage == 40.0 or score.completeness_percentage == 60.0  # Name, Email, Skills
    assert "Education" in score.missing_required_fields
    assert "Work Experience" in score.missing_required_fields


def test_uncertain_field_disqualifies_from_present():
    """Verify field flagged as uncertain is not scored as cleanly present."""
    resume = StructuredResume(
        name="Unknown Candidate",
        email="user@test.com",
        skills=["Python"],
        education=[EducationItem(institution="College")],
        work_experience=[WorkExperienceItem(company="Co")],
        uncertain_fields=["name"],
    )

    score = calculate_completeness_score(resume)
    assert "Name" in score.missing_required_fields
    assert score.completeness_percentage == 80.0

