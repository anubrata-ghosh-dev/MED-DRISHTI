"""
Clinical Intelligence Service for Med-Drishti.
Provides advanced clinical analysis including entity normalization,
abnormal value detection, drug-drug interaction checking, and
intake completeness verification.
"""

import re
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from . import models

logger = logging.getLogger(__name__)


class ClinicalIntelligenceService:
    """
    Provides advanced clinical analysis including normalization,
    abnormal value detection, and drug-interaction flagging.
    """

    # Comprehensive reference ranges for common Indian lab tests
    REFERENCE_RANGES = {
        # Diabetes
        "hba1c": {"min": 4.0, "max": 5.6, "unit": "%", "critical_high": 9.0, "critical_low": None},
        "glucose": {"min": 70, "max": 100, "unit": "mg/dL", "critical_high": 400, "critical_low": 40},
        "fasting glucose": {"min": 70, "max": 100, "unit": "mg/dL", "critical_high": 400, "critical_low": 40},
        "ppbs": {"min": 70, "max": 140, "unit": "mg/dL", "critical_high": 400, "critical_low": 40},
        # CBC
        "hemoglobin": {"min": 12.0, "max": 17.5, "unit": "g/dL", "critical_high": 20.0, "critical_low": 7.0},
        "hb": {"min": 12.0, "max": 17.5, "unit": "g/dL", "critical_high": 20.0, "critical_low": 7.0},
        "wbc": {"min": 4000, "max": 11000, "unit": "cells/mcL", "critical_high": 30000, "critical_low": 2000},
        "platelets": {"min": 150000, "max": 400000, "unit": "cells/mcL", "critical_high": 1000000, "critical_low": 50000},
        "rbc": {"min": 4.5, "max": 5.5, "unit": "million/mcL", "critical_high": None, "critical_low": 3.0},
        # Kidney Function
        "creatinine": {"min": 0.6, "max": 1.2, "unit": "mg/dL", "critical_high": 4.0, "critical_low": None},
        "bun": {"min": 7, "max": 20, "unit": "mg/dL", "critical_high": 50, "critical_low": None},
        "egfr": {"min": 90, "max": 120, "unit": "mL/min", "critical_high": None, "critical_low": 15},
        # Liver Function
        "sgpt": {"min": 7, "max": 56, "unit": "U/L", "critical_high": 200, "critical_low": None},
        "alt": {"min": 7, "max": 56, "unit": "U/L", "critical_high": 200, "critical_low": None},
        "sgot": {"min": 10, "max": 40, "unit": "U/L", "critical_high": 200, "critical_low": None},
        "ast": {"min": 10, "max": 40, "unit": "U/L", "critical_high": 200, "critical_low": None},
        "bilirubin": {"min": 0.1, "max": 1.2, "unit": "mg/dL", "critical_high": 5.0, "critical_low": None},
        "albumin": {"min": 3.5, "max": 5.0, "unit": "g/dL", "critical_high": None, "critical_low": 2.0},
        # Lipid Profile
        "total cholesterol": {"min": 0, "max": 200, "unit": "mg/dL", "critical_high": 300, "critical_low": None},
        "ldl": {"min": 0, "max": 100, "unit": "mg/dL", "critical_high": 190, "critical_low": None},
        "hdl": {"min": 40, "max": 200, "unit": "mg/dL", "critical_high": None, "critical_low": 20},
        "triglycerides": {"min": 0, "max": 150, "unit": "mg/dL", "critical_high": 500, "critical_low": None},
        # Thyroid
        "tsh": {"min": 0.4, "max": 4.0, "unit": "mIU/L", "critical_high": 10.0, "critical_low": 0.1},
        "t3": {"min": 80, "max": 200, "unit": "ng/dL", "critical_high": None, "critical_low": None},
        "t4": {"min": 5.0, "max": 12.0, "unit": "mcg/dL", "critical_high": None, "critical_low": None},
        # Vitals
        "blood_pressure_systolic": {"min": 90, "max": 120, "unit": "mmHg", "critical_high": 180, "critical_low": 70},
        "blood_pressure_diastolic": {"min": 60, "max": 80, "unit": "mmHg", "critical_high": 120, "critical_low": 40},
        "spo2": {"min": 95, "max": 100, "unit": "%", "critical_high": None, "critical_low": 88},
        "pulse": {"min": 60, "max": 100, "unit": "bpm", "critical_high": 150, "critical_low": 40},
        "heart rate": {"min": 60, "max": 100, "unit": "bpm", "critical_high": 150, "critical_low": 40},
        # Urine
        "urine ph": {"min": 4.5, "max": 8.0, "unit": "", "critical_high": None, "critical_low": None},
        # Others
        "uric acid": {"min": 3.5, "max": 7.2, "unit": "mg/dL", "critical_high": 12.0, "critical_low": None},
        "esr": {"min": 0, "max": 20, "unit": "mm/hr", "critical_high": 100, "critical_low": None},
        "crp": {"min": 0, "max": 10, "unit": "mg/L", "critical_high": 100, "critical_low": None},
    }

    # Comprehensive drug-drug interaction database
    DRUG_INTERACTIONS = {
        ("amlodipine", "lisinopril"): {
            "severity": "WARNING",
            "clinical_reasoning": "Combined use may cause excessive hypotension, especially on initiation.",
            "recommendation": "Monitor blood pressure closely. Consider dose adjustment.",
        },
        ("metformin", "contrast_dye"): {
            "severity": "CRITICAL",
            "clinical_reasoning": "Risk of lactic acidosis. Metformin should be held before and after contrast administration.",
            "recommendation": "Hold metformin 48 hours before and after contrast procedures.",
        },
        ("warfarin", "aspirin"): {
            "severity": "CRITICAL",
            "clinical_reasoning": "Significantly increased risk of bleeding when anticoagulant and antiplatelet are combined.",
            "recommendation": "Avoid combination unless specifically indicated. Monitor INR closely.",
        },
        ("warfarin", "ibuprofen"): {
            "severity": "CRITICAL",
            "clinical_reasoning": "NSAIDs increase anticoagulant effect and GI bleeding risk.",
            "recommendation": "Avoid NSAIDs with warfarin. Use acetaminophen for pain.",
        },
        ("enalapril", "potassium"): {
            "severity": "WARNING",
            "clinical_reasoning": "ACE inhibitors increase potassium retention; supplements may cause hyperkalemia.",
            "recommendation": "Monitor serum potassium levels regularly.",
        },
        ("lisinopril", "potassium"): {
            "severity": "WARNING",
            "clinical_reasoning": "ACE inhibitors increase potassium retention; supplements may cause hyperkalemia.",
            "recommendation": "Monitor serum potassium levels regularly.",
        },
        ("fluoxetine", "tramadol"): {
            "severity": "CRITICAL",
            "clinical_reasoning": "Risk of serotonin syndrome with SSRI + serotonergic opioid combination.",
            "recommendation": "Avoid combination. Use alternative analgesic.",
        },
        ("sertraline", "tramadol"): {
            "severity": "CRITICAL",
            "clinical_reasoning": "Risk of serotonin syndrome.",
            "recommendation": "Avoid combination. Use alternative analgesic.",
        },
        ("metformin", "alcohol"): {
            "severity": "WARNING",
            "clinical_reasoning": "Alcohol increases risk of lactic acidosis with metformin.",
            "recommendation": "Advise patient to limit alcohol consumption.",
        },
        ("atorvastatin", "gemfibrozil"): {
            "severity": "WARNING",
            "clinical_reasoning": "Increased risk of rhabdomyolysis with statin-fibrate combination.",
            "recommendation": "Use fenofibrate instead of gemfibrozil if combination needed.",
        },
        ("rosuvastatin", "gemfibrozil"): {
            "severity": "WARNING",
            "clinical_reasoning": "Increased risk of rhabdomyolysis.",
            "recommendation": "Consider alternative or monitor CK levels.",
        },
        ("ciprofloxacin", "theophylline"): {
            "severity": "WARNING",
            "clinical_reasoning": "Ciprofloxacin inhibits theophylline metabolism, increasing toxicity risk.",
            "recommendation": "Monitor theophylline levels. Consider alternative antibiotic.",
        },
        ("clopidogrel", "omeprazole"): {
            "severity": "WARNING",
            "clinical_reasoning": "Omeprazole reduces clopidogrel's antiplatelet effect via CYP2C19 inhibition.",
            "recommendation": "Use pantoprazole instead of omeprazole.",
        },
        ("digoxin", "amiodarone"): {
            "severity": "CRITICAL",
            "clinical_reasoning": "Amiodarone increases digoxin levels by 70-100%, risking toxicity.",
            "recommendation": "Reduce digoxin dose by 50% when starting amiodarone. Monitor levels.",
        },
        ("sildenafil", "nitroglycerin"): {
            "severity": "CRITICAL",
            "clinical_reasoning": "Life-threatening hypotension. PDE5 inhibitors and nitrates are contraindicated together.",
            "recommendation": "Never combine. Wait 24-48 hours between use.",
        },
        ("lithium", "ibuprofen"): {
            "severity": "WARNING",
            "clinical_reasoning": "NSAIDs reduce lithium clearance, increasing blood levels and toxicity risk.",
            "recommendation": "Avoid NSAIDs. Use acetaminophen. Monitor lithium levels.",
        },
        ("methotrexate", "trimethoprim"): {
            "severity": "CRITICAL",
            "clinical_reasoning": "Both are folate antagonists; combination causes severe pancytopenia.",
            "recommendation": "Avoid combination. Use alternative antibiotic.",
        },
        ("insulin", "metformin"): {
            "severity": "WARNING",
            "clinical_reasoning": "Increased risk of hypoglycemia when combining insulin with oral hypoglycemics.",
            "recommendation": "Monitor blood glucose frequently. Adjust doses as needed.",
        },
        ("amlodipine", "simvastatin"): {
            "severity": "WARNING",
            "clinical_reasoning": "Amlodipine increases simvastatin exposure; max simvastatin dose is 20mg with amlodipine.",
            "recommendation": "Limit simvastatin to 20mg/day or switch to atorvastatin.",
        },
        ("spironolactone", "potassium"): {
            "severity": "CRITICAL",
            "clinical_reasoning": "Spironolactone is potassium-sparing; supplements cause dangerous hyperkalemia.",
            "recommendation": "Avoid potassium supplements. Monitor serum potassium.",
        },
    }

    @staticmethod
    def normalize_entity(entity: models.ClinicalEntity) -> Optional[str]:
        """Normalizes raw text into a standard medical term."""
        val = entity.value.lower()
        normalizations = {
            "diabetes": "Type 2 Diabetes Mellitus",
            "metformin": "Type 2 Diabetes Mellitus",
            "hypertension": "Essential Hypertension",
            "high bp": "Essential Hypertension",
            "asthma": "Bronchial Asthma",
            "thyroid": "Thyroid Disorder",
            "cholesterol": "Dyslipidemia",
            "heart disease": "Coronary Artery Disease",
            "kidney disease": "Chronic Kidney Disease",
            "anemia": "Iron Deficiency Anemia",
        }
        for keyword, normalized in normalizations.items():
            if keyword in val:
                return normalized
        return None

    @staticmethod
    def _parse_numeric_value(value_str: str) -> Optional[float]:
        """
        Safely parse a numeric value from a string.
        Handles composite values like '120/80' by extracting the first number.
        """
        if not value_str:
            return None
        # Try direct float conversion first
        try:
            return float(value_str.strip())
        except ValueError:
            pass
        # Extract first number from string
        match = re.search(r'(\d+\.?\d*)', value_str)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                pass
        return None

    @staticmethod
    def detect_abnormals(entities: List[models.ClinicalEntity]) -> List[Dict[str, Any]]:
        """
        Flags values outside standard reference ranges.
        Returns structured findings with status: NORMAL, LOW, HIGH, or CRITICAL.
        """
        abnormals = []
        for ent in entities:
            for ref_key, range_val in ClinicalIntelligenceService.REFERENCE_RANGES.items():
                if ref_key in ent.entity_type.lower() or ref_key in ent.value.lower():
                    numeric_val = ClinicalIntelligenceService._parse_numeric_value(ent.value)
                    if numeric_val is None:
                        continue

                    status = "NORMAL"
                    if range_val.get("critical_low") and numeric_val <= range_val["critical_low"]:
                        status = "CRITICAL"
                    elif range_val.get("critical_high") and numeric_val >= range_val["critical_high"]:
                        status = "CRITICAL"
                    elif numeric_val < range_val["min"]:
                        status = "LOW"
                    elif numeric_val > range_val["max"]:
                        status = "HIGH"

                    if status != "NORMAL":
                        abnormals.append({
                            "entity_id": ent.id,
                            "test": ref_key,
                            "value": ent.value,
                            "numeric_value": numeric_val,
                            "unit": range_val["unit"],
                            "reference_range": f"{range_val['min']}-{range_val['max']} {range_val['unit']}",
                            "status": status,
                        })
                    break  # Matched a reference, don't check more
        return abnormals

    @staticmethod
    def check_interactions(medications: List[str]) -> List[Dict[str, Any]]:
        """
        Checks for potential drug-drug interactions.
        Returns list of interaction dicts with severity, reasoning, and recommendation.
        """
        interactions = []
        meds_lower = [m.lower().strip() for m in medications]

        for (drug_a, drug_b), details in ClinicalIntelligenceService.DRUG_INTERACTIONS.items():
            a_found = any(drug_a in med for med in meds_lower)
            b_found = any(drug_b in med for med in meds_lower)
            if a_found and b_found:
                interactions.append({
                    "drug_a": drug_a,
                    "drug_b": drug_b,
                    "severity": details["severity"],
                    "clinical_reasoning": details["clinical_reasoning"],
                    "recommendation": details["recommendation"],
                    "display": f"⚠️ {details['severity']}: {drug_a.title()} + {drug_b.title()} — {details['clinical_reasoning']}",
                })

        return interactions

    @staticmethod
    def detect_missing_info(session: models.ClinicalSession) -> List[str]:
        """Identifies critical missing fields based on the required clinical schema."""
        missing = []

        # Check structured history tables
        if not session.chief_complaints:
            missing.append("Chief Complaint")
        if not session.hpi:
            missing.append("History of Present Illness (HPI)")
        if not session.medication_histories:
            missing.append("Medication History")
        if not session.allergy_histories:
            missing.append("Allergy History")

        # Also check clinical entities as fallback
        if missing:
            entity_types = {e.entity_type for e in session.clinical_entities}
            if "Chief Complaint" in entity_types and "Chief Complaint" in missing:
                missing.remove("Chief Complaint")
            if "HPI" in entity_types and "History of Present Illness (HPI)" in missing:
                missing.remove("History of Present Illness (HPI)")
            if "Medication" in entity_types and "Medication History" in missing:
                missing.remove("Medication History")
            if "Allergy" in entity_types and "Allergy History" in missing:
                missing.remove("Allergy History")

        return missing
