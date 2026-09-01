from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum


class RoleEnum(str, Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    NURSE = "nurse"
    ADMIN = "admin"


class ConsentStatusEnum(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class RedFlagSeverityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: RoleEnum = RoleEnum.PATIENT


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1800


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: RoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True


# Patient Schemas
class PatientCreate(BaseModel):
    name: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: str = "English"
    abha_id: Optional[str] = None


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None
    abha_id: Optional[str] = None


class PatientResponse(BaseModel):
    id: int
    name: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: str
    abha_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# Consent Schemas
class ConsentCreate(BaseModel):
    consent_type: str
    expires_at: Optional[datetime] = None


class ConsentResponse(BaseModel):
    id: int
    patient_id: int
    consent_type: str
    status: ConsentStatusEnum
    signed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        orm_mode = True


# Clinical Session Schemas
class ClinicalSessionCreate(BaseModel):
    patient_id: Optional[int] = None
    session_type: str = "intake"


class ClinicalSessionUpdate(BaseModel):
    status: Optional[str] = None


class ClinicalSessionResponse(BaseModel):
    id: int
    patient_id: int
    session_type: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Clinical History Schemas
class ClinicalHistoryCreate(BaseModel):
    chief_complaint: Optional[str] = None
    history_of_present_illness: Optional[str] = None
    past_medical_history: Optional[str] = None
    medications: Optional[str] = None
    allergies: Optional[str] = None
    family_history: Optional[str] = None
    social_history: Optional[str] = None


class ClinicalHistoryUpdate(BaseModel):
    chief_complaint: Optional[str] = None
    history_of_present_illness: Optional[str] = None
    past_medical_history: Optional[str] = None
    medications: Optional[str] = None
    allergies: Optional[str] = None
    family_history: Optional[str] = None
    social_history: Optional[str] = None


class ClinicalHistoryResponse(BaseModel):
    id: int
    session_id: int
    chief_complaint: Optional[str] = None
    history_of_present_illness: Optional[str] = None
    past_medical_history: Optional[str] = None
    medications: Optional[str] = None
    allergies: Optional[str] = None
    family_history: Optional[str] = None
    social_history: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


# Document Schemas
class DocumentResponse(BaseModel):
    id: int
    session_id: int
    file_name: str
    file_type: str
    s3_key: str
    ocr_text: Optional[str] = None
    upload_at: datetime

    class Config:
        orm_mode = True


# Extracted Entity Schemas
class ExtractedEntityResponse(BaseModel):
    id: int
    document_id: int
    entity_type: str
    entity_value: str
    confidence: float
    source_text: Optional[str] = None
    extracted_at: datetime

    class Config:
        orm_mode = True


# Red Flag Schemas
class RedFlagResponse(BaseModel):
    id: int
    session_id: int
    rule_id: str
    description: str
    severity: RedFlagSeverityEnum
    triggered_at: datetime
    reviewed: bool

    class Config:
        orm_mode = True


# Voice / Dialogue Schemas
class VoiceTranscribeResponse(BaseModel):
    text: str
    language_detected: str
    confidence: float


class NextQuestionRequest(BaseModel):
    session_id: int
    current_question_id: Optional[str] = None  # None = get first question
    last_answer: Optional[str] = None
    language: str = "en"


class NextQuestionResponse(BaseModel):
    question_id: Optional[str]
    question_text: Optional[str]
    field: Optional[str]
    done: bool = False
    session_id: int


# Document Detail Schema
class DocumentDetailResponse(DocumentResponse):
    extracted_entities: List[ExtractedEntityResponse] = []


# Triage Review Request Schema
class RedFlagReviewRequest(BaseModel):
    reviewed: bool = True


# Doctor Queue Item Schema
class DoctorQueueItemResponse(BaseModel):
    session_id: int
    patient_id: int
    patient_name: str
    patient_gender: Optional[str] = None
    patient_dob: Optional[str] = None
    session_type: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    triage_status: str
    red_flags_count: int
    documents_count: int

    class Config:
        orm_mode = True


# Session Verification Request Schema
class SessionVerifyRequest(BaseModel):
    chief_complaint: Optional[str] = None
    history_of_present_illness: Optional[str] = None
    medications: Optional[str] = None
    allergies: Optional[str] = None
    physician_notes: Optional[str] = None


# Audit Log Schema
class AuditLogResponse(BaseModel):
    id: int
    patient_id: int
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    timestamp: datetime
    details: Optional[str] = None

    class Config:
        orm_mode = True


# Clinical Summary Schema
class ClinicalSummaryResponse(BaseModel):
    session_id: int
    patient_id: int
    chief_complaint: str
    hpi_summary: str
    medications: List[str]
    allergies: List[str]
    red_flags: List[dict]
    confidence_score: float
    generated_at: datetime

    class Config:
        orm_mode = True


