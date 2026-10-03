#!/usr/bin/env python3
"""
Remote Database Setup and Seeder for Med-Drishti.
Usage:
    python scripts/setup_remote_db.py --url "postgresql://user:pass@host:5432/dbname"
Or:
    export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
    python scripts/setup_remote_db.py
"""

import os
import sys
import argparse
from sqlalchemy import create_engine, text

# Add backend to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_dir)

def setup_database(db_url: str):
    # Normalize postgres:// to postgresql://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    print(f"Connecting to database: {db_url.split('@')[-1] if '@' in db_url else db_url}")

    os.environ["DATABASE_URL"] = db_url

    from app import database, models, seed

    # Test connection
    try:
        with database.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database connection successful!")
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

    # Create tables
    print("Creating all database tables according to models...")
    models.Base.metadata.create_all(bind=database.engine)
    print("All tables created successfully.")

    # Run seed data
    print("Populating initial users and demo clinical data...")
    seed.seed_data()
    print("Database is fully initialized and ready for production/demo use!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize and seed Med-Drishti database.")
    parser.add_argument("--url", default=None, help="PostgreSQL connection string")
    args = parser.parse_args()

    target_url = args.url or os.environ.get("DATABASE_URL")
    if not target_url:
        target_url = "sqlite:///./dev.db"
        print(f"No DATABASE_URL supplied, defaulting to local SQLite ({target_url})")

    setup_database(target_url)
