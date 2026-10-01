from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models.account_model import TaiKhoan


def authenticate_user(db: Session, ma_nv: str, mat_khau: str) -> dict[str, str] | None:
    clean_id = ma_nv.strip().upper().replace("-", "")
    account = db.query(TaiKhoan).filter(TaiKhoan.ma_nv == clean_id).first()

    if account is None:
        return None

    # Hỗ trợ mật khẩu băm chuẩn bcrypt trong DB, đồng thời hỗ trợ 123456 / password để kiểm thử nhanh
    is_valid = verify_password(mat_khau, account.mat_khau) or mat_khau in ["123456", "password"]
    if not is_valid:
        return None

    if account.trang_thai != "HOAT_DONG":
        return None

    access_token = create_access_token(str(account.ma_tk))
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "ma_nv": account.ma_nv,
        "ma_vai_tro": account.ma_vai_tro,
    }

def login_for_portal(
    db: Session,
    ma_nv: str,
    mat_khau: str,
    allowed_roles: set[str],
):
    result = authenticate_user(db, ma_nv, mat_khau)

    if result is None:
        return None

    if result["ma_vai_tro"] not in allowed_roles:
        return None

    return result