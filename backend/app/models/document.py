from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, EmailStr


class SummaryStyle(str, Enum):
    BRIEF = "brief"
    DETAILED = "detailed"
    BULLET_POINTS = "bullet_points"


class AnalysisLevel(str, Enum):
    BASIC = "basic"
    STANDARD = "standard"
    DETAILED = "detailed"


class ExtractionFieldEnum(str, Enum):
    NAME = "name"
    EMAIL = "email"
    PHONE = "phone"
    SKILLS = "skills"
    EDUCATION = "education"
    WORK_EXPERIENCE = "work_experience"
    PROJECTS = "projects"
    CERTIFICATIONS = "certifications"


class EducationItem(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[str] = None
    gpa: Optional[str] = None
    highlights: List[str] = Field(default_factory=list)


class WorkExperienceItem(BaseModel):
    company: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)


class ProjectItem(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    link: Optional[str] = None


class StructuredResume(BaseModel):
    """Structured extraction format conforming to Phase 3 requirements."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    work_experience: List[WorkExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    key_findings: List[str] = Field(default_factory=list)
    uncertain_fields: List[str] = Field(default_factory=list)


class CompletenessScore(BaseModel):
    """Deterministic completeness scoring results."""
    completeness_percentage: float = 0.0
    present_required_fields: List[str] = Field(default_factory=list)
    missing_required_fields: List[str] = Field(default_factory=list)
    uncertain_fields: List[str] = Field(default_factory=list)
    total_required_fields: int = 5
    score_breakdown: Dict[str, bool] = Field(default_factory=dict)
    explanation: str = ""


class AnalysisRequest(BaseModel):
    summary_style: str = "detailed"  # brief, detailed, bullet_points
    analysis_level: str = "standard"  # basic, standard, detailed
    selected_fields: List[str] = Field(
        default_factory=lambda: [
            "name",
            "email",
            "phone",
            "skills",
            "education",
            "work_experience",
            "projects",
            "certifications",
        ]
    )


class AnalysisResult(BaseModel):
    summary_style: str
    analysis_level: str
    selected_fields: List[str]
    ai_summary: str
    structured_data: StructuredResume
    completeness: CompletenessScore
    missing_fields: List[str]
    uncertain_fields: List[str]
    model_used: str
    analyzed_at: str
    execution_time_ms: int


class DocumentRecord(BaseModel):
    """Document schema stored in MongoDB."""
    id: str
    filename: str
    file_type: str  # "pdf" or "txt"
    file_size_bytes: int
    upload_timestamp: str
    extracted_text: str
    page_count: int = 1
    word_count: int = 0
    char_count: int = 0
    processing_status: str = "uploaded"  # uploaded, analyzed, failed
    is_scanned: bool = False
    warning_message: Optional[str] = None
    analysis: Optional[AnalysisResult] = None
    error_message: Optional[str] = None


class HealthResponse(BaseModel):
    status: str  # "ok" or "degraded"
    service: str
    version: str
    timestamp: str
    python_version: str
    database: Dict[str, Any]
    groq_status: Dict[str, Any]
