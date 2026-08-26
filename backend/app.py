import click
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db
from models import Usuario
from routes.auth import auth_bp
from routes.health import health_bp
from routes.areas import areas_bp
from routes.procesos import procesos_bp
from routes.documentos import documentos_bp
from routes.dashboard import dashboard_bp
from routes.reportes import reportes_bp

# Importar modelos registra las tablas en SQLAlchemy.
import models  # noqa: F401, E402


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": app.config["CORS_ORIGINS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            }
        },
    )

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(areas_bp)
    app.register_blueprint(procesos_bp)
    app.register_blueprint(documentos_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(reportes_bp)

    @app.get("/")
    def root():
        return jsonify(
            {
                "service": "Portal Gestión de Procesos API",
                "health": "/api/health",
                "database_health": "/api/health/db",
                "auth_login": "/api/auth/login",
                "auth_me": "/api/auth/me",
            }
        )

    @app.cli.command("init-db")
    def init_db():
        """Crea las tablas que todavía no existen."""
        db.create_all()
        click.echo("Base de datos inicializada correctamente.")

    @app.cli.command("create-admin")
    @click.option("--username", prompt=True, help="Usuario administrador")
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
    @click.option("--nombre", prompt="Nombre", default="Administrador")
    def create_admin(username, password, nombre):
        """Crea o actualiza un usuario con rol administrador."""
        db.create_all()
        username = username.strip()
        usuario = Usuario.query.filter_by(username=username).first()

        if usuario:
            usuario.nombre = nombre.strip() or "Administrador"
            usuario.rol = "administrador"
            usuario.activo = True
            usuario.establecer_password(password)
            accion = "actualizado"
        else:
            usuario = Usuario(
                nombre=nombre.strip() or "Administrador",
                username=username,
                rol="administrador",
                activo=True,
            )
            usuario.establecer_password(password)
            db.session.add(usuario)
            accion = "creado"

        db.session.commit()
        click.echo(f"Administrador '{username}' {accion} correctamente.")

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
