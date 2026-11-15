"""HU 13 (gerenciar produtos) e HU 14 (fila de pedidos) — acesso restrito ao perfil ADMIN."""
import uuid
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request, send_from_directory, url_for

from ..auth import admin_obrigatorio
from ..errors import APIError
from ..extensions import db
from ..models import STATUS_FILA, Categoria, Pedido, Produto, StatusPedido
from ..views.serializers import pedido_json, produto_json
from .pedido_controller import expirar_pix_vencidos
from .utils import corpo_json, dinheiro, inteiro, texto

bp = Blueprint("admin", __name__, url_prefix="/api/admin")
bp_uploads = Blueprint("uploads", __name__)

EXTENSOES_IMAGEM = {"png", "jpg", "jpeg", "webp"}


# ---------------------------------------------------------------- produtos (HU 13)
def _preencher_produto(produto: Produto, dados: dict) -> None:
    produto.nome = texto(dados, "nome", "o nome do produto", maximo=100)
    produto.descricao = texto(dados, "descricao", "a descrição")
    produto.ingredientes = texto(dados, "ingredientes", "os ingredientes")
    produto.alergenos = texto(dados, "alergenos", "os alérgenos", obrigatorio=False, maximo=255)
    produto.peso_gramas = inteiro(dados, "peso_gramas", "peso (g)", minimo=1)
    produto.estoque_diario = inteiro(dados, "estoque_diario", "estoque diário", minimo=0)
    produto.imagem_url = texto(dados, "imagem_url", "a imagem", obrigatorio=False, maximo=500)

    preco = dinheiro(dados, "preco", "preço")
    if preco <= 0:                                                   # HU 13 RN #1
        raise APIError("O preço deve ser maior que zero.", campo="preco")
    produto.preco = preco

    if "ativo" in dados:
        produto.ativo = bool(dados["ativo"])

    ids = dados.get("categorias") or []
    if not isinstance(ids, list):
        raise APIError("Categorias inválidas.", campo="categorias")
    categorias = Categoria.query.filter(Categoria.id.in_(ids)).all() if ids else []
    if len(categorias) != len(set(ids)):
        raise APIError("Uma das categorias informadas não existe.", campo="categorias")
    produto.categorias = categorias


def _produto(produto_id: int) -> Produto:
    produto = db.session.get(Produto, produto_id)
    if produto is None:
        raise APIError("Produto não encontrado.", 404)
    return produto


@bp.get("/produtos")
@admin_obrigatorio
def listar_produtos():
    produtos = Produto.query.order_by(Produto.ativo.desc(), Produto.nome).all()
    return jsonify([produto_json(p, admin=True) for p in produtos])


@bp.post("/produtos")
@admin_obrigatorio
def criar_produto():
    produto = Produto(ativo=True)
    _preencher_produto(produto, corpo_json())
    db.session.add(produto)
    db.session.commit()
    return jsonify(produto_json(produto, admin=True)), 201


@bp.put("/produtos/<int:produto_id>")
@admin_obrigatorio
def atualizar_produto(produto_id: int):
    produto = _produto(produto_id)
    _preencher_produto(produto, corpo_json())
    db.session.commit()
    return jsonify(produto_json(produto, admin=True))


@bp.patch("/produtos/<int:produto_id>/ativo")
@admin_obrigatorio
def alternar_ativo(produto_id: int):
    """HU 13 CA#2: liga/desliga o produto na vitrine sem apagá-lo."""
    produto = _produto(produto_id)
    dados = corpo_json()
    if not isinstance(dados.get("ativo"), bool):
        raise APIError("Informe ativo: true ou false.", campo="ativo")
    produto.ativo = dados["ativo"]
    db.session.commit()
    return jsonify(produto_json(produto, admin=True))


@bp.post("/uploads")
@admin_obrigatorio
def enviar_imagem():
    """HU 13 CA#1 + RNF: upload de foto com limite de 2 MB (MAX_CONTENT_LENGTH)."""
    arquivo = request.files.get("arquivo")
    if arquivo is None or not arquivo.filename:
        raise APIError("Selecione uma imagem.", campo="arquivo")
    extensao = arquivo.filename.rsplit(".", 1)[-1].lower() if "." in arquivo.filename else ""
    if extensao not in EXTENSOES_IMAGEM:
        raise APIError("Formato não suportado. Use PNG, JPG ou WEBP.", campo="arquivo")

    pasta = Path(current_app.config["UPLOAD_FOLDER"])
    pasta.mkdir(parents=True, exist_ok=True)
    nome = f"{uuid.uuid4().hex}.{extensao}"
    arquivo.save(pasta / nome)
    return jsonify({"url": url_for("uploads.servir_imagem", nome=nome, _external=True)}), 201


@bp_uploads.get("/uploads/<path:nome>")
def servir_imagem(nome: str):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], nome, max_age=86400)


# ---------------------------------------------------------------- fila (HU 14)
@bp.get("/pedidos")
@admin_obrigatorio
def fila_pedidos():
    """Pedidos pagos e em andamento, do mais antigo para o mais novo (RN09)."""
    expirar_pix_vencidos()
    pedidos = (
        Pedido.query.filter(Pedido.status.in_(STATUS_FILA))
        .order_by(Pedido.criado_em.asc(), Pedido.id.asc())
        .all()
    )
    return jsonify([pedido_json(p, admin=True) for p in pedidos])


@bp.patch("/pedidos/<int:pedido_id>/status")
@admin_obrigatorio
def mudar_status(pedido_id: int):
    pedido = db.session.get(Pedido, pedido_id)
    if pedido is None:
        raise APIError("Pedido não encontrado.", 404)
    try:
        novo = StatusPedido(str(corpo_json().get("status", "")).upper())
    except ValueError:
        raise APIError("Status inválido.", campo="status")

    if novo == StatusPedido.CANCELADO:
        ok = pedido.cancelar()
    else:
        ok = pedido.avancar_status(novo)
    if not ok:
        raise APIError(f"Não é possível mudar o pedido de {pedido.status.value} para {novo.value}.", 409)
    db.session.commit()
    return jsonify(pedido_json(pedido, admin=True))
