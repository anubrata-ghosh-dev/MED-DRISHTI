# Database Architecture & Schema — Med-Drishti

**Database Engine:** SQLite 3 (`med_drishti.db`)
**ORM:** SQLAlchemy 2.0+ Declarative Base
**Session Handler:** Scoped session via `SessionLocal()`
**Target Production Engine:** PostgreSQL 15+

---

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ patients : "registers / owns"
    users ||--o{ clinical_entities : "verifies"
    users ||--o{ audit_logs : "executes action"

    patients ||--o{ clinical_sessions : "attends"
    patients ||--o{ consents : "signs"
    patients ||--o{ medical_records : "owns historical"
    patients ||--o{ audit_logs : "subject of"

    clinical_sessions ||--o{ clinical_histories : "contains"
    clinical_sessions ||--o{ documents : "uploads during"
    clinical_sessions ||--o{ clinical_entities : "structures"
    clinical_sessions ||--o{ red_flags : "triggers"
    clinical_sessions ||--o{ medical_records : "associates"

    documents ||--o{ extracted_entities : "raw OCR parses"
    documents ||--o{ clinical_entities : "source document"
```

---

## 2. Enumerations

### `RoleEnum`
Defines system authorization levels:
- `patient`: Outpatient kiosk user.
- `doctor`: Physician with verification and clinical review privileges.
- `nurse`: Triage staff with red-flag acknowledgment privileges.
- `admin`: System administrator.

### `ConsentStatusEnum`
Lifecycle status of patient consent:
- `pending`: Awaiting signature.
- `accepted`: Granted by patient.
- `rejected`: Explicitly refused.

### `RedFlagSeverityEnum`
Clinical priority tier for emergency alerts:
- `low`: Informational clinical finding.
- `medium`: Condition warranting routine attention.
- `high`: Serious clinical abnormality requiring prompt review.
- `critical`: Emergent life-threatening risk (e.g., acute chest pain, stroke signs).

### `MedicalRecordTypeEnum`
Categorization for historical medical files:
- `lab_report`: Pathology, biochemistry, hematology reports.
- `prescription`: Prior doctor prescription slips.
- `discharge_summary`: Hospital inpatient summaries.
- `imaging`: X-Rays, CT scans, ultrasounds.
- `other`: Miscellaneous health records.

---

## 3. Schema Definitions

### 3.1 `users`
Stores credentials, roles, and status of all system accounts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Unique user identifier |
| `email` | String | Unique, Indexed, Not Null | Account login email |
| `hashed_password` | String | Not Null | Bcrypt hashed secret |
| `full_name` | String | Nullable | User display name |
| `role` | Enum (`RoleEnum`) | Default: `patient` | Access control role |
| `is_active` | Boolean | Default: `True` | Account activation flag |
| `created_at` | DateTime | Default: `utcnow` | Account creation timestamp |
| `updated_at` | DateTime | Default: `utcnow`, onupdate | Last modification timestamp |

---

### 3.2 `patients`
Demographic profile and identity identifiers for clinical subjects.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Unique patient identifier |
| `user_id` | Integer | FK (`users.id`), Nullable | Optional linked user login |
| `name` | String | Not Null | Full legal name |
| `date_of_birth` | String | Nullable | Birth date (`YYYY-MM-DD`) |
| `gender` | String | Nullable | Patient gender |
| `phone` | String | Nullable | Contact phone number |
| `preferred_language`| String | Default: `"English"` | Language for audio and text prompts |
| `abha_id` | String | Unique, Nullable | 14-digit ABHA number or address |
| `created_at` | DateTime | Default: `utcnow` | Record creation timestamp |
| `updated_at` | DateTime | Default: `utcnow`, onupdate | Last modification timestamp |

---

### 3.3 `consents`
Tracks explicit informed digital consent granted by the patient.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Consent record identifier |
| `patient_id` | Integer | FK (`patients.id`), Not Null | Linked patient |
| `consent_type` | String | Not Null | E.g. `data_processing`, `voice_recording` |
| `status` | Enum (`ConsentStatusEnum`) | Default: `pending` | Consent status |
| `signed_at` | DateTime | Nullable | Timestamp of digital signature |
| `expires_at` | DateTime | Nullable | Expiration timestamp |
| `created_at` | DateTime | Default: `utcnow` | Record creation timestamp |

---

### 3.4 `clinical_sessions`
Represents an active or completed patient encounter/intake.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Session encounter identifier |
| `patient_id` | Integer | FK (`patients.id`), Not Null | Linked patient |
| `session_type` | String | Default: `"intake"` | Type of encounter (e.g. `intake`, `followup`) |
| `department` | String | Default: `"General"` | Department: `General` or `Ayurveda` |
| `status` | String | Default: `"active"` | Status: `active`, `completed`, `abandoned` |
| `started_at` | DateTime | Default: `utcnow` | Session start timestamp |
| `completed_at` | DateTime | Nullable | Session completion timestamp |

---

### 3.5 `clinical_histories`
Stores the subjective clinical conversation narrative.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Clinical history record identifier |
| `session_id` | Integer | FK (`clinical_sessions.id`), Not Null | Linked clinical session |
| `chief_complaint` | Text | Nullable | Primary reason for visit |
| `history_of_present_illness` | Text | Nullable | Onset, duration, character, radiation |
| `past_medical_history` | Text | Nullable | Known chronic conditions |
| `medications` | Text | Nullable | Current drug names and dosages |
| `allergies` | Text | Nullable | Known drug, food, or contact allergies |
| `family_history` | Text | Nullable | Hereditary or familial conditions |
| `social_history` | Text | Nullable | Diet, lifestyle, smoking, alcohol |
| `created_at` | DateTime | Default: `utcnow` | Record creation timestamp |

---

### 3.6 `clinical_entities`
Canonical structured clinical observations with AI confidence and doctor verification flags.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Entity identifier |
| `session_id` | Integer | FK (`clinical_sessions.id`), Not Null | Linked clinical session |
| `document_id` | Integer | FK (`documents.id`), Nullable | Source document if extracted via OCR |
| `entity_type` | String | Not Null | E.g. `Medication`, `Allergy`, `Prakriti`, `Symptom` |
| `value` | String | Not Null | Raw extracted string |
| `normalized_value`| String | Nullable | Standardized clinical concept (SNOMED/RxNorm) |
| `unit` | String | Nullable | Measurement unit (e.g. `mg`, `mmHg`, `%`) |
| `confidence` | Float | Default: `1.0` | Extraction confidence (0.0 to 1.0) |
| `source_text` | Text | Nullable | Original sentence or text snippet |
| `verified` | Boolean | Default: `False` | True if verified by physician |
| `verified_by` | Integer | FK (`users.id`), Nullable | Physician user ID who verified |
| `created_at` | DateTime | Default: `utcnow` | Extraction timestamp |

---

### 3.7 `documents`
Uploaded prescription slips, lab tests, and imaging records associated with the intake session.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Document identifier |
| `session_id` | Integer | FK (`clinical_sessions.id`), Not Null | Linked session |
| `file_name` | String | Not Null | Original upload filename |
| `file_type` | String | Nullable | MIME type (e.g., `image/jpeg`, `application/pdf`) |
| `s3_key` | String | Unique | File path or object storage key |
| `ocr_text` | Text | Nullable | Full extracted raw OCR text |
| `upload_at` | DateTime | Default: `utcnow` | Upload timestamp |

---

### 3.8 `extracted_entities`
Legacy raw entities extracted from document OCR text.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Extracted entity identifier |
| `document_id` | Integer | FK (`documents.id`), Not Null | Source document |
| `entity_type` | String | Nullable | Parsed category (`medication`, `lab_value`, `date`) |
| `entity_value` | String | Nullable | Parsed textual value |
| `confidence` | Float | Default: `0.0` | OCR/Parser confidence score |
| `source_text` | Text | Nullable | Surrounding line text |
| `extracted_at` | DateTime | Default: `utcnow` | Extraction timestamp |

---

### 3.9 `red_flags`
Predefined clinical emergency alerts identified by the deterministic rule engine.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Alert identifier |
| `session_id` | Integer | FK (`clinical_sessions.id`), Not Null | Linked session |
| `rule_id` | String | Nullable | Rule identifier (e.g., `RF_CARDIAC_CHEST_PAIN`) |
| `description` | String | Nullable | Alert explanation |
| `severity` | Enum (`RedFlagSeverityEnum`) | Default: `medium` | Severity tier (`low`, `medium`, `high`, `critical`) |
| `triggered_at` | DateTime | Default: `utcnow` | Detection timestamp |
| `reviewed` | Boolean | Default: `False` | Acknowledged by triage staff |

---

### 3.10 `medical_records`
Historical records attached permanently to the patient record across encounters.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Record identifier |
| `patient_id` | Integer | FK (`patients.id`), Not Null | Owning patient |
| `session_id` | Integer | FK (`clinical_sessions.id`), Nullable | Associated intake session |
| `record_type` | Enum (`MedicalRecordTypeEnum`) | Default: `other` | Record classification |
| `title` | String | Nullable | Human-readable title |
| `description` | Text | Nullable | Description or clinical notes |
| `file_name` | String | Nullable | Original filename |
| `file_type` | String | Nullable | MIME type |
| `file_path` | String | Nullable | Local file path |
| `ocr_text` | Text | Nullable | Extracted OCR text |
| `uploaded_at` | DateTime | Default: `utcnow` | Upload timestamp |

---

### 3.11 `audit_logs`
Immutable compliance and access trail tracking actions on sensitive health data.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Log identifier |
| `patient_id` | Integer | FK (`patients.id`), Not Null | Subject patient |
| `action` | String | Nullable | Action code (e.g., `verify_session`, `view_record`) |
| `resource_type` | String | Nullable | Target resource (e.g., `clinical_session`) |
| `resource_id` | Integer | Nullable | Identifier of target resource |
| `performed_by_user_id` | Integer | FK (`users.id`), Nullable | Performing user ID |
| `timestamp` | DateTime | Default: `utcnow` | Event timestamp |
| `details` | Text | Nullable | Descriptive audit text |
| `before_state` | Text | Nullable | Pre-modification state snapshot (JSON) |
| `after_state` | Text | Nullable | Post-modification state snapshot (JSON) |

---

## 4. Migration to PostgreSQL

In a production environment, SQLite must be replaced with PostgreSQL:

### Transition Steps:
1. **Environment Configuration:**
   Update `DATABASE_URL` in `.env`:
   ```bash
   DATABASE_URL=postgresql://med_user:med_password@postgres-host:5432/med_drishti
   ```
2. **Install Drivers:**
   Ensure `psycopg2-binary` or `asyncpg` is installed in `backend/requirements.txt`:
   ```bash
   pip install psycopg2-binary
   ```
3. **Database Migration with Alembic:**
   Initialize and execute migrations:
   ```bash
   alembic init migrations
   alembic revision --autogenerate -m "Initial Med-Drishti Schema"
   alembic upgrade head
   ```
