import re
from typing import Any, Dict, List
from app.models.document import CompletenessScore, StructuredResume

EMAIL_REGEX = re.compile(r"^[\w\.\+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$")


def is_valid_email(email_str: str) -> bool:
    """Validate email format using standard RFC-compliant regex."""
    if not email_str or not isinstance(email_str, str):
        return False
    return bool(EMAIL_REGEX.match(email_str.strip()))


def calculate_completeness_score(
    structured_data: StructuredResume,
) -> CompletenessScore:
    """
    Compute deterministic completeness score according to Phase 4 rules:

    Required fields (5):
    1. Name (non-empty string)
    2. Email (valid email format)
    3. Skills (non-empty list)
    4. Education (non-empty list of items)
    5. Work experience (non-empty list of items)

    Formula:
    Completeness percentage = (number of present required fields / 5) * 100
    """
    score_breakdown: Dict[str, bool] = {}
    present_fields: List[str] = []
    missing_fields: List[str] = []
    uncertain_fields: List[str] = list(structured_data.uncertain_fields or [])

    # 1. Name
    name_present = bool(
        structured_data.name
        and isinstance(structured_data.name, str)
        and len(structured_data.name.strip()) > 1
        and "name" not in uncertain_fields
    )
    score_breakdown["name"] = name_present
    if name_present:
        present_fields.append("Name")
    else:
        missing_fields.append("Name")

    # 2. Email
    raw_email = (structured_data.email or "").strip()
    email_present = bool(
        raw_email
        and is_valid_email(raw_email)
        and "email" not in uncertain_fields
    )
    score_breakdown["email"] = email_present
    if email_present:
        present_fields.append("Email")
    else:
        missing_fields.append("Email")

    # 3. Skills
    skills_present = bool(
        structured_data.skills
        and isinstance(structured_data.skills, list)
        and len(structured_data.skills) > 0
        and "skills" not in uncertain_fields
    )
    score_breakdown["skills"] = skills_present
    if skills_present:
        present_fields.append("Skills")
    else:
        missing_fields.append("Skills")

    # 4. Education
    edu_present = bool(
        structured_data.education
        and isinstance(structured_data.education, list)
        and len(structured_data.education) > 0
        and "education" not in uncertain_fields
    )
    score_breakdown["education"] = edu_present
    if edu_present:
        present_fields.append("Education")
    else:
        missing_fields.append("Education")

    # 5. Work Experience
    exp_present = bool(
        structured_data.work_experience
        and isinstance(structured_data.work_experience, list)
        and len(structured_data.work_experience) > 0
        and "work_experience" not in uncertain_fields
    )
    score_breakdown["work_experience"] = exp_present
    if exp_present:
        present_fields.append("Work Experience")
    else:
        missing_fields.append("Work Experience")

    present_count = sum(1 for val in score_breakdown.values() if val)
    percentage = round((present_count / 5.0) * 100.0, 1)

    explanation = (
        f"Completeness is calculated as ({present_count} / 5) × 100 = {percentage}%. "
        "This metric measures the presence of standard required resume sections (Name, Email, Skills, "
        "Education, and Work Experience) and is an objective indicator of document structural completeness, "
        "NOT an evaluation of candidate talent or qualification."
    )

    return CompletenessScore(
        completeness_percentage=percentage,
        present_required_fields=present_fields,
        missing_required_fields=missing_fields,
        uncertain_fields=uncertain_fields,
        total_required_fields=5,
        score_breakdown=score_breakdown,
        explanation=explanation,
    )

