"""HU 07/08 (carrinho no servidor) | HU 10 — Entrega | HU 11 — Pagamento | HU 12 — Status"""
from datetime import timedelta
from decimal import Decimal

from app.extensions import db
from app.models import Pedido

from .conftest import CARTAO_RECUSADO, ENDERECO, novo_pedido, produto_por_nome, registrar


def _item(nome, qtd=1):
    return {"produto_id": produto_por_nome(nome).id, "quantidade": qtd}


# ---------------- criação e totais
def test_pedido_retirada_cartao_aprovado(client, auth_cliente):
    resp = novo_pedido(client, auth_cliente, [_item("Red Velvet", 2)])
    assert resp.status_code == 201
    pedido = resp.get_json()
    assert pedido["status"] == "PAGO"
    assert pedido["pagamento"]["status"] == "APROVADO"
    assert pedido["taxa_entrega"] == 0
    assert pedido["total"] == 25.80


def test_delivery_cobra_taxa_fixa(client, auth_cliente):  # RN08
    resp = novo_pedido(client, auth_cliente, [_item("Red Velvet")], modalidade="DELIVERY", endereco=ENDERECO)
    pedido = resp.get_json()
    assert resp.status_code == 201
    assert pedido["taxa_entrega"] == 8.00
    assert pedido["total"] == 20.90
    assert pedido["endereco"]["cep"] == "80010000"


def test_delivery_exige_cep_valido(client, auth_cliente):  # RN08 / HU 10 CA#1
    resp = novo_pedido(client, auth_cliente, [_item("Red Velvet")], modalidade="DELIVERY",
                       endereco={**ENDERECO, "cep": "123"})
    assert resp.status_code == 400
    assert resp.get_json()["campo"] == "cep"


def test_delivery_exige_endereco(client, auth_cliente):
    resp = novo_pedido(client, auth_cliente, [_item("Red Velvet")], modalidade="DELIVERY")
    assert resp.status_code == 400


def test_preco_gravado_no_momento_da_compra(client, auth_cliente):  # RN10
    produto = produto_por_nome("Red Velvet")
    pedido_id = novo_pedido(client, auth_cliente, [_item("Red Velvet")]).get_json()["id"]
    produto.preco = Decimal("99.00")
    db.session.commit()
    pedido = client.get(f"/api/pedidos/{pedido_id}", headers=auth_cliente).get_json()
    assert pedido["itens"][0]["preco_unitario"] == 12.90


def test_itens_repetidos_sao_somados(client, auth_cliente):
    pedido = novo_pedido(client, auth_cliente, [_item("Red Velvet", 1), _item("Red Velvet", 2)]).get_json()
    assert pedido["itens"][0]["quantidade"] == 3


# ---------------- validações de carrinho e estoque
def test_carrinho_vazio(client, auth_cliente):
    assert novo_pedido(client, auth_cliente, []).status_code == 400


def test_quantidade_minima_1(client, auth_cliente):  # RN06
    resp = novo_pedido(client, auth_cliente, [_item("Red Velvet", 0)])
    assert resp.status_code == 400


def test_estoque_insuficiente(client, auth_cliente):  # RN07
    resp = novo_pedido(client, auth_cliente, [_item("Coco e Maracujá Vegano Sem Glúten", 11)])
    assert resp.status_code == 409
    assert "restam 10" in resp.get_json()["erro"]


def test_produto_esgotado_nao_pode_ser_comprado(client, auth_cliente):
    assert novo_pedido(client, auth_cliente, [_item("Pistache")]).status_code == 409


def test_estoque_e_baixado(client, auth_cliente):
    novo_pedido(client, auth_cliente, [_item("Red Velvet", 5)])
    assert produto_por_nome("Red Velvet").estoque_diario == 25


def test_pedido_exige_login(client):
    assert client.post("/api/pedidos", json={}).status_code == 401


# ---------------- pagamento
def test_cartao_recusado_nao_cria_pedido(client, auth_cliente):
    resp = novo_pedido(client, auth_cliente, [_item("Red Velvet")], cartao=CARTAO_RECUSADO)
    assert resp.status_code == 402
    assert Pedido.query.count() == 0
    assert produto_por_nome("Red Velvet").estoque_diario == 30


def test_cartao_com_numero_invalido(client, auth_cliente):
    resp = novo_pedido(client, auth_cliente, [_item("Red Velvet")],
                       cartao={"nome": "A", "numero": "1234 5678 9012 3456", "validade": "12/35", "cvv": "123"})
    assert resp.status_code == 400
    assert resp.get_json()["campo"] == "numero"


def test_cartao_vencido(client, auth_cliente):
    resp = novo_pedido(client, auth_cliente, [_item("Red Velvet")],
                       cartao={"nome": "A", "numero": "4111111111111111", "validade": "01/20", "cvv": "123"})
    assert resp.status_code == 400
    assert resp.get_json()["campo"] == "validade"


def test_pix_fica_pendente_e_confirma(client, auth_cliente):
    pedido = novo_pedido(client, auth_cliente, [_item("Red Velvet")], metodo="PIX").get_json()
    assert pedido["status"] == "AGUARDANDO_PAGAMENTO"
    assert pedido["pagamento"]["pix_codigo"].startswith("000201")
    assert pedido["pagamento"]["pix_expira_em"]

    confirmado = client.post(f"/api/pedidos/{pedido['id']}/pix/confirmar", headers=auth_cliente).get_json()
    assert confirmado["status"] == "PAGO"
    assert "pix_codigo" not in confirmado["pagamento"]


def test_pix_expirado_cancela_e_devolve_estoque(client, auth_cliente):  # HU 11 RN #1
    pedido_id = novo_pedido(client, auth_cliente, [_item("Red Velvet", 3)], metodo="PIX").get_json()["id"]
    assert produto_por_nome("Red Velvet").estoque_diario == 27
    pedido = db.session.get(Pedido, pedido_id)
    pedido.criado_em -= timedelta(minutes=11)
    db.session.commit()

    resp = client.post(f"/api/pedidos/{pedido_id}/pix/confirmar", headers=auth_cliente)
    assert resp.status_code == 410
    assert db.session.get(Pedido, pedido_id).status.value == "CANCELADO"
    assert produto_por_nome("Red Velvet").estoque_diario == 30


# ---------------- acompanhamento (HU 12) e cancelamento
def test_cliente_ve_apenas_os_proprios_pedidos(client, auth_cliente):
    pedido_id = novo_pedido(client, auth_cliente, [_item("Red Velvet")]).get_json()["id"]
    outro = {"Authorization": f"Bearer {registrar(client, email='outro@teste.com').get_json()['token']}"}
    assert client.get(f"/api/pedidos/{pedido_id}", headers=outro).status_code == 404
    assert client.get("/api/pedidos", headers=outro).get_json() == []
    assert len(client.get("/api/pedidos", headers=auth_cliente).get_json()) == 1


def test_cliente_cancela_pedido_pago_e_estoque_volta(client, auth_cliente):
    pedido_id = novo_pedido(client, auth_cliente, [_item("Red Velvet", 4)]).get_json()["id"]
    resp = client.post(f"/api/pedidos/{pedido_id}/cancelar", headers=auth_cliente)
    assert resp.get_json()["status"] == "CANCELADO"
    assert produto_por_nome("Red Velvet").estoque_diario == 30


def test_nao_cancela_pedido_em_preparo(client, auth_cliente, auth_admin):
    pedido_id = novo_pedido(client, auth_cliente, [_item("Red Velvet")]).get_json()["id"]
    client.patch(f"/api/admin/pedidos/{pedido_id}/status", json={"status": "EM_PREPARO"}, headers=auth_admin)
    assert client.post(f"/api/pedidos/{pedido_id}/cancelar", headers=auth_cliente).status_code == 409
