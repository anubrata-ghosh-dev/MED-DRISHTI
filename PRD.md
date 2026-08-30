# PRD — Med-Drishti
## AI-Powered Patient Case-Taking & Clinical Intake Platform

> **Smart India Hackathon 2026 — SIH26047**  
> **Problem Statement:** Patient Case-Taking Software  
> **Ministry / Organization:** Ministry of Ayush  
> **Department:** All India Institute of Ayurveda  
> **Product:** Med-Drishti  
> **Document Version:** 1.0.0  
> **Status:** Product Requirements Specification  
> **Target:** SIH 2026 Software Track

---

# 1. Executive Summary

Med-Drishti is an AI-powered, patient-facing clinical intake platform designed to reduce the burden of manual history-taking and fragmented medical-record review in high-volume hospitals and AYUSH institutions.

The system allows a patient to complete their preliminary clinical intake before meeting the physician using:

1. **Natural voice conversation**
2. **Guided touchscreen interaction**
3. **Multilingual input**
4. **Medical document upload/scanning**
5. **AI-assisted document extraction**
6. **Structured clinical history generation**
7. **AYUSH-specific clinical history capture**
8. **Emergency red-flag detection**
9. **Physician review and correction**
10. **Secure consent and health-data handling**
11. **FHIR/ABDM-ready interoperability**

The fundamental workflow is:

```text
Patient
   │
   ▼
Identify / Register
   │
   ▼
Consent + Language Selection
   │
   ├───────────────┐
   ▼               ▼
Voice/Touch       Documents
History           Upload/Scan
   │               │
   ▼               ▼
ASR + NLP         OCR + Document AI
   │               │
   └───────┬───────┘
           ▼
   Clinical Information
       Normalization
           │
           ▼
    Structured Patient
       Case Record
           │
           ▼
   Clinical Summary Engine
           │
      ┌────┴────┐
      ▼         ▼
 Red Flags   Physician Summary
      │         │
      ▼         ▼
 Triage      Doctor Review
                │
                ▼
       Confirm / Edit / Reject
                │
                ▼
       HIS / FHIR / ABDM Layer
```

The system is **not intended to diagnose patients autonomously**.

Its primary purpose is to collect, structure, organize, summarize, and present patient-provided and document-derived information so that the physician can spend more time on examination, clinical reasoning, counselling, and treatment.

---

# 2. Problem Statement

## 2.1 Background

Clinical history-taking is one of the most important components of patient care. However, high patient volumes in Indian hospitals can severely limit the amount of time available for a physician to collect a comprehensive history.

The SIH26047 problem statement identifies consultation windows of approximately 2–5 minutes in heavily loaded public hospitals as a major bottleneck.

During this limited period, physicians may need to:

- Understand the presenting complaint
- Establish the history of present illness
- Review previous medical conditions
- Review surgical history
- Review medications
- Identify allergies
- Review family history
- Review personal history
- Review systems
- Examine the patient
- Review previous reports
- Formulate a diagnosis
- Counsel the patient
- Prescribe treatment

This creates a fundamental information bottleneck.

The problem is further complicated by the fact that patients frequently carry:

- Handwritten prescriptions
- Laboratory reports
- Discharge summaries
- Previous diagnoses
- Medication records
- Reports from multiple hospitals

These documents are often:

- Unstructured
- Chronologically disordered
- Handwritten
- Multilingual
- Difficult to interpret quickly

AYUSH institutions have an additional challenge because Ayurvedic clinical assessment requires specialized parameters such as Dashavidha Pariksha.

The SIH problem statement therefore calls for a patient-facing platform capable of collecting structured clinical history and digitizing existing medical documents before the patient reaches the physician. 

---

# 3. Product Vision

> **Turn the first few minutes of a hospital visit from a data-collection bottleneck into a structured, intelligent clinical intake process.**

Med-Drishti should become the digital bridge between:

```text
Patient
   ↓
Clinical Information
   ↓
AI-Assisted Structuring
   ↓
Physician
   ↓
Hospital Health Record
```

The product should make a patient's relevant history available to the physician **before or at the beginning of the consultation**.

---

# 4. Product Goals

## 4.1 Primary Goals

### G1 — Reduce manual history-taking time

Collect the majority of routine historical information before the physician consultation.

### G2 — Improve completeness of clinical history

Ensure that important history categories are systematically covered.

### G3 — Digitize fragmented medical documents

Convert uploaded/scanned medical documents into structured information.

### G4 — Support Indian languages

Allow patients to communicate using supported Indian languages rather than requiring English proficiency.

### G5 — Support low-literacy users

The system must work for patients who have limited reading, writing, or smartphone experience.

### G6 — Support AYUSH workflows

Capture Dashavidha Pariksha and other relevant Ayurvedic history parameters.

### G7 — Surface potential emergency conditions

Identify predefined red-flag symptoms and immediately alert appropriate clinical staff.

### G8 — Generate physician-ready summaries

Convert raw patient input and document information into concise, structured clinical information.

### G9 — Preserve physician control

AI-generated information must remain reviewable and editable by a clinician.

### G10 — Prepare for healthcare interoperability

Design the internal data model to support FHIR/ABDM integration.

---

# 5. Non-Goals

Med-Drishti must **not** attempt to become a complete hospital management system during the hackathon.

The following are explicitly outside the MVP scope:

- Autonomous diagnosis
- Autonomous prescription generation
- Autonomous treatment decisions
- Replacing doctors
- Full hospital ERP
- Full billing system
- Pharmacy management
- Complete laboratory management system
- Complete radiology information system
- Full electronic medical record replacement
- Insurance claims management
- Fully autonomous emergency response
- Unverified AI-generated medical recommendations

The system may **identify potential red flags**, but it must route those signals to qualified healthcare personnel rather than independently deciding treatment.

---

# 6. Target Users

## 6.1 Primary User — Patient

Typical characteristics:

- Elderly
- Low digital literacy
- First-time hospital visitor
- Rural/semi-urban background
- Native-language speaker
- May carry paper medical records
- May not understand medical terminology

### Patient Goals

The patient wants to:

- Register quickly
- Select a familiar language
- Explain their symptoms naturally
- Upload previous medical records
- Avoid repeatedly explaining the same information
- Complete intake without technical assistance
- Understand what information is being collected

---

# 6.2 Secondary User — Doctor

The doctor needs:

- Concise patient history
- Chief complaint
- HPI
- Past medical history
- Surgical history
- Medication history
- Allergy history
- Family history
- Personal history
- Review of systems
- Previous investigations
- Important abnormalities
- Relevant document references
- Timeline of previous treatment

### Doctor Goals

The physician should be able to:

- Read the case in seconds
- Inspect the original document
- Verify extracted information
- Edit incorrect information
- Identify missing information
- Review red flags
- Accept or reject AI-generated information

---

# 6.3 Triage Nurse / Clinical Staff

Responsibilities:

- Monitor active patient intake
- Receive red-flag alerts
- Prioritize patients
- Assist patients who get stuck
- Review incomplete sessions

---

# 6.4 Hospital Administrator

Responsibilities:

- Monitor patient throughput
- Monitor kiosk utilization
- Monitor completion rates
- Configure departments
- Configure supported languages
- Manage staff accounts
- View operational analytics

---

# 6.5 System Administrator

Responsibilities:

- User management
- Role management
- System configuration
- Security monitoring
- Audit logs
- Model configuration
- Integration configuration

---

# 7. Core User Journey

## 7.1 Complete Patient Journey

```text
START
  │
  ▼
Welcome Screen
  │
  ▼
Select Language
  │
  ▼
Patient Identification
  │
  ├── Existing Patient
  │       │
  │       ▼
  │    Retrieve Record
  │
  └── New Patient
          │
          ▼
       Register
          │
          ▼
Consent
          │
          ▼
Select Department
          │
          ▼
Choose Input Mode
          │
    ┌─────┴─────┐
    ▼           ▼
  Voice        Touch
    │           │
    └─────┬─────┘
          ▼
Clinical History
          │
          ▼
Red-Flag Screening
          │
     ┌────┴────┐
     ▼         ▼
  Normal      Flagged
     │         │
     │         ▼
     │      Triage Alert
     │
     ▼
Upload Medical Documents
          │
          ▼
OCR / Document AI
          │
          ▼
Clinical Entity Extraction
          │
          ▼
Timeline Construction
          │
          ▼
Clinical Summary Generation
          │
          ▼
Patient Confirmation
          │
          ▼
Doctor Dashboard
          │
          ▼
Doctor Review
          │
     ┌────┴────┐
     ▼         ▼
  Confirm     Edit
     │         │
     └────┬────┘
          ▼
Final Clinical Intake Record
          │
          ▼
FHIR / HIS / ABDM Integration
```

---

# 8. Functional Requirements

# FR-01 — Patient Registration

The system shall allow patients to:

- Create a new patient session
- Identify an existing patient
- Enter demographic information
- Select language
- Select hospital department
- Provide required identity information
- Continue without unnecessary fields

### Required Fields

At minimum:

- Name
- Age / Date of Birth
- Gender
- Preferred language
- Department
- Contact identifier where required

### Optional / Integration Fields

- ABHA identifier
- Hospital patient ID
- Existing medical record ID

---

# FR-02 — Consent Management

Consent must be collected before processing sensitive medical information.

The system shall:

- Display consent information
- Provide audio explanation
- Support local-language explanation
- Require explicit user confirmation
- Record consent timestamp
- Record consent scope
- Record consent version
- Support withdrawal where applicable
- Maintain an audit trail

### Consent States

```text
NOT_STARTED
    ↓
PRESENTED
    ↓
ACCEPTED
    │
    └──→ REVOKED
```

---

# FR-03 — Language Selection

The user shall be able to select a supported language before beginning the interview.

Example initial languages:

- English
- Hindi
- Bengali
- Marathi
- Tamil
- Telugu
- Kannada
- Malayalam
- Gujarati
- Punjabi

The architecture must allow additional languages to be added without changing the core clinical workflow.

---

# FR-04 — Conversational Clinical History

The system shall conduct a structured clinical interview.

The AI should not simply ask:

> "Tell me your symptoms."

It should dynamically guide the patient.

Example:

```text
Patient:
"I have chest pain."

System:
"When did the pain start?"

Patient:
"About two hours ago."

System:
"Where exactly do you feel the pain?"

Patient:
"Middle of my chest."

System:
"Does the pain spread to your arm, shoulder, neck, jaw, or back?"
```

The interview engine must use structured clinical schemas.

---

# FR-05 — Adaptive Questioning

Questions should change according to previous answers.

Example:

```text
Chief Complaint = Chest Pain

        ↓

Onset
        ↓
Duration
        ↓
Location
        ↓
Character
        ↓
Radiation
        ↓
Severity
        ↓
Aggravating Factors
        ↓
Relieving Factors
        ↓
Associated Symptoms
```

The system should avoid asking irrelevant questions.

---

# FR-06 — Voice Input

The system shall support:

- Microphone input
- Speech-to-text conversion
- Indian-language speech
- Mixed-language speech where supported
- Accent variation
- Confirmation of recognized text

### Pipeline

```text
Audio
  ↓
Noise Handling
  ↓
Voice Activity Detection
  ↓
ASR
  ↓
Transcript
  ↓
Medical Entity Extraction
  ↓
Clinical State Update
```

---

# FR-07 — Touch-Based Input

Every important voice question should have an equivalent touch interaction wherever practical.

Examples:

### Pain severity

```text
No Pain
  1
  2
  3
  4
  5
  6
  7
  8
  9
  10
Severe Pain
```

### Duration

```text
Minutes
Hours
Days
Weeks
Months
Years
```

### Yes / No

Large touch targets:

```text
┌──────────────┐
│      YES     │
└──────────────┘

┌──────────────┐
│      NO      │
└──────────────┘
```

---

# FR-08 — Clinical History Schema

The system shall maintain structured information for:

## Chief Complaint

- Complaint
- Duration
- Severity
- Onset

## History of Present Illness

- Onset
- Duration
- Progression
- Location
- Character
- Radiation
- Aggravating factors
- Relieving factors
- Associated symptoms

## Past Medical History

- Diabetes
- Hypertension
- Cardiovascular disease
- Respiratory disease
- Renal disease
- Liver disease
- Neurological disease
- Other conditions

## Past Surgical History

- Procedure
- Date
- Hospital
- Indication
- Outcome

## Medication History

- Drug
- Dose
- Frequency
- Route
- Duration
- Current / discontinued

## Allergy History

- Drug
- Food
- Environmental
- Reaction

## Family History

- Disease
- Relationship
- Relevant hereditary conditions

## Personal History

- Smoking
- Tobacco
- Alcohol
- Diet
- Sleep
- Occupation
- Activity

## Review of Systems

- Constitutional
- Cardiovascular
- Respiratory
- Gastrointestinal
- Genitourinary
- Neurological
- Musculoskeletal
- Dermatological

---

# FR-09 — AYUSH / Ayurvedic Mode

When the selected department requires Ayurvedic history, the platform shall activate an AYUSH-specific workflow.

The system should support:

### Dashavidha Pariksha

1. Prakriti
2. Vikriti
3. Sara
4. Samhanana
5. Pramana
6. Satmya
7. Sattva
8. Ahara Shakti
9. Vyayama Shakti
10. Vaya

It should also support relevant:

- Ahara
- Vihara
- Lifestyle
- Nidana
- Relevant Ayurvedic assessment parameters

The clinical ontology must be configurable rather than hard-coded into the UI.

---

# FR-10 — Medical Document Upload

Patients shall be able to provide:

- Prescription images
- Laboratory reports
- Discharge summaries
- Medical certificates
- Investigation reports
- Other medical documents

Supported input:

- Camera
- File upload
- Scanner
- Mobile camera where applicable

---

# FR-11 — Document Quality Assessment

Before OCR processing, the system should evaluate:

- Blur
- Rotation
- Darkness
- Glare
- Cropping
- Missing sections
- Resolution

If quality is insufficient:

```text
Document quality is low.

Please capture the document again.

[ RETAKE ]
[ CONTINUE ANYWAY ]
```

---

# FR-12 — OCR Pipeline

The document-processing pipeline shall support:

```text
Image
 ↓
Preprocessing
 ↓
Deskew
 ↓
Denoise
 ↓
Contrast Enhancement
 ↓
Layout Detection
 ↓
Text Detection
 ↓
OCR
 ↓
Post-processing
 ↓
Clinical Entity Extraction
```

The system should distinguish:

- Printed text
- Handwritten text
- Tables
- Headers
- Dates
- Medication lists
- Lab values

---

# FR-13 — Clinical Entity Extraction

Extract relevant entities such as:

### Medication

```json
{
  "name": "Metformin",
  "dose": "500 mg",
  "frequency": "twice daily"
}
```

### Investigation

```json
{
  "test": "HbA1c",
  "value": "8.2",
  "unit": "%",
  "date": "2026-08-20"
}
```

### Diagnosis

```json
{
  "condition": "Type 2 Diabetes Mellitus",
  "source": "prescription",
  "date": "2026-08-20"
}
```

Every extracted entity should retain:

- Source document
- Page
- Bounding box where possible
- Confidence score
- Extraction timestamp

---

# FR-14 — Confidence-Aware AI

The system must never treat uncertain OCR/AI output as guaranteed fact.

Example:

```text
Medication:
Metformin 500 mg
Confidence: 96%

Medication:
? Amlodipine 5 mg
Confidence: 62%

⚠ Please verify
```

Low-confidence information should be visibly marked.

---

# FR-15 — Document Timeline

Documents should be organized chronologically.

Example:

```text
2024
 │
 ├── Blood Test
 └── Prescription

2025
 │
 ├── Hospital Admission
 ├── Discharge Summary
 └── Prescription

2026
 │
 ├── Blood Test
 └── Current Prescription
```

The doctor should be able to filter the timeline by:

- Date
- Document type
- Medication
- Investigation
- Diagnosis

---

# FR-16 — Laboratory Value Extraction

The system should identify:

- Test name
- Value
- Unit
- Reference range
- Date
- Abnormality status

Example:

```text
HbA1c

Result: 8.2 %
Reference: < 5.7 %

Status: Above reference range
```

The system should distinguish between:

- Extracted fact
- Reference range
- AI interpretation

---

# FR-17 — Red-Flag Detection

The platform shall identify predefined high-priority symptom patterns.

Examples:

### Possible acute cardiac concern

```text
Chest pain
+
Breathlessness
+
Sweating
```

### Possible stroke concern

```text
Facial weakness
+
Speech difficulty
+
Sudden arm weakness
```

### Important principle

Red-flag detection is a **triage signal**, not a diagnosis.

The UI should state:

> "Potential emergency symptoms detected. Please alert clinical staff immediately."

It should never state:

> "You are having a heart attack."

---

# FR-18 — Triage Dashboard

Clinical staff should receive:

- Patient identifier
- Red-flag category
- Time detected
- Relevant patient response
- Priority
- Acknowledgement status

Example:

```text
URGENT

Patient: P-1024

Potential red-flag symptoms:
• Chest pain
• Breathlessness
• Sweating

Detected: 10:21 AM

[ ACKNOWLEDGE ]
[ VIEW CASE ]
```

---

# FR-19 — Clinical Summary Generation

The summary engine shall combine:

```text
Patient Responses
       +
Voice Transcript
       +
Structured History
       +
Document Extraction
       +
Timeline
       ↓
Clinical Summary
```

The summary should contain:

1. Patient demographics
2. Chief complaint
3. HPI
4. Relevant past history
5. Medication history
6. Allergy history
7. Family history
8. Personal history
9. Review of systems
10. Relevant previous investigations
11. Relevant documents
12. Red flags
13. Missing information
14. Confidence indicators

---

# FR-20 — Physician Review

The doctor must be able to:

- Edit text
- Correct extracted entities
- Remove incorrect information
- Add missing information
- View original documents
- View source of extracted information
- Accept summary
- Reject summary
- Mark information as verified

The system shall record these actions.

---

# FR-21 — Explainability / Source Traceability

Every important AI-generated field should ideally be traceable to its source.

Example:

```text
Current medication:
Metformin 500 mg twice daily

Source:
Prescription_2026_08_20.jpg
Page 1
OCR confidence: 94%
```

This is much stronger than presenting an unexplained AI-generated summary.

---

# FR-22 — Missing Information Detection

The system should identify important unanswered fields.

Example:

```text
Incomplete History

Missing:
• Drug allergies
• Previous surgery
• Family history

[ COMPLETE NOW ]
[ SEND TO DOCTOR ]
```

---

# FR-23 — Physician Dashboard

The physician dashboard should contain:

```text
┌───────────────────────────────────────────────┐
│ Patient: Rajesh Kumar       Age: 54           │
│ Token: A-1024               OPD: General      │
├───────────────────────────────────────────────┤
│ 🚨 RED FLAGS                                  │
│ None detected                                 │
├───────────────────────────────────────────────┤
│ CHIEF COMPLAINT                               │
│ Chest discomfort for 2 days                   │
├───────────────────────────────────────────────┤
│ HISTORY OF PRESENT ILLNESS                    │
│ ...                                           │
├───────────────────────────────────────────────┤
│ PAST HISTORY                                  │
│ Hypertension                                  │
├───────────────────────────────────────────────┤
│ MEDICATIONS                                   │
│ Amlodipine 5 mg OD                            │
├───────────────────────────────────────────────┤
│ DOCUMENT TIMELINE                             │
│ 2026-08-20 — Blood Report                     │
│ 2026-08-21 — Prescription                     │
├───────────────────────────────────────────────┤
│ AI CONFIDENCE                                 │
│ High                                          │
├───────────────────────────────────────────────┤
│ [EDIT] [VERIFY] [VIEW DOCUMENTS]              │
└───────────────────────────────────────────────┘
```

---

# 9. AI Architecture

The AI system should be modular.

Do not create one giant prompt that attempts to do everything.

Recommended architecture:

```text
                    ┌───────────────────┐
                    │ Patient Interface │
                    └─────────┬─────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
          Voice Input                     Touch Input
              │                               │
              ▼                               │
         ASR Engine                           │
              │                               │
              └──────────────┬────────────────┘
                             ▼
                  Clinical Dialogue Engine
                             │
                             ▼
                    Clinical State Store
                             │
        ┌────────────────────┼───────────────────┐
        │                    │                   │
        ▼                    ▼                   ▼
   Red Flag Engine     Entity Extractor     Missing Data
        │                    │                   │
        └────────────────────┼───────────────────┘
                             │
                             ▼
                     Structured Case Model
                             │
                             ▼
                      Summary Generator
                             │
                             ▼
                     Physician Dashboard


Documents
    │
    ▼
Image Preprocessing
    │
    ▼
OCR / Layout Model
    │
    ▼
Clinical Entity Extraction
    │
    ▼
Normalization
    │
    ▼
Timeline
    │
    └──────────────► Structured Case Model
```

---

# 10. AI Components

## 10.1 ASR

Responsibilities:

- Convert patient speech into text
- Support Indian languages
- Handle accents
- Provide timestamps
- Provide confidence where available

Potential model families:

- Indic ASR models
- Whisper-family models
- AI4Bharat models
- Bhashini-compatible systems

For the hackathon, the exact model should be selected after benchmarking rather than assuming the largest model is automatically best.

---

# 10.2 Clinical Dialogue Engine

The dialogue engine should be **schema-driven**.

Bad architecture:

```text
LLM → "Ask medical questions"
```

Better architecture:

```text
Clinical Schema
      ↓
Question Policy
      ↓
Patient State
      ↓
LLM / Dialogue Model
      ↓
Validated Question
      ↓
Patient
```

The model should operate inside defined clinical boundaries.

---

# 10.3 Structured Output

The model should produce machine-readable output.

Example:

```json
{
  "chief_complaint": {
    "value": "chest pain",
    "duration": "2 days"
  },
  "hpi": {
    "onset": "gradual",
    "location": "central chest",
    "severity": 6,
    "radiation": "left arm"
  }
}
```

The backend should validate this structure before storing it.

---

# 10.4 LLM Guardrails

The LLM must not:

- Diagnose independently
- Prescribe medication
- Invent medical history
- Invent laboratory values
- Assume missing information
- Convert uncertain OCR into fact
- Override physician decisions

If information is unavailable:

```text
UNKNOWN
```

rather than hallucinating a value.

---

# 11. Document AI Architecture

Recommended pipeline:

```text
Document Upload
      ↓
Virus / File Validation
      ↓
Image Normalization
      ↓
Document Classification
      ↓
Layout Detection
      ↓
OCR
      ↓
Text + Bounding Boxes
      ↓
Clinical Entity Extraction
      ↓
Normalization
      ↓
Confidence Scoring
      ↓
Human Verification
      ↓
Medical Timeline
```

---

# 12. Medical Document Classification

The system should classify documents into:

- Prescription
- Laboratory report
- Discharge summary
- Imaging report
- Consultation note
- Medical certificate
- Other

Classification should determine which extraction schema is applied.

---

# 13. Data Model

## 13.1 Patient

```text
Patient
├── patient_id
├── hospital_id
├── name
├── date_of_birth
├── age
├── gender
├── preferred_language
├── abha_id
├── created_at
└── updated_at
```

---

## 13.2 Clinical Session

```text
ClinicalSession
├── session_id
├── patient_id
├── department
├── language
├── consent_id
├── status
├── started_at
├── completed_at
└── kiosk_id
```

---

## 13.3 Clinical History

```text
ClinicalHistory
├── history_id
├── session_id
├── chief_complaint
├── hpi
├── past_medical_history
├── past_surgical_history
├── medication_history
├── allergy_history
├── family_history
├── personal_history
├── review_of_systems
└── ayush_history
```

---

## 13.4 Document

```text
Document
├── document_id
├── patient_id
├── session_id
├── document_type
├── file_uri
├── document_date
├── upload_date
├── language
├── processing_status
└── checksum
```

---

## 13.5 Extracted Entity

```text
ClinicalEntity
├── entity_id
├── document_id
├── entity_type
├── value
├── normalized_value
├── unit
├── confidence
├── source_page
├── bounding_box
└── verified
```

---

## 13.6 Red Flag

```text
RedFlag
├── red_flag_id
├── session_id
├── category
├── severity
├── evidence
├── detected_at
├── acknowledged
└── acknowledged_by
```

---

## 13.7 Consent

```text
Consent
├── consent_id
├── patient_id
├── session_id
├── consent_type
├── consent_version
├── status
├── granted_at
├── revoked_at
└── evidence
```

---

## 13.8 Audit Log

```text
AuditLog
├── audit_id
├── actor_id
├── actor_role
├── action
├── resource_type
├── resource_id
├── timestamp
├── ip/device
└── metadata
```

---

# 14. Recommended Technology Architecture

## Frontend

Recommended:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Accessible component system
- Web Speech / microphone integration where applicable

Alternative:

- Flutter

For a hackathon, **Next.js + TypeScript** is recommended if the team is strongest in web development.

---

# Backend

Recommended:

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL
- Redis

Why FastAPI?

The project contains significant AI/ML processing, and Python provides easier integration with:

- OCR
- NLP
- ASR
- document processing
- ML models

---

# AI / ML Layer

Potential components:

### ASR

- Indic ASR
- Whisper-family models
- AI4Bharat ecosystem
- Bhashini ecosystem

### OCR

- PaddleOCR
- Tesseract for baseline
- Transformer-based document models
- LayoutLM-family models
- Custom handwritten-text models where training data is available

### NLP

- Clinical NER
- Rule-based medical extraction
- Transformer models
- LLM-based structured extraction

### Summarization

A local/open model should be preferred where feasible.

Possible families:

- Llama
- Mistral
- Qwen
- Indic/Indian-language models

The exact model should be benchmarked against:

- Accuracy
- Latency
- Memory
- Hardware requirements
- Language support

---

# 15. Storage Architecture

Recommended:

```text
PostgreSQL
    │
    ├── Patients
    ├── Sessions
    ├── Clinical History
    ├── Entities
    ├── Consent
    └── Audit Logs

Object Storage
    │
    ├── Prescriptions
    ├── Lab Reports
    ├── Discharge Summaries
    └── Other Documents

Redis
    │
    ├── Active Sessions
    ├── Temporary State
    └── Queue / Cache
```

For development:

- PostgreSQL
- MinIO
- Redis

This avoids making the entire architecture dependent on a cloud provider.

---

# 16. API Design

## Authentication

```http
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
```

---

## Patient

```http
POST   /api/v1/patients
GET    /api/v1/patients/{patient_id}
PATCH  /api/v1/patients/{patient_id}
```

---

## Sessions

```http
POST /api/v1/sessions
GET  /api/v1/sessions/{session_id}
PATCH /api/v1/sessions/{session_id}
POST /api/v1/sessions/{session_id}/complete
```

---

## Clinical History

```http
POST  /api/v1/sessions/{session_id}/history
GET   /api/v1/sessions/{session_id}/history
PATCH /api/v1/sessions/{session_id}/history
```

---

## Voice

```http
POST /api/v1/voice/transcribe
POST /api/v1/voice/next-question
```

---

## Documents

```http
POST /api/v1/documents
GET  /api/v1/documents/{document_id}
POST /api/v1/documents/{document_id}/process
GET  /api/v1/documents/{document_id}/entities
```

---

## Timeline

```http
GET /api/v1/patients/{patient_id}/timeline
```

---

## Summary

```http
POST /api/v1/sessions/{session_id}/generate-summary
GET  /api/v1/sessions/{session_id}/summary
PATCH /api/v1/sessions/{session_id}/summary
POST /api/v1/sessions/{session_id}/verify
```

---

## Red Flags

```http
GET /api/v1/triage/alerts
POST /api/v1/triage/alerts/{alert_id}/acknowledge
```

---

# 17. FHIR / ABDM Readiness

The internal architecture should be designed so that clinical information can eventually be mapped to FHIR resources.

Potential mappings include:

```text
Patient
Observation
Condition
MedicationStatement
AllergyIntolerance
Procedure
DiagnosticReport
DocumentReference
Encounter
Consent
```

The system should use a dedicated interoperability layer:

```text
Internal Clinical Model
          ↓
FHIR Mapper
          ↓
FHIR Resources
          ↓
ABDM / HIS Integration
```

Do not tightly couple the internal database schema to external APIs.

This will make future integration significantly easier.

---

# 18. Security Requirements

Healthcare data is highly sensitive.

The system must implement:

## Encryption

- TLS in transit
- Encryption at rest
- Encrypted object storage

## Authentication

- Strong authentication
- Session expiration
- Role-based access

## Authorization

Roles:

```text
PATIENT
DOCTOR
NURSE
ADMIN
SYSTEM_ADMIN
```

---

# 19. Role-Based Access Control

### Patient

Can access:

- Own session
- Own submitted information
- Consent information

Cannot access:

- Other patients
- Internal staff data
- Administrative dashboards

### Doctor

Can access:

- Assigned patient cases
- Clinical summaries
- Documents
- Timelines

### Nurse

Can access:

- Triage queue
- Red flags
- Relevant patient information

### Administrator

Can access:

- Operational metrics
- Configuration

---

# 20. Privacy Requirements

The product should follow privacy-by-design principles.

### Data Minimization

Collect only information required for the clinical workflow.

### Purpose Limitation

Use data only for clearly defined purposes.

### Session Isolation

A patient must never see the previous patient's information.

### Temporary Data Cleanup

Temporary kiosk session data should be cleared after session completion according to the configured retention policy.

### Auditability

Sensitive operations must be logged.

---

# 21. Kiosk Security

Because the application is designed for potentially shared hospital devices, kiosk mode is critical.

After a session ends:

```text
Patient A
   ↓
Complete
   ↓
Secure Cleanup
   ↓
Reset Application
   ↓
Patient B
```

The system must prevent:

- Browser back navigation into previous patient data
- Cached documents being displayed
- Previous audio transcripts remaining visible
- Previous patient identifiers remaining in local storage

---

# 22. Accessibility Requirements

The system should be usable by:

- Elderly patients
- Low-literacy patients
- First-time users
- Patients unfamiliar with smartphones

UI requirements:

- Large buttons
- Large typography
- High contrast
- Minimal text
- Audio instructions
- Visual icons
- Simple navigation
- One major task per screen
- Clear progress indicator
- No unnecessary menus

---

# 23. UI/UX Principles

## Principle 1 — One Question at a Time

Do not overload the patient.

Bad:

```text
Enter your symptoms, duration, severity,
medications, previous conditions...
```

Better:

```text
What is troubling you today?
```

---

## Principle 2 — Speak or Tap

Every major interaction should provide:

```text
🎙 Speak
```

and/or

```text
👆 Tap
```

---

## Principle 3 — Confirm Important Data

For critical information:

```text
You said:

"I have diabetes for about 8 years."

Is this correct?

[ YES ]
[ CHANGE ]
```

---

## Principle 4 — Never Hide Emergency Warnings

Red flags should override normal navigation.

---

# 24. Dashboard Requirements

## Patient Dashboard

Should show:

- Current session
- Progress
- Language
- Document upload status
- Completion status

---

## Doctor Dashboard

Should show:

- Queue
- Patient summary
- Red flags
- Clinical history
- Documents
- Timeline
- AI confidence
- Verification state

---

## Triage Dashboard

Should show:

- Active alerts
- Priority
- Time waiting
- Patient identifier
- Alert reason
- Acknowledgement status

---

## Admin Dashboard

Should show:

- Patients processed
- Average session duration
- Completion rate
- Red-flag count
- OCR success rate
- ASR metrics
- Doctor verification rate
- Kiosk utilization

---

# 25. AI Evaluation Metrics

The product must be evaluated quantitatively.

## ASR

Measure:

- Word Error Rate
- Character Error Rate
- Language-specific accuracy
- Medical terminology accuracy

---

## OCR

Measure:

- Character accuracy
- Word accuracy
- Entity extraction accuracy
- Medication extraction accuracy
- Lab-value extraction accuracy

---

## Entity Extraction

Measure:

```text
Precision
Recall
F1 Score
```

for:

- Medication
- Diagnosis
- Investigation
- Date
- Dosage
- Allergy

---

## Summary Quality

Evaluate:

- Completeness
- Factual consistency
- Clinical relevance
- Conciseness
- Hallucination rate
- Physician acceptance rate

---

# 26. Product Success Metrics

The SIH problem statement highlights metrics such as end-to-end completion time, ASR/OCR quality, physician satisfaction, and interoperability performance.

Recommended product KPIs:

| KPI | MVP Target |
|---|---:|
| Patient intake completion | < 3–5 min |
| Successful session completion | > 85% |
| ASR medical terminology accuracy | > 90% target |
| OCR printed-text accuracy | > 90% target |
| Handwritten entity extraction | > 75% initial target |
| Summary factual consistency | > 90% target |
| Physician verification acceptance | > 80% |
| Red-flag detection recall | > 95% target |
| UI task failure rate | < 10% |
| Average doctor review time | < 60 sec |

These are **engineering targets**, not claims that the final system will automatically achieve them.

---

# 27. MVP Definition

The MVP should NOT attempt to implement everything.

A strong hackathon MVP should contain:

## Must Have

### Patient

- Language selection
- Registration
- Consent
- Voice input
- Touch input
- Basic clinical history
- Document upload
- OCR
- Entity extraction
- Timeline
- Summary

### Doctor

- Patient queue
- Clinical summary
- Document viewer
- Timeline
- Edit/verify

### AI

- ASR
- Clinical entity extraction
- Basic adaptive questioning
- Summary generation
- Red-flag engine

### Security

- Authentication
- RBAC
- Session isolation
- Audit logging

---

# 28. Phase 2 Features

After MVP:

- Advanced multilingual support
- Better handwriting OCR
- Better medical NER
- More clinical specialties
- More AYUSH frameworks
- Advanced timeline analytics
- FHIR conversion
- ABDM integration
- HIS integration
- Offline/edge inference
- Hospital analytics

---

# 29. Phase 3 Features

Long-term:

- Multi-hospital deployment
- Federated learning
- Local hospital models
- Advanced clinical decision-support integration
- Longitudinal patient health record
- Population-level analytics
- Voice-first accessibility
- Edge AI kiosks
- Enterprise deployment

---

# 30. Offline / Low-Connectivity Mode

Indian public hospitals may not always have reliable connectivity.

The architecture should therefore allow:

```text
Online Mode
    ↓
Cloud / Hospital Server

Offline Mode
    ↓
Local Inference
    ↓
Encrypted Local Queue
    ↓
Sync when connection returns
```

However, offline mode should be treated as a later milestone if it threatens MVP stability.

---

# 31. Architecture Principles

## Principle 1 — AI is not the source of truth

The patient and verified clinical documents are the primary sources.

AI is a transformation and assistance layer.

---

## Principle 2 — Structured data beats free-form text

Store:

```text
Medication
Dose
Frequency
Duration
```

rather than only:

```text
"Patient takes some medicine."
```

---

## Principle 3 — Every AI result should be traceable

Store:

```text
value
confidence
source
timestamp
model_version
```

---

## Principle 4 — Human verification is mandatory for critical information

Doctor:

```text
AI Draft
   ↓
Human Review
   ↓
Verified Clinical Record
```

---

# 32. AI Hallucination Prevention

The summary engine must use retrieved structured data instead of relying entirely on model memory.

Recommended pattern:

```text
Patient Data
    ↓
Structured Clinical State
    ↓
Relevant Evidence Retrieval
    ↓
LLM
    ↓
JSON Schema Validation
    ↓
Medical Rule Validation
    ↓
Clinical Summary
```

The model should be instructed:

```text
Only use information present in the supplied clinical context.

If information is unavailable, return UNKNOWN.

Never infer a diagnosis.

Never invent a medication, laboratory value,
symptom, date, allergy, or medical history.
```

---

# 33. Clinical Safety Architecture

The system should use deterministic rules for safety-critical red flags where possible.

Example:

```text
IF
chest_pain = true
AND
dyspnea = true
AND
acute_onset = true

THEN

priority = HIGH
alert_triage = true
```

This is safer than allowing an LLM alone to decide whether a patient is in an emergency.

LLMs can assist with interpretation, but deterministic safety rules should remain in the critical path.

---

# 34. Observability

The system should log:

- API latency
- ASR latency
- OCR latency
- LLM latency
- OCR failures
- ASR failures
- Session abandonment
- Model errors
- API errors
- Authentication failures
- Red-flag alerts
- Doctor verification actions

Do not log raw medical data unnecessarily.

---

# 35. Model Versioning

Every AI-generated output should record:

```text
model_name
model_version
prompt_version
ontology_version
timestamp
confidence
```

Example:

```json
{
  "model": "clinical-summary-model",
  "version": "0.4.2",
  "prompt_version": "history-summary-v3",
  "ontology_version": "ayush-v1",
  "timestamp": "2026-08-30T10:00:00Z"
}
```

This becomes extremely valuable when debugging incorrect outputs.

---

# 36. Repository Structure

Recommended GitHub structure:

```text
med-drishti/
│
├── apps/
│   ├── patient-kiosk/
│   ├── doctor-dashboard/
│   └── admin-dashboard/
│
├── backend/
│   ├── api/
│   ├── auth/
│   ├── patients/
│   ├── sessions/
│   ├── history/
│   ├── documents/
│   ├── triage/
│   ├── summaries/
│   └── interoperability/
│
├── ai/
│   ├── asr/
│   ├── ocr/
│   ├── nlp/
│   ├── dialogue/
│   ├── red_flags/
│   ├── summarization/
│   └── evaluation/
│
├── data/
│   ├── schemas/
│   ├── ontologies/
│   ├── sample_documents/
│   └── synthetic_patients/
│
├── database/
│   ├── migrations/
│   └── seeds/
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── monitoring/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── ai/
│   ├── security/
│   └── deployment/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── ai/
│   └── e2e/
│
├── docker-compose.yml
├── .env.example
├── README.md
├── PRD.md
├── ARCHITECTURE.md
├── SECURITY.md
├── CONTRIBUTING.md
└── LICENSE
```

---

# 37. Development Phases

# Phase 0 — Product Foundation

### Deliverables

- Repository
- Monorepo structure
- CI/CD
- Docker
- Environment configuration
- Database
- Authentication

### Exit Criteria

- Application boots locally
- Database connects
- Authentication works
- CI passes

---

# Phase 1 — MED-DRISHTI

### Build

- Welcome
- Language selection
- Registration
- Consent
- Department selection
- Patient profile

### Exit Criteria

A patient can create a complete session without backend errors.

---

# Phase 2 — Clinical Interview Engine

### Build

- Clinical schema
- Question engine
- Voice input
- ASR
- Touch fallback
- Session state

### Exit Criteria

Patient can complete a structured history.

---

# Phase 3 — Document AI

### Build

- Upload
- Camera
- Image preprocessing
- OCR
- Document classification
- Entity extraction
- Confidence scores

### Exit Criteria

A sample prescription and lab report can be processed into structured entities.

---

# Phase 4 — Clinical Summary

### Build

- Structured case model
- Summary engine
- Timeline
- Source references
- Confidence indicators

### Exit Criteria

Doctor receives a usable case summary.

---

# Phase 5 — Doctor Dashboard

### Build

- Patient queue
- Summary
- Documents
- Timeline
- Edit
- Verify
- Audit log

### Exit Criteria

Doctor can review and correct the AI output.

---

# Phase 6 — Triage

### Build

- Red-flag rules
- Alert system
- Nurse dashboard
- Acknowledgement

### Exit Criteria

Test emergency scenarios trigger appropriate alerts.

---

# Phase 7 — AYUSH Mode

### Build

- Dashavidha Pariksha schema
- AYUSH-specific questions
- AYUSH summary
- Department-specific workflow

### Exit Criteria

An AYUSH patient can complete a structured Ayurvedic intake.

---

# Phase 8 — Interoperability

### Build

- FHIR mapper
- FHIR resources
- Integration adapter
- Mock HIS API
- ABDM-ready architecture

### Exit Criteria

Patient data can be transformed into valid target interoperability structures.

---

# Phase 9 — Security Hardening

### Build

- RBAC
- Audit logs
- Encryption
- Session cleanup
- Rate limiting
- Input validation
- Secure file handling

### Exit Criteria

Security test suite passes.

---

# Phase 10 — Hackathon Demo Optimization

### Focus

- Reliability
- Latency
- Visual polish
- Demo data
- Failure recovery
- Offline fallback
- Presentation flow

The final demo should prioritize a **reliable end-to-end workflow** over having dozens of unfinished features.

---

# 38. Hackathon Demo Scenario

A recommended demonstration:

## Scenario

A 52-year-old Bengali-speaking patient arrives at a busy hospital with chest discomfort.

### Step 1

Patient approaches Med-Drishti.

### Step 2

Selects:

```text
বাংলা
```

### Step 3

Audio explains consent.

Patient confirms.

### Step 4

AI asks:

> "আপনার প্রধান সমস্যা কী?"

Patient speaks naturally.

### Step 5

ASR converts speech to structured information.

### Step 6

System identifies:

```text
Chest discomfort
+
Breathlessness
```

Red-flag engine activates.

### Step 7

Triage dashboard receives:

```text
HIGH PRIORITY ALERT
```

### Step 8

Patient uploads:

- Old prescription
- Blood report
- Discharge summary

### Step 9

OCR extracts:

```text
Medication
HbA1c
Blood pressure history
Previous diagnosis
```

### Step 10

Timeline generated.

### Step 11

AI creates:

```text
Clinical Summary
```

### Step 12

Doctor opens dashboard.

Within seconds:

```text
Chief Complaint
HPI
Past History
Medication
Allergy
Investigations
Red Flags
Document Timeline
```

### Step 13

Doctor verifies and edits.

### Step 14

Final record is stored.

This demonstrates the entire product rather than showing disconnected AI features.

---

# 39. Demo Data Strategy

Never use real patient information during development or judging unless there is an appropriate legal and institutional basis.

Use synthetic data.

Example:

```text
Patient:
Ramesh Kumar

Age:
54

Language:
Hindi

Chief Complaint:
Chest discomfort

Past History:
Hypertension

Medication:
Amlodipine 5 mg

Documents:
Prescription
CBC report
Lipid profile
Discharge summary
```

Synthetic handwritten prescriptions can be created specifically to benchmark OCR.

---

# 40. Testing Strategy

## Unit Tests

Test:

- Clinical schema
- API validation
- Authentication
- Red-flag rules
- Timeline sorting
- FHIR mapping

---

## Integration Tests

Test:

```text
Patient → Backend
Backend → ASR
Backend → OCR
OCR → Entity Extraction
Entity Extraction → Summary
Summary → Doctor Dashboard
```

---

## E2E Tests

Scenario:

```text
Registration
→ Consent
→ Interview
→ Document Upload
→ OCR
→ Summary
→ Doctor Review
→ Verification
```

---

# 41. AI Evaluation Dataset

Create a controlled evaluation dataset containing:

### Speech

- Hindi
- English
- Bengali
- Mixed language
- Accented speech
- Noisy audio

### Documents

- Printed prescription
- Handwritten prescription
- Lab report
- Discharge summary
- Low-quality scan
- Rotated image
- Multilingual document

### Clinical Cases

- Cardiology-like symptoms
- Respiratory symptoms
- Gastrointestinal symptoms
- Fever
- Musculoskeletal complaints
- Chronic disease follow-up
- AYUSH-specific cases

---

# 42. Security Threat Model

Potential threats:

## Threat 1 — Patient Data Leakage

Mitigation:

- Session isolation
- Encryption
- Authentication
- Automatic cleanup

## Threat 2 — Malicious File Upload

Mitigation:

- File-type validation
- Size limits
- Malware scanning
- Safe object storage
- No direct execution

## Threat 3 — Prompt Injection

Medical documents may contain arbitrary text.

Example:

```text
Ignore previous instructions...
```

The AI pipeline must treat document text as **untrusted data**, not instructions.

---

# 43. Prompt Injection Defense

Architecture:

```text
Document
 ↓
OCR
 ↓
Untrusted Text
 ↓
Extraction Model
 ↓
Schema Validation
 ↓
Structured Data
```

Do not pass raw document content directly into an unrestricted agentic workflow.

---

# 44. Performance Requirements

Target:

### Patient Interface

- First meaningful render < 2 seconds
- UI interaction < 200 ms where possible

### API

- Normal CRUD requests < 500 ms target
- AI requests handled asynchronously

### OCR

- Standard document processing < 10 seconds target

### Summary

- < 10 seconds target for normal case

### Session

- Typical patient flow target < 3–5 minutes

---

# 45. Reliability Requirements

The system must gracefully handle:

- Microphone failure
- Poor network
- OCR failure
- Unsupported document
- AI timeout
- Model failure
- Browser refresh
- Session timeout

Example:

```text
AI service temporarily unavailable.

You can continue using touch-based input.

[ CONTINUE ]
```

AI failure should never completely break the patient workflow.

---

# 46. Fallback Strategy

If ASR fails:

```text
Voice
 ↓
Failed
 ↓
Touch Input
```

If OCR fails:

```text
OCR Failed
 ↓
Show document
 ↓
Allow manual metadata entry
```

If LLM fails:

```text
LLM unavailable
 ↓
Show structured history
 ↓
Doctor reviews raw data
```

This is essential for a reliable hackathon demo.

---

# 47. Product State Machine

```text
CREATED
   ↓
IDENTIFIED
   ↓
CONSENTED
   ↓
IN_PROGRESS
   ↓
HISTORY_COMPLETED
   ↓
DOCUMENT_PROCESSING
   ↓
SUMMARY_READY
   ↓
AWAITING_DOCTOR
   ↓
DOCTOR_REVIEW
   ↓
VERIFIED
   ↓
SYNCED
   ↓
COMPLETED
```

Possible failure states:

```text
CANCELLED
FAILED
EXPIRED
REQUIRES_ASSISTANCE
```

---

# 48. Acceptance Criteria

## Patient Intake

- Patient can complete registration.
- Patient can select language.
- Patient can provide consent.
- Patient can answer questions through voice.
- Patient can answer questions through touch.
- Session can resume after temporary failure.

## Document AI

- Patient can upload a document.
- Document quality can be assessed.
- OCR can process supported documents.
- Extracted entities contain confidence scores.
- Original document remains accessible.

## Summary

- Summary contains structured clinical sections.
- Summary does not invent missing information.
- Doctor can edit output.
- Doctor can verify output.
- AI-generated fields can be traced to source data.

## Triage

- Defined red-flag scenarios trigger alerts.
- Alerts appear on the triage dashboard.
- Nurse can acknowledge alert.
- Alert actions are audited.

## Security

- Users cannot access unauthorized patients.
- Sessions are isolated.
- Audit events are recorded.
- Sensitive temporary data is cleaned according to policy.

---

# 49. Definition of Done

A feature is considered complete only when:

- UI implemented
- API implemented
- Database model implemented
- Validation implemented
- Error handling implemented
- Tests written
- Security considered
- Loading states implemented
- Empty states implemented
- Failure states implemented
- Documentation updated

A feature that only works in the happy path is **not complete**.

---

# 50. Product Risks

## Risk 1 — Handwriting OCR

This is one of the hardest technical components.

### Mitigation

Do not claim perfect handwriting recognition.

Use:

```text
OCR
+
Confidence
+
Human Verification
```

---

## Risk 2 — Indian Language ASR

Different accents and noisy environments may degrade performance.

### Mitigation

- Push-to-talk
- Noise reduction
- Visual transcript confirmation
- Touch fallback
- Language-specific evaluation

---

## Risk 3 — LLM Hallucination

### Mitigation

- Structured inputs
- Schema validation
- Retrieval from source data
- Explicit unknown state
- Physician verification

---

## Risk 4 — ABDM Integration Complexity

Real-world integration may require institutional onboarding, credentials, sandbox access, and compliance.

### Mitigation

Build:

```text
FHIR-ready internal model
+
Mock ABDM adapter
```

for the hackathon.

Do not fake a production integration.

---

## Risk 5 — Overengineering

The project can easily become too large.

### Mitigation

Prioritize:

```text
Patient
 ↓
History
 ↓
Documents
 ↓
Summary
 ↓
Doctor
```

Everything else is secondary.

---

# 51. Competitive Differentiation

Med-Drishti should not position itself as another:

- Health chatbot
- Appointment system
- Hospital registration system
- OCR scanner
- Generic medical assistant

Its differentiating proposition is:

> **A patient-facing multimodal clinical intake system designed for Indian hospital environments that combines structured history-taking, multilingual interaction, medical document intelligence, AYUSH-specific assessment, and physician-verifiable clinical summaries.**

The SIH problem statement itself distinguishes the requirement from ordinary registration systems and generic document scanners.

---

# 52. Key Competitive Moats

## 52.1 Indian-language-first UX

Not merely translated UI.

The entire clinical interview should work naturally in supported Indian languages.

---

## 52.2 Clinical ontology

The system should understand:

```text
Symptom
→ Clinical Attribute
→ Clinical History
```

rather than merely extracting keywords.

---

## 52.3 Multimodal interaction

```text
Voice
+
Touch
+
Documents
```

---

## 52.4 Source-aware clinical AI

Every important output should have evidence.

---

## 52.5 AYUSH-native workflow

Dashavidha Pariksha should be part of the architecture rather than a superficial extra screen.

---

# 53. Recommended Engineering Priorities

If development time becomes limited, prioritize in this order:

```text
P0
Patient → History → Doctor Summary

P0
Document → OCR → Structured Entities

P0
Doctor Verification

P0
Red Flag Detection

P1
AYUSH Mode

P1
Timeline

P1
Multilingual Voice

P1
Security Hardening

P2
FHIR

P2
ABDM

P2
Advanced Analytics

P3
Offline AI
```

Do **not** spend the first half of the hackathon trying to integrate every external healthcare API.

A polished end-to-end prototype is more valuable than five half-working integrations.

---

# 54. Recommended MVP Architecture

```text
┌─────────────────────────────────────┐
│          NEXT.JS FRONTEND           │
│                                     │
│ MED-DRISHTI │ Doctor │ Triage       │
└──────────────────┬──────────────────┘
                   │
                   ▼
             FASTAPI BACKEND
                   │
       ┌───────────┼────────────┐
       ▼           ▼            ▼
   PostgreSQL    Redis      Object Storage
       │
       ▼
 ┌─────────────────────────────┐
 │          AI LAYER           │
 │                             │
 │ ASR │ OCR │ NER │ Summary   │
 │                             │
 │ Red Flag │ Dialogue Engine  │
 └─────────────────────────────┘
                   │
                   ▼
             FHIR ADAPTER
                   │
                   ▼
          HIS / ABDM Layer
```

---

# 55. Recommended First Technical Milestone

Before building sophisticated AI, build this completely:

```text
Patient Registration
        ↓
Consent
        ↓
5–10 Structured Questions
        ↓
Save Answers
        ↓
Doctor Dashboard
        ↓
Display Case
```

Once this works end-to-end, replace individual components with AI.

This prevents the classic hackathon failure mode where the team spends days building AI models but has no working product.

---

# 56. Development Philosophy

The product should follow:

```text
Working System
      >
Fancy AI
```

and:

```text
Reliable AI
      >
Large AI
```

and:

```text
Traceable Output
      >
Impressive Output
```

and:

```text
Doctor Verification
      >
Autonomous Medical Decision
```

---

# 57. Final Product Definition

Med-Drishti is successful when the following statement becomes true:

> A patient can walk into a participating hospital, interact with Med-Drishti in a familiar language using voice or touch, provide their clinical history, upload previous medical documents, and leave the kiosk with a structured clinical intake record that a physician can review, verify, and use immediately during consultation.

The physician should no longer need to begin every consultation by reconstructing the patient's entire history from scratch.

Instead:

```text
BEFORE

Patient
  ↓
Waiting
  ↓
Doctor
  ↓
History Taking
  ↓
Document Review
  ↓
Clinical Reasoning


AFTER

Patient
  ↓
Med-Drishti
  ├── History
  ├── Documents
  ├── Timeline
  └── Red Flags
        ↓
Doctor
  ↓
Verification
  ↓
Clinical Reasoning
```

---

# 58. Success Definition for SIH

The strongest SIH demonstration should prove five things:

### 1. Patient Accessibility

A non-technical patient can use the system.

### 2. AI Capability

Voice and documents are converted into structured clinical information.

### 3. Clinical Utility

A doctor can understand the patient faster.

### 4. Safety

The system does not pretend to replace a clinician and clearly handles uncertainty.

### 5. Scalability

The architecture can evolve into a hospital-wide and ABDM-compatible platform.

---

# 59. One-Line Product Pitch

> **Med-Drishti is an AI-powered multilingual clinical intake platform that lets patients speak, tap, and scan their medical records before consultation—transforming fragmented patient information into a structured, physician-verified clinical case in minutes.**

---

# 60. Strategic Positioning

The team should **not** pitch Med-Drishti as:

> "An AI doctor."

Instead pitch it as:

> **"An AI-powered first-mile clinical information system."**

The distinction matters.

Med-Drishti does not try to replace the physician.

It solves the information bottleneck **before the physician's clinical decision-making begins**.

That is the core product.

---

# 61. Source & Scope Note

This PRD is derived from the SIH26047 problem statement available through the provided SIH problem page and its detailed description. The linked page identifies the problem as **"Patient Case-Taking Software"** under the Ministry of Ayush / All India Institute of Ayurveda and describes requirements around multilingual history-taking, document digitization, clinical summarization, AYUSH history, red-flag detection, consent, privacy, and ABDM/HIS integration.

The architecture, engineering decisions, MVP boundaries, data models, API structure, testing strategy, and implementation priorities in this document are **product/engineering recommendations**, not requirements officially mandated by SIH.

For the final submission, the team should verify the latest official SIH portal wording and submission requirements before freezing the product scope.

---

# 62. Recommended Repository Documentation

The GitHub repository should eventually contain:

```text
README.md
PRD.md
ARCHITECTURE.md
SECURITY.md
API.md
AI_ARCHITECTURE.md
DATA_MODEL.md
DEPLOYMENT.md
TESTING.md
CONTRIBUTING.md
LICENSE
```

`PRD.md` defines **what to build**.

`ARCHITECTURE.md` should define **how it is built**.

`AI_ARCHITECTURE.md` should define **how the AI components work**.

`SECURITY.md` should define **how patient data is protected**.

`API.md` should define **how frontend, backend, AI services, and integrations communicate**.

---

