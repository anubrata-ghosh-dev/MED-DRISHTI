"""
Med-Drishti Database Seed Script.
Populates initial users, demo patients, clinical sessions, mock OCR documents, and red-flag alerts.
"""

import sys
import os
from datetime import datetime, timedelta

# Ensure parent directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from app import models, auth


def seed_data():
    """Seed database with realistic demo data for testing and walkthroughs."""
    print("Recreating database tables...")
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # 1. Seed Users
        print("Seeding default users...")
        kiosk_user = db.query(models.User).filter(models.User.email == "kiosk@meddrishti.in").first()
        if not kiosk_user:
            kiosk_user = models.User(
                email="kiosk@meddrishti.in",
                hashed_password=auth.hash_password("kiosk_dev_password"),
                full_name="Hospital Intake Kiosk #1",
                role=models.RoleEnum.PATIENT
            )
            db.add(kiosk_user)

        doctor_user = db.query(models.User).filter(models.User.email == "dr.sharma@meddrishti.in").first()
        if not doctor_user:
            doctor_user = models.User(
                email="dr.sharma@meddrishti.in",
                hashed_password=auth.hash_password("doctor123"),
                full_name="Dr. Vikram Sharma, MD",
                role=models.RoleEnum.DOCTOR
            )
            db.add(doctor_user)

        nurse_user = db.query(models.User).filter(models.User.email == "nurse.priya@meddrishti.in").first()
        if not nurse_user:
            nurse_user = models.User(
                email="nurse.priya@meddrishti.in",
                hashed_password=auth.hash_password("nurse123"),
                full_name="Nurse Priya Singh",
                role=models.RoleEnum.NURSE
            )
            db.add(nurse_user)

        db.commit()

        # 2. Seed Patients
        print("Seeding demo patients...")
        patient1 = models.Patient(
            name="Rahul Sharma",
            date_of_birth="1985-06-15",
            gender="male",
            phone="9876543210",
            preferred_language="English",
            abha_id="12-3456-7890-1234"
        )
        patient2 = models.Patient(
            name="Ananya Roy",
            date_of_birth="1992-11-20",
            gender="female",
            phone="9812345678",
            preferred_language="Hindi",
            abha_id="98-7654-3210-4321"
        )
        patient3 = models.Patient(
            name="Suresh Kumar",
            date_of_birth="1968-03-08",
            gender="male",
            phone="9988776655",
            preferred_language="English",
            abha_id="55-4433-2211-9988"
        )

        db.add_all([patient1, patient2, patient3])
        db.commit()

        # 3. Seed Clinical Sessions
        print("Seeding clinical sessions...")
        session1 = models.ClinicalSession(
            patient_id=patient1.id,
            session_type="intake",
            status="active"
        )
        session2 = models.ClinicalSession(
            patient_id=patient2.id,
            session_type="intake",
            status="active"
        )
        session3 = models.ClinicalSession(
            patient_id=patient3.id,
            session_type="intake",
            status="completed",
            completed_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.add_all([session1, session2, session3])
        db.commit()

        # 4. Seed Clinical Histories
        print("Seeding clinical histories...")
        cc1 = models.ChiefComplaint(session_id=session1.id, complaint="Severe crushing chest pain radiating to left arm", duration="2 hours", severity="9/10")
        hpi1 = models.HPI(session_id=session1.id, onset="2 hours ago", progression="Worsening", location="Chest radiating to left arm")
        med1 = models.MedicationHistory(session_id=session1.id, drug_name="Telmisartan", dose="40mg", frequency="Once daily", status="current")
        all1 = models.AllergyHistory(session_id=session1.id, allergen="Penicillin", reaction="Skin rash", type="drug")

        cc2 = models.ChiefComplaint(session_id=session2.id, complaint="High fever and severe shortness of breath", duration="3 days", severity="8/10")
        hpi2 = models.HPI(session_id=session2.id, onset="3 days ago", progression="Persistent high grade fever", associated_symptoms="Shortness of breath")
        med2 = models.MedicationHistory(session_id=session2.id, drug_name="Paracetamol", dose="500mg", frequency="As needed", status="current")

        cc3 = models.ChiefComplaint(session_id=session3.id, complaint="Mild headache and routine BP check", duration="1 day", severity="3/10")
        med3 = models.MedicationHistory(session_id=session3.id, drug_name="Metformin", dose="500mg", frequency="Twice daily", status="current")

        db.add_all([cc1, hpi1, med1, all1, cc2, hpi2, med2, cc3, med3])
        db.commit()

        # 5. Seed Documents & Extracted OCR Entities
        print("Seeding OCR documents and extracted entities...")
        doc1 = models.Document(
            session_id=session1.id,
            file_name="Lab_Report_BP_ChestPain.pdf",
            file_type="application/pdf",
            s3_key="/uploads/demo_doc1.pdf",
            ocr_text="""PATIENT EMERGENCY LAB REPORT
Blood Pressure: 185/110 mmHg
Pulse: 104 bpm
SpO2: 93%
Current Meds: Telmisartan 40mg once daily
Date: 31/08/2026"""
        )
        db.add(doc1)
        db.commit()

        ent1 = models.ExtractedEntity(
            document_id=doc1.id,
            entity_type="blood_pressure",
            entity_value="185/110 mmHg",
            confidence=0.96,
            source_text="Blood Pressure: 185/110 mmHg"
        )
        ent2 = models.ExtractedEntity(
            document_id=doc1.id,
            entity_type="spo2",
            entity_value="93%",
            confidence=0.91,
            source_text="SpO2: 93%"
        )
        ent3 = models.ExtractedEntity(
            document_id=doc1.id,
            entity_type="medication",
            entity_value="Telmisartan 40mg",
            confidence=0.94,
            source_text="Telmisartan 40mg once daily"
        )
        db.add_all([ent1, ent2, ent3])
        db.commit()

        # 6. Seed Red Flags
        print("Seeding red-flag triage alerts...")
        rf1 = models.RedFlag(
            session_id=session1.id,
            rule_id="RF001",
            description="Severe Chest Pain: Patient reported severe chest pain radiating to left arm (Matched keyword: 'chest pain')",
            severity=models.RedFlagSeverityEnum.CRITICAL,
            reviewed=False
        )
        rf2 = models.RedFlag(
            session_id=session1.id,
            rule_id="RF003",
            description="Hypertensive Crisis: Severely elevated blood pressure recorded (BP 185/110 mmHg)",
            severity=models.RedFlagSeverityEnum.CRITICAL,
            reviewed=False
        )
        rf3 = models.RedFlag(
            session_id=session2.id,
            rule_id="RF004",
            description="Shortness of Breath: Patient reported high fever and severe shortness of breath",
            severity=models.RedFlagSeverityEnum.CRITICAL,
            reviewed=False
        )
        db.add_all([rf1, rf2, rf3])
        db.commit()

        print("Successfully seeded Med-Drishti database with demo data!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
