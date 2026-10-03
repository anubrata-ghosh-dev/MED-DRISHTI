# Security & Compliance Guide — Med-Drishti

**Document:** System Security Architecture & Production Hardening
**Target:** Med-Drishti Outpatient Intake Kiosk & Physician Dashboard
**Compliance Standards:** Digital Personal Data Protection Act (DPDPA 2023), ABDM Security Guidelines, DISHA Principles
**Status:** MVP Implemented; Production Hardening Specified

---

## 1. Current Security Controls

Med-Drishti implements core security controls across authentication, authorization, audit trails, and input sanitization:

### 1.1 Token-Based Authentication (JWT)
- **Algorithm:** HMAC-SHA256 (`HS256`) via `python-jose`.
- **Expiration:** Default access token expiry of 30 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES = 30`).
- **Token Claims:** Minimal essential payload containing subject (`sub`: user ID) and user email. Tokens never store clinical health records or passwords.
- **Header Format:** Standard `Authorization: Bearer <token>`.

### 1.2 Cryptographic Password Hashing
- Passwords are never stored in plaintext.
- Hashes are generated and verified using `passlib` with `bcrypt` algorithms using adaptive salt work factors (default 12 rounds).

### 1.3 Role-Based Access Control (RBAC)
FastAPI dependency injection enforces role segregation across all routes:

```python
def require_role(allowed_roles: List[models.RoleEnum]):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions for this action")
        return current_user
    return role_checker
```

- **`PATIENT`**: Isolated strictly to their own intake session and consent records. Attempting to query another patient's ID results in `403 Forbidden`.
- **`DOCTOR`**: Authorized to query all clinical queue items, view patient summaries, inspect uploaded records, and execute verification sign-offs.
- **`NURSE`**: Authorized to view and acknowledge red-flag alerts in triage.
- **`ADMIN`**: Authorized to manage system configurations, review audit trails, and oversee user accounts.

### 1.4 Comprehensive Audit Trail (`audit_logs`)
Every clinical verification event and access change is recorded in the `audit_logs` table with:
- Target patient ID
- Resource type and resource ID
- Performing user ID
- UTC timestamp
- Descriptive notes
- `before_state` and `after_state` snapshots for change forensics.

### 1.5 Kiosk Terminal Privacy & Auto-Reset
Because Med-Drishti operates in public outpatient hospital kiosks, risk of consecutive patients viewing prior personal health data is high:
- **Auto-Reset Countdown:** Upon completing the intake flow (`/done`), a visual countdown timer initiates.
- **Client Storage Purge:** The browser automatically clears `localStorage`, `sessionStorage`, patient tokens, and active session states upon countdown completion or manual reset.
- **Redirect:** The browser returns to the clean welcome screen (`/`) ready for the next patient.

### 1.6 Strict Input Validation
- All inbound JSON payloads and multipart form parameters are parsed and validated via **Pydantic** models (`backend/app/schemas.py`).
- Automatic rejection (`422 Unprocessable Entity`) of malformed strings, out-of-spec enums, and unexpected data fields, preventing injection attacks.

---

## 2. Vulnerability Assessment & Technical Debt

| Item | Current Status | Risk Level | Mitigation Required |
|---|---|---|---|
| **CORS Policy** | `allow_origins=["*"]` | **HIGH** | Restrict to explicit kiosk and hospital subdomains |
| **Rate Limiting** | None enabled | **MEDIUM** | Add `slowapi` rate limits on auth and voice routes |
| **Transport Layer** | Plain HTTP (Local Dev) | **CRITICAL** | Mandate TLS 1.3 termination in production |
| **Database Engine** | SQLite (single file) | **HIGH** | Migrate to PostgreSQL with encrypted storage |
| **File Storage** | Plain local filesystem | **HIGH** | Encrypt at rest or migrate to S3 with private ACLs |
| **Secrets Storage** | Plaintext `.env` | **MEDIUM** | Inject secrets via Vault / AWS Secrets Manager |

---

## 3. Production Hardening Roadmap

### 3.1 HTTPS / TLS Termination
In production, Med-Drishti must never be exposed directly over unencrypted HTTP:
- Deploy an edge reverse proxy (Nginx, Traefik, or Cloudflare).
- Enforce **TLS 1.3** with strong cipher suites (`ECDHE-ECDSA-AES256-GCM-SHA384`).
- Enable HTTP Strict Transport Security (`HSTS`):
  ```nginx
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
  ```

### 3.2 Tightening CORS Configuration
Update `backend/app/main.py`:
```python
# Production CORS Configuration
ALLOWED_ORIGINS = [
    "https://kiosk.hospital.gov.in",
    "https://doctor.hospital.gov.in"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

### 3.3 Rate Limiting on Public Endpoints
Protect against brute-force login attempts and denial-of-service on voice/OCR endpoints using `slowapi`:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/auth/login")
@limiter.limit("5/minute")
def login(...):
    ...
```

### 3.4 PostgreSQL & Database Hardening
- Transition from SQLite to PostgreSQL.
- Enable encrypted connections: `sslmode=verify-full`.
- Use a dedicated, unprivileged database role (`med_app_user`) restricted strictly to the `med_drishti` schema.
- Encrypt database storage volumes with AES-256 (LUKS or AWS EBS encryption).

### 3.5 Secure File Storage at Rest
Medical documents must not remain accessible via guessable URLs or open directories:
- Encrypt uploaded files before writing to disk using AES-256-GCM, or stream directly into private S3 buckets.
- Serve documents exclusively through temporary, signed URLs (presigned S3 URLs valid for 5 minutes) or authenticated streaming endpoints (`/api/v1/medical-records/{id}/file`).
