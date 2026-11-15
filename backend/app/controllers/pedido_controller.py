"""HU 10 (entrega/retirada), HU 11 (pagamento) e HU 12 (acompanhar pedido)."""
import re

from flask import Blueprint, current_app, g, jsonify

from ..auth import login_obrigatorio
from ..errors import APIError
from ..extensions import db
from ..models import (
    EnderecoEntrega,
    ItemPedido,
    MetodoPagamento,
    Modalidade,
    Pagamento,
    Pedido,
    Produto,
    StatusPedido,
)
from ..models.pagamento_simulado import processar_cartao
from ..views.serializers import pedido_json
from .utils import corpo_json, inteiro, texto

bp = Blueprint("pedidos", __name__, url_prefix="/api/pedidos")


def expirar_pix_vencidos() -> None:
    """HU 11 RN #1: Pix não pago em 10 minutos cancela o pedido e devolve o estoque."""
    minutos = current_app.config["PIX_EXPIRA_MINUTOS"]
    pendentes = Pedido.query.filter_by(status=StatusPedido.AGUARDANDO_PAGAMENTO).all()
    alterou = False
    for pedido in pendentes:
        if pedido.pix_vencido(minutos):
            pedido.cancelar()
            alterou = True
    if alterou:
        db.session.commit()


def _ler_itens(dados: dict) -> dict[int, int]:
    itens = dados.get("itens")
    if not isinstance(itens, list) or not itens:
        raise APIError("Seu carrinho está vazio.", campo="itens")
    quantidades: dict[int, int] = {}
    for item in itens:
        if not isinstance(item, dict):
            raise APIError("Item do carrinho inválido.", campo="itens")
        produto_id = inteiro(item, "produto_id", "produto")
        quantidade = inteiro(item, "quantidade", "quantidade", minimo=1)            # RN06
        quantidades[produto_id] = quantidades.get(produto_id, 0) + quantidade
    return quantidades


def _ler_endereco(dados: dict) -> EnderecoEntrega:
    end = dados.get("endereco")
    if not isinstance(end, dict):
        raise APIError("Informe o endereço de entrega.", campo="endereco")
    cep = re.sub(r"\D", "", str(end.get("cep") or ""))
    if len(cep) != 8:                                                             # RN08
        raise APIError("CEP inválido. Informe os 8 dígitos.", campo="cep")
    return EnderecoEntrega(
        cep=cep,
        rua=texto(end, "rua", "a rua", maximo=150),
        numero=texto(end, "numero", "o número", maximo=10),
        bairro=texto(end, "bairro", "o bairro", maximo=100),
        cidade=texto(end, "cidade", "a cidade", maximo=100),
        referencia=texto(end, "referencia", "o ponto de referência", obrigatorio=False, maximo=150),
    )


def _pedido_do_usuario(pedido_id: int) -> Pedido:
    pedido = db.session.get(Pedido, pedido_id)
    if pedido is None or pedido.usuario_id != g.usuario.id:
        raise APIError("Pedido não encontrado.", 404)
    return pedido


@bp.post("")
@login_obrigatorio
def criar_pedido():
    dados = corpo_json()
    quantidades = _ler_itens(dados)

    try:
        modalidade = Modalidade(str(dados.get("modalidade", "")).upper())
    except ValueError:
        raise APIError("Escolha entre entrega (delivery) ou retirada no balcão.", campo="modalidade")
    endereco = _ler_endereco(dados) if modalidade == Modalidade.DELIVERY else None

    pagamento_dados = dados.get("pagamento") or {}
    try:
        metodo = MetodoPagamento(str(pagamento_dados.get("metodo", "")).upper())
    except ValueError:
        raise APIError("Escolha a forma de pagamento: Pix ou cartão.", campo="metodo")

    # Bloqueia as linhas dos produtos para evitar vender acima do estoque em compras simultâneas
    produtos = {
        p.id: p
        for p in Produto.query.filter(Produto.id.in_(quantidades)).with_for_update().all()
    }
    for produto_id, quantidade in quantidades.items():
        produto = produtos.get(produto_id)
        if produto is None or not produto.ativo:
            raise APIError("Um dos produtos do carrinho não está mais disponível.", 409, campo="itens")
        if not produto.esta_disponivel(quantidade):                               # RN07
            restante = max(produto.estoque_diario, 0)
            raise APIError(
                f"Estoque insuficiente de \"{produto.nome}\": restam {restante} unidade(s) hoje.",
                409, campo="itens",
            )

    # Cartão é autorizado antes de gravar qualquer coisa: se recusar, nada é persistido.
    if metodo == MetodoPagamento.CARTAO:
        resultado = processar_cartao(pagamento_dados.get("cartao") or {})
        if not resultado.aprovado:
            status = 400 if resultado.campo else 402
            raise APIError(resultado.mensagem, status, campo=resultado.campo)

    pedido = Pedido(usuario_id=g.usuario.id, modalidade=modalidade, status=StatusPedido.AGUARDANDO_PAGAMENTO)
    for produto_id, quantidade in quantidades.items():
        produto = produtos[produto_id]
        pedido.itens.append(ItemPedido(produto=produto, quantidade=quantidade,
                                       preco_unitario=produto.preco))             # RN10
        produto.baixar_estoque(quantidade)
    pedido.endereco = endereco
    pedido.calcular_total(current_app.config["TAXA_ENTREGA"])                    # RN08
    pedido.pagamento = Pagamento(metodo=metodo, valor=pedido.total)
    db.session.add(pedido)
    db.session.flush()

    if metodo == MetodoPagamento.CARTAO:
        pedido.pagamento.aprovar()                                                # entra na fila (RN09)

    db.session.commit()
    return jsonify(pedido_json(pedido)), 201


@bp.get("")
@login_obrigatorio
def meus_pedidos():
    expirar_pix_vencidos()
    pedidos = g.usuario.pedidos.order_by(Pedido.criado_em.desc(), Pedido.id.desc()).all()
    return jsonify([pedido_json(p) for p in pedidos])


@bp.get("/<int:pedido_id>")
@login_obrigatorio
def detalhar_pedido(pedido_id: int):
    expirar_pix_vencidos()
    return jsonify(pedido_json(_pedido_do_usuario(pedido_id)))


@bp.post("/<int:pedido_id>/pix/confirmar")
@login_obrigatorio
def confirmar_pix(pedido_id: int):
    """Simula a notificação do banco de que o Pix foi pago."""
    pedido = _pedido_do_usuario(pedido_id)
    minutos = current_app.config["PIX_EXPIRA_MINUTOS"]
    if pedido.pix_vencido(minutos):
        pedido.cancelar()
        db.session.commit()
        raise APIError("O código Pix expirou e o pedido foi cancelado. Faça um novo pedido.", 410)
    if (pedido.status != StatusPedido.AGUARDANDO_PAGAMENTO
            or pedido.pagamento is None or pedido.pagamento.metodo != MetodoPagamento.PIX):
        raise APIError("Este pedido não está aguardando pagamento via Pix.", 409)
    pedido.pagamento.aprovar()
    db.session.commit()
    return jsonify(pedido_json(pedido))


@bp.post("/<int:pedido_id>/cancelar")
@login_obrigatorio
def cancelar_pedido(pedido_id: int):
    pedido = _pedido_do_usuario(pedido_id)
    if not pedido.cancelar():
        raise APIError("O pedido já está em preparo e não pode mais ser cancelado.", 409)
    db.session.commit()
    return jsonify(pedido_json(pedido))
