import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _database_url():
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        # SQLite queda como fallback exclusivo para desarrollo local.
        return f"sqlite:///{(BASE_DIR / 'procesos.db').as_posix()}"

    # Acepta mysql:// y lo adapta al driver PyMySQL usado por SQLAlchemy.
    if url.startswith("mysql://"):
        return url.replace("mysql://", "mysql+pymysql://", 1)

    return url


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "solo-desarrollo-local")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_EXP_MINUTES = int(os.getenv("JWT_EXP_MINUTES", "480"))

    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }
    JSON_SORT_KEYS = False

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://127.0.0.1:5500,http://localhost:5500",
        ).split(",")
        if origin.strip()
    ]
