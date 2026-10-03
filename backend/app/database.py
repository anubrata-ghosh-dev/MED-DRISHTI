import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Default Database URL (PostgreSQL)
default_db_url = "postgresql://meddrishti:dev_password@localhost:5432/meddrishti"
DATABASE_URL = os.environ.get("DATABASE_URL", default_db_url)

# Auto-fix postgres:// to postgresql:// for compatibility (e.g., Heroku/Render)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

logger.info(f"Connecting to database at {DATABASE_URL.split('@')[-1]}")

if DATABASE_URL.startswith("sqlite"):
    # SQLite configuration for local fallback
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
else:
    # PostgreSQL configuration with connection pooling
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=300
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
