import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from .config import Config
from .controllers import BLUEPRINTS
from .errors import registrar_handlers
from .extensions import db

load_dotenv()


def create_app(config_class=Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)
    os.makedirs(app.instance_path, exist_ok=True)  # pasta do SQLite local
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)  # HTTPS correto atrás do proxy da hospedagem

    origens = app.config["CORS_ORIGINS"]
    CORS(app, resources={r"/api/*": {"origins": origens.split(",") if origens != "*" else "*"}})

    db.init_app(app)
    registrar_handlers(app)
    for bp in BLUEPRINTS:
        app.register_blueprint(bp)

    @app.get("/api/saude")
    def saude():
        return jsonify({"status": "ok"})

    from .seed import registrar_comandos
    registrar_comandos(app)

    with app.app_context():
        db.create_all()

    return app
