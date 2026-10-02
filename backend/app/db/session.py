from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings


engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    connect_args={"init_command": "SET time_zone='+07:00'"},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    database = SessionLocal()
    try:
        yield database
    finally:
        database.close()
