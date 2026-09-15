"""
Database connection pooling and session management improvements.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./sentinelx_data.db"
)

# Use QueuePool for better concurrent connection handling
# SQLite doesn't support concurrent writes, but for PostgreSQL/MySQL this is critical
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool if not DATABASE_URL.startswith("sqlite") else None,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=False,  # Set to True only for debugging
    pool_pre_ping=True,  # Verify connections before use
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    """Dependency for FastAPI routes to inject database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
