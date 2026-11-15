import os
from decimal import Decimal
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _normalizar_url_banco(url: str) -> str:
    """Hospedagens como o Render entregam 'postgres://'; o SQLAlchemy usa o driver psycopg 3."""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-troque-em-producao")
    SQLALCHEMY_DATABASE_URI = _normalizar_url_banco(
        os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'instance' / 'cupcake.db'}")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_EXPIRA_HORAS = 8
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

    # Regras de negócio parametrizadas
    TAXA_ENTREGA = Decimal(os.getenv("TAXA_ENTREGA", "8.00"))   # RN08
    PIX_EXPIRA_MINUTOS = 10                                       # HU 11 / RN #1
    LOGIN_MAX_TENTATIVAS = 5                                      # RN03
    LOGIN_BLOQUEIO_MINUTOS = 15                                   # RN03

    # Upload de imagens (HU 13 / RNF: máximo 2 MB)
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", str(BASE_DIR / "uploads"))


class TestConfig(Config):
    TESTING = True
    SECRET_KEY = "segredo-de-teste"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
