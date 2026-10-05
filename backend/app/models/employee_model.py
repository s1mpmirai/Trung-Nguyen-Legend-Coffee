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
    ma_nv = Column(String, unique=True, index=True) # ForeignKey("nhan_vien.ma_nv"), nullable=False
    mat_khau = Column(String, nullable=False)
    ma_vai_tro = Column(String, nullable=False)  # 'ADMIN', 'QUAN_LY', 'NHAN_VIEN'
    trang_thai = Column(String, default='HOAT_DONG')  # 'HOAT_DONG', 'KHOA', 'NGUNG_HOAT_DONG'
    ngay_tao = Column(DateTime, default=datetime.now)
    ngay_cap_nhat = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    nhan_vien = relationship("nhan_vien", back_populates="tai_khoan")
    
class nhan_vien(Base):
    __tablename__ = "nhan_vien"
    ma_nv = Column(String, primary_key=True)
    ho_ten = Column(String, nullable=False)
    ngay_sinh = Column(Date, nullable=False)
    gioi_tinh = Column(String, nullable=False)  # 'NAM', 'NU', 'KHAC'
    cccd = Column(String, unique=True)
    dia_chi = Column(String)
    sdt = Column(String, unique=True)
    email = Column(String, unique=True)
    so_nguoi_pt = Column(Integer, default=0)  # Số người phụ thuộc
    ma_pb = Column(String, ForeignKey("phong_ban.ma_pb"), nullable=False)
    ma_cv = Column(String, ForeignKey("chuc_vu.ma_cv"), nullable=False)
    ma_ngl = Column(String, ForeignKey("ngach_luong.ma_ngl"), nullable=True)
    ngay_nghi_viec = Column(Date)
    trang_thai = Column(String, default='DANG_LAM')  # 'DANG_LAM', 'DA_NGHI_VIEC'
    hinh_thuc_lam_viec = Column(String, default='FULL_TIME')
    ngay_tao = Column(DateTime, default=datetime.now)
    ngay_cap_nhat = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    ma_pb_rel = relationship("phong_ban", back_populates="nhan_vien")
    ma_cv_rel = relationship("chuc_vu", back_populates="nhan_vien")
    ma_ngl_rel = relationship("ngach_luong", back_populates="nhan_vien")