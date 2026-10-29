import logging
import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

# Tìm và load file .env ở thư mục backend hoặc root
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
root_env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
elif root_env_path.exists():
    load_dotenv(dotenv_path=root_env_path)
else:
    load_dotenv()


# Các giá trị mẫu không được dùng làm khóa ký JWT thật
_PLACEHOLDER_SECRETS = {
    "",
    "change-this-secret",
    "your-super-secret-key-change-this-in-production",
}


def _load_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY") or ""
    if secret in _PLACEHOLDER_SECRETS:
        # Không chặn khởi động khi dev, nhưng sinh khóa ngẫu nhiên thay vì dùng khóa ai cũng biết.
        # Token sẽ mất hiệu lực mỗi lần khởi động lại: hãy đặt SECRET_KEY riêng trong .env.
        logging.getLogger("uvicorn.error").warning(
            "SECRET_KEY chưa được đặt hoặc đang là giá trị mẫu - dùng khóa ngẫu nhiên tạm thời."
        )
        return secrets.token_urlsafe(48)
    return secret


class Settings:
    app_name: str = os.getenv("APP_NAME", "Trung Nguyen Legend HRM API")
    database_url: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:root@localhost:3306/trungnguyen_hrm_lite",
    )
    jwt_secret_key: str = _load_jwt_secret()
    jwt_algorithm: str = (
        os.getenv("JWT_ALGORITHM")
        or os.getenv("ALGORITHM")
        or "HS256"
    )
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    # Frontend gọi API qua proxy cùng origin (Vite/nginx); chỉ mở CORS cho các origin dev đã biết
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
        if origin.strip()
    ]


settings = Settings()
