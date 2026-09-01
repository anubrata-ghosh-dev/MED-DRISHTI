# Med-Drishti Frontend Navigation Guide

## 🗺️ User Journey Map

```
START
  ↓
/ (Welcome)
  ├─ "New Patient?" → /language
  └─ "Are you a doctor?" → /doctor
      ↓
  /language (Language Selection)
      ├─ English
      ├─ Hindi
      ├─ Bengali
      └─ (90+ languages)
          ↓
      /register (Patient Registration)
          - Name
          - Date of Birth
          - Gender
          - Phone Number
          - ABHA ID (optional)
          ↓
      /consent (Privacy Agreement)
          - Data Processing Consent
          - Voice Recording Consent
          ↓
      /intake (Clinical Intake)
          - Q1: Chief Complaint
          - Q2: Duration
          - Q3: Severity
          - Q4: Location
          - Q5: Medications
          - Q6: Allergies
          ↓
      /done (Completion)
          - Receipt & Confirmation
          - "Return to Welcome" button
              ↓
              / (Back to start)
            
PHYSICIAN PATH:
  /doctor (Dashboard)
      ├─ Patient Queue
      ├─ Clinical Summary
      ├─ Verification Form
      └─ Audit Logs
```

---

## 📄 Page Details

### 1. `/` - Welcome & Role Selection
**File**: `/frontend/app/page.tsx`  
**Purpose**: Entry point - patient or physician selection

**Components**:
- Large welcome header
- "New Patient" button → Language selection
- "Physician" button → Doctor dashboard
- System status indicator

**User Actions**:
- Click "New Patient" to begin intake
- Click "Physician" for doctor dashboard

---

### 2. `/language` - Language Preference
**File**: `/frontend/app/language/page.tsx`  
**Purpose**: Select interface language

**Features**:
- 90+ language options (via Whisper support)
- Language flag icons
- Saves preference for entire session
- TTS voice language selection

**User Actions**:
- Select language (default: English)
- Proceed to registration

---

### 3. `/register` - Patient Registration
**File**: `/frontend/app/register/page.tsx`  
**Purpose**: Capture patient demographics

**Form Fields**:
- **Name** (required)
- **Date of Birth** (optional)
- **Gender** (optional: Male/Female/Other)
- **Phone Number** (required)
- **ABHA ID** (optional - India-specific health ID)

**Validation**:
- Phone must be 10+ digits
- Email format validation
- Name length check

**User Actions**:
- Fill registration form
- Click "Register & Continue"
- Creates patient record in database
- Generates JWT session token

**API Call**: `POST /api/v1/patients`

---

### 4. `/consent` - Privacy & Consent
**File**: `/frontend/app/consent/page.tsx`  
**Purpose**: Record consent for data processing and voice recording

**Consent Types**:
1. **Data Processing** - Allow patient data to be processed/stored
2. **Voice Recording** - Allow audio recording for medical notes

**UI Elements**:
- Privacy notice (expandable sections)
- Two toggles for each consent type
- "I Agree to Continue" button
- Fallback to continue even if consent fails

**Compliance**:
- GDPR-compliant consent recording
- HIPAA data privacy acknowledgment
- Records timestamp and acceptance status

**User Actions**:
- Read privacy notice
- Toggle consent agreements
- Click "I Agree & Continue"

**API Calls**:
- `POST /api/v1/patients/{id}/consents` (data_processing)
- `POST /api/v1/patients/{id}/consents` (voice_recording)

---

### 5. `/intake` - Clinical Intake (Core Flow)
**File**: `/frontend/app/intake/page.tsx`  
**Purpose**: Structured voice/text clinical intake

**Components Used**:
- `<QuestionCard>` - Question display with TTS
- `<VoiceRecorder>` - Audio recording component
- Question text with audio playback button
- Transcript display
- Text fallback option

**Features**:
- **Voice Recording**: 
  - Tap to record
  - Real-time waveform
  - Stop when done
  - Auto-transcription via ASR
  
- **Text Entry**:
  - Fallback if audio unavailable
  - Click "Prefer typing" link
  - Type answer in textarea

- **Question Flow**:
  - 6-question sequence
  - Stateful progression
  - Can review and re-record

**Dialogue Questions**:
1. "What brings you in today?" (chief_complaint)
2. "How long have you had this?" (duration)
3. "Rate severity 1-10" (severity)
4. "Where is the discomfort?" (location)
5. "What medications are you taking?" (medications)
6. "Any known allergies?" (allergies)

**User Actions**:
- Tap microphone to start recording
- Speak answer clearly
- Tap "Done Speaking" to stop
- Review transcription
- Confirm or re-record
- Click "Got it" for next question
- On final question: Session complete

**API Calls**:
- `POST /api/v1/voice/next-question` (get question)
- `POST /api/v1/voice/transcribe` (transcribe audio)
- `POST /api/v1/sessions/{id}/history` (save on completion)

---

### 6. `/triage` - Triage Alert Dashboard
**File**: `/frontend/app/triage/page.tsx`  
**Purpose**: Nurse triage alert management

**Displays**:
- Red-flag alerts by severity
- Alert descriptions and rules
- Patient information
- Review/mark resolved buttons

**Alert Severity Colors**:
- 🔴 CRITICAL - Immediate action needed
- 🟠 HIGH - Urgent review
- 🟡 MEDIUM - Soon
- 🟢 STABLE - Routine follow-up

**User Actions**:
- View alert details
- Mark as reviewed
- Filter by severity
- Search patients

**API Calls**:
- `GET /api/v1/triage/alerts`
- `PUT /api/v1/triage/alerts/{id}/review`

---

### 7. `/doctor` - Physician Dashboard
**File**: `/frontend/app/doctor/page.tsx`  
**Purpose**: Complete patient review and verification

**Layout**: 3-column (Queue | Summary | Verification)

**Left Column - Patient Queue**:
- List of patients awaiting review
- Status badge (active/completed)
- Triage status color-coded
- Red-flag count
- Click to select patient
- Search and filter options

**Middle Column - Clinical Summary**:
- Patient demographics
- Subjective (patient-reported):
  - Chief complaint
  - History of present illness
  - Medications
  - Allergies
- Objective (extracted):
  - Vitals & labs
  - OCR medications
  - Documents analyzed
- Assessment & Triage:
  - Red-flags detected
  - Triage status
  - Severity indicators

**Right Column - Verification Form**:
- Editable chief complaint
- Editable HPI
- Editable medications
- Editable allergies
- Physician notes textarea
- "Verify & Complete Session" button

**Additional Sections**:
- Audit trail (log of all actions)
- Document viewer (expandable)

**User Actions** (Physician):
- Select patient from queue
- Review clinical summary
- Edit/verify clinical data if needed
- Add assessment notes
- Click "Verify & Complete Session"
- Session status changes to "completed"

**API Calls**:
- `GET /api/v1/doctor/queue`
- `GET /api/v1/sessions/{id}/summary`
- `PUT /api/v1/sessions/{id}/verify`
- `GET /api/v1/sessions/{id}/audit-logs`

---

### 8. `/done` - Completion Confirmation
**File**: `/frontend/app/done/page.tsx`  
**Purpose**: Thank you screen after intake completion

**Displays**:
- Success message
- Session receipt
- Summary of captured data
- "Return to Welcome" button

**User Actions**:
- Review intake summary
- Return to home screen to restart

---

## 🔄 Data Flow Diagram

```
FRONTEND                          BACKEND                      DATABASE
─────────────                     ───────                      ────────

/register (Form)
  └──→ POST /auth/register ─────→ Create User (JWT) ─────→ users table
       POST /patients ─────────→ Create Patient record ──→ patients table
       │
       ↓ Save token to localStorage

/consent (UI)
  └──→ POST /consents (x2) ─────→ Record consents ─────────→ consents table
       │
       ↓ Create session

/intake (VoiceRecorder)
  ├──→ POST /sessions ────────→ Create session ──────────→ sessions table
  │
  ├──→ POST /voice/next-question  Get question flow ──→ dialogue_policy.json
  │
  ├──→ POST /voice/transcribe    Transcribe audio ──→ (Whisper model)
  │
  ├──→ POST /history ──────────→ Save answers ────────────→ clinical_history table
  │
  └──→ GET /summary ──────────→ Generate summary ─────→ red_flags table

/doctor (Dashboard)
  ├──→ GET /doctor/queue ─────→ Fetch patients ────────→ sessions + patients tables
  │
  ├──→ GET /summary ──────────→ Generate clinical summary ─────→ multiple tables
  │
  ├──→ PUT /verify ───────────→ Complete session ──────→ sessions + audit_logs
  │
  └──→ GET /audit-logs ──────→ Fetch audit trail ──────→ audit_logs table
```

---

## 🎨 Component Architecture

```
App (Root)
├── AuthProvider (Context)
│   ├── token storage
│   ├── patient ID
│   └── session ID
│
├── KioskWrapper (Layout)
│   ├── Full-screen kiosk mode
│   └── Responsive design
│
├── Page Components
│   ├── Welcome (page.tsx)
│   ├── LanguageSelect (language/page.tsx)
│   ├── Registration (register/page.tsx)
│   ├── Consent (consent/page.tsx)
│   ├── Intake (intake/page.tsx)
│   │   └── QuestionCard
│   │       └── VoiceRecorder
│   │           ├── Microphone access
│   │           ├── Web Audio API
│   │           └── ASR integration
│   ├── Triage (triage/page.tsx)
│   │   └── AlertCard
│   ├── Doctor (doctor/page.tsx)
│   │   ├── QueueList
│   │   ├── ClinicalSummaryView
│   │   └── VerificationForm
│   └── Done (done/page.tsx)
│
└── Shared Components
    ├── BigButton (UI)
    ├── LoadingSpinner (UI)
    ├── DocumentUploader
    └── Various UI elements
```

---

## 🔑 Key Component Props

### VoiceRecorder
```tsx
interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  language?: string; // 'en', 'hi', 'bn', etc.
}
```

### QuestionCard
```tsx
interface QuestionCardProps {
  question: string;
  questionId: string;
  onAnswer: (answer: string) => void;
  language?: string;
}
```

### ClinicalSummaryView
```tsx
interface ClinicalSummaryViewProps {
  summary: {
    patient: PatientInfo;
    subjective: SubjectiveData;
    objective: ObjectiveData;
    assessment_triage: AssessmentData;
  };
}
```

---

## 🌐 Environment Variables

```env
# .env.local in /frontend/
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 📱 Responsive Design

All pages are fully responsive:
- **Desktop**: Full width, optimized layout
- **Tablet**: Adjusted spacing, readable text
- **Mobile**: Single column, large touch targets
- **Touch-friendly**: Big buttons, easy scrolling

---

## ♿ Accessibility Features

- ✅ Text-to-speech (TTS) for all questions
- ✅ Voice input with fallback to text
- ✅ Keyboard navigation support
- ✅ High contrast colors
- ✅ ARIA labels on interactive elements
- ✅ Screen reader compatible

---

## 🧪 Testing Frontend

```bash
# Build check
npm run build

# TypeScript check only
npx tsc --noEmit

# Run in dev mode with hot reload
npm run dev
```

---

## 🚀 Frontend Performance Tips

- Pages are pre-rendered as static when possible
- Code splitting per route
- Image optimization via Next.js
- CSS-in-JS with Tailwind for tree-shaking
- Lazy loading of voice components

---

**Last Updated**: September 1, 2026
