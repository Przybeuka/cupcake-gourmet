from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def agora() -> datetime:
    """Data/hora atual em UTC sem fuso (o banco usa TIMESTAMP sem time zone)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
