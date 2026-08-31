# Med-Drishti Backend

FastAPI-based backend for clinical intake and patient management.

## Setup

### 1. Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Dev Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at `http://localhost:8000`
Swagger docs: `http://localhost:8000/docs`

## Database

By default, SQLite is used (dev.db). To use PostgreSQL, set:
```bash
export DATABASE_URL=postgresql://user:password@localhost/meddrishti
```

## Project Structure
```
backend/
├── app/
│   ├── main.py       # FastAPI app and routes
│   ├── models.py     # SQLAlchemy ORM models
│   ├── database.py   # Database engine and session
│   ├── auth.py       # JWT and password hashing
│   ├── schemas.py    # Pydantic request/response models
│   └── __init__.py
├── requirements.txt
└── README.md
```

## API Endpoints (Phase 1)

### Auth
- `POST /api/v1/auth/register` — Register new user
- `POST /api/v1/auth/login` — Login and get JWT token
- `POST /api/v1/auth/logout` — Logout

### Patients
- `POST /api/v1/patients` — Create patient
- `GET /api/v1/patients/{patient_id}` — Get patient
- `PUT /api/v1/patients/{patient_id}` — Update patient

### Clinical Sessions
- `POST /api/v1/sessions` — Create session
- `GET /api/v1/sessions/{session_id}` — Get session
- `PUT /api/v1/sessions/{session_id}` — Update session

### Clinical History
- `POST /api/v1/sessions/{session_id}/history` — Create clinical history
- `GET /api/v1/sessions/{session_id}/history` — Get session histories

### Consents
- `POST /api/v1/patients/{patient_id}/consents` — Create consent
- `GET /api/v1/patients/{patient_id}/consents` — Get consents

## Authentication

All endpoints except `/health`, `/auth/register`, and `/auth/login` require JWT token:

```
Authorization: Bearer <access_token>
```

Tokens expire in 30 minutes by default.

## Data Models

- **User** — Doctor, nurse, patient, admin accounts
- **Patient** — Patient records with ABHA ID support
- **ClinicalSession** — Intake sessions (active, completed, abandoned)
- **ClinicalHistory** — Structured clinical notes (CC, HPI, PMH, meds, allergies, etc.)
- **Document** — Uploaded documents (scans, reports)
- **ExtractedEntity** — OCR-extracted data (medications, dates, lab values)
- **Consent** — Audit trail for data access consents
- **RedFlag** — Triggered alerts from rule engine
- **AuditLog** — Access and modification audit trail
