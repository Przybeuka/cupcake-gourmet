import enum
import re
from datetime import timedelta

import bcrypt

from ..extensions import agora, db

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$")


class Perfil(str, enum.Enum):
    CLIENTE = "CLIENTE"
    ADMIN = "ADMIN"


class Usuario(db.Model):
    __tablename__ = "usuario"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), nullable=False, unique=True)          # RN01
    senha_hash = db.Column(db.String(255), nullable=False)                   # RN11
    perfil = db.Column(db.Enum(Perfil, name="perfil_usuario"), nullable=False, default=Perfil.CLIENTE)
    tentativas_login = db.Column(db.SmallInteger, nullable=False, default=0)
    bloqueado_ate = db.Column(db.DateTime, nullable=True)                    # RN03
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)

    pedidos = db.relationship("Pedido", back_populates="usuario", lazy="dynamic")

    # ---------- validações ----------
    @staticmethod
    def validar_email(email: str) -> bool:
        return bool(EMAIL_REGEX.match(email or ""))

    @staticmethod
    def validar_senha(senha: str) -> str | None:
        """RN02: mínimo 8 caracteres, 1 letra maiúscula e 1 número. Retorna a mensagem de erro ou None."""
        if len(senha or "") < 8:
            return "A senha deve ter no mínimo 8 caracteres."
        if not re.search(r"[A-Z]", senha):
            return "A senha deve conter ao menos uma letra maiúscula."
        if not re.search(r"\d", senha):
            return "A senha deve conter ao menos um número."
        return None

    # ---------- senha ----------
    def definir_senha(self, senha: str) -> None:
        self.senha_hash = bcrypt.hashpw(senha.encode(), bcrypt.gensalt()).decode()

    def verificar_senha(self, senha: str) -> bool:
        return bcrypt.checkpw((senha or "").encode(), self.senha_hash.encode())

    # ---------- bloqueio por tentativas (RN03) ----------
    def esta_bloqueado(self) -> bool:
        return self.bloqueado_ate is not None and self.bloqueado_ate > agora()

    def registrar_falha_login(self, max_tentativas: int, minutos_bloqueio: int) -> None:
        self.tentativas_login += 1
        if self.tentativas_login >= max_tentativas:
            self.bloqueado_ate = agora() + timedelta(minutes=minutos_bloqueio)
            self.tentativas_login = 0

    def registrar_login_ok(self) -> None:
        self.tentativas_login = 0
        self.bloqueado_ate = None

    @property
    def is_admin(self) -> bool:
        return self.perfil == Perfil.ADMIN
