# Med-Drishti — Implementation Plan

This document translates the PRD into a prioritized, phased implementation plan.

## Goal
Deliver an MVP for Med-Drishti that enables patient-facing clinical intake (voice + touch), basic document upload + OCR, structured clinical history capture, red-flag detection, and a physician review dashboard. Design for later expansion (AYUSH mode, advanced Document AI, FHIR mapping).

## MVP Scope (Hackathon minimum)
- Patient registration + consent + language selection
- Voice & touch intake for chief complaint and HPI (basic schema-driven dialog)
- Document upload and baseline OCR (printed text) with entity extraction for medications and dates
- Structured clinical record storage (Postgres schema subset)
- Simple clinical summary generator (template + lightweight LLM prompts)
- Red-flag rule engine (configurable rules)
- Physician dashboard showing summary, timeline, and original documents
- Role-based auth (patient, doctor, triage nurse)
- Basic security: TLS, data isolation, consent audit

## Tech Stack
- **Frontend:** Next.js + TypeScript + Tailwind CSS
- **Backend:** FastAPI + Pydantic + SQLAlchemy
- **DB:** PostgreSQL
- **Cache:** Redis
- **Object Storage:** MinIO (dev)
- **OCR:** Tesseract/PaddleOCR (baseline)
- **ASR:** Whisper small/medium or Indic model

## Phases & Timeline

### Phase 0 — Project Setup (1 day)
- Repository structure: `backend/`, `frontend/`, `infra/`, `docs/`
- Docker-compose for Postgres + Redis + MinIO
- `.env.example`, README templates

### Phase 1 — Core Backend & Data Model (2–3 days)
- DB models: Patient, ClinicalSession, ClinicalHistory, Document, ExtractedEntity, Consent, RedFlag, AuditLog
- Auth endpoints: login, refresh, logout
- API: POST `/api/v1/patients`, GET `/api/v1/patients/{id}`, POST `/api/v1/sessions`

### Phase 1A — Registration Flow Repair (current fix)
- Reconcile frontend payloads with the FastAPI contracts (`name` vs `full_name`, patient/session IDs, bearer-token usage)
- Allow guest kiosk patient registration without blocking on a pre-existing account when the app is used as a public intake station
- Support both query-param and JSON-based patient IDs for session creation to keep frontend and backend compatibility stable
- Validate the end-to-end patient creation + session creation flow before continuing the next UX pass

### Phase 2 — Frontend Basic UI & Kiosk Mode (2–3 days)
- Welcome, language selection, registration, consent screens
- Large buttons, audio prompt placeholders, kiosk cleanup flow
- Wire to backend

### Phase 3 — Voice Intake & Dialogue Engine (3–5 days)
- ASR integration (Whisper API or local model)
- POST `/api/v1/voice/transcribe` and `/api/v1/voice/next-question`
- Schema-driven question policy for HPI

### Phase 4 — Document Upload + OCR (2–4 days)
- POST `/api/v1/documents` upload endpoint
- Image preprocessing (deskew, denoise)
- Tesseract/PaddleOCR integration
- Regex-based entity extraction (medication, dates, lab values)

### Phase 5 — Summary Generator & Confidence UI (2–3 days)
- Combine structured inputs + extracted entities into summary
- Mark low-confidence values
- Source traceability

### Phase 6 — Red-Flag Engine & Triage Dashboard (1–2 days)
- YAML/DB-based red-flag rules
- Triage alerts API and dashboard

### Phase 7 — Physician Dashboard & Review (2–3 days)
- Patient queue, summary, document viewer, timeline
- Edit/verify workflow with audit logging

### Phase 8 — Testing & Polish (2–3 days)
- Unit + integration tests
- Load testing
- Security audit
- Demo data

## First Tasks to Implement

**Task 1:** Create repo skeleton with docker-compose
**Task 2:** Implement `GET /api/v1/health` and `POST /api/v1/patients` endpoints
**Task 3:** Basic patient registration UI (Next.js form)
**Task 4:** Document upload + OCR pipeline
**Task 5:** Summary generator (template-based)

## Minimum APIs

```
GET  /api/v1/health
POST /api/v1/auth/login
POST /api/v1/patients
GET  /api/v1/patients/{patient_id}
POST /api/v1/sessions
GET  /api/v1/sessions/{session_id}
POST /api/v1/documents
POST /api/v1/voice/transcribe
GET  /api/v1/triage/alerts
```

## Definition of Done
- UI implemented
- API implemented
- Database model implemented
- Tests written
- Error handling implemented
- Documentation updated

---

**Next:** Start with Phase 0 & Phase 1 (backend skeleton + first endpoints).

