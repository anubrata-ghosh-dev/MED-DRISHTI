import os
from sqlalchemy.orm import Session
from . import models, database, auth

def seed_demo_data(db: Session):
    print("Seeding synthetic demo data...")

    # 1. Create Demo Users
    patient_user = models.User(
        email="demo@patient.com",
        hashed_password=auth.hash_password("test123"),
        full_name="Demo Patient",
        role=models.RoleEnum.PATIENT
    )
    doctor_user = models.User(
        email="demo@doctor.com",
        hashed_password=auth.hash_password("test123"),
        full_name="Dr. Sarah Smith",
        role=models.RoleEnum.DOCTOR
    )
    admin_user = models.User(
        email="admin@test.com",
        hashed_password=auth.hash_password("test123"),
        full_name="System Admin",
        role=models.RoleEnum.ADMIN
    )

    db.add_all([patient_user, doctor_user, admin_user])
    db.commit()

    # 2. Create Diverse Synthetic Patients
    patients = [
        models.Patient(
            name="Ramesh Kumar",
            date_of_birth="1972-05-15",
            gender="Male",
            phone="9876543210",
            preferred_language="Hindi",
            abha_id="ABHA-HINDI-001",
            user_id=patient_user.id
        ),
        models.Patient(
            name="Anjali Das",
            date_of_birth="1985-11-20",
            gender="Female",
            phone="9876543211",
            preferred_language="Bengali",
            abha_id="ABHA-BENG-002",
            user_id=patient_user.id
        ),
        models.Patient(
            name="Suresh Iyer",
            date_of_birth="1960-02-10",
            gender="Male",
            phone="9876543212",
            preferred_language="English",
            abha_id="ABHA-ENG-003",
            user_id=patient_user.id
        ),
        models.Patient(
            name="Priya Sharma",
            date_of_birth="1990-07-05",
            gender="Female",
            phone="9876543213",
            preferred_language="English",
            abha_id="ABHA-AYUSH-004",
            user_id=patient_user.id
        )
    ]
    db.add_all(patients)
    db.commit()

    # 3. Create Demo Sessions (representing different scenarios)
    # Scenario A: Critical Red Flag (Chest Pain)
    s1 = models.ClinicalSession(patient_id=patients[0].id, session_type="intake", status="active")
    db.add(s1)
    db.commit()

    h1 = models.ClinicalHistory(
        session_id=s1.id,
        chief_complaint="Severe chest pain and breathlessness",
        history_of_present_illness="Pain started 2 hours ago, spreading to left arm.",
        medications="Amlodipine 5mg",
        allergies="None"
    )
    db.add(h1)
    db.add(models.RedFlag(session_id=s1.id, rule_id="RF_CARDIAC_URGENT", description="Urgent Cardiac Pattern detected", severity=models.RedFlagSeverityEnum.CRITICAL))

    # Scenario B: AYUSH Intake
    s2 = models.ClinicalSession(patient_id=patients[3].id, session_type="intake", department="Ayurveda", status="active")
    db.add(s2)
    db.commit()

    # Add structured AYUSH entities
    db.add(models.ClinicalEntity(session_id=s2.id, entity_type="Prakriti", value="Vata-Pitta", confidence=1.0))
    db.add(models.ClinicalEntity(session_id=s2.id, entity_type="Vikriti", value="High Pitta imbalance", confidence=0.9))

    # Scenario C: OCR Case (Low Confidence)
    s3 = models.ClinicalSession(patient_id=patients[1].id, session_type="intake", status="active")
    db.add(s3)
    db.commit()

    db.add(models.ClinicalEntity(session_id=s3.id, entity_type="Medication", value="Metformin 500mg", confidence=0.6, source_text="Met?formin 500mg"))

    db.commit()
    print("Demo data successfully seeded!")

if __name__ == "__main__":
    session = database.SessionLocal()
    seed_demo_data(session)
    session.close()
