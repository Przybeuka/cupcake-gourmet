"""HU 01 (criar conta) e HU 02 (login)."""
from flask import Blueprint, current_app, g, jsonify

from ..auth import gerar_token, login_obrigatorio
from ..errors import APIError
from ..extensions import db
from ..models import Usuario
from ..views.serializers import usuario_json
from .utils import corpo_json, texto

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

MSG_LOGIN_INVALIDO = "E-mail ou senha inválidos."  # HU 02 CA#2: mensagem genérica


@bp.post("/registrar")
def registrar():
    dados = corpo_json()
    nome = texto(dados, "nome", "seu nome completo", maximo=120)
    email = texto(dados, "email", "seu e-mail", maximo=160).lower()
    senha = dados.get("senha") or ""
    confirmacao = dados.get("confirmacao_senha") or ""

    if not Usuario.validar_email(email):                                      # HU 01 CA#1
        raise APIError("Informe um e-mail válido.", campo="email")
    erro_senha = Usuario.validar_senha(senha)                                  # RN02
    if erro_senha:
        raise APIError(erro_senha, campo="senha")
    if senha != confirmacao:                                                   # HU 01 CA#2
        raise APIError("A confirmação de senha não confere.", campo="confirmacao_senha")
    if Usuario.query.filter_by(email=email).first():                           # RN01
        raise APIError("Este e-mail já está cadastrado.", 409, campo="email")

    usuario = Usuario(nome=nome, email=email)
    usuario.definir_senha(senha)                                               # RN11
    db.session.add(usuario)
    db.session.commit()
    return jsonify({"token": gerar_token(usuario), "usuario": usuario_json(usuario)}), 201


@bp.post("/login")
def login():
    dados = corpo_json()
    email = str(dados.get("email") or "").strip().lower()
    senha = str(dados.get("senha") or "")
    if not email or not senha:
        raise APIError("Informe e-mail e senha.")

    usuario = Usuario.query.filter_by(email=email).first()
    if usuario is None:
        raise APIError(MSG_LOGIN_INVALIDO, 401)

    if usuario.esta_bloqueado():                                               # RN03
        raise APIError("Conta bloqueada temporariamente por excesso de tentativas. "
                       "Tente novamente em alguns minutos.", 423)

    if not usuario.verificar_senha(senha):
        usuario.registrar_falha_login(current_app.config["LOGIN_MAX_TENTATIVAS"],
                                      current_app.config["LOGIN_BLOQUEIO_MINUTOS"])
        db.session.commit()
        if usuario.esta_bloqueado():
            raise APIError("Conta bloqueada por 15 minutos após 5 tentativas incorretas.", 423)
        raise APIError(MSG_LOGIN_INVALIDO, 401)

    usuario.registrar_login_ok()
    db.session.commit()
    return jsonify({"token": gerar_token(usuario), "usuario": usuario_json(usuario)})


@bp.get("/me")
@login_obrigatorio
def me():
    return jsonify(usuario_json(g.usuario))
