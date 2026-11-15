import enum
from datetime import timedelta
from decimal import Decimal

from ..extensions import agora, db


class Modalidade(str, enum.Enum):
    DELIVERY = "DELIVERY"
    RETIRADA = "RETIRADA"


class StatusPedido(str, enum.Enum):
    AGUARDANDO_PAGAMENTO = "AGUARDANDO_PAGAMENTO"
    PAGO = "PAGO"
    EM_PREPARO = "EM_PREPARO"
    PRONTO = "PRONTO"
    SAIU_PARA_ENTREGA = "SAIU_PARA_ENTREGA"
    ENTREGUE = "ENTREGUE"
    CANCELADO = "CANCELADO"


class MetodoPagamento(str, enum.Enum):
    PIX = "PIX"
    CARTAO = "CARTAO"


class StatusPagamento(str, enum.Enum):
    PENDENTE = "PENDENTE"
    APROVADO = "APROVADO"
    RECUSADO = "RECUSADO"


# Status em que o pedido aparece na fila da cozinha (RN09: só depois de pago)
STATUS_FILA = (
    StatusPedido.PAGO,
    StatusPedido.EM_PREPARO,
    StatusPedido.PRONTO,
    StatusPedido.SAIU_PARA_ENTREGA,
)

# Status em que o pedido ainda pode ser cancelado (antes de entrar em preparo)
STATUS_CANCELAVEIS = (StatusPedido.AGUARDANDO_PAGAMENTO, StatusPedido.PAGO)


class Pedido(db.Model):
    __tablename__ = "pedido"
    __table_args__ = (
        db.CheckConstraint("subtotal >= 0", name="ck_pedido_subtotal"),
        db.CheckConstraint("taxa_entrega >= 0", name="ck_pedido_taxa"),
        db.CheckConstraint("total = subtotal + taxa_entrega", name="ck_pedido_total"),
    )

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuario.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = db.Column(db.Enum(StatusPedido, name="status_pedido"), nullable=False,
                       default=StatusPedido.AGUARDANDO_PAGAMENTO, index=True)
    modalidade = db.Column(db.Enum(Modalidade, name="modalidade_pedido"), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    taxa_entrega = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal("0"))
    total = db.Column(db.Numeric(10, 2), nullable=False)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=agora, onupdate=agora)

    usuario = db.relationship("Usuario", back_populates="pedidos")
    itens = db.relationship("ItemPedido", back_populates="pedido", cascade="all, delete-orphan", lazy="selectin")
    endereco = db.relationship("EnderecoEntrega", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    pagamento = db.relationship("Pagamento", uselist=False, back_populates="pedido",
                                cascade="all, delete-orphan", lazy="selectin")

    # ---------- cálculo ----------
    def calcular_total(self, taxa_entrega: Decimal) -> None:
        self.subtotal = sum((item.subtotal() for item in self.itens), Decimal("0"))
        self.taxa_entrega = taxa_entrega if self.modalidade == Modalidade.DELIVERY else Decimal("0")
        self.total = self.subtotal + self.taxa_entrega

    # ---------- ciclo de vida ----------
    def proximos_status(self) -> list[StatusPedido]:
        """Transições permitidas a partir do status atual (usado pela fila da cozinha)."""
        if self.status == StatusPedido.PAGO:
            return [StatusPedido.EM_PREPARO]
        if self.status == StatusPedido.EM_PREPARO:
            return [StatusPedido.PRONTO]
        if self.status == StatusPedido.PRONTO:
            # Delivery sai para entrega; retirada no balcão é entregue direto ao cliente
            if self.modalidade == Modalidade.DELIVERY:
                return [StatusPedido.SAIU_PARA_ENTREGA]
            return [StatusPedido.ENTREGUE]
        if self.status == StatusPedido.SAIU_PARA_ENTREGA:
            return [StatusPedido.ENTREGUE]
        return []

    def avancar_status(self, novo: StatusPedido) -> bool:
        if novo not in self.proximos_status():
            return False
        self.status = novo
        return True

    def pode_cancelar(self) -> bool:
        return self.status in STATUS_CANCELAVEIS

    def cancelar(self) -> bool:
        """Cancela e devolve os itens ao estoque (HU 11 / RN #1)."""
        if not self.pode_cancelar():
            return False
        for item in self.itens:
            item.produto.devolver_estoque(item.quantidade)
        self.status = StatusPedido.CANCELADO
        return True

    # ---------- Pix ----------
    def pix_expira_em(self, minutos: int):
        return self.criado_em + timedelta(minutes=minutos)

    def pix_vencido(self, minutos: int) -> bool:
        return (
            self.status == StatusPedido.AGUARDANDO_PAGAMENTO
            and self.pagamento is not None
            and self.pagamento.metodo == MetodoPagamento.PIX
            and agora() > self.pix_expira_em(minutos)
        )


class ItemPedido(db.Model):
    __tablename__ = "item_pedido"
    __table_args__ = (
        db.UniqueConstraint("pedido_id", "produto_id", name="uq_item_pedido_produto"),
        db.CheckConstraint("quantidade >= 1", name="ck_item_quantidade"),       # RN06
        db.CheckConstraint("preco_unitario > 0", name="ck_item_preco"),
    )

    id = db.Column(db.Integer, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey("pedido.id", ondelete="CASCADE"), nullable=False)
    produto_id = db.Column(db.Integer, db.ForeignKey("produto.id", ondelete="RESTRICT"), nullable=False)
    quantidade = db.Column(db.Integer, nullable=False)
    preco_unitario = db.Column(db.Numeric(10, 2), nullable=False)               # RN10

    pedido = db.relationship("Pedido", back_populates="itens")
    produto = db.relationship("Produto", lazy="joined")

    def subtotal(self) -> Decimal:
        return Decimal(self.preco_unitario) * self.quantidade


class EnderecoEntrega(db.Model):
    __tablename__ = "endereco_entrega"

    pedido_id = db.Column(db.Integer, db.ForeignKey("pedido.id", ondelete="CASCADE"), primary_key=True)
    cep = db.Column(db.String(8), nullable=False)
    rua = db.Column(db.String(150), nullable=False)
    numero = db.Column(db.String(10), nullable=False)
    bairro = db.Column(db.String(100), nullable=False)
    cidade = db.Column(db.String(100), nullable=False)
    referencia = db.Column(db.String(150), nullable=True)


class Pagamento(db.Model):
    __tablename__ = "pagamento"
    __table_args__ = (db.CheckConstraint("valor > 0", name="ck_pagamento_valor"),)

    id = db.Column(db.Integer, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey("pedido.id", ondelete="CASCADE"), nullable=False, unique=True)
    metodo = db.Column(db.Enum(MetodoPagamento, name="metodo_pagamento"), nullable=False)
    status = db.Column(db.Enum(StatusPagamento, name="status_pagamento"), nullable=False,
                       default=StatusPagamento.PENDENTE)
    valor = db.Column(db.Numeric(10, 2), nullable=False)
    pago_em = db.Column(db.DateTime, nullable=True)

    pedido = db.relationship("Pedido", back_populates="pagamento")

    def aprovar(self) -> None:
        self.status = StatusPagamento.APROVADO
        self.pago_em = agora()
        self.pedido.status = StatusPedido.PAGO
