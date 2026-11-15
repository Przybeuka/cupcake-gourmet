"""Camada View do MVC: converte os models em JSON para o front-end."""
from flask import current_app

from ..models import Categoria, Pedido, Produto, Usuario


def _dinheiro(valor) -> float:
    return float(round(valor, 2))


def _data(valor):
    return valor.isoformat() + "Z" if valor else None


def usuario_json(u: Usuario) -> dict:
    return {"id": u.id, "nome": u.nome, "email": u.email, "perfil": u.perfil.value}


def categoria_json(c: Categoria) -> dict:
    return {"id": c.id, "nome": c.nome}


def produto_json(p: Produto, admin: bool = False) -> dict:
    dados = {
        "id": p.id,
        "nome": p.nome,
        "descricao": p.descricao,
        "ingredientes": p.ingredientes,
        "alergenos": p.alergenos,
        "peso_gramas": p.peso_gramas,
        "preco": _dinheiro(p.preco),
        "estoque_diario": p.estoque_diario,
        "esgotado": p.esgotado,
        "imagem_url": p.imagem_url,
        "categorias": [categoria_json(c) for c in sorted(p.categorias, key=lambda c: c.id)],
    }
    if admin:
        dados["ativo"] = p.ativo
    return dados


def pedido_json(p: Pedido, admin: bool = False) -> dict:
    minutos_pix = current_app.config["PIX_EXPIRA_MINUTOS"]
    dados = {
        "id": p.id,
        "status": p.status.value,
        "modalidade": p.modalidade.value,
        "subtotal": _dinheiro(p.subtotal),
        "taxa_entrega": _dinheiro(p.taxa_entrega),
        "total": _dinheiro(p.total),
        "criado_em": _data(p.criado_em),
        "atualizado_em": _data(p.atualizado_em),
        "pode_cancelar": p.pode_cancelar(),
        "itens": [
            {
                "produto_id": i.produto_id,
                "nome": i.produto.nome,
                "quantidade": i.quantidade,
                "preco_unitario": _dinheiro(i.preco_unitario),
                "subtotal": _dinheiro(i.subtotal()),
            }
            for i in p.itens
        ],
        "endereco": None,
        "pagamento": None,
    }
    if p.endereco:
        e = p.endereco
        dados["endereco"] = {
            "cep": e.cep, "rua": e.rua, "numero": e.numero,
            "bairro": e.bairro, "cidade": e.cidade, "referencia": e.referencia,
        }
    if p.pagamento:
        pg = p.pagamento
        dados["pagamento"] = {
            "metodo": pg.metodo.value,
            "status": pg.status.value,
            "valor": _dinheiro(pg.valor),
            "pago_em": _data(pg.pago_em),
        }
        if pg.metodo.value == "PIX" and pg.status.value == "PENDENTE":
            dados["pagamento"]["pix_codigo"] = codigo_pix(p)
            dados["pagamento"]["pix_expira_em"] = _data(p.pix_expira_em(minutos_pix))
    if admin:
        dados["cliente"] = {"nome": p.usuario.nome, "email": p.usuario.email}
        dados["proximos_status"] = [s.value for s in p.proximos_status()]
    return dados


def codigo_pix(p: Pedido) -> str:
    """Código 'copia e cola' fictício (pagamento simulado, ver escopo M2)."""
    valor = f"{float(p.total):.2f}"
    return f"00020126580014BR.GOV.BCB.PIX0136cupcake-gourmet-pedido-{p.id:06d}5204000053039865406{valor}5802BR6304SIMU"
