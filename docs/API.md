# API Reference — Med-Drishti

**Base URL:** `http://localhost:8000`
**Current Version:** `v1` (`/api/v1`)
**Standard Headers:**
- `Content-Type: application/json` (for JSON endpoints)
- `Authorization: Bearer <access_token>` (for authenticated endpoints)

---

## Table of Contents
1. [Health & System](#1-health--system)
2. [Authentication](#2-authentication)
3. [Patient Management](#3-patient-management)
4. [Clinical Sessions & Intake](#4-clinical-sessions--intake)
5. [Documents & OCR](#5-documents--ocr)
6. [Patient Medical Records](#6-patient-medical-records)
7. [Triage & Red Flags](#7-triage--red-flags)
8. [Doctor Dashboard & Verification](#8-doctor-dashboard--verification)
9. [Clinical Intelligence](#9-clinical-intelligence)
10. [Voice & Dialogue Engine](#10-voice--dialogue-engine)
11. [AI Gateway Direct](#11-ai-gateway-direct)
12. [Interoperability (FHIR & ABDM)](#12-interoperability-fhir--abdm)
13. [Hospital Directory](#13-hospital-directory)

---

## 1. Health & System

### `GET /api/v1/health`
Checks backend health and timestamp.

#### Response `200 OK`
```json
{
  "status": "ok",
  "time": "2026-09-20T12:00:00.000000"
}
```

---

## 2. Authentication

### `POST /api/v1/auth/register`
Registers a new user account (Patient, Doctor, Nurse, Admin).

#### Request Body
```json
{
  "email": "doctor@hospital.in",
  "password": "securepassword123",
  "full_name": "Dr. Ramesh Gupta",
  "role": "doctor"
}
```

#### Response `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

---

### `POST /api/v1/auth/login`
Authenticates user and issues a JWT bearer token.

#### Request Body
```json
{
  "email": "doctor@hospital.in",
  "password": "securepassword123"
}
```

#### Response `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

---

### `POST /api/v1/auth/logout`
Terminates user session.

#### Headers
`Authorization: Bearer <access_token>`

#### Response `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

## 3. Patient Management

### `POST /api/v1/patients`
Creates a new patient profile.

#### Request Body
```json
{
  "name": "Rahul Sharma",
  "date_of_birth": "1985-06-15",
  "gender": "male",
  "phone": "9876543210",
  "preferred_language": "Hindi",
  "abha_id": "12-3456-7890-1234"
}
```

#### Response `200 OK`
```json
{
  "id": 1,
  "name": "Rahul Sharma",
  "date_of_birth": "1985-06-15",
  "gender": "male",
  "phone": "9876543210",
  "preferred_language": "Hindi",
  "abha_id": "12-3456-7890-1234",
  "created_at": "2026-09-20T12:05:00.000000",
  "updated_at": "2026-09-20T12:05:00.000000"
}
```

---

### `GET /api/v1/patients/{patient_id}`
Retrieves patient details by ID.

#### Response `200 OK`
```json
{
  "id": 1,
  "name": "Rahul Sharma",
  "date_of_birth": "1985-06-15",
  "gender": "male",
  "phone": "9876543210",
  "preferred_language": "Hindi",
  "abha_id": "12-3456-7890-1234",
  "created_at": "2026-09-20T12:05:00.000000",
  "updated_at": "2026-09-20T12:05:00.000000"
}
```

---

### `PUT /api/v1/patients/{patient_id}`
Updates demographic information for a patient.

#### Request Body
```json
{
  "phone": "9876500000",
  "preferred_language": "English"
}
```

#### Response `200 OK`
```json
{
  "id": 1,
  "name": "Rahul Sharma",
  "date_of_birth": "1985-06-15",
  "gender": "male",
  "phone": "9876500000",
  "preferred_language": "English",
  "abha_id": "12-3456-7890-1234",
  "created_at": "2026-09-20T12:05:00.000000",
  "updated_at": "2026-09-20T12:10:00.000000"
}
```

---

### `POST /api/v1/patients/{patient_id}/consents`
Records patient consent for data and voice processing.

#### Request Body
```json
{
  "consent_type": "data_processing",
  "expires_at": "2027-09-20T12:00:00"
}
```

#### Response `200 OK`
```json
{
  "id": 1,
  "patient_id": 1,
  "consent_type": "data_processing",
  "status": "accepted",
  "signed_at": "2026-09-20T12:06:00.000000",
  "expires_at": "2027-09-20T12:00:00.000000",
  "created_at": "2026-09-20T12:06:00.000000"
}
```

---

### `GET /api/v1/patients/{patient_id}/consents`
Retrieves all recorded consent agreements for a patient.

#### Response `200 OK`
```json
[
  {
    "id": 1,
    "patient_id": 1,
    "consent_type": "data_processing",
    "status": "accepted",
    "signed_at": "2026-09-20T12:06:00.000000",
    "expires_at": "2027-09-20T12:00:00.000000",
    "created_at": "2026-09-20T12:06:00.000000"
  }
]
```

---

## 4. Clinical Sessions & Intake

### `POST /api/v1/sessions`
Initiates a new clinical intake session for a patient.

#### Request Body
```json
{
  "patient_id": 1,
  "session_type": "intake"
}
```

#### Query Parameter (optional)
- `department`: e.g. `General` or `Ayurveda` (Default: `General`)

#### Response `200 OK`
```json
{
  "id": 10,
  "patient_id": 1,
  "session_type": "intake",
  "status": "active",
  "started_at": "2026-09-20T12:15:00.000000",
  "completed_at": null
}
```

---

### `GET /api/v1/sessions/{session_id}`
Retrieves session status and metadata.

#### Response `200 OK`
```json
{
  "id": 10,
  "patient_id": 1,
  "session_type": "intake",
  "status": "active",
  "started_at": "2026-09-20T12:15:00.000000",
  "completed_at": null
}
```

---

### `PUT /api/v1/sessions/{session_id}`
Updates session status (e.g., marks as completed).

#### Request Body
```json
{
  "status": "completed"
}
```

#### Response `200 OK`
```json
{
  "id": 10,
  "patient_id": 1,
  "session_type": "intake",
  "status": "completed",
  "started_at": "2026-09-20T12:15:00.000000",
  "completed_at": "2026-09-20T12:30:00.000000"
}
```

---

### `POST /api/v1/sessions/{session_id}/history`
Saves structured clinical history notes and triggers red flag evaluation.

#### Request Body
```json
{
  "chief_complaint": "Acute crushing chest pain radiating to left arm",
  "history_of_present_illness": "Pain began 2 hours ago while resting. Accompanied by sweating.",
  "past_medical_history": "Hypertension diagnosed 2021",
  "medications": "Amlodipine 5mg once daily",
  "allergies": "Penicillin",
  "family_history": "Father suffered myocardial infarction at age 55",
  "social_history": "Non-smoker, occasional alcohol"
}
```

#### Response `200 OK`
```json
{
  "id": 5,
  "session_id": 10,
  "chief_complaint": "Acute crushing chest pain radiating to left arm",
  "history_of_present_illness": "Pain began 2 hours ago while resting. Accompanied by sweating.",
  "past_medical_history": "Hypertension diagnosed 2021",
  "medications": "Amlodipine 5mg once daily",
  "allergies": "Penicillin",
  "family_history": "Father suffered myocardial infarction at age 55",
  "social_history": "Non-smoker, occasional alcohol",
  "created_at": "2026-09-20T12:20:00.000000"
}
```

---

### `GET /api/v1/sessions/{session_id}/history`
Retrieves recorded clinical history for a session.

#### Response `200 OK`
```json
[
  {
    "id": 5,
    "session_id": 10,
    "chief_complaint": "Acute crushing chest pain radiating to left arm",
    "history_of_present_illness": "Pain began 2 hours ago while resting. Accompanied by sweating.",
    "past_medical_history": "Hypertension diagnosed 2021",
    "medications": "Amlodipine 5mg once daily",
    "allergies": "Penicillin",
    "family_history": "Father suffered myocardial infarction at age 55",
    "social_history": "Non-smoker, occasional alcohol",
    "created_at": "2026-09-20T12:20:00.000000"
  }
]
```

---

### `GET /api/v1/sessions/{session_id}/summary`
Generates a synthesized clinical summary aggregating dialogue, documents, medications, and red flags.

#### Response `200 OK`
```json
{
  "session_id": 10,
  "patient": {
    "id": 1,
    "name": "Rahul Sharma",
    "gender": "male",
    "date_of_birth": "1985-06-15",
    "preferred_language": "Hindi"
  },
  "subjective": {
    "chief_complaint": "Acute crushing chest pain radiating to left arm",
    "history_of_present_illness": "Pain began 2 hours ago while resting. Accompanied by sweating.",
    "medications": "Amlodipine 5mg once daily",
    "allergies": "Penicillin"
  },
  "objective": {
    "extracted_entities": [
      {
        "entity_type": "Medication",
        "entity_value": "Amlodipine 5mg",
        "confidence": 1.0
      }
    ],
    "documents_count": 1
  },
  "red_flags": [
    {
      "id": 1,
      "rule_id": "RF_CARDIAC_CHEST_PAIN",
      "description": "Chest pain / cardiac pattern detected",
      "severity": "critical",
      "reviewed": false
    }
  ],
  "medical_records": []
}
```

---

### `POST /api/v1/sessions/{session_id}/verify` (and `PUT`)
Doctor verifies and signs off on a session, committing physician notes and creating an audit trail.

#### Request Body
```json
{
  "chief_complaint": "Confirmed: Acute angina / suspect NSTEMI",
  "history_of_present_illness": "Verified by Dr. Sharma. Pain radiates to left arm, diaphoretic.",
  "medications": "Amlodipine 5mg OD; Aspirin 325mg STAT given",
  "allergies": "Penicillin verified",
  "physician_notes": "Urgent ECG performed. Referred to Cardiology Department."
}
```

#### Response `200 OK`
```json
{
  "message": "Session successfully verified and completed",
  "session_id": 10,
  "status": "completed"
}
```

---

### `GET /api/v1/sessions/{session_id}/audit-logs`
Retrieves the audit log history associated with the patient session.

#### Response `200 OK`
```json
[
  {
    "id": 12,
    "patient_id": 1,
    "action": "verify_session",
    "resource_type": "clinical_session",
    "resource_id": 10,
    "timestamp": "2026-09-20T12:45:00.000000",
    "details": "Physician verified session #10. Notes: Urgent ECG performed. Referred to Cardiology Department."
  }
]
```

---

## 5. Documents & OCR

### `POST /api/v1/documents/upload` (and `/api/v1/documents`)
Uploads a scanned prescription, lab report, or medical record image; executes OCR and extracts entities.

#### Request Form-Data
- `session_id`: `10`
- `file`: `<binary image/PDF file>`

#### Response `200 OK`
```json
{
  "id": 3,
  "session_id": 10,
  "file_name": "prescription_scan.jpg",
  "file_type": "image/jpeg",
  "s3_key": "/path/to/uploads/10_prescription_scan.jpg",
  "ocr_text": "Rx Metformin 500mg BD Tab Atorvastatin 20mg HS BP 140/90",
  "upload_at": "2026-09-20T12:22:00.000000",
  "extracted_entities": [
    {
      "id": 8,
      "document_id": 3,
      "entity_type": "medication",
      "entity_value": "Metformin 500mg",
      "confidence": 0.92,
      "source_text": "Metformin 500mg BD",
      "extracted_at": "2026-09-20T12:22:01.000000"
    }
  ]
}
```

---

### `GET /api/v1/documents/{document_id}/entities`
Retrieves all entities parsed from a specific uploaded document.

#### Response `200 OK`
```json
{
  "document_id": 3,
  "entities": [
    {
      "id": 8,
      "document_id": 3,
      "entity_type": "medication",
      "entity_value": "Metformin 500mg",
      "confidence": 0.92,
      "source_text": "Metformin 500mg BD"
    }
  ]
}
```

---

## 6. Patient Medical Records

### `POST /api/v1/patients/{patient_id}/medical-records/upload`
Uploads a historical medical document attached directly to the patient profile.

#### Request Form-Data
- `file`: `<binary file>`
- `title`: `"Chest X-Ray Report 2024"`
- `description`: `"Routine health checkup report"`
- `record_type`: `"imaging"` (Options: `lab_report`, `prescription`, `discharge_summary`, `imaging`, `other`)
- `session_id`: `10` (optional)

#### Response `200 OK`
```json
{
  "id": 4,
  "patient_id": 1,
  "session_id": 10,
  "record_type": "imaging",
  "title": "Chest X-Ray Report 2024",
  "description": "Routine health checkup report",
  "file_name": "xray_report.pdf",
  "file_type": "application/pdf",
  "ocr_text": "Lungs clear, cardiothoracic ratio normal.",
  "uploaded_at": "2026-09-20T12:25:00.000000"
}
```

---

### `GET /api/v1/patients/{patient_id}/medical-records`
Lists all historical medical records for a patient.

#### Response `200 OK`
```json
[
  {
    "id": 4,
    "patient_id": 1,
    "session_id": 10,
    "record_type": "imaging",
    "title": "Chest X-Ray Report 2024",
    "description": "Routine health checkup report",
    "file_name": "xray_report.pdf",
    "file_type": "application/pdf",
    "ocr_text": "Lungs clear, cardiothoracic ratio normal.",
    "uploaded_at": "2026-09-20T12:25:00.000000"
  }
]
```

---

### `GET /api/v1/medical-records/{record_id}/file`
Downloads or streams the raw uploaded file from disk.

#### Response
Streams file with appropriate `Content-Type` header (e.g. `image/jpeg` or `application/pdf`).

---

### `DELETE /api/v1/medical-records/{record_id}`
Deletes a medical record and unlinks its physical file.

#### Response `200 OK`
```json
{
  "message": "Medical record deleted",
  "id": 4
}
```

---

## 7. Triage & Red Flags

### `GET /api/v1/triage/alerts`
Retrieves all active and reviewed clinical red-flag alerts.

#### Response `200 OK`
```json
[
  {
    "id": 1,
    "session_id": 10,
    "rule_id": "RF_CARDIAC_CHEST_PAIN",
    "description": "Chest pain / cardiac pattern detected",
    "severity": "critical",
    "triggered_at": "2026-09-20T12:20:01.000000",
    "reviewed": false
  }
]
```

---

### `POST /api/v1/triage/alerts/{alert_id}/review` (and `PUT`)
Allows a triage nurse or physician to acknowledge and sign off on a red flag.

#### Request Body
```json
{
  "reviewed": true
}
```

#### Response `200 OK`
```json
{
  "id": 1,
  "session_id": 10,
  "rule_id": "RF_CARDIAC_CHEST_PAIN",
  "description": "Chest pain / cardiac pattern detected",
  "severity": "critical",
  "triggered_at": "2026-09-20T12:20:01.000000",
  "reviewed": true
}
```

---

## 8. Doctor Dashboard & Verification

### `GET /api/v1/doctor/queue`
Retrieves the prioritized queue of patient intake sessions for physician review.

#### Response `200 OK`
```json
[
  {
    "session_id": 10,
    "patient_id": 1,
    "patient_name": "Rahul Sharma",
    "patient_gender": "male",
    "patient_dob": "1985-06-15",
    "session_type": "intake",
    "status": "active",
    "started_at": "2026-09-20T12:15:00.000000",
    "completed_at": null,
    "triage_status": "CRITICAL",
    "red_flags_count": 1,
    "documents_count": 1,
    "medical_records_count": 1
  }
]
```

---

## 9. Clinical Intelligence

### `GET /api/v1/clinical-intelligence/{session_id}`
Computes out-of-range lab findings, drug-drug interaction warnings, and missing intake fields.

#### Response `200 OK`
```json
{
  "session_id": 10,
  "abnormal_findings": [
    {
      "entity_id": 14,
      "value": "160/100",
      "range": "90-120 mmHg",
      "status": "ABNORMAL"
    }
  ],
  "drug_interactions": [
    "Interaction between amlodipine and lisinopril: Risk of excessive hypotension"
  ],
  "missing_information": [],
  "total_clinical_entities": 6
}
```

---

## 10. Voice & Dialogue Engine

### `POST /api/v1/voice/transcribe`
Transcribes uploaded audio speech to text using the AI Gateway.

#### Request Form-Data
- `audio`: `<binary audio WAV/MP3 file>`
- `language`: `"hi"` (Default: `"en"`)

#### Response `200 OK`
```json
{
  "text": "मुझे दो दिन से सीने में दर्द है",
  "language_detected": "hi",
  "confidence": 0.95
}
```

---

### `GET /api/v1/voice/synthesize` (and `GET /api/v1/voice/tts`)
Generates high-quality native audio stream for question text.

#### Query Parameters
- `text`: `"कृपया अपनी मुख्य समस्या बताएं"`
- `lang`: `"hi"`

#### Response
Direct binary MP3 audio stream (`Content-Type: audio/mpeg`).

---

### `GET /api/v1/dialogue/next-question` (and `POST /api/v1/voice/next-question`)
Determines the next adaptive clinical question based on prior patient answers and department.

#### Query Parameters
- `session_id`: `10`
- `current_question_id`: `"chief_complaint"`
- `last_answer`: `"severe chest pain"`
- `language`: `"en"`

#### Response `200 OK`
```json
{
  "question_id": "chest_pain_nature",
  "question_text": "Is the chest pain sharp, crushing, or burning? Does it spread to your arm or neck?",
  "field": "history_of_present_illness",
  "done": false,
  "session_id": 10
}
```

---

## 11. AI Gateway Direct

### `POST /api/v1/ai/transcribe`
Direct audio transcription interface via registered provider.

#### Form-Data
- `file`: `<audio file>`
- `language`: `"hi"`

#### Response `200 OK`
```json
{
  "text": "मेरे सिर में दर्द है",
  "language_detected": "hi",
  "confidence": 0.94
}
```

---

### `POST /api/v1/ai/synthesize`
Direct text-to-speech generation interface.

#### Request Body
```json
{
  "text": "Hello, how are you feeling today?",
  "language": "en"
}
```

#### Response
Binary audio stream (`audio/mpeg`).

---

### `POST /api/v1/ai/translate`
Translates text between Indian languages and English.

#### Request Body
```json
{
  "text": "Severe headache for three days",
  "source_language": "en",
  "target_language": "hi"
}
```

#### Response `200 OK`
```json
{
  "original_text": "Severe headache for three days",
  "translated_text": "तीन दिनों से गंभीर सिरदर्द",
  "source_language": "en",
  "target_language": "hi"
}
```

---

## 12. Interoperability (FHIR & ABDM)

### `GET /api/v1/fhir/{session_id}` (and `/api/v1/sessions/{session_id}/fhir`)
Generates an HL7 FHIR R4 Bundle for the clinical intake encounter.

#### Response `200 OK`
```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "timestamp": "2026-09-20T12:35:00.000000",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "1",
        "identifier": [
          {
            "system": "http://abha.gov.in",
            "value": "12-3456-7890-1234"
          }
        ],
        "name": [
          {
            "text": "Rahul Sharma"
          }
        ],
        "gender": "male",
        "birthDate": "1985-06-15"
      }
    },
    {
      "resource": {
        "resourceType": "Encounter",
        "id": "10",
        "status": "finished",
        "class": {
          "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          "code": "AMB"
        },
        "subject": {
          "reference": "Patient/1"
        }
      }
    }
  ]
}
```

---

### `POST /api/v1/abdm/resolve-abha`
Verifies an Ayushman Bharat Health Account (ABHA) address or 14-digit number.

#### Request Body
```json
{
  "abha_id": "12-3456-7890-1234"
}
```

#### Response `200 OK`
```json
{
  "status": "success",
  "patient_name": "Demo Patient",
  "abha_verified": true,
  "linked_id": "ABHA12345678"
}
```

---

### `POST /api/v1/abdm/share-record`
Simulates pushing an encounter FHIR Bundle to ABDM Health Information Exchange.

#### Request Body
```json
{
  "session_id": 10
}
```

#### Response `200 OK`
```json
{
  "status": "success",
  "consent_id": "CONSENT_a4f8b912",
  "session_id": 10,
  "fhir_resource_count": 5
}
```

---

## 13. Hospital Directory

### `GET /api/v1/hospitals`
Lists healthcare facilities, optionally filtered by state.

#### Query Parameters
- `state`: e.g. `"Delhi"` (optional)

#### Response `200 OK`
```json
{
  "hospitals": [
    {
      "id": 1,
      "name": "All India Institute of Ayurveda",
      "city": "New Delhi",
      "state": "Delhi",
      "type": "AYUSH / Tertiary",
      "emergency_available": true
    }
  ],
  "count": 1
}
```
