"""
seed_kiosk.py — Run once after first deploy to create the kiosk user.

Usage (on Render shell or locally against prod DB):
    python -m app.seed_kiosk

Environment variables used:
    KIOSK_EMAIL     — defaults to kiosk@meddrishti.in
    KIOSK_PASSWORD  — defaults to kiosk_dev_password  (override in prod!)
"""
import os
from .database import SessionLocal
from . import models, auth


def seed_kiosk(db=None):
    close = False
    if db is None:
        db = SessionLocal()
        close = True

    kiosk_email = os.environ.get("KIOSK_EMAIL", "kiosk@meddrishti.in")
    kiosk_password = os.environ.get("KIOSK_PASSWORD", "kiosk_dev_password")

    existing = db.query(models.User).filter(models.User.email == kiosk_email).first()
    if existing:
        print(f"[seed_kiosk] Kiosk user already exists: {kiosk_email}")
    else:
        kiosk = models.User(
            email=kiosk_email,
            hashed_password=auth.hash_password(kiosk_password),
            full_name="Kiosk User",
            role=models.RoleEnum.NURSE,
            is_active=True,
        )
        db.add(kiosk)
        db.commit()
        print(f"[seed_kiosk] Created kiosk user: {kiosk_email}")

    if close:
        db.close()


if __name__ == "__main__":
    seed_kiosk()
