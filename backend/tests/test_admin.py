"""HU 13 — Gerenciar produtos | HU 14 — Fila de pedidos"""
import io

from .conftest import novo_pedido, produto_por_nome

NOVO_PRODUTO = {
    "nome": "Paçoca", "descricao": "Cupcake de amendoim.", "ingredientes": "Farinha, amendoim, açúcar.",
    "alergenos": "Contém glúten e amendoim.", "peso_gramas": 100, "preco": "10.50",
    "estoque_diario": 20, "categorias": [1],
}


# ---------------- permissões
def test_cliente_nao_acessa_admin(client, auth_cliente):
    assert client.get("/api/admin/produtos", headers=auth_cliente).status_code == 403
    assert client.get("/api/admin/pedidos", headers=auth_cliente).status_code == 403


# ---------------- HU 13
def test_admin_cadastra_produto(client, auth_admin):
    resp = client.post("/api/admin/produtos", json=NOVO_PRODUTO, headers=auth_admin)
    assert resp.status_code == 201
    assert resp.get_json()["preco"] == 10.50
    assert "Paçoca" in [p["nome"] for p in client.get("/api/produtos").get_json()]


def test_preco_zero_ou_negativo_e_rejeitado(client, auth_admin):  # HU 13 RN #1
    for preco in ["0", "-5"]:
        resp = client.post("/api/admin/produtos", json={**NOVO_PRODUTO, "preco": preco}, headers=auth_admin)
        assert resp.status_code == 400
        assert resp.get_json()["campo"] == "preco"


def test_campos_obrigatorios(client, auth_admin):
    resp = client.post("/api/admin/produtos", json={**NOVO_PRODUTO, "nome": ""}, headers=auth_admin)
    assert resp.status_code == 400
    assert resp.get_json()["campo"] == "nome"


def test_admin_edita_produto(client, auth_admin):
    produto = produto_por_nome("Red Velvet")
    resp = client.put(f"/api/admin/produtos/{produto.id}",
                      json={**NOVO_PRODUTO, "nome": "Red Velvet Premium", "preco": "14.00"}, headers=auth_admin)
    assert resp.status_code == 200
    assert resp.get_json()["nome"] == "Red Velvet Premium"


def test_switch_desativa_sem_apagar(client, auth_admin):  # HU 13 CA#2
    produto = produto_por_nome("Red Velvet")
    resp = client.patch(f"/api/admin/produtos/{produto.id}/ativo", json={"ativo": False}, headers=auth_admin)
    assert resp.get_json()["ativo"] is False
    assert "Red Velvet" not in [p["nome"] for p in client.get("/api/produtos").get_json()]
    assert "Red Velvet" in [p["nome"] for p in client.get("/api/admin/produtos", headers=auth_admin).get_json()]


def test_upload_de_imagem(client, auth_admin):  # HU 13 CA#1
    resp = client.post("/api/admin/uploads", headers=auth_admin, content_type="multipart/form-data",
                       data={"arquivo": (io.BytesIO(b"fake-png"), "foto.png")})
    assert resp.status_code == 201
    url = resp.get_json()["url"]
    assert client.get(url.replace("http://localhost", "")).status_code == 200


def test_upload_acima_de_2mb_e_rejeitado(client, auth_admin):  # HU 13 RNF
    grande = io.BytesIO(b"0" * (2 * 1024 * 1024 + 1))
    resp = client.post("/api/admin/uploads", headers=auth_admin, content_type="multipart/form-data",
                       data={"arquivo": (grande, "foto.png")})
    assert resp.status_code == 413


def test_upload_formato_invalido(client, auth_admin):
    resp = client.post("/api/admin/uploads", headers=auth_admin, content_type="multipart/form-data",
                       data={"arquivo": (io.BytesIO(b"x"), "virus.exe")})
    assert resp.status_code == 400


# ---------------- HU 14
def _pedido(client, auth_cliente, metodo="CARTAO", modalidade="RETIRADA", **kw):
    item = {"produto_id": produto_por_nome("Red Velvet").id, "quantidade": 1}
    return novo_pedido(client, auth_cliente, [item], metodo=metodo, modalidade=modalidade, **kw).get_json()


def test_fila_mostra_apenas_pedidos_pagos(client, auth_cliente, auth_admin):  # RN09
    pago = _pedido(client, auth_cliente)
    _pedido(client, auth_cliente, metodo="PIX")  # aguardando pagamento
    fila = client.get("/api/admin/pedidos", headers=auth_admin).get_json()
    assert [p["id"] for p in fila] == [pago["id"]]
    assert fila[0]["cliente"]["email"] == "cliente@teste.com"


def test_fila_ordenada_por_chegada(client, auth_cliente, auth_admin):
    primeiro = _pedido(client, auth_cliente)
    segundo = _pedido(client, auth_cliente)
    fila = client.get("/api/admin/pedidos", headers=auth_admin).get_json()
    assert [p["id"] for p in fila] == [primeiro["id"], segundo["id"]]


def test_fluxo_completo_de_status_delivery(client, auth_cliente, auth_admin):  # HU 14 CA#2 + HU 12
    from .conftest import ENDERECO
    pedido = _pedido(client, auth_cliente, modalidade="DELIVERY", endereco=ENDERECO)
    for status in ["EM_PREPARO", "PRONTO", "SAIU_PARA_ENTREGA", "ENTREGUE"]:
        resp = client.patch(f"/api/admin/pedidos/{pedido['id']}/status", json={"status": status}, headers=auth_admin)
        assert resp.status_code == 200, resp.get_json()
    visto_pelo_cliente = client.get(f"/api/pedidos/{pedido['id']}", headers=auth_cliente).get_json()
    assert visto_pelo_cliente["status"] == "ENTREGUE"
    # Entregue sai da fila
    assert client.get("/api/admin/pedidos", headers=auth_admin).get_json() == []


def test_retirada_pula_saiu_para_entrega(client, auth_cliente, auth_admin):
    pedido = _pedido(client, auth_cliente)
    for status in ["EM_PREPARO", "PRONTO"]:
        client.patch(f"/api/admin/pedidos/{pedido['id']}/status", json={"status": status}, headers=auth_admin)
    invalido = client.patch(f"/api/admin/pedidos/{pedido['id']}/status",
                            json={"status": "SAIU_PARA_ENTREGA"}, headers=auth_admin)
    assert invalido.status_code == 409
    ok = client.patch(f"/api/admin/pedidos/{pedido['id']}/status", json={"status": "ENTREGUE"}, headers=auth_admin)
    assert ok.status_code == 200


def test_transicao_invalida(client, auth_cliente, auth_admin):
    pedido = _pedido(client, auth_cliente)
    resp = client.patch(f"/api/admin/pedidos/{pedido['id']}/status", json={"status": "ENTREGUE"}, headers=auth_admin)
    assert resp.status_code == 409
