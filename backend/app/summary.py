"""
Clinical Summary Generator Engine for Med-Drishti.
Synthesizes structured history, voice intake, and OCR extracted entities into a unified summary.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime


def generate_clinical_summary(
    patient: Dict[str, Any],
    history: Optional[Dict[str, Any]],
    documents: List[Dict[str, Any]],
    red_flags: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Synthesizes clinical data for a patient session.
    """
    # 1. Chief Complaint & HPI
    chief_complaint = history.get("chief_complaint") if history else "No chief complaint recorded"
    hpi = history.get("history_of_present_illness") if history else "No present illness history recorded"

    # 2. Extract & Group OCR Entities
    extracted_medications = []
    extracted_vitals = []
    extracted_dates = []

    for doc in documents:
        doc_id = doc.get("id")
        doc_name = doc.get("file_name", "Document")
        for entity in doc.get("extracted_entities", []):
            item = {
                "id": entity.get("id"),
                "document_id": doc_id,
                "document_name": doc_name,
                "type": entity.get("entity_type"),
                "value": entity.get("entity_value"),
                "confidence": entity.get("confidence", 0.0),
                "low_confidence": entity.get("confidence", 0.0) < 0.70,
                "source_text": entity.get("source_text")
            }
            if entity.get("entity_type") == "medication":
                extracted_medications.append(item)
            elif entity.get("entity_type") in ["blood_pressure", "spo2", "hba1c", "glucose", "pulse"]:
                extracted_vitals.append(item)
            elif entity.get("entity_type") == "date":
                extracted_dates.append(item)

    # 3. Combine medications (intake + OCR)
    patient_meds = history.get("medications") if history else None
    
    # 4. Synthesize Clinical SOAP Summary structure
    summary = {
        "generated_at": datetime.utcnow().isoformat(),
        "patient": {
            "id": patient.get("id"),
            "name": patient.get("name"),
            "gender": patient.get("gender"),
            "dob": patient.get("date_of_birth"),
            "language": patient.get("preferred_language")
        },
        "subjective": {
            "chief_complaint": chief_complaint,
            "hpi": hpi,
            "patient_reported_medications": patient_meds,
            "patient_reported_allergies": history.get("allergies") if history else None
        },
        "objective": {
            "vitals_and_labs": extracted_vitals,
            "ocr_extracted_medications": extracted_medications,
            "extracted_dates": extracted_dates,
            "total_documents_analyzed": len(documents)
        },
        "assessment_triage": {
            "red_flags_count": len(red_flags),
            "red_flags": red_flags,
            "triage_status": "CRITICAL" if any(rf.get("severity") == "critical" for rf in red_flags)
                             else ("HIGH" if any(rf.get("severity") == "high" for rf in red_flags) else "STABLE")
        }
    }

    return summary
