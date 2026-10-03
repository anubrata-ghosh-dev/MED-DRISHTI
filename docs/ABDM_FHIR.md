# ABDM & FHIR Interoperability Guide — Med-Drishti

**Healthcare Data Standard:** HL7 FHIR Release 4 (R4)
**National Integration:** Ayushman Bharat Digital Mission (ABDM)
**File Reference:** `backend/app/interop.py`
**Status:** Canonical FHIR R4 Mapper Complete; ABDM Mock Adapter Implemented

---

## 1. Overview

Interoperability with existing Hospital Information Systems (HIS) and national digital health infrastructure is a primary mandate of the SIH26047 specification.

Med-Drishti implements a two-tier interoperability engine:
1. **HL7 FHIR R4 Bundle Transformer (`FhirMapper`):** Translates internal structured intake sessions into standard, internationally compliant FHIR R4 JSON bundles.
2. **ABDM Gateway Adapter (`AbdmProvider`):** Handles national health identity (ABHA) resolution, patient consent artifact generation, and health record exchange.

---

## 2. FHIR R4 Resource Mapping

Med-Drishti maps each completed clinical encounter into an HL7 FHIR R4 `collection` Bundle:

```text
Bundle (type: collection)
  ├── Patient (demographics, ABHA identifier)
  ├── Encounter (session timing, status, ambulatory class)
  ├── Observation (symptoms, vital signs, physical findings)
  ├── MedicationStatement (prescriptions, active drugs, dosages)
  └── AllergyIntolerance (substances, clinical status, allergies)
```

### 2.1 Resource Schemas

#### A. `Patient`
```json
{
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
```

#### B. `Encounter`
```json
{
  "resourceType": "Encounter",
  "id": "10",
  "status": "finished",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB"
  },
  "subject": {
    "reference": "Patient/1"
  },
  "period": {
    "start": "2026-09-20T12:15:00",
    "end": "2026-09-20T12:30:00"
  }
}
```

#### C. `MedicationStatement`
```json
{
  "resourceType": "MedicationStatement",
  "status": "active",
  "medicationCodeableConcept": {
    "text": "Amlodipine 5mg"
  },
  "subject": {
    "reference": "Patient/1"
  },
  "encounter": {
    "reference": "Encounter/10"
  },
  "effectivePeriod": {
    "start": "2026-09-20T12:20:00"
  }
}
```

#### D. `AllergyIntolerance`
```json
{
  "resourceType": "AllergyIntolerance",
  "clinicalStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
        "code": "active"
      }
    ]
  },
  "verificationStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/verification-status",
        "code": "unconfirmed"
      }
    ]
  },
  "code": {
    "text": "Penicillin"
  },
  "patient": {
    "reference": "Patient/1"
  }
}
```

#### E. `Observation`
```json
{
  "resourceType": "Observation",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "vital-signs"
        }
      ]
    }
  ],
  "code": {
    "text": "Chief Complaint"
  },
  "subject": {
    "reference": "Patient/1"
  },
  "encounter": {
    "reference": "Encounter/10"
  },
  "valueString": "Acute crushing chest pain",
  "interpretation": [
    {
      "text": "Physician-Verified"
    }
  ]
}
```

---

## 3. ABDM Provider Interface & Current Mock

The ABDM adapter interface is specified in `backend/app/interop.py`:

```python
class AbdmProvider(ABC):
    @abstractmethod
    def resolve_abha(self, abha_id: str) -> Optional[Dict[str, Any]]:
        """Verifies ABHA address or number against national registry."""
        pass

    @abstractmethod
    def create_consent(self, patient_id: int, requester_id: str) -> Optional[str]:
        """Creates a digital consent artifact."""
        pass

    @abstractmethod
    def share_record(self, consent_id: str, bundle: Dict[str, Any]) -> bool:
        """Pushes encrypted FHIR bundle to the health information exchange."""
        pass
```

### `MockAbdmProvider` Implementation
The codebase includes `MockAbdmProvider`, which simulates successful ABDM operations for local evaluation, UI walkthroughs, and unit testing without connecting to live government gateways.

---

## 4. Connecting the Real ABDM Sandbox

To transition from `MockAbdmProvider` to the official Government of India ABDM Sandbox:

### Phase 1: National Health Authority (NHA) Registration
1. Register the hospital/kiosk entity on the [ABDM Sandbox Portal](https://sandbox.abdm.gov.in/).
2. Obtain your **Client ID** and **Client Secret**.
3. Register your bridge gateway callback URL.

### Phase 2: Milestone Implementation

#### Milestone 1 (M1): ABHA Creation & Verification
Implement Aadhaar/Mobile OTP authentication endpoints:
- `POST https://healthidsbx.abdm.gov.in/api/v1/registration/aadhaar/generateOtp`
- `POST https://healthidsbx.abdm.gov.in/api/v1/registration/aadhaar/verifyOTP`
- Cache the resulting `X-Token` and update `patient.abha_id` with the authenticated 14-digit number.

#### Milestone 2 (M2): Health Information Provider (HIP)
Enable the hospital to share records created at the Med-Drishti kiosk:
1. **Care Context Discovery:** Implement webhook `/v0.5/care-contexts/discover` to let patients discover their kiosk intake records by mobile number or ABHA.
2. **Account Linking:** Implement `/v0.5/links/link/init` and `/v0.5/links/link/confirm` with SMS OTP.
3. Link the encounter `session.id` as the ABDM `careContextReference`.

#### Milestone 3 (M3): Health Information User (HIU) & Consent Transfer
1. **Consent Flow:** Handle consent notifications via `/v0.5/consents/hip/notify`.
2. **Data Request:** Listen for `/v0.5/health-information/hip/request`.
3. **Data Encryption (FIDELIS):** ABDM mandates end-to-end data encryption using:
   - **Key Exchange:** ECDH over Curve25519.
   - **Encryption:** AES-GCM 128/256-bit with random IV.
4. **Data Push:** Push the encrypted payload containing the `FhirMapper.generate_bundle(session)` bundle to the requester's callback endpoint.

---

## 5. Verification Command

Verify the FHIR R4 Bundle generation for any session via the API:

```bash
curl -s http://localhost:8000/api/v1/fhir/1 | python3 -m json.tool
```
