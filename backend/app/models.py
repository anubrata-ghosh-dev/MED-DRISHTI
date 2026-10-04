from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import sqlalchemy.orm as orm
from datetime import datetime
import enum

Base = declarative_base()

class RoleEnum(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    NURSE = "nurse"
    ADMIN = "admin"

class ConsentStatusEnum(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class RedFlagSeverityEnum(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class MedicalRecordTypeEnum(str, enum.Enum):
    LAB_REPORT = "lab_report"
    PRESCRIPTION = "prescription"
    DISCHARGE_SUMMARY = "discharge_summary"
    IMAGING = "imaging"
    OTHER = "other"

class AttentionStatusEnum(str, enum.Enum):
    ROUTINE = "routine"
    NEEDS_ATTENTION = "needs_attention"
    PRIORITY = "priority"
    CRITICAL = "critical"
    FOLLOW_UP = "follow_up"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.PATIENT)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    patients = relationship("Patient", back_populates="user")

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    preferred_language = Column(String, default="English")
    abha_id = Column(String, nullable=True, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="patients")
    sessions = relationship("ClinicalSession", back_populates="patient")
    consents = relationship("Consent", back_populates="patient")
    audit_logs = relationship("AuditLog", back_populates="patient")
    medical_records = relationship("MedicalRecord", back_populates="patient")

class Consent(Base):
    __tablename__ = "consents"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    consent_type = Column(String, nullable=False)
    status = Column(SQLEnum(ConsentStatusEnum), default=ConsentStatusEnum.PENDING)
    signed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    patient = relationship("Patient", back_populates="consents")

class ClinicalSession(Base):
    __tablename__ = "clinical_sessions"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    session_type = Column(String, default="intake")
    department = Column(String, default="General")
    status = Column(String, default="active")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Patient attention/priority status (physician-controlled)
    attention_status = Column(SQLEnum(AttentionStatusEnum), default=AttentionStatusEnum.ROUTINE)
    attention_reason = Column(Text, nullable=True)
    attention_note = Column(Text, nullable=True)
    attention_changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    attention_changed_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="sessions")

    # Structured Clinical History Relationships
    chief_complaints = relationship("ChiefComplaint", back_populates="session", cascade="all, delete-orphan")
    hpi = relationship("HPI", back_populates="session", cascade="all, delete-orphan")
    past_medical_histories = relationship("PastMedicalHistory", back_populates="session", cascade="all, delete-orphan")
    past_surgical_histories = relationship("PastSurgicalHistory", back_populates="session", cascade="all, delete-orphan")
    medication_histories = relationship("MedicationHistory", back_populates="session", cascade="all, delete-orphan")
    allergy_histories = relationship("AllergyHistory", back_populates="session", cascade="all, delete-orphan")
    family_histories = relationship("FamilyHistory", back_populates="session", cascade="all, delete-orphan")
    personal_histories = relationship("PersonalHistory", back_populates="session", cascade="all, delete-orphan")
    review_of_systems = relationship("ReviewOfSystems", back_populates="session", cascade="all, delete-orphan")
    ayush_histories = relationship("AyushHistory", back_populates="session", cascade="all, delete-orphan")

    # Patient statements (original language preservation)
    patient_statements = relationship("PatientStatement", back_populates="session", cascade="all, delete-orphan")

    # Ayurvedic assessments
    prakriti_assessments = relationship("PrakritiAssessment", back_populates="session", cascade="all, delete-orphan")
    vikriti_assessments = relationship("VikritAssessment", back_populates="session", cascade="all, delete-orphan")
    dashavidha_pariksha = relationship("DashavidhaPariksha", back_populates="session", cascade="all, delete-orphan")

    # Doctor notes
    doctor_notes = relationship("DoctorNote", back_populates="session", cascade="all, delete-orphan")

    documents = relationship("Document", back_populates="session")
    red_flags = relationship("RedFlag", back_populates="session")
    medical_records = relationship("MedicalRecord", back_populates="session")
    clinical_entities = relationship("ClinicalEntity", back_populates="session")


class PatientStatement(Base):
    """Stores original patient voice/text statements with full provenance."""
    __tablename__ = "patient_statements"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    original_text = Column(Text, nullable=False)
    original_language = Column(String, nullable=False, default="en")
    translated_text = Column(Text, nullable=True)  # English translation if original is not English
    structured_extraction = Column(Text, nullable=True)  # JSON of extracted symptoms/fields
    confidence = Column(Float, nullable=True)
    source = Column(String, default="text")  # 'text' | 'voice'
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="patient_statements")


class ChiefComplaint(Base):
    __tablename__ = "chief_complaints"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    complaint = Column(Text, nullable=False)
    original_text = Column(Text, nullable=True)        # Patient's original words (possibly non-English)
    original_language = Column(String, nullable=True)  # e.g. 'bn', 'hi', 'ta'
    duration = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    onset = Column(String, nullable=True)
    source = Column(String, default="patient_entered")  # patient_entered | ai_extracted | physician_entered
    ai_confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="chief_complaints")

class HPI(Base):
    __tablename__ = "hpi"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    onset = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    progression = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    character = Column(String, nullable=True)
    radiation = Column(String, nullable=True)
    aggravating_factors = Column(Text, nullable=True)
    relieving_factors = Column(Text, nullable=True)
    associated_symptoms = Column(Text, nullable=True)
    source = Column(String, default="patient_entered")  # patient_entered | ai_extracted | physician_entered
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="hpi")

class PastMedicalHistory(Base):
    __tablename__ = "past_medical_histories"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    condition = Column(String, nullable=False)
    date_of_diagnosis = Column(String, nullable=True)
    status = Column(String, nullable=True) # e.g., active, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="past_medical_histories")

class PastSurgicalHistory(Base):
    __tablename__ = "past_surgical_histories"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    procedure = Column(String, nullable=False)
    date = Column(String, nullable=True)
    hospital = Column(String, nullable=True)
    indication = Column(String, nullable=True)
    outcome = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="past_surgical_histories")

class MedicationHistory(Base):
    __tablename__ = "medication_histories"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    drug_name = Column(String, nullable=False)
    dose = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    route = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    status = Column(String, nullable=True) # current, discontinued
    source = Column(String, default="patient_entered")  # patient_entered | ocr_extracted | physician_entered
    ai_confidence = Column(Float, nullable=True)
    requires_verification = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="medication_histories")

class AllergyHistory(Base):
    __tablename__ = "allergy_histories"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    allergen = Column(String, nullable=False)
    reaction = Column(Text, nullable=True)
    type = Column(String, nullable=True) # drug, food, environmental
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="allergy_histories")

class FamilyHistory(Base):
    __tablename__ = "family_histories"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    condition = Column(String, nullable=False)
    relationship = Column(String, nullable=False)
    relevance = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = orm.relationship("ClinicalSession", back_populates="family_histories")

class PersonalHistory(Base):
    __tablename__ = "personal_histories"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    category = Column(String, nullable=False) # e.g., smoking, alcohol, diet
    value = Column(String, nullable=True)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="personal_histories")

class ReviewOfSystems(Base):
    __tablename__ = "review_of_systems"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    system = Column(String, nullable=False) # e.g., cardiovascular, respiratory
    finding = Column(Text, nullable=True)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="review_of_systems")

class AyushHistory(Base):
    __tablename__ = "ayush_histories"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    parameter = Column(String, nullable=False) # e.g., Prakriti, Vikriti, Sara, Agni
    value = Column(String, nullable=True)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="ayush_histories")


# ============ Ayurvedic Assessment Models ============

class PrakritiAssessment(Base):
    """Structured Prakriti (individual constitution) assessment."""
    __tablename__ = "prakriti_assessments"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    vata_score = Column(Integer, nullable=True)    # 0-100 percentage
    pitta_score = Column(Integer, nullable=True)
    kapha_score = Column(Integer, nullable=True)
    dominant_dosha = Column(String, nullable=True)   # vata | pitta | kapha | vata_pitta | etc.
    secondary_dosha = Column(String, nullable=True)
    assessment_method = Column(String, default="questionnaire")  # questionnaire | physician | ai_suggested
    questionnaire_responses = Column(Text, nullable=True)  # JSON of Q&A
    physician_notes = Column(Text, nullable=True)
    physician_confirmed = Column(Boolean, default=False)
    assessed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    assessed_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="prakriti_assessments")


class VikritAssessment(Base):
    """Vikriti (current imbalance / disease state) assessment."""
    __tablename__ = "vikriti_assessments"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    vata_imbalance = Column(String, nullable=True)   # normal | slightly_elevated | elevated | high
    pitta_imbalance = Column(String, nullable=True)
    kapha_imbalance = Column(String, nullable=True)
    primary_imbalance = Column(String, nullable=True)  # the most vitiated dosha
    agni_status = Column(String, nullable=True)       # sama | vishama | tikshna | manda
    ama_presence = Column(String, nullable=True)      # absent | mild | moderate | severe
    clinical_notes = Column(Text, nullable=True)
    physician_confirmed = Column(Boolean, default=False)
    assessed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    assessed_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="vikriti_assessments")


class DashavidhaPariksha(Base):
    """Dashavidha Pariksha — the 10-fold Ayurvedic clinical examination."""
    __tablename__ = "dashavidha_pariksha"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    # 1. Prakriti — individual constitution
    prakriti_notes = Column(Text, nullable=True)
    # 2. Vikriti — current disease state
    vikriti_notes = Column(Text, nullable=True)
    # 3. Sara — tissue quality (pravara/madhyama/avara)
    sara = Column(String, nullable=True)
    sara_notes = Column(Text, nullable=True)
    # 4. Samhanana — body compactness/build
    samhanana = Column(String, nullable=True)
    samhanana_notes = Column(Text, nullable=True)
    # 5. Pramana — body measurements/proportion
    pramana = Column(String, nullable=True)
    pramana_notes = Column(Text, nullable=True)
    # 6. Satmya — adaptability/wholesomeness
    satmya = Column(String, nullable=True)
    satmya_notes = Column(Text, nullable=True)
    # 7. Satva — mental/psychological strength
    satva = Column(String, nullable=True)  # pravara | madhyama | avara
    satva_notes = Column(Text, nullable=True)
    # 8. Ahara Shakti — digestive/metabolic capacity
    ahara_shakti = Column(String, nullable=True)
    ahara_shakti_notes = Column(Text, nullable=True)
    # 9. Vyayama Shakti — exercise/physical capacity
    vyayama_shakti = Column(String, nullable=True)
    vyayama_shakti_notes = Column(Text, nullable=True)
    # 10. Vaya — age category
    vaya = Column(String, nullable=True)  # bala | madhyama | vriddha
    vaya_notes = Column(Text, nullable=True)
    # Overall
    additional_notes = Column(Text, nullable=True)
    physician_confirmed = Column(Boolean, default=False)
    assessed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    assessed_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="dashavidha_pariksha")


class DoctorNote(Base):
    """Persistent physician notes for a clinical session."""
    __tablename__ = "doctor_notes"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    content = Column(Text, nullable=False)
    note_type = Column(String, default="general")  # general | assessment | plan | followup | ayurvedic
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="doctor_notes")


class ClinicalEntity(Base):
    __tablename__ = "clinical_entities"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    entity_type = Column(String, nullable=False)
    value = Column(String, nullable=False)
    normalized_value = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    confidence = Column(Float, default=1.0)
    source_text = Column(Text, nullable=True)
    verified = Column(Boolean, default=False)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="clinical_entities")
    document = relationship("Document")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String)
    s3_key = Column(String, nullable=True)
    ocr_text = Column(Text, nullable=True)
    upload_at = Column(DateTime, default=datetime.utcnow)
    document_date = Column(String, nullable=True)  # Extracted date from document
    is_handwritten = Column(Boolean, default=False)
    processing_status = Column(String, default="pending")  # pending | processing | completed | failed | needs_verification
    ocr_confidence = Column(Float, nullable=True)
    session = relationship("ClinicalSession", back_populates="documents")
    extracted_entities = relationship("ExtractedEntity", back_populates="document")

class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    entity_type = Column(String)
    entity_value = Column(String)
    confidence = Column(Float, default=0.0)
    source_text = Column(Text, nullable=True)
    extracted_at = Column(DateTime, default=datetime.utcnow)
    document = relationship("Document", back_populates="extracted_entities")

class RedFlag(Base):
    __tablename__ = "red_flags"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    rule_id = Column(String)
    description = Column(String)
    severity = Column(SQLEnum(RedFlagSeverityEnum), default=RedFlagSeverityEnum.MEDIUM)
    triggered_at = Column(DateTime, default=datetime.utcnow)
    reviewed = Column(Boolean, default=False)
    session = relationship("ClinicalSession", back_populates="red_flags")

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=True)
    record_type = Column(SQLEnum(MedicalRecordTypeEnum), default=MedicalRecordTypeEnum.OTHER)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    file_name = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    ocr_text = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    document_date = Column(String, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    extracted_entities_json = Column(Text, nullable=True)  # JSON string of extracted entities
    processing_status = Column(String, default="pending")  # pending | processing | completed | failed
    patient = relationship("Patient", back_populates="medical_records")
    session = relationship("ClinicalSession", back_populates="medical_records")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    action = Column(String)
    resource_type = Column(String)
    resource_id = Column(Integer)
    performed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)
    before_state = Column(Text, nullable=True)
    after_state = Column(Text, nullable=True)
    patient = relationship("Patient", back_populates="audit_logs")
