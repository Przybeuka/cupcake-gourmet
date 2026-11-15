"""HU 04 — Catálogo | HU 05 — Filtros | HU 06 — Detalhes"""
from app.extensions import db
from app.models import Categoria

from .conftest import produto_por_nome


def _ids(client, nome):
    return {c["nome"]: c["id"] for c in client.get("/api/categorias").get_json()}[nome]


def test_catalogo_lista_produtos_com_preco(client):
    produtos = client.get("/api/produtos").get_json()
    assert len(produtos) == 8
    assert all(p["preco"] > 0 for p in produtos)


def test_catalogo_esconde_inativos(client):  # RN04
    produto = produto_por_nome("Red Velvet")
    produto.ativo = False
    db.session.commit()
    nomes = [p["nome"] for p in client.get("/api/produtos").get_json()]
    assert "Red Velvet" not in nomes
    assert client.get(f"/api/produtos/{produto.id}").status_code == 404


def test_produto_esgotado_aparece_com_badge_no_fim(client):  # HU 04 CA#2
    produtos = client.get("/api/produtos").get_json()
    assert produtos[-1]["nome"] == "Pistache"
    assert produtos[-1]["esgotado"] is True


def test_filtro_por_categoria(client):
    veganos = client.get(f"/api/produtos?categorias={_ids(client, 'Veganos')}").get_json()
    assert {p["nome"] for p in veganos} == {"Cenoura com Brigadeiro Vegano", "Coco e Maracujá Vegano Sem Glúten"}


def test_produto_com_varias_categorias_aparece_em_cada_filtro(client):  # RN05
    nome = "Coco e Maracujá Vegano Sem Glúten"
    for categoria in ["Veganos", "Zero Lactose", "Sem Glúten"]:
        nomes = [p["nome"] for p in client.get(f"/api/produtos?categorias={_ids(client, categoria)}").get_json()]
        assert nome in nomes


def test_filtros_combinados_exigem_todas_as_categorias(client):
    filtro = f"{_ids(client, 'Veganos')},{_ids(client, 'Sem Glúten')}"
    nomes = [p["nome"] for p in client.get(f"/api/produtos?categorias={filtro}").get_json()]
    assert nomes == ["Coco e Maracujá Vegano Sem Glúten"]


def test_filtro_invalido(client):
    assert client.get("/api/produtos?categorias=abc").status_code == 400


def test_detalhes_com_ingredientes_alergenos_e_peso(client):  # HU 06
    produto = produto_por_nome("Chocolate Belga")
    corpo = client.get(f"/api/produtos/{produto.id}").get_json()
    assert "chocolate" in corpo["ingredientes"].lower()
    assert "nozes" in corpo["alergenos"]
    assert corpo["peso_gramas"] == 120


def test_categorias_iniciais(client):
    assert Categoria.query.count() == 4
