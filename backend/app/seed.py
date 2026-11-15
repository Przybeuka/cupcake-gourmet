"""Dados iniciais: categorias, usuário administrador e cardápio de exemplo.

Uso:  flask --app run seed
"""
import os
from decimal import Decimal

import click

from .extensions import db
from .models import Categoria, Perfil, Produto, Usuario

CATEGORIAS = ["Tradicionais", "Veganos", "Zero Lactose", "Sem Glúten"]

PRODUTOS = [
    {
        "nome": "Red Velvet", "preco": "12.90", "peso_gramas": 110, "estoque_diario": 30,
        "descricao": "Massa aveludada de cacau com toque de baunilha e cobertura de cream cheese.",
        "ingredientes": "Farinha de trigo, açúcar, cacau, leite, ovos, manteiga, cream cheese, corante natural de beterraba.",
        "alergenos": "Contém glúten, leite e ovos.", "categorias": ["Tradicionais"],
    },
    {
        "nome": "Chocolate Belga", "preco": "13.90", "peso_gramas": 120, "estoque_diario": 25,
        "descricao": "Massa úmida de chocolate 70% com ganache de chocolate belga.",
        "ingredientes": "Farinha de trigo, chocolate belga 70%, açúcar, ovos, manteiga, creme de leite.",
        "alergenos": "Contém glúten, leite e ovos. Pode conter traços de nozes.", "categorias": ["Tradicionais"],
    },
    {
        "nome": "Limão Siciliano", "preco": "11.90", "peso_gramas": 105, "estoque_diario": 20,
        "descricao": "Massa cítrica com recheio de curd de limão e merengue maçaricado.",
        "ingredientes": "Farinha de trigo, limão siciliano, açúcar, ovos, manteiga.",
        "alergenos": "Contém glúten, leite e ovos.", "categorias": ["Tradicionais"],
    },
    {
        "nome": "Cenoura com Brigadeiro Vegano", "preco": "13.50", "peso_gramas": 110, "estoque_diario": 15,
        "descricao": "Massa de cenoura fofinha com brigadeiro de cacau e leite de coco.",
        "ingredientes": "Farinha de trigo, cenoura, açúcar demerara, óleo de girassol, cacau, leite de coco.",
        "alergenos": "Contém glúten.", "categorias": ["Veganos", "Zero Lactose"],
    },
    {
        "nome": "Frutas Vermelhas Sem Glúten", "preco": "14.90", "peso_gramas": 115, "estoque_diario": 12,
        "descricao": "Massa de farinha de arroz e amêndoas com compota de frutas vermelhas.",
        "ingredientes": "Farinha de arroz, farinha de amêndoas, ovos, açúcar, morango, framboesa, mirtilo, manteiga.",
        "alergenos": "Contém ovos, leite e amêndoas. Não contém glúten.", "categorias": ["Sem Glúten"],
    },
    {
        "nome": "Coco e Maracujá Vegano Sem Glúten", "preco": "15.50", "peso_gramas": 110, "estoque_diario": 10,
        "descricao": "Massa de coco sem glúten com creme de maracujá à base de leite de coco.",
        "ingredientes": "Farinha de arroz, coco ralado, leite de coco, maracujá, açúcar demerara, óleo de coco.",
        "alergenos": "Não contém glúten, leite nem ovos.", "categorias": ["Veganos", "Zero Lactose", "Sem Glúten"],
    },
    {
        "nome": "Doce de Leite Zero Lactose", "preco": "12.50", "peso_gramas": 110, "estoque_diario": 18,
        "descricao": "Massa amanteigada sem lactose recheada com doce de leite zero lactose.",
        "ingredientes": "Farinha de trigo, leite zero lactose, ovos, açúcar, manteiga sem lactose.",
        "alergenos": "Contém glúten e ovos. Contém leite (sem lactose).", "categorias": ["Zero Lactose"],
    },
    {
        "nome": "Pistache", "preco": "16.90", "peso_gramas": 120, "estoque_diario": 0,
        "descricao": "Massa de baunilha com creme de pistache siciliano. Produção limitada.",
        "ingredientes": "Farinha de trigo, pistache, açúcar, ovos, manteiga, creme de leite.",
        "alergenos": "Contém glúten, leite, ovos e pistache (castanha).", "categorias": ["Tradicionais"],
    },
]


def popular_banco() -> dict:
    criados = {"categorias": 0, "produtos": 0, "admin": False}

    categorias = {c.nome: c for c in Categoria.query.all()}
    for nome in CATEGORIAS:
        if nome not in categorias:
            categorias[nome] = Categoria(nome=nome)
            db.session.add(categorias[nome])
            criados["categorias"] += 1

    email_admin = os.getenv("ADMIN_EMAIL", "admin@cupcakegourmet.com")
    if not Usuario.query.filter_by(email=email_admin).first():
        admin = Usuario(nome="Administrador da Loja", email=email_admin, perfil=Perfil.ADMIN)
        admin.definir_senha(os.getenv("ADMIN_SENHA", "Admin1234"))
        db.session.add(admin)
        criados["admin"] = True

    if Produto.query.count() == 0:
        for dados in PRODUTOS:
            produto = Produto(
                nome=dados["nome"], descricao=dados["descricao"], ingredientes=dados["ingredientes"],
                alergenos=dados["alergenos"], peso_gramas=dados["peso_gramas"],
                preco=Decimal(dados["preco"]), estoque_diario=dados["estoque_diario"], ativo=True,
                categorias=[categorias[n] for n in dados["categorias"]],
            )
            db.session.add(produto)
            criados["produtos"] += 1

    db.session.commit()
    return criados


def registrar_comandos(app):
    @app.cli.command("seed")
    def seed():
        """Cria categorias, administrador e cardápio de exemplo."""
        resultado = popular_banco()
        click.echo(f"Seed concluído: {resultado}")
