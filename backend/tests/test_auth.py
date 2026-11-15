"""HU 01 — Criar conta | HU 02 — Login"""
from app.extensions import db
from app.models import Usuario

from .conftest import SENHA, registrar


# ---------------- HU 01
def test_cadastro_valido_retorna_token(client):
    resp = registrar(client)
    assert resp.status_code == 201
    corpo = resp.get_json()
    assert corpo["token"]
    assert corpo["usuario"]["perfil"] == "CLIENTE"


def test_senha_e_armazenada_com_hash_bcrypt(client):  # RN11
    registrar(client)
    usuario = Usuario.query.filter_by(email="cliente@teste.com").one()
    assert usuario.senha_hash != SENHA
    assert usuario.senha_hash.startswith("$2")


def test_email_invalido_e_rejeitado(client):  # CA#1
    resp = registrar(client, email="sem-arroba.com")
    assert resp.status_code == 400
    assert resp.get_json()["campo"] == "email"


def test_confirmacao_de_senha_diferente(client):  # CA#2
    resp = client.post("/api/auth/registrar", json={
        "nome": "X", "email": "x@teste.com", "senha": SENHA, "confirmacao_senha": "Outra123",
    })
    assert resp.status_code == 400
    assert resp.get_json()["campo"] == "confirmacao_senha"


def test_email_duplicado_e_rejeitado(client):  # RN01
    registrar(client)
    resp = registrar(client, email="CLIENTE@teste.com")
    assert resp.status_code == 409


def test_regras_de_senha(client):  # RN02
    for senha, trecho in [("Ab1", "8 caracteres"), ("senhasemmaiuscula1", "maiúscula"), ("SenhaSemNumero", "número")]:
        resp = registrar(client, senha=senha)
        assert resp.status_code == 400
        assert trecho in resp.get_json()["erro"]


# ---------------- HU 02
def test_login_valido(client):
    registrar(client)
    resp = client.post("/api/auth/login", json={"email": "cliente@teste.com", "senha": SENHA})
    assert resp.status_code == 200
    assert resp.get_json()["usuario"]["email"] == "cliente@teste.com"


def test_mensagem_de_erro_generica(client):  # CA#2
    registrar(client)
    senha_errada = client.post("/api/auth/login", json={"email": "cliente@teste.com", "senha": "Errada123"})
    email_inexistente = client.post("/api/auth/login", json={"email": "ninguem@teste.com", "senha": "Errada123"})
    assert senha_errada.status_code == email_inexistente.status_code == 401
    assert senha_errada.get_json()["erro"] == email_inexistente.get_json()["erro"] == "E-mail ou senha inválidos."


def test_bloqueio_apos_5_tentativas(client):  # RN03
    registrar(client)
    for _ in range(4):
        assert client.post("/api/auth/login", json={"email": "cliente@teste.com", "senha": "Errada123"}).status_code == 401
    quinta = client.post("/api/auth/login", json={"email": "cliente@teste.com", "senha": "Errada123"})
    assert quinta.status_code == 423
    # Mesmo com a senha certa, continua bloqueado
    assert client.post("/api/auth/login", json={"email": "cliente@teste.com", "senha": SENHA}).status_code == 423


def test_bloqueio_expira(client):  # RN03
    registrar(client)
    for _ in range(5):
        client.post("/api/auth/login", json={"email": "cliente@teste.com", "senha": "Errada123"})
    usuario = Usuario.query.filter_by(email="cliente@teste.com").one()
    usuario.bloqueado_ate = usuario.bloqueado_ate.replace(year=2000)  # simula 15 min passados
    db.session.commit()
    assert client.post("/api/auth/login", json={"email": "cliente@teste.com", "senha": SENHA}).status_code == 200


def test_rota_protegida_sem_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer lixo"}).status_code == 401
