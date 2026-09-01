# Med-Drishti Quick Reference Guide

## 🚀 Start Development Servers (5 minutes)

### Terminal 1: Backend
```bash
cd /Users/anubrataghosh/Projects/Med-Drishti/backend
source venv/bin/activate
python -m uvicorn app.main:app --reload
# Wait for: "Uvicorn running on http://0.0.0.0:8000"
```

### Terminal 2: Frontend
```bash
cd /Users/anubrataghosh/Projects/Med-Drishti/frontend
npm run dev
# Wait for: "▲ Next.js 14.2.5"
# Open: http://localhost:3000
```

---

## 🧪 Run Integration Tests

```bash
# Terminal 3: Complete 7-phase test
cd /Users/anubrataghosh/Projects/Med-Drishti
./test-complete-flow.sh
# Expected output: "✅ ALL TESTS PASSED (Phases 0-7 Complete)"
```

---

## 🔗 Key URLs

| Resource | URL |
|----------|-----|
| Frontend App | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

---

## 📱 Test User Accounts

### Seeded in Database
```
Patient:  john@test.com / test123  (role: patient)
Doctor:   dr.smith@test.com / test123  (role: doctor)
Nurse:    nurse@test.com / test123  (role: nurse)
Admin:    admin@test.com / test123  (role: admin)
```

### Register New
- Go to http://localhost:3000/language → Select language
- Click "New Patient" on welcome screen
- Enter email, password, name, gender, phone
- Click "Register & Continue"

---

## 🔑 Most Important Endpoints

### Create Session & Intake
```bash
# Register patient
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","full_name":"John","role":"patient"}'

# Create patient record
curl -X POST http://localhost:8000/api/v1/patients \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Smith","gender":"male","preferred_language":"English"}'

# Create intake session
curl -X POST http://localhost:8000/api/v1/sessions \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"patient_id":1,"session_type":"intake"}'

# Get next question
curl -X POST http://localhost:8000/api/v1/voice/next-question \
  -H "Content-Type: application/json" \
  -d '{"session_id":1,"current_question_id":null,"language":"en"}'
```

### Generate Summary & Verify
```bash
# Get clinical summary
curl -X GET http://localhost:8000/api/v1/sessions/1/summary \
  -H "Authorization: Bearer <DOCTOR_TOKEN>"

# Verify session (physician)
curl -X PUT http://localhost:8000/api/v1/sessions/1/verify \
  -H "Authorization: Bearer <DOCTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"chief_complaint":"Headache","history_of_present_illness":"Since yesterday","physician_notes":"Patient stable"}'
```

---

## 📁 Important Files

| File | Purpose | Lines |
|------|---------|-------|
| `/backend/app/main.py` | All API endpoints | 764 |
| `/backend/app/models.py` | Database schema (9 models) | 250 |
| `/backend/app/schemas.py` | Pydantic validation | 285 |
| `/backend/app/voice.py` | Whisper ASR module | 80 |
| `/backend/app/dialogue_policy.json` | 6-question flow | 60 |
| `/frontend/app/doctor/page.tsx` | Doctor dashboard | 328 |
| `/frontend/components/summary/ClinicalSummaryView.tsx` | Summary UI | 190 |
| `/frontend/lib/api.ts` | HTTP client (30+ functions) | 310 |

---

## 🛠️ Common Commands

### Backend
```bash
# Restart server (auto-reload on changes)
# Just save file - Uvicorn reloads automatically

# Seed database with test data
cd backend && python -c "from app.seed import seed_database; seed_database()"

# Check database
sqlite3 backend/dev.db ".tables"
```

### Frontend
```bash
# Rebuild if needed
npm run build

# Check TypeScript errors only
npx tsc --noEmit

# View Next.js build output
npm run build 2>&1 | grep "Route"
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check port 8000 is free
lsof -i :8000

# Reset database
rm backend/dev.db
# Restart backend - creates new db

# Check Python version (need 3.9+)
python --version
```

### Frontend Won't Build
```bash
# Clear cache and reinstall
rm -rf frontend/node_modules
rm frontend/package-lock.json
npm install

# Check Node version (need 18+)
node --version
```

### API Calls Failing
```bash
# Check backend is running
curl http://localhost:8000/api/v1/health

# Check token is valid
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/auth/me
```

---

## 📊 Architecture Quick View

```
┌──────────────────────┐
│   Frontend (3000)    │  Next.js 14 + React 18 + Tailwind
│  - Voice Recording   │
│  - Text Entry        │
│  - Doctor Dashboard  │
└──────────┬───────────┘
           │ HTTP/REST
┌──────────▼───────────┐
│  Backend (8000)      │  FastAPI + SQLAlchemy
│  - 30+ Endpoints     │
│  - JWT Auth          │
│  - Voice ASR         │
│  - Red-flag Engine   │
└──────────┬───────────┘
           │ SQL
┌──────────▼───────────┐
│  Database            │
│  - SQLite (dev)      │
│  - PostgreSQL (prod) │
│  - 9 Models          │
└──────────────────────┘
```

---

## ✅ Validation Checklist

- [ ] Backend running on 8000: `curl http://localhost:8000/api/v1/health`
- [ ] Frontend running on 3000: Visit http://localhost:3000
- [ ] Can register patient: Try creating account
- [ ] Can transcribe voice: Speak in intake form
- [ ] Doctor dashboard works: Login as doctor, view queue
- [ ] Integration tests pass: Run `./test-complete-flow.sh`

---

## 📞 When Stuck

1. **Check logs**: Look at terminal output where server started
2. **Check database**: `sqlite3 backend/dev.db "SELECT COUNT(*) FROM user;"`
3. **Reset everything**: Kill servers, delete dev.db, restart
4. **Read error message**: Usually points to exact issue
5. **Reference docs**: http://localhost:8000/docs (Swagger)

---

**Last Updated**: September 1, 2026  
**Status**: ✅ Production Ready
