"""HU 04 (catálogo), HU 05 (filtros) e HU 06 (detalhes)."""
from flask import Blueprint, jsonify, request

from ..errors import APIError
from ..extensions import db
from ..models import Categoria, Produto
from ..views.serializers import categoria_json, produto_json

bp = Blueprint("catalogo", __name__, url_prefix="/api")


@bp.get("/categorias")
def listar_categorias():
    categorias = Categoria.query.order_by(Categoria.id).all()
    return jsonify([categoria_json(c) for c in categorias])


@bp.get("/produtos")
def listar_produtos():
    consulta = Produto.query.filter(Produto.ativo.is_(True))                   # RN04

    # ?categorias=2,4 → produto precisa pertencer a TODAS as categorias escolhidas
    # (um cliente vegano e celíaco quer itens Veganos E Sem Glúten). RN05 garante
    # que um produto com várias categorias aparece em cada filtro.
    ids = request.args.get("categorias", "").strip()
    if ids:
        try:
            lista = {int(x) for x in ids.split(",") if x.strip()}
        except ValueError:
            raise APIError("Filtro de categorias inválido.")
        for categoria_id in lista:
            consulta = consulta.filter(Produto.categorias.any(Categoria.id == categoria_id))

    busca = request.args.get("busca", "").strip()
    if busca:
        consulta = consulta.filter(Produto.nome.ilike(f"%{busca}%"))

    # Esgotados vão para o fim da vitrine
    produtos = consulta.order_by((Produto.estoque_diario <= 0), Produto.nome).all()
    return jsonify([produto_json(p) for p in produtos])


@bp.get("/produtos/<int:produto_id>")
def detalhar_produto(produto_id: int):
    produto = db.session.get(Produto, produto_id)
    if produto is None or not produto.ativo:
        raise APIError("Produto não encontrado.", 404)
    return jsonify(produto_json(produto))
