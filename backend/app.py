from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db
from routes.health import health_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": app.config["CORS_ORIGINS"],
            }
        },
    )

    app.register_blueprint(health_bp)

    @app.get("/")
    def root():
        return jsonify(
            {
                "service": "Portal Gestión de Procesos API",
                "health": "/api/health",
            }
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
