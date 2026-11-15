from flask import jsonify
from werkzeug.exceptions import HTTPException


class APIError(Exception):
    """Erro de negócio com mensagem amigável para o usuário."""

    def __init__(self, mensagem: str, status: int = 400, campo: str | None = None):
        super().__init__(mensagem)
        self.mensagem = mensagem
        self.status = status
        self.campo = campo


MENSAGENS_HTTP = {
    400: "Requisição inválida.",
    401: "Faça login para continuar.",
    403: "Você não tem permissão para esta ação.",
    404: "Recurso não encontrado.",
    405: "Método não permitido.",
    413: "O arquivo excede o tamanho máximo de 2 MB.",
}


def registrar_handlers(app):
    @app.errorhandler(APIError)
    def _api_error(erro: APIError):
        corpo = {"erro": erro.mensagem}
        if erro.campo:
            corpo["campo"] = erro.campo
        return jsonify(corpo), erro.status

    @app.errorhandler(HTTPException)
    def _http_error(erro: HTTPException):
        mensagem = MENSAGENS_HTTP.get(erro.code, erro.description)
        return jsonify({"erro": mensagem}), erro.code

    @app.errorhandler(Exception)
    def _erro_inesperado(erro: Exception):
        app.logger.exception("Erro inesperado: %s", erro)
        return jsonify({"erro": "Erro interno. Tente novamente em instantes."}), 500
