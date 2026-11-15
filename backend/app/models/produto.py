from ..extensions import agora, db

produto_categoria = db.Table(
    "produto_categoria",
    db.Column("produto_id", db.Integer, db.ForeignKey("produto.id", ondelete="CASCADE"), primary_key=True),
    db.Column("categoria_id", db.Integer, db.ForeignKey("categoria.id", ondelete="RESTRICT"), primary_key=True),
)


class Categoria(db.Model):
    __tablename__ = "categoria"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(60), nullable=False, unique=True)


class Produto(db.Model):
    __tablename__ = "produto"
    __table_args__ = (
        db.CheckConstraint("preco > 0", name="ck_produto_preco"),
        db.CheckConstraint("peso_gramas > 0", name="ck_produto_peso"),
        db.CheckConstraint("estoque_diario >= 0", name="ck_produto_estoque"),
    )

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    ingredientes = db.Column(db.Text, nullable=False)
    alergenos = db.Column(db.String(255), nullable=True)
    peso_gramas = db.Column(db.Integer, nullable=False)
    preco = db.Column(db.Numeric(10, 2), nullable=False)
    estoque_diario = db.Column(db.Integer, nullable=False, default=0)       # RN07
    ativo = db.Column(db.Boolean, nullable=False, default=True, index=True)  # RN04
    imagem_url = db.Column(db.String(500), nullable=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)

    categorias = db.relationship("Categoria", secondary=produto_categoria, lazy="selectin")

    @property
    def esgotado(self) -> bool:
        return self.estoque_diario <= 0

    def esta_disponivel(self, quantidade: int) -> bool:
        """RN04 + RN07: produto ativo e com estoque diário suficiente."""
        return self.ativo and 1 <= quantidade <= self.estoque_diario

    def baixar_estoque(self, quantidade: int) -> None:
        self.estoque_diario -= quantidade

    def devolver_estoque(self, quantidade: int) -> None:
        self.estoque_diario += quantidade
