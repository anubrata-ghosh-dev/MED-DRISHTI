# Testing & Verification Guide — Med-Drishti

**Test Suite Version:** 1.0.0
**Test Categories:** Unit Tests, Integration Tests, E2E CLI Automation, Frontend Static Analysis

---

## 1. Test Execution Commands

### 1.1 Backend Unit & Integration Tests (pytest)
To execute the automated backend test suite covering API routes, authentication, sessions, and red-flag rules:

```bash
cd backend
python3 -m pytest tests/ -v
```

### 1.2 Standalone Registration & CORS Test
To verify CORS header delivery and patient registration edge cases (e.g. whitespace or empty string ABHA handling):

```bash
cd backend
python3 test_registration.py
```

### 1.3 Complete Integration Bash Script
To run an automated end-to-end integration test against a live backend (`http://localhost:8000`) testing all phases (Auth, Consent, Dialogue, Summary, Red Flags, OCR, Doctor Queue, Verification):

```bash
./test-complete-flow.sh
```

### 1.4 Frontend Type Check & Production Build
To ensure strict TypeScript type safety and compile the Next.js frontend without errors:

```bash
cd frontend
npm run build
npm run lint
```

---

## 2. Core Test Scenarios

### Scenario 1: Patient Registration & Profile Handling
- **Objective:** Validate creation of patient records with diverse data formats.
- **Test Steps:**
  1. Send `POST /api/v1/patients` with full details (Name, DOB, Gender, Phone, Language, ABHA).
  2. Send `POST /api/v1/patients` with optional fields left blank or empty string.
  3. Verify that empty ABHA values are converted to `None` so unique index violations do not trigger.
- **Expected Status:** `200 OK`.

### Scenario 2: Informed Consent Recording
- **Objective:** Ensure informed consent is recorded prior to clinical intake.
- **Test Steps:**
  1. Send `POST /api/v1/patients/{id}/consents` with `consent_type: "data_processing"`.
  2. Send `POST /api/v1/patients/{id}/consents` with `consent_type: "voice_recording"`.
  3. Verify with `GET /api/v1/patients/{id}/consents`.
- **Expected Status:** `200 OK` with status `accepted` and signed timestamp.

### Scenario 3: Clinical Session & Adaptive Dialogue Flow
- **Objective:** Test conversational progression through clinical dialogue policy.
- **Test Steps:**
  1. Create session via `POST /api/v1/sessions`.
  2. Request first question: `POST /api/v1/voice/next-question` with `current_question_id: null`.
  3. Verify return of `chief_complaint`.
  4. Submit answer `"Chest pain and shortness of breath"`.
  5. Verify adaptive branching dynamically selects targeted follow-up question.
  6. Traverse question tree until `done: true`.
- **Expected Outcome:** Progressive sequence leading to completed case capture.

### Scenario 4: Voice & Speech Engine Fallback Handling
- **Objective:** Ensure the system handles missing audio or transcription failures without crashing.
- **Test Steps:**
  1. Submit corrupt or empty audio bytes to `POST /api/v1/voice/transcribe`.
  2. Verify that `LocalVoiceProvider` catches the error and `MockAIProvider` emits a fallback envelope.
- **Expected Outcome:** `200 OK` returning `{"text": "[Transcription Unavailable]", ...}` with confidence `0.0`.

### Scenario 5: Deterministic Red-Flag Detection
- **Objective:** Verify real-time detection of clinical emergency patterns.
- **Test Steps:**
  1. Submit clinical history containing: `"Crushing chest pain radiating to left arm and sweating"`.
  2. Verify `red_flag_engine.evaluate_red_flags()` identifies rule `RF_CARDIAC_URGENT` / `RF_CARDIAC_CHEST_PAIN`.
  3. Verify record created in `red_flags` table with severity `CRITICAL`.
  4. Verify patient appears with `triage_status: "CRITICAL"` on `GET /api/v1/doctor/queue` and `GET /api/v1/triage/alerts`.
- **Expected Outcome:** Immediate prioritization on both physician and triage nurse dashboards.

### Scenario 6: Document Upload & OCR Entity Extraction
- **Objective:** Validate text extraction and clinical parameter parsing from physical documents.
- **Test Steps:**
  1. Upload prescription image via `POST /api/v1/documents/upload`.
  2. Check `documents.ocr_text` contains raw extracted text.
  3. Verify `extracted_entities` and `clinical_entities` contain structured drug names (e.g. `"Metformin 500mg"`).
- **Expected Outcome:** OCR text digitized with structured clinical parameters.

### Scenario 7: Physician Verification & Immutable Audit Logging
- **Objective:** Verify doctor sign-off workflow and tamper-evident audit trail.
- **Test Steps:**
  1. Doctor reviews intake summary via `GET /api/v1/sessions/{id}/summary`.
  2. Doctor submits verification via `POST /api/v1/sessions/{id}/verify`.
  3. Verify session status transitions from `active` to `completed`.
  4. Query `GET /api/v1/sessions/{id}/audit-logs` and verify log entry exists with timestamp, doctor notes, and action `verify_session`.
- **Expected Outcome:** Complete, auditable encounter record signed off by doctor.

### Scenario 8: HL7 FHIR R4 Bundle Compilation
- **Objective:** Validate FHIR compliance for health system integration.
- **Test Steps:**
  1. Query `GET /api/v1/fhir/{session_id}`.
  2. Parse response and verify root object is `{"resourceType": "Bundle", "type": "collection"}`.
  3. Verify entry list contains valid `Patient`, `Encounter`, `Observation`, and `MedicationStatement` resources.
- **Expected Outcome:** Valid HL7 FHIR R4 JSON bundle.

### Scenario 9: Kiosk Security Auto-Reset
- **Objective:** Ensure patient privacy between kiosk users.
- **Test Steps:**
  1. Navigate to `/done` in frontend.
  2. Wait for 30-second countdown or click "New Patient Intake".
  3. Verify redirection to `/` and verify `localStorage` tokens and active session IDs are wiped.
- **Expected Outcome:** Clean state for subsequent patient.
