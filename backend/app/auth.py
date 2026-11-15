from datetime import timedelta
from functools import wraps

import jwt
from flask import current_app, g, request

from .errors import APIError
from .extensions import agora, db
from .models import Usuario


def gerar_token(usuario: Usuario) -> str:
    horas = current_app.config["JWT_EXPIRA_HORAS"]
    payload = {
        "sub": str(usuario.id),
        "perfil": usuario.perfil.value,
        "exp": agora() + timedelta(hours=horas),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def _usuario_do_token() -> Usuario:
    cabecalho = request.headers.get("Authorization", "")
    if not cabecalho.startswith("Bearer "):
        raise APIError("Faça login para continuar.", 401)
    token = cabecalho.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise APIError("Sua sessão expirou. Faça login novamente.", 401)
    except jwt.InvalidTokenError:
        raise APIError("Sessão inválida. Faça login novamente.", 401)
    usuario = db.session.get(Usuario, int(payload["sub"]))
    if usuario is None:
        raise APIError("Sessão inválida. Faça login novamente.", 401)
    return usuario


def login_obrigatorio(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        g.usuario = _usuario_do_token()
        return func(*args, **kwargs)
    return wrapper


def admin_obrigatorio(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        g.usuario = _usuario_do_token()
        if not g.usuario.is_admin:
            raise APIError("Acesso restrito à equipe da loja.", 403)
        return func(*args, **kwargs)
    return wrapper
