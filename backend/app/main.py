import json
import os
from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from . import models, database, auth, schemas
from . import voice as voice_module
from . import ocr as ocr_module
from . import summary as summary_module
from . import red_flag_engine


app = FastAPI(
    title="Med-Drishti Backend",
    version="0.1.0",
    description="AI-powered clinical intake system"
)

# Create tables at startup
models.Base.metadata.create_all(bind=database.engine)


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> models.User:
    """Get current authenticated user from JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    payload = auth.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first() if user_id is not None else None
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


# ============ Health Check ============
@app.get("/api/v1/health")
def health():
    """Health check endpoint"""
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


# ============ Auth Endpoints ============
@app.post("/api/v1/auth/register", response_model=schemas.TokenResponse)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = models.User(
        email=payload.email,
        hashed_password=auth.hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@app.post("/api/v1/auth/login", response_model=schemas.TokenResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login user and get access token"""
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    # Generate token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@app.post("/api/v1/auth/logout")
def logout(current_user: models.User = Depends(get_current_user)):
    """Logout (token invalidation handled client-side)"""
    return {"message": "Logged out successfully"}


# ============ Patient Endpoints ============
@app.post("/api/v1/patients", response_model=schemas.PatientResponse)
def create_patient(
    payload: schemas.PatientCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new patient"""
    patient = models.Patient(
        user_id=current_user.id if current_user.role == models.RoleEnum.PATIENT else None,
        name=payload.name,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        phone=payload.phone,
        preferred_language=payload.preferred_language,
        abha_id=payload.abha_id,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@app.get("/api/v1/patients/{patient_id}", response_model=schemas.PatientResponse)
def get_patient(
    patient_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get patient by ID"""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check authorization: patients can only view their own records
    if current_user.role == models.RoleEnum.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return patient


@app.put("/api/v1/patients/{patient_id}", response_model=schemas.PatientResponse)
def update_patient(
    patient_id: int,
    payload: schemas.PatientUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update patient record"""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check authorization
    if current_user.role == models.RoleEnum.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update fields
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    db.commit()
    db.refresh(patient)
    return patient


# ============ Clinical Session Endpoints ============
@app.post("/api/v1/sessions", response_model=schemas.ClinicalSessionResponse)
def create_session(
    patient_id: int,
    payload: schemas.ClinicalSessionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new clinical session"""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check authorization
    if current_user.role == models.RoleEnum.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    session = models.ClinicalSession(
        patient_id=patient_id,
        session_type=payload.session_type
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@app.get("/api/v1/sessions/{session_id}", response_model=schemas.ClinicalSessionResponse)
def get_session(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get clinical session by ID"""
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check authorization
    if current_user.role == models.RoleEnum.PATIENT and session.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return session


@app.put("/api/v1/sessions/{session_id}", response_model=schemas.ClinicalSessionResponse)
def update_session(
    session_id: int,
    payload: schemas.ClinicalSessionUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update clinical session status"""
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check authorization (doctors/nurses can update)
    if current_user.role == models.RoleEnum.PATIENT:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if payload.status:
        session.status = payload.status
        if payload.status == "completed":
            session.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(session)
    return session


# ============ Clinical History Endpoints ============
@app.post("/api/v1/sessions/{session_id}/history", response_model=schemas.ClinicalHistoryResponse)
def create_clinical_history(
    session_id: int,
    payload: schemas.ClinicalHistoryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update clinical history for a session"""
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check authorization
    if current_user.role == models.RoleEnum.PATIENT and session.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    history = models.ClinicalHistory(
        session_id=session_id,
        chief_complaint=payload.chief_complaint,
        history_of_present_illness=payload.history_of_present_illness,
        past_medical_history=payload.past_medical_history,
        medications=payload.medications,
        allergies=payload.allergies,
        family_history=payload.family_history,
        social_history=payload.social_history,
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    # Evaluate red flags on input text
    combined_text = f"{payload.chief_complaint or ''} {payload.history_of_present_illness or ''} {payload.medications or ''} {payload.allergies or ''}"
    triggered_flags = red_flag_engine.evaluate_red_flags(combined_text)
    for tf in triggered_flags:
        rf = models.RedFlag(
            session_id=session_id,
            rule_id=tf["rule_id"],
            description=tf["description"],
            severity=tf["severity"]
        )
        db.add(rf)
    if triggered_flags:
        db.commit()

    return history


@app.get("/api/v1/sessions/{session_id}/history", response_model=list[schemas.ClinicalHistoryResponse])
def get_clinical_histories(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all clinical histories for a session"""
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check authorization
    if current_user.role == models.RoleEnum.PATIENT and session.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    histories = db.query(models.ClinicalHistory).filter(models.ClinicalHistory.session_id == session_id).all()
    return histories


# ============ Consent Endpoints ============
@app.post("/api/v1/patients/{patient_id}/consents", response_model=schemas.ConsentResponse)
def create_consent(
    patient_id: int,
    payload: schemas.ConsentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a consent record"""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check authorization
    if current_user.role == models.RoleEnum.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    consent = models.Consent(
        patient_id=patient_id,
        consent_type=payload.consent_type,
        status=models.ConsentStatusEnum.ACCEPTED,  # Auto-accept for now
        signed_at=datetime.utcnow(),
        expires_at=payload.expires_at,
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return consent


@app.get("/api/v1/patients/{patient_id}/consents", response_model=list[schemas.ConsentResponse])
def get_consents(
    patient_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all consents for a patient"""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check authorization
    if current_user.role == models.RoleEnum.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    consents = db.query(models.Consent).filter(models.Consent.patient_id == patient_id).all()
    return consents


# ============ Voice Endpoints ============

# Load dialogue policy at module level
_POLICY_PATH = os.path.join(os.path.dirname(__file__), "dialogue_policy.json")
with open(_POLICY_PATH) as f:
    _DIALOGUE_POLICY = json.load(f)

_QUESTION_MAP = {q["id"]: q for q in _DIALOGUE_POLICY["questions"]}


@app.post("/api/v1/voice/transcribe", response_model=schemas.VoiceTranscribeResponse)
async def transcribe_voice(
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
    current_user: models.User = Depends(get_current_user),
):
    """Transcribe uploaded audio to text using Whisper."""
    audio_bytes = await audio.read()
    result = voice_module.transcribe_audio(audio_bytes, language_hint=language if language != "en" else None)
    return schemas.VoiceTranscribeResponse(**result)


@app.post("/api/v1/voice/next-question", response_model=schemas.NextQuestionResponse)
def get_next_question(
    payload: schemas.NextQuestionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the next dialogue question for a session."""
    # Verify session exists
    session = db.query(models.ClinicalSession).filter(
        models.ClinicalSession.id == payload.session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Determine next question id
    if payload.current_question_id is None:
        # Start from beginning
        next_id = _DIALOGUE_POLICY["start_question_id"]
    else:
        current_q = _QUESTION_MAP.get(payload.current_question_id)
        if not current_q:
            raise HTTPException(status_code=400, detail=f"Unknown question id: {payload.current_question_id}")
        next_id = current_q.get("next")

    # If no next question, dialogue is done
    if next_id is None:
        return schemas.NextQuestionResponse(
            question_id=None,
            question_text=None,
            field=None,
            done=True,
            session_id=payload.session_id,
        )

    next_q = _QUESTION_MAP.get(next_id)
    if not next_q:
        raise HTTPException(status_code=500, detail=f"Question {next_id} not found in policy")

    # Select language-specific text if available
    lang = payload.language
    text_key = f"text_{lang}"
    question_text = next_q.get(text_key) or next_q["text"]

    return schemas.NextQuestionResponse(
        question_id=next_q["id"],
        question_text=question_text,
        field=next_q["field"],
        done=False,
        session_id=payload.session_id,
    )


# ============ Document & OCR Endpoints (Phase 4) ============
@app.post("/api/v1/documents", response_model=schemas.DocumentDetailResponse)
async def upload_document(
    session_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a document, perform OCR, and extract medical entities."""
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save file locally
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{session_id}_{file.filename}")

    file_bytes = await file.read()
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # OCR text extraction
    raw_ocr_text = ocr_module.extract_ocr_text(file_path)

    # Save Document DB record
    doc_record = models.Document(
        session_id=session_id,
        file_name=file.filename,
        file_type=file.content_type or "application/octet-stream",
        s3_key=file_path,
        ocr_text=raw_ocr_text
    )
    db.add(doc_record)
    db.commit()
    db.refresh(doc_record)

    # Extract Entities
    extracted = ocr_module.extract_entities_from_text(raw_ocr_text)
    entity_records = []
    for ent in extracted:
        entity_obj = models.ExtractedEntity(
            document_id=doc_record.id,
            entity_type=ent["entity_type"],
            entity_value=ent["entity_value"],
            confidence=ent["confidence"],
            source_text=ent["source_text"]
        )
        db.add(entity_obj)
        entity_records.append(entity_obj)

    db.commit()
    db.refresh(doc_record)

    # Evaluate red flags on document OCR text
    triggered = red_flag_engine.evaluate_red_flags(raw_ocr_text)
    for tf in triggered:
        rf = models.RedFlag(
            session_id=session_id,
            rule_id=tf["rule_id"],
            description=tf["description"],
            severity=tf["severity"]
        )
        db.add(rf)
    if triggered:
        db.commit()

    return doc_record


@app.get("/api/v1/sessions/{session_id}/documents", response_model=list[schemas.DocumentDetailResponse])
def get_session_documents(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all uploaded documents & extracted entities for a session."""
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return session.documents


# ============ Summary Generator Endpoints (Phase 5) ============
@app.get("/api/v1/sessions/{session_id}/summary")
def get_session_summary(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate synthesized clinical summary payload for a session."""
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    patient_dict = {
        "id": session.patient.id,
        "name": session.patient.name,
        "gender": session.patient.gender,
        "date_of_birth": session.patient.date_of_birth,
        "preferred_language": session.patient.preferred_language
    }

    history_rec = session.histories[-1] if session.histories else None
    history_dict = None
    if history_rec:
        history_dict = {
            "chief_complaint": history_rec.chief_complaint,
            "history_of_present_illness": history_rec.history_of_present_illness,
            "medications": history_rec.medications,
            "allergies": history_rec.allergies
        }

    docs_list = []
    for doc in session.documents:
        doc_dict = {
            "id": doc.id,
            "file_name": doc.file_name,
            "ocr_text": doc.ocr_text,
            "extracted_entities": [
                {
                    "id": ent.id,
                    "entity_type": ent.entity_type,
                    "entity_value": ent.entity_value,
                    "confidence": ent.confidence,
                    "source_text": ent.source_text
                }
                for ent in doc.extracted_entities
            ]
        }
        docs_list.append(doc_dict)

    red_flags_list = [
        {
            "id": rf.id,
            "rule_id": rf.rule_id,
            "description": rf.description,
            "severity": rf.severity,
            "reviewed": rf.reviewed
        }
        for rf in session.red_flags
    ]

    return summary_module.generate_clinical_summary(
        patient=patient_dict,
        history=history_dict,
        documents=docs_list,
        red_flags=red_flags_list
    )


# ============ Red-Flag Engine & Triage Endpoints (Phase 6) ============
@app.get("/api/v1/triage/alerts", response_model=list[schemas.RedFlagResponse])
def get_triage_alerts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get active red flags for triage nurse dashboard."""
    alerts = db.query(models.RedFlag).order_by(models.RedFlag.triggered_at.desc()).all()
    return alerts


@app.put("/api/v1/triage/alerts/{alert_id}/review", response_model=schemas.RedFlagResponse)
def review_triage_alert(
    alert_id: int,
    payload: schemas.RedFlagReviewRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a red flag as reviewed by triage nurse / physician."""
    alert = db.query(models.RedFlag).filter(models.RedFlag.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Red flag alert not found")

    alert.reviewed = payload.reviewed
    db.commit()
    db.refresh(alert)
    return alert


# ============ Doctor Dashboard & Verification Endpoints (Phase 7) ============
@app.get("/api/v1/doctor/queue", response_model=list[schemas.DoctorQueueItemResponse])
def get_doctor_queue(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get active and completed patient sessions queue for doctor review."""
    sessions = db.query(models.ClinicalSession).order_by(models.ClinicalSession.started_at.desc()).all()
    queue = []
    for s in sessions:
        red_flags = s.red_flags
        triage_status = "CRITICAL" if any(rf.severity == models.RedFlagSeverityEnum.CRITICAL for rf in red_flags) \
                        else ("HIGH" if any(rf.severity == models.RedFlagSeverityEnum.HIGH for rf in red_flags) else "STABLE")

        queue.append({
            "session_id": s.id,
            "patient_id": s.patient.id,
            "patient_name": s.patient.name,
            "patient_gender": s.patient.gender,
            "patient_dob": s.patient.date_of_birth,
            "session_type": s.session_type,
            "status": s.status,
            "started_at": s.started_at,
            "completed_at": s.completed_at,
            "triage_status": triage_status,
            "red_flags_count": len(red_flags),
            "documents_count": len(s.documents)
        })

    # Sort critical first, then active, then timestamp
    severity_rank = {"CRITICAL": 0, "HIGH": 1, "STABLE": 2}
    queue.sort(key=lambda x: (0 if x["status"] == "active" else 1, severity_rank[x["triage_status"]]))
    return queue


@app.put("/api/v1/sessions/{session_id}/verify")
def verify_session(
    session_id: int,
    payload: schemas.SessionVerifyRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify and sign off on a clinical session (creates AuditLog entry)."""
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update clinical history if provided
    if session.histories:
        history = session.histories[-1]
        if payload.chief_complaint:
            history.chief_complaint = payload.chief_complaint
        if payload.history_of_present_illness:
            history.history_of_present_illness = payload.history_of_present_illness
        if payload.medications:
            history.medications = payload.medications
        if payload.allergies:
            history.allergies = payload.allergies

    # Mark session completed
    session.status = "completed"
    session.completed_at = datetime.utcnow()

    # Create AuditLog record
    audit_entry = models.AuditLog(
        patient_id=session.patient_id,
        action="verify_session",
        resource_type="clinical_session",
        resource_id=session.id,
        performed_by_user_id=current_user.id if current_user else None,
        details=f"Physician verified session #{session.id}. Notes: {payload.physician_notes or 'None'}"
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(session)

    return {"message": "Session successfully verified and completed", "session_id": session.id, "status": "completed"}


@app.get("/api/v1/sessions/{session_id}/audit-logs", response_model=list[schemas.AuditLogResponse])
def get_session_audit_logs(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get audit logs for a session/patient."""
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    logs = db.query(models.AuditLog).filter(models.AuditLog.patient_id == session.patient_id).order_by(models.AuditLog.timestamp.desc()).all()
    return logs


