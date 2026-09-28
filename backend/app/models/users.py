from app.db.session import Base
from sqlalchemy import Column, String, DateTime, Date, Boolean, ForeignKey, Numeric, Float, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.utils.time_helper import format_dt

class tai_khoan(Base):
    __tablename__ = "tai_khoan"
    ma_tk = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ma_nv = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)