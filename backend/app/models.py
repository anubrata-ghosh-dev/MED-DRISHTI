from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
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


class Consent(Base):
    __tablename__ = "consents"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    consent_type = Column(String, nullable=False)  # data_processing, voice_recording, etc.
    status = Column(SQLEnum(ConsentStatusEnum), default=ConsentStatusEnum.PENDING)
    signed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="consents")


class ClinicalSession(Base):
    __tablename__ = "clinical_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    session_type = Column(String, default="intake")  # intake, follow-up, etc.
    status = Column(String, default="active")  # active, completed, abandoned
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    patient = relationship("Patient", back_populates="sessions")
    histories = relationship("ClinicalHistory", back_populates="session")
    documents = relationship("Document", back_populates="session")
    red_flags = relationship("RedFlag", back_populates="session")


class ClinicalHistory(Base):
    __tablename__ = "clinical_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    chief_complaint = Column(Text, nullable=True)
    history_of_present_illness = Column(Text, nullable=True)
    past_medical_history = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    family_history = Column(Text, nullable=True)
    social_history = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("ClinicalSession", back_populates="histories")


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String)  # pdf, jpg, png, etc.
    s3_key = Column(String, unique=True)  # Path in MinIO/S3
    ocr_text = Column(Text, nullable=True)  # Raw OCR output
    upload_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("ClinicalSession", back_populates="documents")
    extracted_entities = relationship("ExtractedEntity", back_populates="document")


class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    entity_type = Column(String)  # medication, lab_value, date, etc.
    entity_value = Column(String)
    confidence = Column(Float, default=0.0)  # 0.0 - 1.0
    source_text = Column(Text, nullable=True)  # Original text from OCR
    extracted_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="extracted_entities")


class RedFlag(Base):
    __tablename__ = "red_flags"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.id"), nullable=False)
    rule_id = Column(String)  # Identifier for the triggered rule
    description = Column(String)
    severity = Column(SQLEnum(RedFlagSeverityEnum), default=RedFlagSeverityEnum.MEDIUM)
    triggered_at = Column(DateTime, default=datetime.utcnow)
    reviewed = Column(Boolean, default=False)
    
    session = relationship("ClinicalSession", back_populates="red_flags")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    action = Column(String)  # view, edit, delete, etc.
    resource_type = Column(String)  # patient, document, etc.
    resource_id = Column(Integer)
    performed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)
    
    patient = relationship("Patient", back_populates="audit_logs")
