# Med-Drishti — Website & Dashboard Design Specification

*Aligned to the SIH26047 PRD (Ministry of Ayush / All India Institute of Ayurveda). This replaces the earlier general-purpose draft — product name, architecture, and stack now follow the PRD directly.*

---

## 1. What this site actually is

Four kinds of people use this system, and the PRD is explicit that they need different things from it:

- **The patient**, at a shared kiosk in a busy hospital, often elderly, first-time-digital, and more comfortable in a regional language than in English. They need one task per screen, large targets, and a voice that never assumes they can read fine print.
- **The doctor**, with a 2–5 minute consultation window. They need the case readable in seconds — chief complaint, history, medications, red flags, documents — with everything traceable back to where it came from.
- **The nurse / triage staff**, watching a live queue for flagged patients and acknowledging alerts before they're missed.
- **The hospital and system admin**, who need throughput, completion rate, and configuration — a much lighter, secondary surface.

The product's real job, stated plainly in the PRD, is to **turn the first few minutes of a hospital visit from a data-collection bottleneck into a structured, physician-verifiable clinical case** — not to diagnose. Every design decision below exists to make that handoff fast, trustworthy, and honest about its own uncertainty.

---

## 2. Design plan

### Pass 1 — the token system

**Color** — six tokens, five doing status work and one doing something deliberately different.

| Name | Hex | Role |
|---|---|---|
| Clinical Mist | `#EDF1EE` | Page background — pale, cool sage-white. |
| Chart Ink | `#16241F` | Primary text and structural lines. |
| Pulse Teal | `#1F6F63` | Primary action color; "no flags" state. |
| Vitals Amber | `#D89A3D` | Priority-tier flag. |
| Alert Coral | `#C4432E` | Urgent-tier flag — reserved, never decorative. |
| Ayush Sage | `#6E8B74` | Department indicator for AYUSH-workflow screens **only**. |

Ayush Sage is the one addition to the original five, and it earns a rule of its own: it never appears in the severity system. A clinician scanning a queue reads color for exactly one thing at a time — urgency uses teal/amber/coral, department uses sage — so the two systems can never be misread as one another. It's desaturated deliberately, to avoid the "green = herbal/natural" cliché; it functions as a tag, not a theme.

**Type — two systems, because the audiences genuinely need different things from a typeface.**

*Kiosk (patient-facing, multilingual):* **Noto Sans**, with the script-specific variant swapped in per selected language — Noto Sans Devanagari for Hindi/Marathi, Bengali, Tamil, Telugu, Kannada, Malayalam, Gujarati, Gurmukhi for Punjabi, and Latin for English. This is a constraint-driven choice, not a default: very few families offer metrically consistent, fully-covered glyphs across all ten target scripts, and a patient's interface shouldn't change *personality* just because it changed *script*. Warmth here comes from color, iconography, and spacing — not from an expressive display face, because no single expressive face covers ten Indic scripts well. Picking an "exotic" display font that looks great in Devanagari and quietly degrades for Tamil or Malayalam would be an accessibility bug wearing a design choice's clothes, so coverage parity wins over personality on the kiosk.

*Dashboards (doctor / nurse / admin, primarily English and medical terminology):* **Fraunces** for headlines, **IBM Plex Sans** for UI and data — unchanged from the original plan. Clinicians aren't the multilingual-accessibility constraint, so this side of the product can afford a more opinionated typeface pairing.

**Layout — two rhythms under one system.**

```
Kiosk                          Dashboard
┌───────────────────┐          ┌──┬─────────────────────┐
│ ●───○───○───○      │          │  │  Med-Drishti        │
│  (step rail)       │          │T │──────────────────── │
│                     │          │A │ ruled rows,         │
│   one task,         │          │B │ left-aligned,       │
│   full width,       │          │S │ dense               │
│   large targets     │          │  │                     │
└───────────────────┘          └──┴─────────────────────┘
```

The kiosk is strictly one task per screen with a visible step rail styled as a row of chart tabs (tying back to the chart metaphor without resorting to a generic progress bar). Every tap target is large. The dashboard keeps the original ruled, chart-page density.

### Pass 1 critique

- **Cut:** treating the kiosk as just a "lighter" version of the dashboard. The PRD is explicit that these are different tasks under different cognitive load, so they're now genuinely different layouts, not one responsive scale of the same thing.
- **Cut:** a single global type system. Forcing one typeface to cover ten Indic scripts *and* carry a distinctive personality is the kind of thing that looks fine in a design mockup with only English placeholder text and breaks the moment a Bengali-speaking patient actually uses it.
- **Kept, deliberately:** numbered sequence for the Dashavidha Pariksha capture (Section 5, AYUSH screen) — those ten parameters are a genuinely fixed clinical sequence, so numbering earns its place there the same way it did for patient onboarding in the earlier draft.
- **New rule, not present before:** every AI-generated field carries a visible confidence mark and source reference as part of the layout — not a tooltip you have to go find. The PRD treats this as a safety requirement (Section on explainability), and it changes the dashboard component set materially (Section 6).

### Principles

1. The clinical-document metaphor still governs the dashboards — ruled rows, left alignment, no card grid.
2. The kiosk is one task, one screen, biggest available touch target, and language changes the script but never the interface's personality.
3. Urgency and department are two color systems that never overlap.
4. Nothing the AI produces is shown as plain fact — confidence and source are always attached.

---

## 3. Site architecture

```
Med-Drishti
├── Patient Kiosk
│   ├── Welcome
│   ├── Select language
│   ├── Identify  (existing patient lookup / new registration)
│   ├── Consent
│   ├── Select department  (incl. AYUSH)
│   ├── Clinical interview  (voice + touch, adaptive)
│   │   └── AYUSH history  (if AYUSH department selected)
│   ├── Upload documents  (camera / file)
│   ├── Review & confirm summary
│   └── Session complete  (secure reset)
├── Doctor dashboard
│   ├── Queue
│   ├── Patient case  (summary, history, meds, allergies, ROS, documents, timeline, red flags)
│   ├── Edit / verify
│   └── Case notes
├── Nurse / triage dashboard
│   ├── Active alerts
│   ├── Queue monitor
│   └── Acknowledge / escalate
└── Admin
    ├── Hospital admin  (throughput, kiosk utilization, department & language config)
    └── System admin  (users, roles, audit log, model & integration config)
```

---

## 4. Core flows

### 4.1 Full patient kiosk journey

```
Welcome
   │
Select language              (script switches everywhere below)
   │
Identify ── existing? ── retrieve record
   │             │
  new ──────► Register
   │
Consent            (read aloud, explicit confirm, timestamped)
   │
Select department ── AYUSH? ── AYUSH history branch (Section 5.7)
   │
Clinical interview      (adaptive: voice with visible transcript, or touch)
   │
Red-flag check ── flagged? ── Priority/Urgent screen (4.2) + nurse queue notified
   │
Upload documents ── quality check ── retake if poor
   │
OCR + entity extraction  (each entity shown with confidence)
   │
Review & confirm summary   ("You said... is this correct?")
   │
Session complete → doctor queue
```

### 4.2 Red-flag path

The one place the kiosk layout itself changes based on system state:

```
Rule engine flags the interview
 (deterministic rules — not an LLM decision, per PRD safety architecture)
      │
      ▼
┌──────────────────────────────────────┐
│  Screen changes immediately:          │
│  "Potential emergency symptoms        │
│   detected. Please alert clinical     │
│   staff immediately."                 │
│                                        │
│  – What this means, in plain words    │
│  – A member of staff has already      │
│    been notified — shown as fact      │
│  – Patient is guided to stay at the   │
│    kiosk or nearest desk              │
└──────────────────────────────────────┘
      │
      ▼
Nurse/triage dashboard receives the
alert at the top of the queue, with
the evidence that triggered it
```

The screen never states a diagnosis ("you may be having a heart attack") — only that specific symptoms were detected and staff have been alerted, matching the PRD's explicit safety language.

### 4.3 Doctor review

Queue → open case → history and prior documents load **above** the current complaint, since the doctor's first question is almost always "has this happened before" → verify or edit each AI-drafted field against its source → confirm → record moves toward FHIR/HIS/ABDM sync.

---

## 5. Page specifications

### 5.1 Welcome & language

Full-width, minimal text, large tap targets in each language's own script — not a dropdown, which asks a low-literacy user to read English to find their own language.

```
┌───────────────────────────────────┐
│                                     │
│   हिंदी      বাংলা      தமிழ்         │
│   मराठी      తెలుగు     ಕನ್ನಡ         │
│   മലയാളം    ગુજરાતી    ਪੰਜਾਬੀ       │
│              English               │
│                                     │
└───────────────────────────────────┘
```

### 5.2 Identify & register

Two large choices — "I've visited before" / "First time here" — not a form up front. New registration collects only what's required at this stage: name, age or date of birth, gender, department, one contact identifier. ABHA ID and prior hospital record ID are offered, not required.

### 5.3 Consent

Read aloud automatically in the selected language, plain-language summary above any formal text, one large confirm action. Withdrawal is possible later from the same dashboard the patient's data lives in, not buried in settings.

### 5.4 Clinical interview

One question, one screen, every question with a voice and a touch path:

```
┌───────────────────────────────────┐
│  What's troubling you today?       │
│                                     │
│  ( 🎙 Speak )      ( 👆 Tap )        │
│  ─────────────────────────────    │
│  [ active input renders here ]     │
│                                     │
│              [ Next ]              │
└───────────────────────────────────┘
```

Voice always shows a live transcript before moving on. Follow-up questions are chosen by the adaptive schema (onset → location → character → radiation → severity → associated symptoms), never a fixed script — but the *pattern* on screen is identical question to question, so the patient never has to re-learn the interface mid-interview. Critical answers get a confirm-back step: *"You said: 'chest pain for two hours.' Is this right?"* with Yes / Change.

### 5.5 Document upload

```
┌───────────────────────────────────┐
│  Show us your documents            │
│  ( 📷 Camera )   ( 📁 File )         │
│  ─────────────────────────────    │
│  [ preview ]                       │
│                                     │
│  Document quality looks low.       │
│  [ Retake ]   [ Use anyway ]       │
└───────────────────────────────────┘
```

After OCR, each extracted field is shown with its confidence and, on tap, its source:

```
Medication: Metformin 500 mg          ✓ 96%
Medication: Amlodipine 5 mg           ⚠ 62% — please verify
  Source: prescription_20260820.jpg, page 1
```

Low-confidence fields are visually distinct (amber tag) but never hidden or silently accepted.

### 5.6 Review & confirm

A plain-language read-back of the whole intake before it's sent to the doctor — the patient's last chance to correct anything, phrased as their own words, not the system's summary of them.

### 5.7 AYUSH history (conditional)

Only shown when an AYUSH department is selected. The Dashavidha Pariksha is a genuinely fixed ten-part sequence, so it's the one other place numbering is used:

```
1  Prakriti        6  Satmya
2  Vikriti          7  Sattva
3  Sara              8  Ahara Shakti
4  Samhanana        9  Vyayama Shakti
5  Pramana          10 Vaya
```

Each step follows the same one-question pattern as 5.4, tagged with the Ayush Sage indicator so it's visually clear this is a distinct clinical track, not a stray extra screen.

### 5.8 Doctor dashboard

```
┌───────────────────────────────────────────────┐
│  Rajesh Kumar · 54 · Token A-1024              │
├───────────────────────────────────────────────┤
│  Red flags: none                                │
├───────────────────────────────────────────────┤
│  Chief complaint                                │
│  Chest discomfort, 2 days                       │
├───────────────────────────────────────────────┤
│  History & prior documents                      │
│  ─ Hypertension, on Amlodipine 5 mg              │
│  ─ Bloodwork, Nov 2025                          │
├───────────────────────────────────────────────┤
│  Current interview transcript / entities        │
│  [ each field: value · confidence · source ]    │
│                                                  │
│  [ Edit ]   [ Verify ]   [ View documents ]     │
└───────────────────────────────────────────────┘
```

History sits above the current complaint, on purpose (Section 4.3).

### 5.9 Nurse / triage dashboard

Densest screen in the product — a ruled table, not cards, sorted by flag tier then wait time:

```
Flag       Patient       Waiting   Evidence
────────   ───────────   ───────   ──────────────────────
🔴 Urgent   R. Sharma      2 min    Chest pain + dyspnea
🟡 Priority M. Chatterjee  8 min    Fever, 3 days
   None     A. Banerjee   22 min    Refill request
[ Acknowledge ]  [ View case ]
```

### 5.10 Admin

Lighter surface, same ruled-row language: patients processed, completion rate, kiosk utilization, ASR/OCR success rate, department and language configuration. Not the design focus of this spec — kept consistent with the dashboard system rather than designed as its own thing.

---

## 6. Components

- **Flag chip** — filled, rounded (6px), plain-word label ("No flags," "Priority," "Urgent"), single slow pulse the moment it's first computed. Never shares a color with the Ayush tag.
- **Ayush tag** — sage, small, outline not filled — visually lighter-weight than a flag chip so it reads as *context*, not *status*.
- **Confidence mark** — a small ✓ or ⚠ beside any AI-extracted field, tappable to reveal source document, page, and confidence percentage. Present everywhere an AI-derived value appears; there is no version of this component that hides the mark.
- **Confirm-back** — "You said: [x]. Is this correct?" with Yes / Change. Used for every clinically important answer, not just the final summary.
- **Step rail** — a row of chart-tab-styled dots at the top of every kiosk screen, filled up to the current step. No numbers, no percentage — just position.
- **Record row** — the ruled-table pattern reused across doctor, nurse, and admin views. Never becomes a card.
- **Failure state** — plain and actionable: *"Voice isn't working right now — you can keep going by tapping."* AI failure never blocks the workflow; it degrades to the next available input mode.

---

## 7. Voice and content

- The interface never diagnoses. It reports what was detected and what happens next: "Potential emergency symptoms detected. Please alert clinical staff immediately," never "You are having a heart attack."
- When information wasn't provided, the system says so plainly rather than filling the gap — a missing field reads "Not provided" or "Unknown," never a guessed value.
- Buttons name the exact action: "Send to a nurse," "Confirm," "Retake" — never "Submit" or "Continue."
- Sentence case throughout. No tracked-out capitals, no eyebrow labels, no middle-dot metadata strings.

---

## 8. Motion

One deliberate cue per state change:

- Flag chip: a single slow pulse (~1.5s, twice) when first computed.
- Confidence mark: no animation — it should never draw attention away from the value it's qualifying.
- Step rail: the current step's dot fills smoothly on advance; nothing else on screen moves.

No scroll-triggered reveals, no hover effects on kiosk screens (there's no hover on a touch kiosk to begin with).

---

## 9. Accessibility, security, and responsiveness

- Kiosk base type size starts at 20–24px body / 32–40px for the current question, well above dashboard density (14–16px), because the two audiences have entirely different reading conditions.
- Chart Ink on Clinical Mist and white text on Pulse Teal / Alert Coral / Vitals Amber all clear WCAG AA; kiosk primary text targets AAA where the palette allows, given the elderly and low-vision patient base.
- Flag and confidence states are never color-only — both carry a text or symbol label.
- One task per kiosk screen, no navigation menu, no way to jump ahead of an unanswered required question.
- **Session cleanup is a design requirement, not an implementation detail.** On completion or timeout, the kiosk shows a short thank-you screen, then hard-resets to Welcome — no back-navigation into the previous patient's data, no cached transcript, no lingering identifier in view. This matters more here than almost anything else in the spec, since the device is shared.
- Dashboard layout collapses to a single column under 640px; the nurse queue table becomes a stacked ruled list on tablet width.

---

## 10. Tech stack (per PRD)

This replaces the earlier Flask/SQLite note — the PRD specifies a different stack, and the component system above maps onto it directly:

- **Frontend:** Next.js + React + TypeScript, styled with Tailwind CSS. The six color tokens and both type systems live in `tailwind.config` as design tokens rather than scattered literals:

  ```js
  // tailwind.config.js (excerpt)
  colors: {
    mist:  '#EDF1EE',
    ink:   '#16241F',
    teal:  '#1F6F63',
    amber: '#D89A3D',
    coral: '#C4432E',
    sage:  '#6E8B74',
  },
  fontFamily: {
    kiosk:     ['Noto Sans', 'sans-serif'],      // script variant swapped at runtime
    display:   ['Fraunces', 'serif'],
    dashboard: ['"IBM Plex Sans"', 'sans-serif'],
  }
  ```

  The kiosk and dashboard are reasonably built as two route groups in the same Next.js app, sharing the token set but not the component library — a kiosk "flag chip" and a dashboard "flag chip" render the same state differently on purpose (Section 6).

- **Backend:** FastAPI (Python) with Pydantic models matching the clinical schema, SQLAlchemy over PostgreSQL for patients/sessions/history/entities/consent/audit, Redis for active kiosk session state.
- **Documents:** object storage (MinIO for development, S3-compatible in production) — the confidence-mark component's "source" link resolves to a signed URL here.
- **AI layer:** kept outside the frontend's concern entirely — ASR, OCR, and entity extraction are backend services the UI only ever sees as a value + confidence + source triple, which is exactly what Section 6's confidence mark is built to display regardless of which model produced it.
