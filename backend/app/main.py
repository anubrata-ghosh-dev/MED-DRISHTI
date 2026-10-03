import json
import io
import os
import uuid
from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Form
from fastapi.responses import Response, StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi.exceptions import RequestValidationError
from starlette.requests import Request
from starlette.responses import JSONResponse

from fastapi.middleware.cors import CORSMiddleware

from . import models, database, auth, schemas
from . import voice as voice_module
from . import ocr as ocr_module
from . import summary as summary_module
from . import red_flag_engine
from .ai_gateway import gateway
from .ai_providers import SarvamProvider, GoogleVisionProvider, LocalVoiceProvider, LocalOCRProvider, LocalSummaryProvider, MockAIProvider
from . import chatbot as chatbot_module
from . import hospitals as hospitals_module
from .interop import FhirMapper, MockAbdmProvider
from .dialogue_service import resolve_next_question
from .clinical_intelligence import ClinicalIntelligenceService

app = FastAPI(
    title="Med-Drishti Backend",
    version="0.1.0",
    description="AI-powered clinical intake system"
)

# --- AI Gateway Initialization ---
# Sarvam is first so production voice and translation requests use the hosted
# Indic models. Local providers remain available if the service is unavailable.
gateway.register_provider(SarvamProvider())
gateway.register_provider(GoogleVisionProvider())
gateway.register_provider(LocalVoiceProvider())
gateway.register_provider(LocalOCRProvider())
gateway.register_provider(LocalSummaryProvider())
gateway.register_provider(MockAIProvider())

# --- ABDM Provider Initialization ---
abdm_service = MockAbdmProvider()

_cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request ID Middleware ---
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# --- Global Exception Handlers ---
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": f"HTTP_{exc.status_code}", "message": str(exc.detail), "request_id": request_id}},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": "Request validation failed", "request_id": request_id, "details": exc.errors()}},
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    import logging
    logger = logging.getLogger(__name__)
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled error [req={request_id}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "An internal server error occurred", "request_id": request_id}},
    )

# Database tables are now managed by Alembic migrations.
# Run: alembic upgrade head

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

def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    if not authorization:
        return None
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
    except ValueError:
        return None
    payload = auth.decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    return user

# RBAC Helpers
def require_role(allowed_roles: List[models.RoleEnum]):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions for this action")
        return current_user
    return role_checker

@app.get("/api/v1/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

# ============ Authentication Endpoints ============
@app.post("/api/v1/auth/register", response_model=schemas.TokenResponse)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        email=payload.email,
        hashed_password=auth.hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
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
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
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
    return {"message": "Logged out successfully"}

# ============ Patient Endpoints ============
@app.post("/api/v1/patients", response_model=schemas.PatientResponse)
def create_patient(
    payload: schemas.PatientCreate,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    date_of_birth = payload.date_of_birth.strip() if payload.date_of_birth and payload.date_of_birth.strip() else None
    phone = payload.phone.strip() if payload.phone and payload.phone.strip() else None
    abha_id = payload.abha_id.strip() if payload.abha_id and payload.abha_id.strip() else None
    patient = models.Patient(
        user_id=current_user.id if current_user and current_user.role == models.RoleEnum.PATIENT else None,
        name=payload.name.strip(),
        date_of_birth=date_of_birth,
        gender=payload.gender,
        phone=phone,
        preferred_language=payload.preferred_language or "English",
        abha_id=abha_id,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@app.get("/api/v1/patients/{patient_id}", response_model=schemas.PatientResponse)
def get_patient(
    patient_id: int,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user and current_user.role == models.RoleEnum.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return patient

@app.put("/api/v1/patients/{patient_id}", response_model=schemas.PatientResponse)
def update_patient(
    patient_id: int,
    payload: schemas.PatientUpdate,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user and current_user.role == models.RoleEnum.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient

# ============ Clinical Session Endpoints ============
@app.post("/api/v1/sessions", response_model=schemas.ClinicalSessionResponse)
def create_session(
    payload: schemas.ClinicalSessionCreate,
    patient_id: Optional[int] = None,
    department: str = "General",
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    session_patient_id = patient_id if patient_id is not None else payload.patient_id
    if session_patient_id is None:
        raise HTTPException(status_code=400, detail="patient_id is required")
    patient = db.query(models.Patient).filter(models.Patient.id == session_patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user and current_user.role == models.RoleEnum.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    session = models.ClinicalSession(
        patient_id=session_patient_id,
        session_type=payload.session_type,
        department=department
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@app.get("/api/v1/sessions/{session_id}", response_model=schemas.ClinicalSessionResponse)
def get_session(
    session_id: int,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user and current_user.role == models.RoleEnum.PATIENT and session.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return session

@app.put("/api/v1/sessions/{session_id}", response_model=schemas.ClinicalSessionResponse)
def update_session(
    session_id: int,
    payload: schemas.ClinicalSessionUpdate,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user and current_user.role == models.RoleEnum.PATIENT:
        raise HTTPException(status_code=403, detail="Access denied")
    if payload.status:
        session.status = payload.status
        if payload.status == "completed":
            session.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session

@app.post("/api/v1/sessions/{session_id}/history", response_model=schemas.StructuredClinicalHistoryResponse)
def create_clinical_history(
    session_id: int,
    payload: schemas.StructuredClinicalHistoryCreate,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user and current_user.role == models.RoleEnum.PATIENT and session.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Insert structured history into granular tables
    if payload.chief_complaints:
        for cc in payload.chief_complaints:
            db.add(models.ChiefComplaint(session_id=session_id, **cc.model_dump()))
    if payload.hpi:
        for h in payload.hpi:
            db.add(models.HPI(session_id=session_id, **h.model_dump()))
    if payload.past_medical_histories:
        for pmh in payload.past_medical_histories:
            db.add(models.PastMedicalHistory(session_id=session_id, **pmh.model_dump()))
    if payload.past_surgical_histories:
        for psh in payload.past_surgical_histories:
            db.add(models.PastSurgicalHistory(session_id=session_id, **psh.model_dump()))
    if payload.medication_histories:
        for mh in payload.medication_histories:
            db.add(models.MedicationHistory(session_id=session_id, **mh.model_dump()))
    if payload.allergy_histories:
        for ah in payload.allergy_histories:
            db.add(models.AllergyHistory(session_id=session_id, **ah.model_dump()))
    if payload.family_histories:
        for fh in payload.family_histories:
            db.add(models.FamilyHistory(session_id=session_id, **fh.model_dump()))
    if payload.personal_histories:
        for ph in payload.personal_histories:
            db.add(models.PersonalHistory(session_id=session_id, **ph.model_dump()))
    if payload.review_of_systems:
        for ros in payload.review_of_systems:
            db.add(models.ReviewOfSystems(session_id=session_id, **ros.model_dump()))
    if payload.ayush_histories:
        for ay in payload.ayush_histories:
            db.add(models.AyushHistory(session_id=session_id, **ay.model_dump()))

    # Create ClinicalEntity records for searchability and red-flag evaluation
    combined_text_parts = []
    if payload.chief_complaints:
        for cc in payload.chief_complaints:
            db.add(models.ClinicalEntity(session_id=session_id, entity_type="Chief Complaint", value=cc.complaint, confidence=1.0, source_text=cc.complaint))
            combined_text_parts.append(cc.complaint)
    if payload.hpi:
        for h in payload.hpi:
            text = " ".join(filter(None, [h.onset, h.duration, h.progression, h.location, h.associated_symptoms]))
            if text.strip():
                db.add(models.ClinicalEntity(session_id=session_id, entity_type="HPI", value=text.strip(), confidence=1.0, source_text=text))
                combined_text_parts.append(text)
    if payload.medication_histories:
        for mh in payload.medication_histories:
            db.add(models.ClinicalEntity(session_id=session_id, entity_type="Medication", value=mh.drug_name, confidence=1.0, source_text=f"{mh.drug_name} {mh.dose or ''}"))
            combined_text_parts.append(mh.drug_name)
    if payload.allergy_histories:
        for ah in payload.allergy_histories:
            db.add(models.ClinicalEntity(session_id=session_id, entity_type="Allergy", value=ah.allergen, confidence=1.0, source_text=ah.allergen))
            combined_text_parts.append(ah.allergen)

    db.commit()

    # Evaluate red flags on combined text
    combined_text = " ".join(combined_text_parts)
    if combined_text.strip():
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

    db.refresh(session)
    return schemas.StructuredClinicalHistoryResponse(
        chief_complaints=[schemas.ChiefComplaintResponse.model_validate(cc) for cc in session.chief_complaints],
        hpi=[schemas.HPIResponse.model_validate(h) for h in session.hpi],
        past_medical_histories=[schemas.PastMedicalHistoryResponse.model_validate(pmh) for pmh in session.past_medical_histories],
        past_surgical_histories=[schemas.PastSurgicalHistoryResponse.model_validate(psh) for psh in session.past_surgical_histories],
        medication_histories=[schemas.MedicationHistoryResponse.model_validate(mh) for mh in session.medication_histories],
        allergy_histories=[schemas.AllergyHistoryResponse.model_validate(ah) for ah in session.allergy_histories],
        family_histories=[schemas.FamilyHistoryResponse.model_validate(fh) for fh in session.family_histories],
        personal_histories=[schemas.PersonalHistoryResponse.model_validate(ph) for ph in session.personal_histories],
        review_of_systems=[schemas.ReviewOfSystemsResponse.model_validate(ros) for ros in session.review_of_systems],
        ayush_histories=[schemas.AyushHistoryResponse.model_validate(ay) for ay in session.ayush_histories],
    )

@app.get("/api/v1/sessions/{session_id}/history", response_model=schemas.StructuredClinicalHistoryResponse)
def get_clinical_histories(
    session_id: int,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user and current_user.role == models.RoleEnum.PATIENT and session.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return schemas.StructuredClinicalHistoryResponse(
        chief_complaints=[schemas.ChiefComplaintResponse.model_validate(cc) for cc in session.chief_complaints],
        hpi=[schemas.HPIResponse.model_validate(h) for h in session.hpi],
        past_medical_histories=[schemas.PastMedicalHistoryResponse.model_validate(pmh) for pmh in session.past_medical_histories],
        past_surgical_histories=[schemas.PastSurgicalHistoryResponse.model_validate(psh) for psh in session.past_surgical_histories],
        medication_histories=[schemas.MedicationHistoryResponse.model_validate(mh) for mh in session.medication_histories],
        allergy_histories=[schemas.AllergyHistoryResponse.model_validate(ah) for ah in session.allergy_histories],
        family_histories=[schemas.FamilyHistoryResponse.model_validate(fh) for fh in session.family_histories],
        personal_histories=[schemas.PersonalHistoryResponse.model_validate(ph) for ph in session.personal_histories],
        review_of_systems=[schemas.ReviewOfSystemsResponse.model_validate(ros) for ros in session.review_of_systems],
        ayush_histories=[schemas.AyushHistoryResponse.model_validate(ay) for ay in session.ayush_histories],
    )

# ============ Consent Endpoints ============
@app.post("/api/v1/patients/{patient_id}/consents", response_model=schemas.ConsentResponse)
def create_consent(
    patient_id: int,
    payload: schemas.ConsentCreate,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user and current_user.role == models.RoleEnum.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    consent = models.Consent(
        patient_id=patient_id,
        consent_type=payload.consent_type,
        status=models.ConsentStatusEnum.ACCEPTED,
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
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user and current_user.role == models.RoleEnum.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    consents = db.query(models.Consent).filter(models.Consent.patient_id == patient_id).all()
    return consents

# ============ Voice & Dialogue Endpoints ============
@app.get("/api/v1/voice/tts")
@app.get("/api/v1/voice/synthesize")
def generate_tts_audio(text: str, lang: str = "en"):
    """Generate high quality audio for any language text."""
    if not text:
        raise HTTPException(status_code=400, detail="Text parameter is required")
    try:
        audio_bytes = gateway.synthesize(text=text.strip(), lang=lang.lower())
        media_type = "audio/wav" if audio_bytes[:4] == b"RIFF" else "audio/mpeg"
        return Response(content=audio_bytes, media_type=media_type)
    except Exception as e:
        lang_map = {"bn": "bn", "ta": "ta", "ml": "ml", "te": "te", "pa": "pa", "hi": "hi", "en": "en"}
        target_lang = lang_map.get(lang.lower(), "en")
        try:
            from gtts import gTTS
            tts = gTTS(text=text.strip(), lang=target_lang)
            mp3_fp = io.BytesIO()
            tts.write_to_fp(mp3_fp)
            mp3_fp.seek(0)
            return Response(content=mp3_fp.getvalue(), media_type="audio/mpeg")
        except Exception as fallback_err:
            raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(fallback_err)}")

@app.post("/api/v1/voice/transcribe", response_model=schemas.VoiceTranscribeResponse)
async def transcribe_voice(
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    audio_bytes = await audio.read()
    result = gateway.transcribe(audio_bytes, language_hint=language if language != "en" else None)
    return schemas.VoiceTranscribeResponse(**result)

@app.post("/api/v1/voice/next-question", response_model=schemas.NextQuestionResponse)
def get_next_question(
    payload: schemas.NextQuestionRequest,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    session = db.query(models.ClinicalSession).filter(
        models.ClinicalSession.id == payload.session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    next_id, question_text, field, is_done = resolve_next_question(
        current_question_id=payload.current_question_id,
        last_answer=payload.last_answer,
        language=payload.language,
        department=session.department
    )

    return schemas.NextQuestionResponse(
        question_id=next_id,
        question_text=question_text,
        field=field,
        done=is_done,
        session_id=payload.session_id,
    )

@app.get("/api/v1/dialogue/next-question", response_model=schemas.NextQuestionResponse)
def get_dialogue_next_question(
    session_id: int,
    current_question_id: Optional[str] = None,
    last_answer: Optional[str] = None,
    language: str = "en",
    db: Session = Depends(get_db),
):
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    next_id, question_text, field, is_done = resolve_next_question(
        current_question_id=current_question_id,
        last_answer=last_answer,
        language=language,
        department=session.department
    )

    return schemas.NextQuestionResponse(
        question_id=next_id,
        question_text=question_text,
        field=field,
        done=is_done,
        session_id=session_id,
    )

# ============ Document & OCR Endpoints ============
@app.post("/api/v1/documents", response_model=schemas.DocumentDetailResponse)
@app.post("/api/v1/documents/upload", response_model=schemas.DocumentDetailResponse)
async def upload_document(
    session_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 1. Document Quality Check
    file_bytes = await file.read()
    temp_path = f"/tmp/{uuid.uuid4().hex}_{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(file_bytes)

    quality = ocr_module.check_image_quality(temp_path)
    if not quality["is_viable"]:
        os.remove(temp_path)
        raise HTTPException(status_code=400, detail=f"Document quality too low: {quality['reason']}")

    # 2. OCR Extraction via Gateway
    raw_ocr_text = gateway.extract_text(temp_path)
    os.remove(temp_path)

    doc_record = models.Document(
        session_id=session_id,
        file_name=file.filename,
        file_type=file.content_type or "application/octet-stream",
        s3_key=f"uploads/docs/{uuid.uuid4().hex}_{file.filename}",
        ocr_text=raw_ocr_text
    )
    db.add(doc_record)
    db.commit()
    db.refresh(doc_record)

    # 3. Entity Extraction via Gateway
    extracted = gateway.extract_entities(raw_ocr_text)
    for ent in extracted:
        entity_obj = models.ExtractedEntity(
            document_id=doc_record.id,
            entity_type=ent["entity_type"],
            entity_value=ent["entity_value"],
            confidence=ent.get("confidence", 0.0),
            source_text=ent.get("source_text")
        )
        db.add(entity_obj)
        clinical_ent = models.ClinicalEntity(
            session_id=session_id,
            document_id=doc_record.id,
            entity_type=ent["entity_type"],
            value=ent["entity_value"],
            confidence=ent.get("confidence", 0.0),
            source_text=ent.get("source_text")
        )
        db.add(clinical_ent)

    db.commit()
    db.refresh(doc_record)

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
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.documents

@app.get("/api/v1/documents/{document_id}/entities")
def get_document_entities(
    document_id: int,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    entities = db.query(models.ExtractedEntity).filter(models.ExtractedEntity.document_id == document_id).all()
    return {"document_id": document_id, "entities": entities}

# ============ Medical Record Endpoints ============
@app.post("/api/v1/patients/{patient_id}/medical-records", response_model=schemas.MedicalRecordResponse)
@app.post("/api/v1/patients/{patient_id}/medical-records/upload", response_model=schemas.MedicalRecordResponse)
async def upload_medical_record(
    patient_id: int,
    file: UploadFile = File(...),
    title: str = Form(default=""),
    description: str = Form(default=""),
    record_type: str = Form(default="other"),
    session_id: Optional[int] = Form(default=None),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads", "medical_records")
    os.makedirs(upload_dir, exist_ok=True)
    unique_name = f"{patient_id}_{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = os.path.join(upload_dir, unique_name)

    file_bytes = await file.read()
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    ocr_text = ""
    try:
        ocr_text = gateway.extract_text(file_path)
    except Exception as e:
        print(f"[OCR Warning] Could not extract text: {e}")

    try:
        rec_type = models.MedicalRecordTypeEnum(record_type)
    except ValueError:
        rec_type = models.MedicalRecordTypeEnum.OTHER

    record = models.MedicalRecord(
        patient_id=patient_id,
        session_id=session_id,
        record_type=rec_type,
        title=title.strip() if title else file.filename,
        description=description.strip() if description else None,
        file_name=file.filename,
        file_type=file.content_type or "application/octet-stream",
        file_path=file_path,
        ocr_text=ocr_text,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@app.get("/api/v1/patients/{patient_id}/medical-records", response_model=list[schemas.MedicalRecordResponse])
def get_patient_medical_records(
    patient_id: int,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    records = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.patient_id == patient_id
    ).order_by(models.MedicalRecord.uploaded_at.desc()).all()
    return records

@app.get("/api/v1/medical-records/{record_id}/file")
def get_medical_record_file(
    record_id: int,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    record = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    if not record.file_path or not os.path.exists(record.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(
        path=record.file_path,
        filename=record.file_name,
        media_type=record.file_type or "application/octet-stream",
    )

@app.delete("/api/v1/medical-records/{record_id}", status_code=200)
def delete_medical_record(
    record_id: int,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    record = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    if record.file_path and os.path.exists(record.file_path):
        os.remove(record.file_path)
    db.delete(record)
    db.commit()
    return {"message": "Medical record deleted", "id": record_id}

# ============ Summary Generator Endpoints ============
@app.get("/api/v1/sessions/{session_id}/summary")
def get_session_summary(
    session_id: int,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
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

    # Build structured history dict from the 10 granular tables
    history_dict = None
    chief_complaints = session.chief_complaints
    hpi_records = session.hpi
    medication_records = session.medication_histories
    allergy_records = session.allergy_histories

    if chief_complaints or hpi_records:
        history_dict = {
            "chief_complaint": "; ".join([cc.complaint for cc in chief_complaints]) if chief_complaints else "No chief complaint recorded",
            "history_of_present_illness": "; ".join(filter(None, [
                " ".join(filter(None, [h.onset, h.duration, h.progression, h.location, h.associated_symptoms]))
                for h in hpi_records
            ])) if hpi_records else "No present illness history recorded",
            "medications": ", ".join([f"{m.drug_name} {m.dose or ''}" for m in medication_records]) if medication_records else None,
            "allergies": ", ".join([a.allergen for a in allergy_records]) if allergy_records else None,
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
            "severity": rf.severity.value if hasattr(rf.severity, 'value') else rf.severity,
            "reviewed": rf.reviewed
        }
        for rf in session.red_flags
    ]

    medical_records_list = [
        {
            "id": mr.id,
            "record_type": mr.record_type.value if mr.record_type else "other",
            "title": mr.title,
            "description": mr.description,
            "file_name": mr.file_name,
            "ocr_text": mr.ocr_text,
            "uploaded_at": mr.uploaded_at.isoformat() if mr.uploaded_at else None
        }
        for mr in session.patient.medical_records
    ]

    summary = gateway.summarize({
        "patient": patient_dict,
        "history": history_dict,
        "documents": docs_list,
        "red_flags": red_flags_list
    })

    if not summary or "chief_complaint" not in summary:
        summary = summary_module.generate_clinical_summary(
            patient=patient_dict,
            history=history_dict,
            documents=docs_list,
            red_flags=red_flags_list
        )

    summary["medical_records"] = medical_records_list
    return summary

# ============ Red-Flag Engine & Triage Endpoints ============
@app.get("/api/v1/triage/alerts", response_model=list[schemas.RedFlagResponse])
def get_triage_alerts(
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    alerts = db.query(models.RedFlag).order_by(models.RedFlag.triggered_at.desc()).all()
    return alerts

@app.put("/api/v1/triage/alerts/{alert_id}/review", response_model=schemas.RedFlagResponse)
@app.post("/api/v1/triage/alerts/{alert_id}/review", response_model=schemas.RedFlagResponse)
def review_triage_alert(
    alert_id: int,
    payload: schemas.RedFlagReviewRequest,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    alert = db.query(models.RedFlag).filter(models.RedFlag.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Red flag alert not found")

    alert.reviewed = payload.reviewed
    db.commit()
    db.refresh(alert)
    return alert

# ============ Doctor Dashboard & Verification Endpoints ============
@app.get("/api/v1/doctor/queue", response_model=list[schemas.DoctorQueueItemResponse])
def get_doctor_queue(
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
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
            "documents_count": len(s.documents),
            "medical_records_count": len(s.patient.medical_records)
        })

    severity_rank = {"CRITICAL": 0, "HIGH": 1, "STABLE": 2}
    queue.sort(key=lambda x: (0 if x["status"] == "active" else 1, severity_rank[x["triage_status"]]))
    return queue

@app.put("/api/v1/sessions/{session_id}/verify")
@app.post("/api/v1/sessions/{session_id}/verify")
def verify_session(
    session_id: int,
    payload: schemas.SessionVerifyRequest,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update structured history if corrections provided
    if payload.chief_complaints:
        # Clear existing and replace
        for existing in session.chief_complaints:
            db.delete(existing)
        for cc in payload.chief_complaints:
            db.add(models.ChiefComplaint(session_id=session_id, **cc.model_dump()))
    if payload.hpi:
        for existing in session.hpi:
            db.delete(existing)
        for h in payload.hpi:
            db.add(models.HPI(session_id=session_id, **h.model_dump()))
    if payload.medication_histories:
        for existing in session.medication_histories:
            db.delete(existing)
        for mh in payload.medication_histories:
            db.add(models.MedicationHistory(session_id=session_id, **mh.model_dump()))
    if payload.allergy_histories:
        for existing in session.allergy_histories:
            db.delete(existing)
        for ah in payload.allergy_histories:
            db.add(models.AllergyHistory(session_id=session_id, **ah.model_dump()))
    if payload.past_medical_histories:
        for existing in session.past_medical_histories:
            db.delete(existing)
        for pmh in payload.past_medical_histories:
            db.add(models.PastMedicalHistory(session_id=session_id, **pmh.model_dump()))
    if payload.past_surgical_histories:
        for existing in session.past_surgical_histories:
            db.delete(existing)
        for psh in payload.past_surgical_histories:
            db.add(models.PastSurgicalHistory(session_id=session_id, **psh.model_dump()))
    if payload.family_histories:
        for existing in session.family_histories:
            db.delete(existing)
        for fh in payload.family_histories:
            db.add(models.FamilyHistory(session_id=session_id, **fh.model_dump()))
    if payload.personal_histories:
        for existing in session.personal_histories:
            db.delete(existing)
        for ph in payload.personal_histories:
            db.add(models.PersonalHistory(session_id=session_id, **ph.model_dump()))
    if payload.review_of_systems:
        for existing in session.review_of_systems:
            db.delete(existing)
        for ros in payload.review_of_systems:
            db.add(models.ReviewOfSystems(session_id=session_id, **ros.model_dump()))
    if payload.ayush_histories:
        for existing in session.ayush_histories:
            db.delete(existing)
        for ay in payload.ayush_histories:
            db.add(models.AyushHistory(session_id=session_id, **ay.model_dump()))

    session.status = "completed"
    session.completed_at = datetime.utcnow()

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
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    logs = db.query(models.AuditLog).filter(models.AuditLog.patient_id == session.patient_id).order_by(models.AuditLog.timestamp.desc()).all()
    return logs

# ============ AI Gateway Direct Endpoints ============
class TranscribePayload(schemas.BaseModel):
    audio_base64: Optional[str] = None
    language: Optional[str] = "en"

class SynthesizePayload(schemas.BaseModel):
    text: str
    language: str = "en"

class TranslatePayload(schemas.BaseModel):
    text: str
    source_language: str
    target_language: str

@app.post("/api/v1/ai/transcribe")
async def ai_transcribe(
    file: Optional[UploadFile] = File(None),
    language: str = Form(default="en")
):
    if file:
        audio_bytes = await file.read()
    else:
        audio_bytes = b""
    result = gateway.transcribe(audio_bytes, language_hint=language)
    return result

@app.post("/api/v1/ai/synthesize")
def ai_synthesize(payload: SynthesizePayload):
    audio_bytes = gateway.synthesize(payload.text, lang=payload.language)
    media_type = "audio/wav" if audio_bytes[:4] == b"RIFF" else "audio/mpeg"
    return Response(content=audio_bytes, media_type=media_type)

@app.post("/api/v1/ai/translate")
def ai_translate(payload: TranslatePayload):
    translated = gateway.translate(payload.text, payload.source_language, payload.target_language)
    return {
        "original_text": payload.text,
        "translated_text": translated,
        "source_language": payload.source_language,
        "target_language": payload.target_language
    }

# ============ Interoperability (FHIR & ABDM) Endpoints ============
@app.get("/api/v1/fhir/{session_id}")
@app.get("/api/v1/sessions/{session_id}/fhir")
def get_fhir_bundle(
    session_id: int,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    bundle = FhirMapper.generate_bundle(session)
    return bundle

class AbhaResolveRequest(schemas.BaseModel):
    abha_id: str

class ShareRecordRequest(schemas.BaseModel):
    session_id: int
    consent_id: Optional[str] = None

@app.post("/api/v1/abdm/resolve-abha")
def resolve_abha(payload: AbhaResolveRequest):
    result = abdm_service.resolve_abha(payload.abha_id)
    if not result:
        raise HTTPException(status_code=404, detail="ABHA ID could not be resolved")
    return result

@app.post("/api/v1/abdm/share-record")
def share_record_abdm(
    payload: ShareRecordRequest,
    db: Session = Depends(get_db)
):
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    bundle = FhirMapper.generate_bundle(session)
    consent_id = payload.consent_id or abdm_service.create_consent(session.patient_id, "MED_DRISHTI_HOSPITAL")
    success = abdm_service.share_record(consent_id, bundle)
    return {
        "status": "success" if success else "failed",
        "consent_id": consent_id,
        "session_id": payload.session_id,
        "fhir_resource_count": len(bundle.get("entry", []))
    }

# ============ Clinical Intelligence Endpoints ============
@app.get("/api/v1/clinical-intelligence/{session_id}")
def get_clinical_intelligence(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = db.query(models.ClinicalSession).filter(models.ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    entities = session.clinical_entities
    abnormals = ClinicalIntelligenceService.detect_abnormals(entities)
    medications = [e.value for e in entities if "medication" in e.entity_type.lower()]
    interactions = ClinicalIntelligenceService.check_interactions(medications)
    missing = ClinicalIntelligenceService.detect_missing_info(session)

    return {
        "session_id": session_id,
        "abnormal_findings": abnormals,
        "drug_interactions": interactions,
        "missing_information": missing,
        "total_clinical_entities": len(entities)
    }

# ============ Sarvam AI Chatbot Endpoint ============
class ChatMessage(schemas.BaseModel):
    role: str
    content: str

class ChatRequest(schemas.BaseModel):
    messages: list[ChatMessage]
    language: str = "en"

class ChatResponse(schemas.BaseModel):
    reply: str
    language: str

@app.post("/api/v1/chat", response_model=ChatResponse)
def patient_chat(payload: ChatRequest):
    messages_dicts = [{"role": m.role, "content": m.content} for m in payload.messages]
    result = chatbot_module.get_chat_response(messages_dicts, language=payload.language)
    return ChatResponse(reply=result["reply"], language=result["language"])

@app.get("/api/v1/triage/stats")
def get_triage_stats(
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    alerts = db.query(models.RedFlag).all()
    return {
        "total_alerts": len(alerts),
        "critical": sum(1 for a in alerts if a.severity == models.RedFlagSeverityEnum.CRITICAL),
        "high": sum(1 for a in alerts if a.severity == models.RedFlagSeverityEnum.HIGH),
        "medium": sum(1 for a in alerts if a.severity == models.RedFlagSeverityEnum.MEDIUM),
        "low": sum(1 for a in alerts if a.severity == models.RedFlagSeverityEnum.LOW),
        "reviewed": sum(1 for a in alerts if a.reviewed),
        "unreviewed": sum(1 for a in alerts if not a.reviewed),
    }

# ============ Hospital Finder Endpoints ============
@app.get("/api/v1/hospitals/nearby")
def get_nearby_hospitals(
    lat: float,
    lng: float,
    radius_km: float = 50.0,
    limit: int = 10,
    hospital_type: Optional[str] = None,
):
    results = hospitals_module.get_nearby_hospitals(
        lat=lat, lng=lng, radius_km=radius_km, limit=limit, hospital_type=hospital_type
    )
    return {"hospitals": results, "count": len(results)}

@app.get("/api/v1/hospitals")
def list_hospitals(state: Optional[str] = None):
    results = hospitals_module.get_all_hospitals(state=state)
    return {"hospitals": results, "count": len(results)}

@app.get("/api/v1/hospitals/search")
def search_hospitals(q: str):
    results = hospitals_module.search_hospitals(query=q)
    return {"hospitals": results, "count": len(results)}
