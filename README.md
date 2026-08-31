# Med-Drishti

AI-powered clinical intake system for patient onboarding and intelligent triage.

## Quick Start

### 1. Start Local Services
```bash
docker-compose up -d
```

This starts PostgreSQL, Redis, and MinIO.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend API: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:3000`

## Project Structure
```
Med-Drishti/
├── backend/           # FastAPI backend
├── frontend/          # Next.js frontend
├── infra/            # Infrastructure & DevOps
├── docs/             # Documentation
├── docker-compose.yml
├── .env.example
├── MED-DRISHTI_IMPLEMENTATION_PLAN.md
├── ARCHITECTURE.md
└── PRD.md
```

## Documentation
- [PRD](./PRD.md) — Product Requirements Document
- [Architecture](./ARCHITECTURE.md) — System design and tech stack
- [Implementation Plan](./MED-DRISHTI_IMPLEMENTATION_PLAN.md) — Phased roadmap
- [Backend README](./backend/README.md) — Backend setup
- [Frontend README](./frontend/README.md) — Frontend setup

## Core Features (MVP)
- Patient registration and consent management
- Voice + touch-based clinical intake
- Document upload and OCR with entity extraction
- Structured clinical record storage
- Red-flag detection engine
- Physician review dashboard
- Role-based access control

## Tech Stack
- **Backend:** FastAPI, Python, SQLAlchemy
- **Frontend:** Next.js, TypeScript, React, Tailwind CSS
- **Database:** PostgreSQL, Redis, MinIO
- **OCR:** Tesseract/PaddleOCR
- **ASR:** Whisper
- **Containerization:** Docker & Docker Compose

## Development
See individual README files in `backend/` and `frontend/` folders.

## Testing
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

## Contributing
1. Create a feature branch
2. Commit changes
3. Push and open a PR
4. Code review and merge

---

**Status:** Early MVP — Under Active Development
