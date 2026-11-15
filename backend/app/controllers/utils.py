from decimal import Decimal, InvalidOperation

from flask import request

from ..errors import APIError


def corpo_json() -> dict:
    dados = request.get_json(silent=True)
    if not isinstance(dados, dict):
        raise APIError("Envie os dados no formato JSON.")
    return dados


def texto(dados: dict, campo: str, rotulo: str, obrigatorio: bool = True, maximo: int | None = None) -> str | None:
    valor = dados.get(campo)
    valor = str(valor).strip() if valor is not None else ""
    if not valor:
        if obrigatorio:
            raise APIError(f"Informe {rotulo}.", campo=campo)
        return None
    if maximo and len(valor) > maximo:
        raise APIError(f"{rotulo.capitalize()} deve ter no máximo {maximo} caracteres.", campo=campo)
    return valor


def inteiro(dados: dict, campo: str, rotulo: str, minimo: int | None = None) -> int:
    valor = dados.get(campo)
    if isinstance(valor, bool):
        raise APIError(f"{rotulo.capitalize()} inválido.", campo=campo)
    try:
        numero = int(valor)
        if str(numero) != str(valor).strip() and not isinstance(valor, int):
            raise ValueError
    except (TypeError, ValueError):
        raise APIError(f"{rotulo.capitalize()} deve ser um número inteiro.", campo=campo)
    if minimo is not None and numero < minimo:
        raise APIError(f"{rotulo.capitalize()} deve ser no mínimo {minimo}.", campo=campo)
    return numero


def dinheiro(dados: dict, campo: str, rotulo: str) -> Decimal:
    try:
        valor = Decimal(str(dados.get(campo)).replace(",", "."))
    except (InvalidOperation, TypeError):
        raise APIError(f"{rotulo.capitalize()} inválido.", campo=campo)
    if not valor.is_finite():
        raise APIError(f"{rotulo.capitalize()} inválido.", campo=campo)
    return valor.quantize(Decimal("0.01"))
