import os
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


class Settings:
    app_name: str = os.getenv("APP_NAME", "Trung Nguyen Legend HRM API")
    database_url: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:root@localhost:3306/trungnguyen_hrm_lite",
    )
    jwt_secret_key: str = (
        os.getenv("JWT_SECRET_KEY")
        or os.getenv("SECRET_KEY")
        or "change-this-secret"
    )
    jwt_algorithm: str = (
        os.getenv("JWT_ALGORITHM")
        or os.getenv("ALGORITHM")
        or "HS256"
    )
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


settings = Settings()
