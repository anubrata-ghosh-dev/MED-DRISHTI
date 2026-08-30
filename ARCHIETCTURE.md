# ARCHITECTURE.md — Med-Drishti

## AI-Powered Patient Case-Taking & Clinical Intake Platform

**Project:** Med-Drishti  
**SIH Problem Statement:** SIH26047 — Patient Case-Taking Software  
**Target:** Smart India Hackathon 2026  
**Architecture Version:** 1.0.0  
**Status:** Engineering Specification

---

# 1. Architecture Overview

Med-Drishti is a modular, API-driven clinical intake platform designed to collect patient history, process medical documents, identify predefined red flags, generate structured clinical summaries, and present those summaries to healthcare professionals for verification.

The architecture follows a fundamental principle:

> **AI assists clinical information processing; it does not replace clinical decision-making.**

The system is divided into six major layers:

```text
┌────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                      │
│                                                            │
│ Med-Drishti │ Doctor Dashboard │ Triage │ Admin          │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                         API LAYER                           │
│                                                            │
│ FastAPI │ Authentication │ RBAC │ Validation │ WebSocket    │
└─────────────────────────────┬──────────────────────────────┘
                              │
             ┌────────────────┼─────────────────┐
             ▼                ▼                 ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Clinical Services│ │ Document Services│ │ Triage Services  │
│                  │ │                  │ │                  │
│ Sessions         │ │ Upload           │ │ Red Flags        │
│ History          │ │ OCR              │ │ Alerts           │
│ Dialogue         │ │ Extraction       │ │ Queue            │
│ Summary          │ │ Timeline         │ │ Acknowledgement  │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
┌────────────────────────────────────────────────────────────┐
│                         AI LAYER                            │
│                                                            │
│ ASR │ OCR │ NLP/NER │ Dialogue │ Summary │ Confidence      │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                       DATA LAYER                            │
│                                                            │
│ PostgreSQL │ Redis │ Object Storage │ Audit Logs            │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                  INTEROPERABILITY LAYER                     │
│                                                            │
│ FHIR Mapper │ HIS Adapter │ ABDM Adapter                   │
└────────────────────────────────────────────────────────────┘
```

---

# 2. Architectural Goals

The architecture must provide:

1. Reliable patient intake
2. Modular AI components
3. Strong separation between AI and clinical truth
4. Human verification
5. Multilingual support
6. Document processing
7. Red-flag detection
8. Secure healthcare-data handling
9. Horizontal scalability
10. FHIR/ABDM readiness
11. Easy local development
12. Easy deployment
13. Graceful AI failure
14. Strong observability
15. Testability

---

# 3. Core Architectural Principles

## 3.1 AI Is Not the Source of Truth

The system should distinguish between:

```text
Patient-provided information
        ↓
Document-derived information
        ↓
AI-derived information
        ↓
Physician-verified information
```

The highest trust should be assigned to information that has been explicitly verified by a healthcare professional.

---

## 3.2 Structured Data First

Do not store the patient's history only as a large text blob.

Instead of:

```text
"Patient has diabetes and takes medicine..."
```

store:

```json
{
  "condition": "Type 2 Diabetes Mellitus",
  "status": "active",
  "source": "patient",
  "confidence": 0.94
}
```

Structured data enables:

- Validation
- Search
- Timeline generation
- FHIR mapping
- Analytics
- Better summaries
- Better auditability

---

## 3.3 AI Components Must Be Replaceable

The architecture must not depend on a single AI provider.

For example:

```text
ASR Interface
     │
     ├── Whisper Adapter
     ├── Indic ASR Adapter
     └── Future ASR Adapter
```

The rest of the application should not care which model is being used.

The same principle applies to:

- OCR
- NER
- LLM
- Embedding models
- Translation

---

## 3.4 Safety-Critical Logic Must Be Deterministic

Do not allow an LLM to be the only component deciding emergency alerts.

Use:

```text
Structured Clinical State
        ↓
Deterministic Rules
        ↓
Red Flag
        ↓
Triage Alert
```

An LLM can help extract symptoms, but the final safety rule should preferably be deterministic.

---

## 3.5 Human-in-the-Loop

Critical AI output follows:

```text
AI
 ↓
Confidence
 ↓
Source
 ↓
Doctor Review
 ↓
Verification
 ↓
Clinical Record
```

---

# 4. System Context

At the highest level:

```text
                         ┌──────────────┐
                         │   Patient    │
                         └──────┬───────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Med-Drishti   │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   API Gateway   │
                       └────────┬────────┘
                                │
             ┌──────────────────┼─────────────────┐
             │                  │                 │
             ▼                  ▼                 ▼
       Clinical Service   Document Service   Triage Service
             │                  │                 │
             └──────────────────┼─────────────────┘
                                │
                                ▼
                           AI Services
                                │
                                ▼
                         Clinical Database
                                │
                  ┌─────────────┴─────────────┐
                  ▼                           ▼
           Doctor Dashboard             Triage Dashboard
                  │
                  ▼
            Physician Review
                  │
                  ▼
         Interoperability Layer
                  │
             ┌────┴─────┐
             ▼          ▼
            FHIR       HIS/ABDM
```

---

# 5. Deployment Architecture

For the hackathon, use a modular monolith with isolated AI workers rather than immediately creating dozens of microservices.

Recommended:

```text
                         INTERNET / LAN
                              │
                              ▼
                         NGINX / Caddy
                              │
                              ▼
                        Next.js App
                              │
                              ▼
                         FastAPI API
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
         PostgreSQL         Redis          MinIO
              │               │                │
              │               ▼                │
              │          Task Queue             │
              │               │                │
              └───────────────┼────────────────┘
                              ▼
                       AI Worker Pool
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
                ASR          OCR          NLP
                                             │
                                             ▼
                                         Summary
```

This is simpler to develop and deploy than a large microservice architecture.

---

# 6. Recommended Technology Stack

## Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
Accessible UI Components
```

Responsibilities:

- Med-Drishti
- Doctor dashboard
- Triage dashboard
- Admin dashboard
- Voice recording
- Document upload
- Session state
- API interaction

---

## Backend

```text
Python
FastAPI
Pydantic
SQLAlchemy
Alembic
```

Responsibilities:

- API
- Authentication
- Authorization
- Clinical sessions
- Patient data
- Document metadata
- AI orchestration
- Triage
- Summary generation
- Audit logging
- FHIR mapping

---

## Database

```text
PostgreSQL
```

PostgreSQL is the primary source of structured application data.

---

## Cache / Queue

```text
Redis
```

Used for:

- Temporary session state
- Background jobs
- Task queue
- Rate limiting
- Short-lived caching

Redis must not become the permanent source of clinical records.

---

## Object Storage

Development:

```text
MinIO
```

Production:

```text
S3-compatible object storage
```

Used for:

- Medical images
- PDFs
- Audio recordings where retention is explicitly required
- Processed documents

---

## AI Runtime

Potential stack:

```text
Python
PyTorch
Transformers
ONNX Runtime
CUDA where available
```

Models should be accessed through adapters.

---

# 7. Repository Architecture

Recommended repository:

```text
med-drishti/
│
├── apps/
│   │
│   ├── patient-kiosk/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── tests/
│   │
│   ├── doctor-dashboard/
│   │   ├── app/
│   │   ├── components/
│   │   └── tests/
│   │
│   └── admin-dashboard/
│       ├── app/
│       ├── components/
│       └── tests/
│
├── backend/
│   │
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   ├── core/
│   │   ├── auth/
│   │   ├── patients/
│   │   ├── sessions/
│   │   ├── history/
│   │   ├── documents/
│   │   ├── triage/
│   │   ├── summaries/
│   │   ├── ayush/
│   │   ├── audit/
│   │   └── interoperability/
│   │
│   ├── migrations/
│   └── tests/
│
├── ai/
│   │
│   ├── common/
│   ├── asr/
│   ├── ocr/
│   ├── document_classifier/
│   ├── nlp/
│   ├── dialogue/
│   ├── red_flags/
│   ├── summarization/
│   └── evaluation/
│
├── data/
│   ├── schemas/
│   ├── ontologies/
│   ├── synthetic/
│   └── samples/
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── monitoring/
│
├── tests/
│   ├── integration/
│   └── e2e/
│
├── docs/
│
├── docker-compose.yml
├── .env.example
├── README.md
├── PRD.md
├── ARCHITECTURE.md
├── AI_ARCHITECTURE.md
├── SECURITY.md
├── API.md
├── DATA_MODEL.md
├── DEPLOYMENT.md
└── LICENSE
```

---

# 8. Frontend Architecture

The frontend should be separated into three primary applications.

```text
apps/
├── patient-kiosk
├── doctor-dashboard
└── admin-dashboard
```

A fourth route/application may be used for triage if required.

---

# 9. Med-Drishti Architecture

The Med-Drishti should be designed as a state-driven application.

```text
Welcome
  ↓
Language
  ↓
Identification
  ↓
Registration
  ↓
Consent
  ↓
Department
  ↓
Interview
  ↓
Documents
  ↓
Review
  ↓
Completion
```

Each step has:

```text
UI
State
Validation
API
Error Handling
Recovery
```

---

# 10. Patient State Machine

```text
WELCOME
   ↓
LANGUAGE_SELECTED
   ↓
IDENTIFIED
   ↓
REGISTERED
   ↓
CONSENTED
   ↓
DEPARTMENT_SELECTED
   ↓
INTERVIEWING
   ↓
HISTORY_COMPLETED
   ↓
DOCUMENT_UPLOAD
   ↓
DOCUMENT_PROCESSING
   ↓
REVIEW
   ↓
SUBMITTED
   ↓
COMPLETED
```

Failure states:

```text
ERROR
REQUIRES_ASSISTANCE
EXPIRED
CANCELLED
```

---

# 11. Doctor Dashboard Architecture

The doctor dashboard should be optimized for speed.

Primary layout:

```text
┌──────────────────────────────────────────────────────────┐
│ Patient Search │ Queue │ Alerts │ Profile                │
├───────────────┬──────────────────────────────────────────┤
│ Patient List  │ Patient Clinical Summary                 │
│               │                                          │
│ P-1024        │ Chief Complaint                          │
│ P-1025        │ HPI                                      │
│ P-1026        │ Past History                             │
│               │ Medications                              │
│               │ Allergies                                │
│               │ Investigations                           │
│               │ Timeline                                 │
│               │ Documents                                │
└───────────────┴──────────────────────────────────────────┘
```

The doctor should not have to navigate through multiple pages to understand the case.

---

# 12. Triage Dashboard

Triage should use real-time updates.

Recommended communication:

```text
Patient Session
      │
      ▼
Red Flag Engine
      │
      ▼
Alert Service
      │
      ▼
WebSocket / SSE
      │
      ▼
Triage Dashboard
```

Example:

```text
HIGH PRIORITY
Patient P-1024

Chest pain
Breathlessness

[ACKNOWLEDGE]
[VIEW CASE]
```

---

# 13. Backend Architecture

The FastAPI backend should follow domain-oriented modules.

```text
backend/app/

├── api/
│
├── core/
│   ├── config.py
│   ├── database.py
│   ├── security.py
│   ├── logging.py
│   └── exceptions.py
│
├── auth/
├── patients/
├── sessions/
├── history/
├── documents/
├── triage/
├── summaries/
├── ayush/
├── audit/
└── interoperability/
```

Each domain should contain:

```text
router
schema
model
service
repository
tests
```

Example:

```text
patients/
├── router.py
├── schemas.py
├── models.py
├── service.py
├── repository.py
└── tests/
```

---

# 14. API Layer

The API layer is responsible for:

- Authentication
- Request validation
- Authorization
- Routing
- Serialization
- Error handling
- Rate limiting
- API versioning

API prefix:

```text
/api/v1
```

---

# 15. Service Layer

Business logic should not be placed directly inside FastAPI route handlers.

Bad:

```python
@router.post("/patients")
def create_patient(...):
    # 200 lines of business logic
```

Better:

```text
Router
   ↓
Service
   ↓
Repository
   ↓
Database
```

Example:

```text
POST /patients
      ↓
PatientRouter
      ↓
PatientService
      ↓
PatientRepository
      ↓
PostgreSQL
```

---

# 16. Repository Layer

Repositories abstract database operations.

Example responsibilities:

```text
PatientRepository

create()
get_by_id()
get_by_hospital_id()
update()
exists()
```

The service layer should contain business rules.

The repository layer should primarily contain data-access logic.

---

# 17. Database Architecture

Primary database:

```text
PostgreSQL
```

Core relationships:

```text
Patient
  │
  ├── ClinicalSession
  │      │
  │      ├── ClinicalHistory
  │      ├── Documents
  │      ├── RedFlags
  │      └── Summary
  │
  ├── Documents
  │
  └── AuditLogs
```

---

# 18. Core Database Entities

```text
patients
clinical_sessions
clinical_histories
clinical_entities
documents
document_pages
document_entities
red_flags
triage_alerts
summaries
consents
users
roles
audit_logs
model_runs
```

---

# 19. Source-of-Truth Model

Every important piece of clinical information should have provenance.

Example:

```json
{
  "value": "Metformin 500 mg",
  "source_type": "DOCUMENT",
  "source_id": "doc_123",
  "confidence": 0.96,
  "verified": false,
  "verified_by": null
}
```

Possible source types:

```text
PATIENT
DOCUMENT
AI
DOCTOR
SYSTEM
```

---

# 20. Clinical Information Lifecycle

```text
Raw Input
   ↓
Extraction
   ↓
Normalization
   ↓
Validation
   ↓
Structured Entity
   ↓
Confidence Assignment
   ↓
Clinical Summary
   ↓
Doctor Verification
   ↓
Verified Entity
```

---

# 21. Clinical Session Architecture

A session is the central object connecting patient interaction to clinical information.

```text
ClinicalSession
│
├── Patient
├── Department
├── Language
├── Consent
├── History
├── Documents
├── Red Flags
├── Summary
├── Verification
└── Audit Events
```

Session status:

```text
CREATED
IDENTIFIED
CONSENTED
IN_PROGRESS
HISTORY_COMPLETED
DOCUMENT_PROCESSING
SUMMARY_READY
AWAITING_DOCTOR
DOCTOR_REVIEW
VERIFIED
SYNCED
COMPLETED
```

---

# 22. Clinical Interview Architecture

The interview engine should be schema-driven.

```text
Clinical Schema
       ↓
Question Policy
       ↓
Current Patient State
       ↓
Next Question
       ↓
Patient Response
       ↓
Response Parser
       ↓
State Update
```

Do not allow the LLM to freely control the entire interview.

---

# 23. Clinical Schema

Example:

```json
{
  "chief_complaint": {
    "required": true,
    "questions": [
      "What is troubling you today?"
    ]
  },
  "duration": {
    "required": true
  },
  "severity": {
    "required": false,
    "type": "scale"
  }
}
```

The schema determines what information should be collected.

---

# 24. Question Engine

The question engine maintains a state such as:

```json
{
  "chief_complaint": "chest pain",
  "duration": "2 hours",
  "severity": 7,
  "radiation": null
}
```

It then determines the next missing clinically relevant field.

```text
Current State
      ↓
Required Fields
      ↓
Missing Fields
      ↓
Priority
      ↓
Next Question
```

---

# 25. Voice Architecture

Voice pipeline:

```text
Microphone
   ↓
Audio Capture
   ↓
Voice Activity Detection
   ↓
Noise Processing
   ↓
ASR
   ↓
Transcript
   ↓
Language Detection
   ↓
Clinical Entity Extraction
   ↓
Structured Response
```

The frontend should stream or upload audio depending on the selected ASR implementation.

---

# 26. ASR Adapter

The backend should expose an internal interface:

```text
ASRProvider

transcribe(audio, language)
```

Possible implementations:

```text
WhisperProvider
IndicASRProvider
BhashiniProvider
MockASRProvider
```

This prevents the rest of the application from becoming dependent on one model.

---

# 27. ASR Failure Handling

If ASR fails:

```text
ASR
 ↓
Failure
 ↓
Retry
 ↓
Failure
 ↓
Touch Input
```

The patient must never become trapped because speech recognition failed.

---

# 28. Document Processing Architecture

Document processing should be asynchronous.

```text
Patient Upload
      ↓
API
      ↓
Object Storage
      ↓
Document Job
      ↓
Redis Queue
      ↓
Document Worker
      ↓
OCR
      ↓
Entity Extraction
      ↓
Database
      ↓
Frontend Poll / WebSocket
```

---

# 29. Document Processing State Machine

```text
UPLOADED
   ↓
VALIDATING
   ↓
PREPROCESSING
   ↓
CLASSIFYING
   ↓
OCR_PROCESSING
   ↓
ENTITY_EXTRACTION
   ↓
NORMALIZING
   ↓
COMPLETED
```

Failure:

```text
FAILED
REQUIRES_REVIEW
```

---

# 30. File Validation

Before processing:

```text
Upload
 ↓
File Type Validation
 ↓
File Size Validation
 ↓
Malware/Security Scan
 ↓
Checksum
 ↓
Object Storage
```

Allowed formats for MVP:

```text
JPEG
PNG
PDF
WEBP
```

Maximum file size should be configurable.

---

# 31. Document Quality Pipeline

```text
Original Image
      ↓
Resolution Check
      ↓
Blur Detection
      ↓
Rotation Detection
      ↓
Brightness / Contrast
      ↓
Crop Detection
      ↓
Quality Score
```

Example:

```json
{
  "quality_score": 0.82,
  "blur": false,
  "rotation": true,
  "glare": false
}
```

---

# 32. OCR Architecture

```text
Document
   ↓
Preprocessing
   ↓
Layout Detection
   ↓
Text Detection
   ↓
OCR
   ↓
Bounding Boxes
   ↓
Confidence
   ↓
Post-processing
```

OCR output should retain coordinates.

Example:

```json
{
  "text": "Metformin 500 mg",
  "confidence": 0.94,
  "page": 1,
  "bbox": [100, 220, 500, 260]
}
```

---

# 33. Document Classification

The classifier identifies:

```text
PRESCRIPTION
LAB_REPORT
DISCHARGE_SUMMARY
IMAGING_REPORT
CONSULTATION_NOTE
MEDICAL_CERTIFICATE
OTHER
```

The classification result determines the extraction strategy.

---

# 34. Clinical Entity Extraction

OCR output should pass through a clinical extraction layer.

```text
OCR Text
   ↓
Sentence / Layout Processing
   ↓
Medical NER
   ↓
Entity Normalization
   ↓
Schema Validation
   ↓
Confidence
```

Entities include:

```text
MEDICATION
DOSAGE
FREQUENCY
DIAGNOSIS
SYMPTOM
LAB_TEST
LAB_VALUE
UNIT
DATE
PROCEDURE
ALLERGY
```

---

# 35. Entity Confidence

Each entity must contain:

```text
confidence
source
model_version
verified
```

Example:

```json
{
  "entity_type": "MEDICATION",
  "value": "Amlodipine",
  "confidence": 0.91,
  "source_document": "doc_102",
  "verified": false
}
```

---

# 36. Low-Confidence Processing

Example:

```text
OCR Result

"Amlo...ine 5 mg"

Confidence: 61%

⚠ Verification Required
```

The system must not silently convert low-confidence results into clinical facts.

---

# 37. Medical Timeline Architecture

The timeline is constructed from dated clinical events.

```text
Documents
   +
Patient History
   +
Investigations
   +
Medications
   +
Procedures
   ↓
Timeline Builder
   ↓
Chronological Events
```

Example:

```text
2025-08-10
Prescription

2025-08-12
Blood Test

2026-01-05
Hospital Admission

2026-08-20
Current Prescription
```

---

# 38. Laboratory Extraction

A laboratory result should contain:

```json
{
  "test_name": "HbA1c",
  "value": 8.2,
  "unit": "%",
  "reference_range": "< 5.7%",
  "date": "2026-08-20",
  "source": "doc_102"
}
```

The system should not confuse the patient's result with the reference range.

---

# 39. Red-Flag Architecture

Red-flag processing:

```text
Patient Response
      ↓
Structured Clinical State
      ↓
Red Flag Rules
      ↓
Risk Signal
      ↓
Triage Alert
```

Example:

```text
IF

acute_chest_pain = TRUE
AND breathlessness = TRUE

THEN

priority = HIGH
```

---

# 40. Red-Flag Engine

The red-flag engine should be independent from the LLM.

Recommended structure:

```text
ai/red_flags/

├── engine.py
├── schemas.py
├── rules/
│   ├── cardiac.yaml
│   ├── stroke.yaml
│   ├── respiratory.yaml
│   └── general.yaml
└── tests/
```

Rules should be versioned.

---

# 41. Triage Alert Architecture

```text
Red Flag
   ↓
Alert Created
   ↓
Database
   ↓
Event Published
   ↓
WebSocket / SSE
   ↓
Triage Dashboard
```

Alert states:

```text
ACTIVE
ACKNOWLEDGED
RESOLVED
DISMISSED
```

---

# 42. Clinical Summary Architecture

Summary generation should not consume uncontrolled raw data.

Use:

```text
Patient Data
      ↓
Structured Clinical State
      ↓
Relevant Evidence
      ↓
Summary Generator
      ↓
Structured Output
      ↓
Schema Validation
      ↓
Consistency Checks
      ↓
Doctor Review
```

---

# 43. Summary Output

Recommended structure:

```text
Patient Information

Chief Complaint

History of Present Illness

Past Medical History

Past Surgical History

Medication History

Allergy History

Family History

Personal History

Review of Systems

Previous Investigations

Document Timeline

Red Flags

Missing Information

AI Confidence
```

---

# 44. Summary Safety

The summary generator must follow:

```text
KNOWN
UNKNOWN
CONFLICTING
```

Do not force every field to contain a value.

Example:

```json
{
  "drug_allergy": {
    "status": "UNKNOWN"
  }
}
```

Not:

```json
{
  "drug_allergy": "None"
}
```

unless the patient or clinician explicitly provided that information.

---

# 45. AI Gateway

All AI calls should pass through a common AI gateway.

```text
Backend
   ↓
AI Gateway
   ├── ASR
   ├── OCR
   ├── NER
   ├── Dialogue
   └── Summary
```

The gateway handles:

- Model selection
- Versioning
- Timeouts
- Retries
- Logging
- Confidence
- Error handling

---

# 46. Model Registry

Every model should have:

```text
model_name
model_version
provider
language
task
status
```

Example:

```json
{
  "model_name": "clinical-summary",
  "model_version": "0.4.2",
  "task": "summarization",
  "status": "production"
}
```

---

# 47. Prompt Versioning

Prompts should be treated as versioned application artifacts.

Example:

```text
ai/summarization/prompts/

history_summary_v1.txt
history_summary_v2.txt
```

Store the prompt version alongside generated output.

---

# 48. AI Run Tracking

Every AI operation should create a model-run record where appropriate.

```text
ModelRun
├── run_id
├── model_name
├── model_version
├── task
├── input_reference
├── output_reference
├── confidence
├── latency
├── created_at
└── status
```

Do not unnecessarily store sensitive raw model inputs.

---

# 49. AYUSH Architecture

AYUSH functionality should be schema-driven.

```text
Department
     ↓
Clinical Workflow
     ↓
Ontology
     ↓
Question Schema
     ↓
History
```

Example:

```text
department = AYURVEDA

workflow =
    GENERAL_HISTORY
    +
DASHAVIDHA_PARIKSHA
    +
AYUSH_PARAMETERS
```

---

# 50. Dashavidha Pariksha

The ontology should represent:

```text
Prakriti
Vikriti
Sara
Samhanana
Pramana
Satmya
Sattva
Ahara Shakti
Vyayama Shakti
Vaya
```

Do not hard-code these fields into individual UI components.

Store them as configurable clinical schemas.

---

# 51. Authentication Architecture

Recommended:

```text
Login
 ↓
Credential Verification
 ↓
Access Token
 ↓
Refresh Token
 ↓
RBAC
 ↓
Protected API
```

Roles:

```text
PATIENT
DOCTOR
NURSE
ADMIN
SYSTEM_ADMIN
```

---

# 52. Authorization

Every protected request should verify:

```text
Who is the user?
        +
What role do they have?
        +
What resource are they accessing?
        +
Are they allowed to access it?
```

Never rely only on frontend route protection.

Authorization must be enforced on the backend.

---

# 53. Patient Access Isolation

Patient data access should follow:

```text
Authenticated User
       ↓
Authorization Check
       ↓
Hospital Scope
       ↓
Patient Scope
       ↓
Resource
```

A patient must never be able to access another patient's session by modifying an ID in an API request.

---

# 54. Audit Architecture

Important operations should generate audit events.

Examples:

```text
PATIENT_CREATED
CONSENT_GRANTED
DOCUMENT_UPLOADED
DOCUMENT_VIEWED
ENTITY_EXTRACTED
SUMMARY_GENERATED
SUMMARY_EDITED
SUMMARY_VERIFIED
RED_FLAG_CREATED
RED_FLAG_ACKNOWLEDGED
PATIENT_RECORD_VIEWED
```

Audit logs should be append-oriented and protected from ordinary modification.

---

# 55. Consent Architecture

Before clinical data processing:

```text
Patient
 ↓
Consent Screen
 ↓
Consent Explanation
 ↓
Explicit Acceptance
 ↓
Consent Record
 ↓
Clinical Processing
```

Consent should include:

```text
consent_id
version
type
status
timestamp
session_id
patient_id
```

---

# 56. Object Storage Architecture

Medical files should not be stored directly inside PostgreSQL.

Use:

```text
PostgreSQL
    ↓
Document Metadata

MinIO / S3
    ↓
Actual File
```

Example:

```text
documents/
    hospital/
        patient/
            session/
                document/
                    original.pdf
                    processed.json
```

Actual storage keys should use opaque identifiers rather than patient names.

---

# 57. Redis Architecture

Redis may be used for:

```text
Session cache
Background jobs
Rate limiting
Temporary tokens
WebSocket state
```

Do not store permanent medical history exclusively in Redis.

---

# 58. Background Job Architecture

Long-running operations should not block normal API requests.

Examples:

```text
OCR
ASR
Document classification
Entity extraction
Summary generation
FHIR transformation
```

Flow:

```text
API Request
    ↓
Create Job
    ↓
Redis Queue
    ↓
Worker
    ↓
AI Processing
    ↓
Database
    ↓
Job Complete
```

---

# 59. Job States

```text
QUEUED
PROCESSING
COMPLETED
FAILED
RETRYING
CANCELLED
```

The frontend can retrieve status:

```http
GET /api/v1/jobs/{job_id}
```

---

# 60. Retry Strategy

Transient AI failures should be retried.

Example:

```text
Attempt 1
   ↓
Failure
   ↓
Attempt 2
   ↓
Failure
   ↓
Attempt 3
   ↓
FAILED
```

Do not retry indefinitely.

---

# 61. API Communication

Frontend to backend:

```text
HTTPS
REST
JSON
```

Real-time events:

```text
WebSocket
```

or:

```text
Server-Sent Events
```

depending on implementation complexity.

---

# 62. API Versioning

All public APIs should use:

```text
/api/v1/
```

Future breaking changes can use:

```text
/api/v2/
```

Avoid silently changing the behavior of existing API contracts.

---

# 63. Error Handling

Use standardized errors.

Example:

```json
{
  "error": {
    "code": "DOCUMENT_PROCESSING_FAILED",
    "message": "The document could not be processed.",
    "request_id": "req_123"
  }
}
```

Never expose:

- Stack traces
- Internal paths
- Model prompts
- Database errors
- Secrets

to end users.

---

# 64. Frontend Error Strategy

Every AI-dependent screen needs a fallback.

Example:

```text
Voice Recognition Failed

You can continue using touch input.

[TRY AGAIN]
[CONTINUE WITH TOUCH]
```

Document failure:

```text
We could not read this document.

[RETAKE PHOTO]
[CONTINUE WITHOUT DOCUMENT]
```

Summary failure:

```text
AI summary is temporarily unavailable.

Your structured history has been saved
and can still be reviewed by the doctor.
```

---

# 65. Offline Architecture

Offline mode should not be part of the first implementation unless required.

However, the architecture should permit it.

```text
             ONLINE
               │
               ▼
          Hospital Server


             OFFLINE
               │
               ▼
       Local Encrypted Queue
               │
               ▼
        Sync when Online
```

The synchronization layer must eventually resolve:

- Duplicate sessions
- Conflicting updates
- Failed uploads
- Partial processing

---

# 66. Interoperability Architecture

Internal data should remain independent of external standards.

```text
Internal Clinical Model
          │
          ▼
FHIR Mapping Layer
          │
          ▼
FHIR Resources
          │
     ┌────┴────┐
     ▼         ▼
    HIS       ABDM
```

---

# 67. FHIR Mapping

Potential mappings:

```text
Patient
      → Patient

Clinical Session
      → Encounter

Clinical Entity
      → Observation / Condition

Medication
      → MedicationStatement

Allergy
      → AllergyIntolerance

Investigation
      → DiagnosticReport / Observation

Document
      → DocumentReference

Consent
      → Consent
```

The exact mappings should be validated against the relevant interoperability requirements before production use.

---

# 68. Caching Strategy

Cache only data that is safe and useful to cache.

Suitable:

```text
Department configuration
Language configuration
Question schemas
Public metadata
Short-lived session state
```

Avoid caching sensitive clinical records unnecessarily.

---

# 69. Security Architecture

Security layers:

```text
TLS
 ↓
Authentication
 ↓
Authorization
 ↓
Input Validation
 ↓
File Validation
 ↓
Database Access Control
 ↓
Encryption
 ↓
Audit Logging
```

---

# 70. Secrets Management

Never commit secrets.

Bad:

```text
DATABASE_PASSWORD=123456
```

inside Git.

Use:

```text
.env
```

locally and a proper secret manager in production.

Repository should contain:

```text
.env.example
```

but never:

```text
.env
```

---

# 71. Environment Configuration

Separate:

```text
development
testing
staging
production
```

Example:

```text
APP_ENV=development
DATABASE_URL=...
REDIS_URL=...
OBJECT_STORAGE_ENDPOINT=...
AI_MODEL_PATH=...
JWT_SECRET=...
```

---

# 72. Kiosk Security Architecture

At the end of every session:

```text
Session Complete
      ↓
Invalidate Session
      ↓
Clear Local State
      ↓
Clear Uploaded Temporary Files
      ↓
Clear Audio State
      ↓
Clear Browser Storage
      ↓
Reset UI
      ↓
Welcome Screen
```

The next patient must never inherit previous session state.

---

# 73. Browser Storage Rules

Do not store sensitive clinical data in:

```text
localStorage
```

unless there is a specific, reviewed reason.

Prefer:

```text
Server-side session
+
Short-lived secure cookies
+
Encrypted temporary storage where necessary
```

---

# 74. Logging Architecture

Application logs should include:

```text
timestamp
service
request_id
user_id where appropriate
operation
latency
status
error_code
```

Do not log unnecessary:

```text
medical history
patient documents
audio transcripts
identity information
```

---

# 75. Observability

Monitor:

```text
API latency
Error rate
AI latency
OCR success rate
ASR success rate
Queue length
Worker failures
Database health
Memory
CPU
GPU
Storage
```

---

# 76. Health Checks

Expose:

```http
GET /health
GET /health/live
GET /health/ready
```

Example:

```text
/liveness

Application running


/readiness

Database ✓
Redis ✓
Object Storage ✓
AI Worker ✓
```

---

# 77. Metrics

Recommended metrics:

```text
http_requests_total
http_request_duration
ocr_jobs_total
ocr_job_duration
asr_jobs_total
asr_job_duration
summary_jobs_total
summary_job_duration
red_flag_alerts_total
session_completion_rate
session_abandonment_rate
doctor_verification_rate
```

---

# 78. Testing Architecture

Testing must occur at multiple levels.

```text
Unit
 ↓
Integration
 ↓
AI Evaluation
 ↓
E2E
 ↓
Security
 ↓
Performance
```

---

# 79. Unit Testing

Test:

```text
Clinical schemas
Validators
Red-flag rules
Timeline sorting
Authentication
Authorization
FHIR mapping
Question selection
```

Red-flag rules should have especially strong unit-test coverage.

---

# 80. Integration Testing

Examples:

```text
API → PostgreSQL

API → Redis

API → Object Storage

Document Worker → OCR

OCR → Entity Extraction

Clinical State → Summary

Red Flag → Alert
```

---

# 81. End-to-End Testing

Primary E2E scenario:

```text
Patient Registration
       ↓
Consent
       ↓
History
       ↓
Document Upload
       ↓
OCR
       ↓
Entity Extraction
       ↓
Summary
       ↓
Doctor Dashboard
       ↓
Doctor Verification
       ↓
Completion
```

---

# 82. AI Evaluation

AI should be tested separately from ordinary software tests.

ASR:

```text
WER
CER
Medical terminology accuracy
Language accuracy
```

OCR:

```text
Character accuracy
Word accuracy
Entity accuracy
```

NER:

```text
Precision
Recall
F1
```

Summary:

```text
Factual consistency
Completeness
Hallucination rate
Physician acceptance
```

---

# 83. Synthetic Data

Do not use real patient records during development unless there is an appropriate legal and institutional basis.

Use:

```text
Synthetic Patients
Synthetic Prescriptions
Synthetic Laboratory Reports
Synthetic Discharge Summaries
Synthetic Voice Samples
```

Synthetic documents should include difficult examples:

```text
Blurred
Rotated
Handwritten
Multilingual
Low contrast
Noisy
```

---

# 84. CI/CD

Every pull request should run:

```text
Lint
 ↓
Type Check
 ↓
Unit Tests
 ↓
Integration Tests
 ↓
Build
```

AI-heavy tests may run in a separate pipeline if they require GPUs.

---

# 85. Docker Architecture

Recommended services:

```text
frontend
backend
worker
postgres
redis
minio
nginx
```

Example:

```text
docker-compose.yml

services:

  frontend
  backend
  worker
  postgres
  redis
  minio
  nginx
```

---

# 86. Local Development

A new developer should ideally be able to run:

```bash
git clone <repository>

cp .env.example .env

docker compose up -d

npm install

npm run dev
```

or the equivalent project-specific commands.

The entire MVP should work locally without requiring a cloud account.

---

# 87. Development Order

Do not build the AI stack first.

Recommended order:

```text
1. Database
2. Backend
3. Patient Registration
4. Consent
5. Clinical Session
6. Basic History
7. Doctor Dashboard
8. Document Upload
9. OCR
10. Entity Extraction
11. Summary
12. Red Flags
13. Voice
14. AYUSH
15. Interoperability
16. Hardening
```

This order minimizes integration risk.

---

# 88. Vertical Slice Strategy

Each milestone should produce a working vertical slice.

### Slice 1

```text
Patient
 ↓
Register
 ↓
History
 ↓
Doctor
```

### Slice 2

```text
Patient
 ↓
Document
 ↓
OCR
 ↓
Doctor
```

### Slice 3

```text
Patient
 ↓
History + Documents
 ↓
Summary
 ↓
Doctor Verification
```

### Slice 4

```text
Patient
 ↓
Red Flag
 ↓
Triage
```

---

# 89. MVP Architecture

For the SIH demo, keep the deployment simple:

```text
                  ┌──────────────────┐
                  │   Next.js App    │
                  │                  │
                  │ Patient / Doctor │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ FastAPI Backend  │
                  └────────┬─────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
        PostgreSQL       Redis         MinIO
                           │
                           ▼
                      AI Workers
             ┌────────────┼────────────┐
             ▼            ▼            ▼
            ASR          OCR          NLP
                                      │
                                      ▼
                                   Summary
```

This is sufficient for the first complete prototype.

---

# 90. Production Evolution

Once the system has proven its workflow, individual components can be separated.

Initial:

```text
FastAPI
+
Workers
```

Later:

```text
API Gateway

Clinical Service

Document Service

AI Orchestrator

ASR Service

OCR Service

NLP Service

Summary Service

Triage Service

Interoperability Service
```

Do not introduce this complexity before it is necessary.

---

# 91. Scalability Strategy

The stateless API layer should be horizontally scalable.

```text
                  Load Balancer
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       API-1         API-2        API-3
          │            │            │
          └────────────┼────────────┘
                       ▼
                   PostgreSQL
                       +
                     Redis
                       +
                  Object Store
```

AI workers can scale independently:

```text
OCR Worker × N
ASR Worker × N
Summary Worker × N
```

---

# 92. Database Scaling

Start with:

```text
Single PostgreSQL instance
```

Later:

```text
Primary
 +
Read Replicas
 +
Backups
```

Partitioning or sharding should only be introduced when actual scale requires it.

---

# 93. AI Worker Scaling

AI processing is computationally expensive.

Separate workers by task:

```text
asr-worker
ocr-worker
nlp-worker
summary-worker
```

Each worker can consume jobs from queues.

---

# 94. Latency Strategy

Patient-facing interactions should feel immediate.

Avoid:

```text
Patient
 ↓
Wait 15 seconds
 ↓
Everything processed
```

Prefer:

```text
Patient Answer
 ↓
Immediate UI Update
 ↓
Background Processing
 ↓
Structured Data Appears
```

Long-running tasks should be asynchronous.

---

# 95. Data Consistency

Clinical records should use transactional updates.

Example:

```text
Document processed
      ↓
Create entities
      ↓
Update document status
      ↓
Commit transaction
```

If extraction fails midway:

```text
Transaction rollback
```

where appropriate.

---

# 96. Idempotency

Important operations should be idempotent.

Example:

```text
POST /documents/{id}/process
```

If the same request is accidentally submitted twice, it should not create duplicate clinical entities.

Use:

```text
job_id
document_id
processing_version
idempotency_key
```

where appropriate.

---

# 97. Concurrency

Prevent conflicting doctor edits.

For example:

```text
Doctor A opens patient
Doctor B opens patient
        ↓
Doctor A edits
        ↓
Doctor B tries to overwrite
```

Use optimistic concurrency where appropriate.

Example:

```text
version = 7

Update only if version = 7
```

---

# 98. Data Retention

Retention policies should be configurable.

Example categories:

```text
Clinical Records
Documents
Temporary Audio
Temporary OCR Data
Audit Logs
AI Processing Metadata
```

Temporary data should have shorter retention than clinical records.

Retention requirements must ultimately follow the institution's legal and operational policies.

---

# 99. Backup Strategy

Production should support:

```text
Database backups
Object-storage backups
Configuration backups
Disaster recovery procedures
```

At minimum:

```text
Daily database backup
+
Object storage redundancy
```

for a prototype-to-production pathway.

---

# 100. Disaster Recovery

The system should define:

```text
RPO
Recovery Point Objective

RTO
Recovery Time Objective
```

For the hackathon these can remain documented targets rather than fully implemented infrastructure.

---

# 101. Security Boundaries

The main security boundaries are:

```text
Internet
   │
   ▼
Reverse Proxy
   │
   ▼
Frontend
   │
   ▼
API
   │
   ├── Database
   ├── Redis
   ├── Object Storage
   └── AI Workers
```

AI workers should not directly expose public endpoints.

---

# 102. Untrusted Input Boundary

The following should be considered untrusted:

```text
Patient speech
Patient text
Uploaded documents
OCR text
External integration payloads
```

Therefore:

```text
Untrusted Input
      ↓
Validation
      ↓
Sanitization
      ↓
Structured Representation
      ↓
Business Logic
```

---

# 103. Prompt Injection Protection

Medical documents can contain arbitrary text.

Therefore:

```text
Document
 ↓
OCR
 ↓
UNTRUSTED TEXT
 ↓
Extraction Model
 ↓
Schema
 ↓
Validated Clinical Data
```

Do not allow document text to become executable instructions for an agent.

---

# 104. AI Output Validation

Never directly store arbitrary LLM output as trusted clinical information.

Use:

```text
LLM
 ↓
JSON Schema
 ↓
Pydantic Validation
 ↓
Clinical Validation
 ↓
Confidence
 ↓
Database
```

---

# 105. Example AI Pipeline

```text
Patient:
"I've had chest pain since this morning."

       ↓

ASR

       ↓

"I've had chest pain since this morning."

       ↓

Clinical Extraction

       ↓

{
  complaint: "chest pain",
  onset: "this morning"
}

       ↓

Clinical State

       ↓

Red Flag Engine

       ↓

Potential Alert

       ↓

Summary Engine

       ↓

Doctor Review
```

---

# 106. Clinical Conflict Handling

Different sources may disagree.

Example:

```text
Patient says:
No diabetes

Old document:
Diabetes mellitus
```

Do not silently choose one.

Store:

```text
CONFLICTING INFORMATION
```

and surface it to the doctor.

---

# 107. Source Priority

A possible source hierarchy:

```text
Physician Verified
       ↓
Patient Confirmed
       ↓
Document Extracted + Verified
       ↓
Document Extracted
       ↓
AI Inference
```

AI inference should not overwrite higher-confidence information.

---

# 108. Document Viewer

Doctors should be able to see:

```text
Original Document
       +
Extracted Text
       +
Highlighted Entity
```

Example:

```text
Original Prescription

        ↓

[Metformin 500 mg]
        ↑
Highlighted source region

Confidence: 94%
```

This creates transparency.

---

# 109. Physician Verification Model

Each entity may have:

```text
UNREVIEWED
CONFIRMED
CORRECTED
REJECTED
```

Example:

```text
Medication: Amlodipine 5 mg

AI:
Amlodipine 5 mg
Confidence: 87%

Doctor:
CONFIRMED
```

---

# 110. Audit Example

```json
{
  "actor_role": "DOCTOR",
  "action": "ENTITY_CONFIRMED",
  "resource_type": "CLINICAL_ENTITY",
  "resource_id": "entity_123",
  "timestamp": "2026-08-30T10:30:00Z"
}
```

---

# 111. Architecture Decision Records

Major architectural decisions should be documented.

Recommended:

```text
docs/architecture/adr/

ADR-001-nextjs-fastapi.md
ADR-002-postgresql.md
ADR-003-ai-adapter-pattern.md
ADR-004-red-flag-rules.md
ADR-005-object-storage.md
```

This prevents the team from repeatedly revisiting the same decisions.

---

# 112. Important Architecture Decisions

## Decision 1

Use:

```text
Next.js + TypeScript
```

for frontend.

## Decision 2

Use:

```text
FastAPI + Python
```

for backend.

## Decision 3

Use:

```text
PostgreSQL
```

as primary database.

## Decision 4

Use:

```text
Redis
```

for queues and temporary state.

## Decision 5

Use:

```text
MinIO/S3
```

for medical documents.

## Decision 6

Use adapter interfaces for AI models.

## Decision 7

Use deterministic red-flag rules.

## Decision 8

Use human verification for clinically important AI output.

---

# 113. What NOT to Build Initially

Avoid:

```text
Kubernetes
Service Mesh
Kafka
Multiple API Gateways
Complex Event Sourcing
Blockchain
Federated Learning
Large-scale distributed databases
Custom LLM training
```

unless there is a concrete requirement.

For the SIH prototype, these would mostly add complexity without improving the demonstration.

---

# 114. Recommended Initial Infrastructure

Use:

```text
Docker Compose
      │
      ├── Next.js
      ├── FastAPI
      ├── Worker
      ├── PostgreSQL
      ├── Redis
      └── MinIO
```

Optional:

```text
Nginx
Prometheus
Grafana
```

---

# 115. Complete End-to-End Data Flow

The complete system should operate approximately as follows:

```text
                     PATIENT
                        │
                        ▼
                 Med-Drishti
                        │
              Language + Consent
                        │
                        ▼
                Clinical Session
                        │
             ┌──────────┴──────────┐
             │                     │
             ▼                     ▼
          Voice                   Touch
             │                     │
             ▼                     │
            ASR                    │
             │                     │
             └──────────┬──────────┘
                        ▼
              Clinical Question Engine
                        │
                        ▼
              Structured Clinical State
                        │
             ┌──────────┼───────────┐
             │          │           │
             ▼          ▼           ▼
          Red Flag     History     Missing Data
             │          │
             ▼          │
         Triage Alert   │
                        │
                        ▼
                Document Upload
                        │
                        ▼
                 Object Storage
                        │
                        ▼
                  Document Queue
                        │
                        ▼
                      OCR
                        │
                        ▼
                 Entity Extraction
                        │
                        ▼
                   Normalize
                        │
                        ▼
                 Confidence Score
                        │
                        ▼
                 Clinical Timeline
                        │
                        ▼
                 Summary Generator
                        │
                        ▼
                 Structured Summary
                        │
                        ▼
                 Doctor Dashboard
                        │
                        ▼
                Doctor Verification
                        │
                        ▼
               Verified Clinical Data
                        │
                        ▼
                FHIR Mapping Layer
                        │
                ┌───────┴────────┐
                ▼                ▼
               HIS              ABDM
```

---

# 116. Recommended Build Sequence

The actual implementation should follow this sequence.

## Stage 1 — Foundation

Build:

```text
Repository
Docker
PostgreSQL
FastAPI
Next.js
Authentication
```

---

## Stage 2 — Patient Workflow

Build:

```text
Registration
Consent
Language
Department
Clinical Session
```

---

## Stage 3 — Basic Clinical History

Build:

```text
Question Schema
Question Engine
History Storage
Doctor Dashboard
```

At this point the system already has a working product.

---

## Stage 4 — Document AI

Build:

```text
Upload
Object Storage
OCR
Document Classification
Entity Extraction
```

---

## Stage 5 — Summary

Build:

```text
Structured Case Model
Timeline
Summary Generator
Confidence
Source References
```

---

## Stage 6 — Safety

Build:

```text
Red Flag Rules
Triage Alerts
Real-Time Dashboard
```

---

## Stage 7 — Voice

Build:

```text
Audio Capture
ASR
Transcript
Clinical Extraction
Touch Fallback
```

---

## Stage 8 — AYUSH

Build:

```text
AYUSH Schema
Dashavidha Pariksha
AYUSH Questions
AYUSH Summary
```

---

## Stage 9 — Security

Build:

```text
RBAC
Audit
File Security
Session Cleanup
Rate Limiting
Input Validation
```

---

## Stage 10 — Interoperability

Build:

```text
FHIR Models
FHIR Mapper
Mock HIS
ABDM Adapter
```

---

# 117. Definition of Architectural Completion

The architecture is considered successfully implemented when:

```text
Patient
 ↓
Registration
 ↓
Consent
 ↓
History
 ↓
Documents
 ↓
AI Processing
 ↓
Summary
 ↓
Red Flags
 ↓
Doctor
 ↓
Verification
 ↓
Structured Record
```

works as one connected system.

Individual AI demos are not sufficient.

---

# 118. Final Architecture

The final target architecture is:

```text
                              ┌───────────────────────┐
                              │       PATIENT         │
                              └───────────┬───────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │     Med-Drishti       │
                              │                       │
                              │ Voice │ Touch │ Scan  │
                              └───────────┬───────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │     NEXT.JS WEB APP   │
                              └───────────┬───────────┘
                                          │
                                      HTTPS
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │      FASTAPI API       │
                              │                       │
                              │ Auth │ Sessions │ RBAC │
                              └───────────┬───────────┘
                                          │
             ┌────────────────────────────┼─────────────────────────┐
             │                            │                         │
             ▼                            ▼                         ▼
   ┌──────────────────┐        ┌──────────────────┐       ┌──────────────────┐
   │ Clinical Service │        │ Document Service │       │ Triage Service   │
   │                  │        │                  │       │                  │
   │ History          │        │ Upload           │       │ Red Flags        │
   │ Dialogue         │        │ OCR              │       │ Alerts           │
   │ Sessions         │        │ Extraction       │       │ Queue            │
   └────────┬─────────┘        └────────┬─────────┘       └────────┬─────────┘
            │                           │                          │
            └───────────────────────────┼──────────────────────────┘
                                        │
                                        ▼
                              ┌───────────────────────┐
                              │      AI GATEWAY       │
                              └───────────┬───────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
              ┌──────────┐          ┌──────────┐          ┌──────────┐
              │   ASR    │          │   OCR    │          │   NLP    │
              └──────────┘          └──────────┘          └────┬─────┘
                                                               │
                                      ┌────────────────────────┼───────┐
                                      │                        │       │
                                      ▼                        ▼       ▼
                                 Dialogue                  Summary  Entity
                                  Engine                   Engine   Extractor
                                      │                        │       │
                                      └────────────────────────┼───────┘
                                                               │
                                                               ▼
                                                    Structured Clinical State
                                                               │
                              ┌────────────────────────────────┼──────────────┐
                              │                                │              │
                              ▼                                ▼              ▼
                       Red Flag Engine                    Timeline       Summary
                              │                                │              │
                              ▼                                └──────┬───────┘
                       Triage Alert                                      │
                              │                                          ▼
                              ▼                                ┌────────────────────┐
                       Triage Dashboard                        │ Doctor Dashboard   │
                                                               └─────────┬──────────┘
                                                                         │
                                                                         ▼
                                                               Physician Verification
                                                                         │
                                                                         ▼
                                                               Verified Clinical Record
                                                                         │
                                                                         ▼
                                                              ┌──────────────────────┐
                                                              │ Interoperability     │
                                                              │ Layer                │
                                                              │                      │
                                                              │ FHIR │ HIS │ ABDM    │
                                                              └──────────────────────┘


                 ┌─────────────────────────────────────────────────────────┐
                 │                         DATA LAYER                      │
                 │                                                         │
                 │ PostgreSQL │ Redis │ MinIO/S3 │ Audit │ Model Registry │
                 └─────────────────────────────────────────────────────────┘
```

---

# 119. Final Engineering Rule

The most important architectural rule for Med-Drishti is:

```text
                 DO NOT BUILD

        AI Model
           ↓
      Giant Prompt
           ↓
       Final Answer


                 BUILD

Patient Input
     +
Documents
     +
Structured Clinical Schema
     +
Deterministic Safety Rules
     +
AI Extraction
     +
Confidence
     +
Source Traceability
     +
Human Verification
          ↓
Verified Clinical Information
```

The product should be **modular, explainable, failure-tolerant, and clinically supervised**.

The hackathon MVP should prioritize one completely working pipeline:

```text
PATIENT
   ↓
HISTORY
   ↓
DOCUMENTS
   ↓
AI PROCESSING
   ↓
SUMMARY
   ↓
RED FLAGS
   ↓
DOCTOR
   ↓
VERIFY
```

over a collection of disconnected AI demonstrations.

That architecture gives Med-Drishti a realistic path from a hackathon prototype to a deployable hospital clinical-intake platform.