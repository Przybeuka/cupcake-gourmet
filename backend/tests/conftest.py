import pytest

from app import create_app
from app.config import TestConfig
from app.extensions import db
from app.models import Produto
from app.seed import popular_banco

SENHA = "Senha123"
CARTAO_OK = {"nome": "Maria Teste", "numero": "4111 1111 1111 1111", "validade": "12/35", "cvv": "123"}
CARTAO_RECUSADO = {**CARTAO_OK, "numero": "4000 0000 0000 0002"}
ENDERECO = {"cep": "80010-000", "rua": "Rua XV de Novembro", "numero": "100",
            "bairro": "Centro", "cidade": "Curitiba", "referencia": "Perto da praça"}


@pytest.fixture
def app(tmp_path):
    class Config(TestConfig):
        UPLOAD_FOLDER = str(tmp_path / "uploads")

    app = create_app(Config)
    with app.app_context():
        popular_banco()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def registrar(client, email="cliente@teste.com", senha=SENHA, nome="Cliente Teste"):
    return client.post("/api/auth/registrar", json={
        "nome": nome, "email": email, "senha": senha, "confirmacao_senha": senha,
    })


@pytest.fixture
def auth_cliente(client):
    token = registrar(client).get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_admin(client):
    resp = client.post("/api/auth/login", json={"email": "admin@cupcakegourmet.com", "senha": "Admin1234"})
    return {"Authorization": f"Bearer {resp.get_json()['token']}"}


def produto_por_nome(nome: str) -> Produto:
    return Produto.query.filter_by(nome=nome).one()


def novo_pedido(client, headers, itens, modalidade="RETIRADA", metodo="CARTAO", cartao=None, endereco=None):
    corpo = {"itens": itens, "modalidade": modalidade, "pagamento": {"metodo": metodo}}
    if metodo == "CARTAO":
        corpo["pagamento"]["cartao"] = cartao or CARTAO_OK
    if endereco is not None:
        corpo["endereco"] = endereco
    return client.post("/api/pedidos", json=corpo, headers=headers)
