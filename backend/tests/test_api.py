"""
Pytest Test Suite for Med-Drishti API Endpoints.
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_auth_and_patient_creation():
    """Test user registration, login, and patient creation flow."""
    # 1. Register
    email = "test.patient@meddrishti.in"
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "password123",
        "full_name": "Test Patient",
        "role": "patient"
    })
    assert reg_resp.status_code in [200, 400]  # 400 if already registered

    # 2. Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "password123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Patient
    patient_resp = client.post("/api/v1/patients", json={
        "name": "Integration Test Patient",
        "date_of_birth": "1990-01-01",
        "gender": "male",
        "phone": "9998887770"
    }, headers=headers)
    assert patient_resp.status_code == 200
    patient_id = patient_resp.json()["id"]

    # 4. Create Session
    session_resp = client.post("/api/v1/sessions", params={"patient_id": patient_id}, json={
        "session_type": "intake"
    }, headers=headers)
    assert session_resp.status_code == 200
    session_id = session_resp.json()["id"]

    # 5. Get Next Question
    q_resp = client.post("/api/v1/voice/next-question", json={
        "session_id": session_id,
        "language": "en"
    }, headers=headers)
    assert q_resp.status_code == 200
    assert q_resp.json()["question_id"] == "chief_complaint"


def test_red_flag_evaluation():
    """Test red flag detection on severe chest pain input."""
    from app.red_flag_engine import evaluate_red_flags
    triggered = evaluate_red_flags("Patient experiencing severe chest pain radiating to left arm")
    assert len(triggered) > 0
    assert any(t["rule_id"] == "RF001" for t in triggered)
