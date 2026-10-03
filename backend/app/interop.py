import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from . import models

class FhirMapper:
    """
    Transforms the internal Med-Drishti Structured Case Model
    into HL7 FHIR (Fast Healthcare Interoperability Resources) format.
    """

    @staticmethod
    def map_patient(patient: models.Patient) -> Dict[str, Any]:
        return {
            "resourceType": "Patient",
            "id": str(patient.id),
            "identifier": [
                {"system": "http://abha.gov.in", "value": patient.abha_id} if patient.abha_id else {}
            ],
            "name": [{"text": patient.name}],
            "gender": patient.gender.lower() if patient.gender else "unknown",
            "birthDate": patient.date_of_birth,
        }

    @staticmethod
    def map_encounter(session: models.ClinicalSession) -> Dict[str, Any]:
        return {
            "resourceType": "Encounter",
            "id": str(session.id),
            "status": "finished" if session.status == "completed" else "in-progress",
            "class": {"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "AMB"}, # Ambulatory
            "subject": {"reference": f"Patient/{session.patient_id}"},
            "period": {
                "start": session.started_at.isoformat() if session.started_at else None,
                "end": session.completed_at.isoformat() if session.completed_at else None,
            },
        }

    @staticmethod
    def map_clinical_entity(entity: models.ClinicalEntity, session_id: int) -> Dict[str, Any]:
        if "Medication" in entity.entity_type:
            return {
                "resourceType": "MedicationStatement",
                "status": "active",
                "medicationCodeableConcept": {"text": entity.value},
                "subject": {"reference": f"Patient/{entity.session.patient_id}"},
                "encounter": {"reference": f"Encounter/{session_id}"},
                "effectivePeriod": {"start": datetime.utcnow().isoformat()}
            }

        if "Allergy" in entity.entity_type:
            return {
                "resourceType": "AllergyIntolerance",
                "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", "code": "active"}]},
                "verificationStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/verification-status", "code": "unconfirmed"}]},
                "code": {"text": entity.value},
                "patient": {"reference": f"Patient/{entity.session.patient_id}"},
            }

        return {
            "resourceType": "Observation",
            "status": "final",
            "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
            "code": {"text": entity.entity_type},
            "subject": {"reference": f"Patient/{entity.session.patient_id}"},
            "encounter": {"reference": f"Encounter/{session_id}"},
            "effectiveDateTime": datetime.utcnow().isoformat(),
            "valueString": entity.value,
            "interpretation": [{"text": "AI-Extracted" if not entity.verified else "Physician-Verified"}]
        }

    @classmethod
    def generate_bundle(cls, session: models.ClinicalSession) -> Dict[str, Any]:
        bundle = {
            "resourceType": "Bundle",
            "type": "collection",
            "timestamp": datetime.utcnow().isoformat(),
            "entry": []
        }
        bundle["entry"].append({"resource": cls.map_patient(session.patient)})
        bundle["entry"].append({"resource": cls.map_encounter(session)})
        for entity in session.clinical_entities:
            bundle["entry"].append({"resource": cls.map_clinical_entity(entity, session.id)})
        return bundle

class AbdmProvider(ABC):
    """Interface for ABDM (Ayushman Bharat Digital Mission) services."""
    @abstractmethod
    def resolve_abha(self, abha_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def create_consent(self, patient_id: int, requester_id: str) -> Optional[str]:
        pass

    @abstractmethod
    def share_record(self, consent_id: str, bundle: Dict[str, Any]) -> bool:
        pass

class MockAbdmProvider(AbdmProvider):
    """Mock implementation for development and hackathon demo."""
    def resolve_abha(self, abha_id: str) -> Optional[Dict[str, Any]]:
        return {
            "status": "success",
            "patient_name": "Demo Patient",
            "abha_verified": True,
            "linked_id": "ABHA12345678"
        }

    def create_consent(self, patient_id: int, requester_id: str) -> Optional[str]:
        return f"CONSENT_{uuid.uuid4().hex[:8]}"

    def share_record(self, consent_id: str, bundle: Dict[str, Any]) -> bool:
        return True
