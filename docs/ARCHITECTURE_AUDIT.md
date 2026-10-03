# Repository & Architecture Audit — Med-Drishti

**Audit Date:** September 2026
**Audited Target:** Med-Drishti MVP Codebase
**Auditor:** Lead Software Architect & Systems Auditor
**Purpose:** Technical baseline, debt audit, vulnerability evaluation, and change boundaries.

---

## Executive Summary

Med-Drishti is a functioning clinical intake prototype comprising a Next.js 14 frontend and a FastAPI backend with SQLite persistence. The application successfully fulfills the initial objectives of SIH26047 by providing patient intake, multimodal history collection, document OCR extraction, deterministic red-flag detection, and physician sign-off workflows. This audit establishes the current architectural baseline, highlights technical debt and security risks, and defines components that must remain stable.

---

## A. Frontend Architecture

- **Framework:** Next.js 14 (using the modern App Router architecture).
- **Core Libraries:** React 18, TypeScript 5, Tailwind CSS, Axios, React Hook Form, Zod.
- **Page Routes:**
  - `/`: Kiosk landing and welcome screen with call-to-action to begin intake.
  - `/language`: Preferred intake language selection (English, Hindi, Bengali, Tamil, Telugu, Malayalam, Punjabi).
  - `/register`: Patient registration capturing basic demographics (name, DOB, gender, phone, optional ABHA).
  - `/consent`: Explicit informed digital consent screen for data collection and voice processing.
  - `/intake`: Conversational multimodal clinical intake interface featuring speech recognition, adaptive questioning, and structured responses.
  - `/medical-history`: Historical medical record and prescription upload interface.
  - `/done`: Completion screen with session reference, patient instructions, and automatic kiosk reset timer.
  - `/doctor`: Physician review dashboard with live patient queue, summary viewer, and sign-off modal.
  - `/triage`: Emergency and triage nurse dashboard displaying real-time red-flag alerts.
  - `/hospitals`: Facility finder enabling geolocation and state-based hospital search.

---

## B. Backend Architecture

- **Framework:** FastAPI running on Python 3.10+ ASGI server (Uvicorn).
- **ORM & Data Layer:** SQLAlchemy with declarative models and session lifecycle management.
- **API Structure:** Unified versioned REST endpoints prefixed with `/api/v1/`.
- **Modular Services:**
  - `ai_gateway.py`: Orchestrates AI providers with resilient fallbacks.
  - `ai_providers.py`: Local and mock provider implementations.
  - `clinical_intelligence.py`: Lab range checking, drug interactions, and schema normalization.
  - `dialogue_service.py`: Policy-driven adaptive clinical inquiry engine.
  - `interop.py`: HL7 FHIR R4 Bundle transformation and ABDM interface.
  - `red_flag_engine.py`: Deterministic keyword and regex rule evaluator.
  - `ocr.py`: Document text extraction and clinical entity parsing.
  - `summary.py`: Clinical case summary synthesis.

---

## C. Database Architecture

- **Database Engine:** SQLite 3 (`med_drishti.db`).
- **Access Method:** SQLAlchemy ORM with scoped session generator (`get_db`).
- **Tables (11 tables):**
  1. `users`: User identity, hashed passwords, roles (`patient`, `doctor`, `nurse`, `admin`).
  2. `patients`: Patient demographics, language, ABHA reference.
  3. `consents`: Signed consent forms with status, timestamps, expiration.
  4. `clinical_sessions`: Encounter lifecycle, status (`active`, `completed`), department.
  5. `clinical_histories`: Subjective history (Chief Complaint, HPI, Past Med, Medications, Allergies).
  6. `documents`: Document upload metadata, storage key, raw OCR text.
  7. `extracted_entities`: OCR-parsed entities (entity type, value, confidence).
  8. `clinical_entities`: Canonical structured clinical observations linked to session and doctor verification.
  9. `red_flags`: Real-time alerts flagged by deterministic clinical rules.
  10. `medical_records`: Patient-attached documents, reports, and prescriptions.
  11. `audit_logs`: Immutable clinical action logs with timestamps and before/after states.

---

## D. Authentication & Authorization

- **Mechanism:** Stateless JSON Web Tokens (JWT) signed using HMAC-SHA256 via `python-jose`.
- **Password Security:** Salted cryptographic hashes generated via `passlib` with `bcrypt`.
- **RBAC (Role-Based Access Control):**
  - Roles: `PATIENT`, `DOCTOR`, `NURSE`, `ADMIN`.
  - Enforced via FastAPI dependency injection: `get_current_user`, `require_role([...])`.

---

## E. File Storage Architecture

- **Mechanism:** Local file system storage under `backend/uploads/` and `backend/uploads/medical_records/`.
- **File Serving:** Direct streaming via FastAPI `FileResponse` and base64-encoded file payloads.
- **Limitation:** Ephemeral container storage unless mounted as a persistent volume in Docker.

---

## F. Existing APIs

The API exposes endpoints structured under `/api/v1`:

- **Health:**
  - `GET /api/v1/health`
- **Authentication:**
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
- **Patient Management:**
  - `POST /api/v1/patients`
  - `GET /api/v1/patients/{patient_id}`
  - `PUT /api/v1/patients/{patient_id}`
  - `POST /api/v1/patients/{patient_id}/consents`
  - `GET /api/v1/patients/{patient_id}/consents`
  - `GET /api/v1/patients/{patient_id}/medical-records`
- **Clinical Sessions & History:**
  - `POST /api/v1/sessions`
  - `GET /api/v1/sessions/{session_id}`
  - `PUT /api/v1/sessions/{session_id}`
  - `POST /api/v1/sessions/{session_id}/history`
  - `GET /api/v1/sessions/{session_id}/history`
  - `GET /api/v1/sessions/{session_id}/summary`
  - `POST /api/v1/sessions/{session_id}/verify` (and `PUT`)
  - `GET /api/v1/sessions/{session_id}/audit-logs`
  - `GET /api/v1/sessions/{session_id}/fhir`
- **Document Management & OCR:**
  - `POST /api/v1/documents` & `POST /api/v1/documents/upload`
  - `GET /api/v1/sessions/{session_id}/documents`
  - `GET /api/v1/documents/{document_id}/entities`
- **Medical Records:**
  - `POST /api/v1/patients/{patient_id}/medical-records` & `POST /api/v1/patients/{patient_id}/medical-records/upload`
  - `GET /api/v1/medical-records/{record_id}/file`
  - `DELETE /api/v1/medical-records/{record_id}`
- **Triage & Red Flags:**
  - `GET /api/v1/triage/alerts`
  - `POST /api/v1/triage/alerts/{alert_id}/review` (and `PUT`)
- **Doctor Queue:**
  - `GET /api/v1/doctor/queue`
- **Clinical Intelligence:**
  - `GET /api/v1/clinical-intelligence/{session_id}`
- **Voice & Dialogue:**
  - `POST /api/v1/voice/transcribe`
  - `GET /api/v1/voice/tts` & `GET /api/v1/voice/synthesize`
  - `POST /api/v1/voice/next-question`
  - `GET /api/v1/dialogue/next-question`
- **AI Gateway Direct:**
  - `POST /api/v1/ai/transcribe`
  - `POST /api/v1/ai/synthesize`
  - `POST /api/v1/ai/translate`
- **Interoperability (FHIR / ABDM):**
  - `GET /api/v1/fhir/{session_id}`
  - `POST /api/v1/abdm/resolve-abha`
  - `POST /api/v1/abdm/share-record`
- **Hospitals & Facilities:**
  - `GET /api/v1/hospitals`
  - `GET /api/v1/hospitals/nearby`
  - `GET /api/v1/hospitals/search`

---

## G. AI Integrations

1. **Voice Recognition (ASR):** Primary intake utilizes the browser's native **Web Speech API** for immediate client-side recognition. Backend transcription uses `faster-whisper` via `LocalVoiceProvider`, with `MockAIProvider` fallback.
2. **Text to Speech (TTS):** Frontend utilizes browser `speechSynthesis` API for instantaneous playback. Backend generates native MP3 audio streams via `gTTS`.
3. **Document OCR:** Dual-engine OCR using `pytesseract` (standard printed typography) and `easyocr` (multilingual and stylized text), extracting textual content from uploaded images.
4. **Entity Extraction:** Regular expression and rule-based parser extracting clinical parameters: medication names, dosages, units, dates, and preliminary diagnostic terms.
5. **Red Flag Detection Engine:** Deterministic rule engine parsing intake narratives and OCR text against `red_flags_rules.json` to identify emergent conditions (chest pain, dyspnea, acute neurological signs) with associated severity classifications (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).

---

## H. Patient Kiosk Workflow

```
[ Welcome Screen ]  --> Select "Begin Intake"
         │
         ▼
[ Language Selection ]  --> Select Hindi / Bengali / English / etc.
         │
         ▼
[ Patient Registration ]  --> Demographics: Name, Gender, DOB, Phone, optional ABHA
         │
         ▼
[ Informed Consent ]  --> Review terms, check permissions, sign consent
         │
         ▼
[ Multimodal Intake ]  --> Voice/touch dynamic dialogue: CC, HPI, Meds, Allergies
         │
         ▼
[ Medical History Upload ]  --> Upload physical prescriptions / lab reports
         │
         ▼
[ Done / Confirmation ]  --> Receive token number; countdown timer auto-resets kiosk
```

---

## I. Document Processing Workflow

```
[ Patient uploads document ]
         │
         ▼
[ Saved to /uploads/ with unique identifier ]
         │
         ▼
[ LocalOCRProvider runs Tesseract / EasyOCR ]
         │
         ▼
[ Raw OCR text stored in documents.ocr_text ]
         │
         ▼
[ Entity Extraction runs against OCR text ]
         │
         ▼
[ Entities saved in extracted_entities and clinical_entities with confidence scores ]
         │
         ▼
[ Red-Flag Rule Engine evaluates OCR text for contraindications and urgent risks ]
```

---

## J. Doctor Dashboard Workflow

1. **Patient Queue:** Doctor views active and completed patient sessions sorted chronologically and prioritized by triage severity (`CRITICAL` alerts top-ranked).
2. **Case Inspection:** Doctor selects a patient to view the synthesized clinical case summary (Subjective, Objective, Meds, Allergies).
3. **Document & Record Review:** Doctor inspects uploaded prescription images, OCR transcripts, and extracted entities side-by-side.
4. **Clinical Verification:** Doctor edits inaccurate or unconfirmed AI observations, adds physician notes, and clicks "Verify Session".
5. **Audit Logging:** Verification commits changes, marks session `completed`, and records an immutable log in `audit_logs`.

---

## K. Deployment Architecture

- **Containerization:** `docker-compose.yml` orchestrates:
  - `backend`: FastAPI app running on port 8000.
  - `frontend`: Next.js web client running on port 3000.
- **Local Dev:**
  - Backend: `uvicorn app.main:app --reload --port 8000`
  - Frontend: `npm run dev`

---

## L. Environment Variables

| Variable Name | Required | Default / Example | Purpose |
|---|---|---|---|
| `JWT_SECRET_KEY` | Recommended | `secret_dev_key_med_drishti` | Signing secret for authentication tokens |
| `DATABASE_URL` | Optional | `sqlite:///./med_drishti.db` | SQLAlchemy database connection URI |
| `UPLOAD_DIR` | Optional | `./uploads` | Destination directory for file storage |
| `NEXT_PUBLIC_API_URL` | Optional | `http://localhost:8000` | Backend API base URI for frontend client |

---

## M. Technical Debt

1. **ABHA Identity Integration:** The `abha_id` field exists in the database schema, but ABDM sandbox APIs are currently simulated via `MockAbdmProvider`. Real ABDM M1/M2/M3 gateway flows are not yet wired.
2. **SQLite Database Concurrency:** SQLite is suitable for single-node development and evaluation prototypes, but locks entire tables during writes. It is unsuitable for production multi-worker deployment.
3. **Bhashini Government API:** Voice and translation currently use browser Web Speech, `faster-whisper`, and `gTTS`. The Bhashini pipeline adapter architecture is established in `AIProvider`, but external API keys and live endpoints are not connected.
4. **OCR Accuracy on Handwritten Prescriptions:** `easyocr` baseline exhibits varying accuracy on cursive and noisy Indian clinical handwriting without specialized fine-tuning.

---

## N. Security & Hardening Risks

1. **Permissive CORS Configuration:** Backend currently sets `allow_origins=["*"]`, which permits cross-origin requests from any client. In production, this must be restricted to verified hospital and kiosk origins.
2. **Absence of Rate Limiting:** Authentication endpoints (`/api/v1/auth/login`, `/api/v1/auth/register`) do not enforce rate limits, presenting vulnerability to credential stuffing and brute-force attacks.
3. **Plain File Storage:** Uploaded medical files are stored in plaintext on the local filesystem rather than encrypted at rest or stored in access-controlled object storage (e.g., S3/MinIO with presigned URLs).

---

## O. Components That Must NOT Be Changed

To preserve application stability and avoid breaking dependent systems:
- **Database Schema Integrity:** Existing table names and column definitions in `models.py` must not be renamed or dropped without formal database migrations.
- **Existing API Contracts:** Existing routes and response models under `/api/v1/` must remain backward compatible.
- **Frontend Page Routes:** The Next.js routing hierarchy (`/`, `/language`, `/register`, `/consent`, `/intake`, `/medical-history`, `/done`, `/doctor`, `/triage`, `/hospitals`) must be preserved as the core user experience.
