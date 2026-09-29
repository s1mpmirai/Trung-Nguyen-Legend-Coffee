from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models.account_model import TaiKhoan
from app.security import get_current_user_id

def check_user_role(db: Session, ma_nv: str, allowed_roles: set[str]) -> bool:
    