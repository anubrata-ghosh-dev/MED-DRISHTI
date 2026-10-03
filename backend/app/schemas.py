from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
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

class MedicalRecordTypeEnum(str, Enum):
    LAB_REPORT = "lab_report"
    PRESCRIPTION = "prescription"
    DISCHARGE_SUMMARY = "discharge_summary"
    IMAGING = "imaging"
    OTHER = "other"

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
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)

# Structured Clinical History Schemas

class ChiefComplaintCreate(BaseModel):
    complaint: str
    duration: Optional[str] = None
    severity: Optional[str] = None
    onset: Optional[str] = None

class ChiefComplaintResponse(BaseModel):
    id: int
    complaint: str
    duration: Optional[str] = None
    severity: Optional[str] = None
    onset: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class HPICreate(BaseModel):
    onset: Optional[str] = None
    duration: Optional[str] = None
    progression: Optional[str] = None
    location: Optional[str] = None
    character: Optional[str] = None
    radiation: Optional[str] = None
    aggravating_factors: Optional[str] = None
    relieving_factors: Optional[str] = None
    associated_symptoms: Optional[str] = None

class HPIResponse(BaseModel):
    id: int
    onset: Optional[str] = None
    duration: Optional[str] = None
    progression: Optional[str] = None
    location: Optional[str] = None
    character: Optional[str] = None
    radiation: Optional[str] = None
    aggravating_factors: Optional[str] = None
    relieving_factors: Optional[str] = None
    associated_symptoms: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PastMedicalHistoryCreate(BaseModel):
    condition: str
    date_of_diagnosis: Optional[str] = None
    status: Optional[str] = None

class PastMedicalHistoryResponse(BaseModel):
    id: int
    condition: str
    date_of_diagnosis: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PastSurgicalHistoryCreate(BaseModel):
    procedure: str
    date: Optional[str] = None
    hospital: Optional[str] = None
    indication: Optional[str] = None
    outcome: Optional[str] = None

class PastSurgicalHistoryResponse(BaseModel):
    id: int
    procedure: str
    date: Optional[str] = None
    hospital: Optional[str] = None
    indication: Optional[str] = None
    outcome: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class MedicationHistoryCreate(BaseModel):
    drug_name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None
    duration: Optional[str] = None
    status: Optional[str] = None

class MedicationHistoryResponse(BaseModel):
    id: int
    drug_name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None
    duration: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AllergyHistoryCreate(BaseModel):
    allergen: str
    reaction: Optional[str] = None
    type: Optional[str] = None

class AllergyHistoryResponse(BaseModel):
    id: int
    allergen: str
    reaction: Optional[str] = None
    type: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FamilyHistoryCreate(BaseModel):
    condition: str
    relationship: str
    relevance: Optional[str] = None

class FamilyHistoryResponse(BaseModel):
    id: int
    condition: str
    relationship: str
    relevance: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PersonalHistoryCreate(BaseModel):
    category: str
    value: Optional[str] = None
    detail: Optional[str] = None

class PersonalHistoryResponse(BaseModel):
    id: int
    category: str
    value: Optional[str] = None
    detail: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ReviewOfSystemsCreate(BaseModel):
    system: str
    finding: Optional[str] = None
    detail: Optional[str] = None

class ReviewOfSystemsResponse(BaseModel):
    id: int
    system: str
    finding: Optional[str] = None
    detail: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AyushHistoryCreate(BaseModel):
    parameter: str
    value: Optional[str] = None
    detail: Optional[str] = None

class AyushHistoryResponse(BaseModel):
    id: int
    parameter: str
    value: Optional[str] = None
    detail: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class StructuredClinicalHistoryCreate(BaseModel):
    chief_complaints: Optional[List[ChiefComplaintCreate]] = None
    hpi: Optional[List[HPICreate]] = None
    past_medical_histories: Optional[List[PastMedicalHistoryCreate]] = None
    past_surgical_histories: Optional[List[PastSurgicalHistoryCreate]] = None
    medication_histories: Optional[List[MedicationHistoryCreate]] = None
    allergy_histories: Optional[List[AllergyHistoryCreate]] = None
    family_histories: Optional[List[FamilyHistoryCreate]] = None
    personal_histories: Optional[List[PersonalHistoryCreate]] = None
    review_of_systems: Optional[List[ReviewOfSystemsCreate]] = None
    ayush_histories: Optional[List[AyushHistoryCreate]] = None

class StructuredClinicalHistoryResponse(BaseModel):
    chief_complaints: List[ChiefComplaintResponse] = []
    hpi: List[HPIResponse] = []
    past_medical_histories: List[PastMedicalHistoryResponse] = []
    past_surgical_histories: List[PastSurgicalHistoryResponse] = []
    medication_histories: List[MedicationHistoryResponse] = []
    allergy_histories: List[AllergyHistoryResponse] = []
    family_histories: List[FamilyHistoryResponse] = []
    personal_histories: List[PersonalHistoryResponse] = []
    review_of_systems: List[ReviewOfSystemsResponse] = []
    ayush_histories: List[AyushHistoryResponse] = []
    model_config = ConfigDict(from_attributes=True)

# Structured Clinical Entity Schemas
class ClinicalEntityCreate(BaseModel):
    entity_type: str
    value: str
    normalized_value: Optional[str] = None
    unit: Optional[str] = None
    confidence: float = 1.0
    source_text: Optional[str] = None

class ClinicalEntityResponse(BaseModel):
    id: int
    session_id: int
    document_id: Optional[int] = None
    entity_type: str
    value: str
    normalized_value: Optional[str] = None
    unit: Optional[str] = None
    confidence: float
    source_text: Optional[str] = None
    verified: bool
    verified_by: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Document Schemas
class DocumentResponse(BaseModel):
    id: int
    session_id: int
    file_name: str
    file_type: str
    s3_key: str
    ocr_text: Optional[str] = None
    upload_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Extracted Entity Schemas (Legacy)
class ExtractedEntityResponse(BaseModel):
    id: int
    document_id: int
    entity_type: str
    entity_value: str
    confidence: float
    source_text: Optional[str] = None
    extracted_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Red Flag Schemas
class RedFlagResponse(BaseModel):
    id: int
    session_id: int
    rule_id: str
    description: str
    severity: RedFlagSeverityEnum
    triggered_at: datetime
    reviewed: bool
    model_config = ConfigDict(from_attributes=True)

# Voice / Dialogue Schemas
class VoiceTranscribeResponse(BaseModel):
    text: str
    language_detected: str
    confidence: float

class NextQuestionRequest(BaseModel):
    session_id: int
    current_question_id: Optional[str] = None
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
    medical_records_count: int = 0
    model_config = ConfigDict(from_attributes=True)

# Session Verification Request Schema
class SessionVerifyRequest(BaseModel):
    chief_complaints: Optional[List[ChiefComplaintCreate]] = None
    hpi: Optional[List[HPICreate]] = None
    past_medical_histories: Optional[List[PastMedicalHistoryCreate]] = None
    past_surgical_histories: Optional[List[PastSurgicalHistoryCreate]] = None
    medication_histories: Optional[List[MedicationHistoryCreate]] = None
    allergy_histories: Optional[List[AllergyHistoryCreate]] = None
    family_histories: Optional[List[FamilyHistoryCreate]] = None
    personal_histories: Optional[List[PersonalHistoryCreate]] = None
    review_of_systems: Optional[List[ReviewOfSystemsCreate]] = None
    ayush_histories: Optional[List[AyushHistoryCreate]] = None
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
    model_config = ConfigDict(from_attributes=True)

# Medical Record Schemas
class MedicalRecordResponse(BaseModel):
    id: int
    patient_id: int
    session_id: Optional[int] = None
    record_type: MedicalRecordTypeEnum = MedicalRecordTypeEnum.OTHER
    title: Optional[str] = None
    description: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    ocr_text: Optional[str] = None
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)


# ============ Structured Error Response ============
class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: str
    details: Optional[Any] = None

class ErrorResponse(BaseModel):
    error: ErrorDetail

# ============ Document Quality Report ============
class DocumentQualityReport(BaseModel):
    is_viable: bool
    issues: List[str] = []
    blur_score: Optional[float] = None
    brightness: Optional[float] = None
    contrast: Optional[float] = None
    rotation_angle: Optional[float] = None
    glare_percentage: Optional[float] = None

# ============ Medical Timeline Schemas ============
class LabResultItem(BaseModel):
    test_name: str
    value: float
    unit: str
    reference_range: str
    is_abnormal: bool
    status: str = "NORMAL"  # NORMAL, LOW, HIGH, CRITICAL

class TimelineEvent(BaseModel):
    date: Optional[str] = None
    event_type: str  # intake_session, lab_report, prescription, imaging, discharge_summary
    title: str
    summary: Optional[str] = None
    source_document_id: Optional[int] = None
    entities: List[dict] = []
    lab_results: List[LabResultItem] = []

class PatientTimeline(BaseModel):
    patient_id: int
    events: List[TimelineEvent] = []

# ============ Triage Stats ============
class TriageStatsResponse(BaseModel):
    total_alerts: int = 0
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    reviewed: int = 0
    unreviewed: int = 0
