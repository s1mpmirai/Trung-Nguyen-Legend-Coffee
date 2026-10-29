from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class TaiKhoan(Base):
    __tablename__ = "tai_khoan"

    ma_tk: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ma_nv: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    mat_khau: Mapped[str] = mapped_column(String(255), nullable=False)
    ma_vai_tro: Mapped[str] = mapped_column(String(30), nullable=False)
    trang_thai: Mapped[str] = mapped_column(String(20), nullable=False, default="HOAT_DONG")
    lan_dn_cuoi: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # 1 = đang dùng mật khẩu tạm do Admin cấp / đặt lại, bắt buộc đổi ở lần đăng nhập tới
    phai_doi_mat_khau: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ngay_tao: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
