"""Gateway de pagamento simulado (escopo M2).

O fluxo e os estados do pagamento são os mesmos de um gateway real, então a troca
por um provedor de verdade fica restrita a este módulo.

Cartões de teste:
- qualquer número válido (algoritmo de Luhn) é APROVADO;
- números terminados em 0002 são RECUSADOS (para demonstrar o fluxo de erro).

Os dados do cartão são validados e descartados: nada é gravado no banco (HU 11 / RN #2).
"""
import re
from dataclasses import dataclass

from ..extensions import agora


@dataclass
class ResultadoCartao:
    aprovado: bool
    mensagem: str
    campo: str | None = None


def luhn_valido(numero: str) -> bool:
    soma = 0
    for i, digito in enumerate(reversed(numero)):
        n = int(digito)
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n -= 9
        soma += n
    return soma % 10 == 0


def processar_cartao(dados: dict) -> ResultadoCartao:
    numero = re.sub(r"\D", "", str(dados.get("numero", "")))
    nome = str(dados.get("nome", "")).strip()
    validade = str(dados.get("validade", "")).strip()
    cvv = str(dados.get("cvv", "")).strip()

    if not nome:
        return ResultadoCartao(False, "Informe o nome impresso no cartão.", "nome")
    if not (13 <= len(numero) <= 19) or not luhn_valido(numero):
        return ResultadoCartao(False, "Número de cartão inválido.", "numero")

    m = re.fullmatch(r"(\d{2})/(\d{2})", validade)
    if not m or not 1 <= int(m.group(1)) <= 12:
        return ResultadoCartao(False, "Validade inválida. Use o formato MM/AA.", "validade")
    mes, ano = int(m.group(1)), 2000 + int(m.group(2))
    hoje = agora()
    if (ano, mes) < (hoje.year, hoje.month):
        return ResultadoCartao(False, "Cartão vencido.", "validade")

    if not re.fullmatch(r"\d{3,4}", cvv):
        return ResultadoCartao(False, "Código de segurança (CVV) inválido.", "cvv")

    if numero.endswith("0002"):
        return ResultadoCartao(False, "Pagamento recusado pela operadora. Tente outro cartão ou use Pix.")
    return ResultadoCartao(True, "Pagamento aprovado.")
