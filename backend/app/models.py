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

    documents = relationship("Document", back_populates="session")
    red_flags = relationship("RedFlag", back_populates="session")
    medical_records = relationship("MedicalRecord", back_populates="session")
    clinical_entities = relationship("ClinicalEntity", back_populates="session")

class ChiefComplaint(Base):
    __tablename__ = "chief_complaints"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    complaint = Column(Text, nullable=False)
    duration = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    onset = Column(String, nullable=True)
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
    parameter = Column(String, nullable=False) # e.g., Prakriti, Vikriti, Sara
    value = Column(String, nullable=True)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ClinicalSession", back_populates="ayush_histories")

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
    processing_status = Column(String, default="completed")  # pending, processing, completed, failed
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
    before_state = Column(Text, nullable=True) # Added for immutable audit trails
    after_state = Column(Text, nullable=True)  # Added for immutable audit trails
    patient = relationship("Patient", back_populates="audit_logs")
