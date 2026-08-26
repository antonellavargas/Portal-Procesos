from flask import Blueprint, current_app, jsonify
from sqlalchemy import text

from extensions import db


health_bp = Blueprint("health", __name__, url_prefix="/api/health")


@health_bp.get("")
def health():
    return jsonify(
        {
            "status": "ok",
            "service": "Portal Gestión de Procesos API",
        }
    )


@health_bp.get("/db")
def health_db():
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify(
            {
                "status": "ok",
                "database": "connected",
                "dialect": db.engine.dialect.name,
            }
        )
    except Exception as exc:
        current_app.logger.exception("Error comprobando la base de datos")
        return (
            jsonify(
                {
                    "status": "error",
                    "database": "disconnected",
                    "message": str(exc),
                }
            ),
            500,
        )
