import os


class Settings:
    app_name: str = os.getenv("APP_NAME", "Trung Nguyen Legend HRM API")
    database_url: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@db:3306/trungnguyen_hrm_lite")
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "change-this-secret")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


settings = Settings()
