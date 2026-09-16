from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy import func
from sqlalchemy.orm import selectinload

from auth_utils import login_requerido, roles_requeridos
from extensions import db
from models import Area, Proceso

procesos_bp = Blueprint("procesos", __name__, url_prefix="/api/procesos")


def fecha(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def _es_activo(valor):
    return str(valor or "Activo").strip().lower() != "inactivo"


def full(proceso):
    data = proceso.to_dict()
    data["area"] = proceso.area.to_dict() if proceso.area else None
    documentos_visibles = [d for d in proceso.documentos if _es_activo(d.estado)]
    data["documentos"] = [d.to_dict() for d in documentos_visibles]
    data["total_documentos"] = len(documentos_visibles)
    data["estado_visual"] = "Crítico" if proceso.es_critico else "Activo"
    return data


@procesos_bp.get("")
@login_requerido
def listar():
    q = (request.args.get("q") or "").strip()
    area_id = request.args.get("area_id", type=int)
    tipo = (request.args.get("tipo") or "").strip()
    critico = (request.args.get("critico") or "").lower()
    estado = (request.args.get("estado") or "").strip()
    query = Proceso.query.options(
        selectinload(Proceso.area),
        selectinload(Proceso.documentos),
    ).join(Area)
    # Los inactivos se conservan en BD, pero no se muestran en los listados.
    query = query.filter(
        func.lower(Proceso.estado) != "inactivo",
        func.lower(Area.estado) != "inactivo",
    )
    if q:
        patron = f"%{q}%"
        query = query.filter(
            db.or_(
                Proceso.codigo.ilike(patron),
                Proceso.nombre.ilike(patron),
                Proceso.responsable.ilike(patron),
                Proceso.persona_responsable.ilike(patron),
                Area.nombre.ilike(patron),
            )
        )
    if area_id:
        query = query.filter(Proceso.area_id == area_id)
    if tipo:
        query = query.filter(Proceso.tipo == tipo)
    if critico in ("1", "true", "si", "sí"):
        query = query.filter(Proceso.es_critico.is_(True))
    if critico in ("0", "false", "no"):
        query = query.filter(Proceso.es_critico.is_(False))
    if estado:
        estado_normalizado = estado.strip().lower().replace("í", "i")
        if estado_normalizado == "critico":
            query = query.filter(Proceso.es_critico.is_(True))
        elif estado_normalizado == "activo":
            query = query.filter(Proceso.es_critico.is_(False))
    return jsonify({"procesos": [full(x) for x in query.order_by(Proceso.nombre.asc()).all()]})


@procesos_bp.get("/meta")
@login_requerido
def meta():
    tipos = [
        x[0]
        for x in db.session.query(Proceso.tipo)
        .filter(Proceso.tipo.isnot(None), Proceso.tipo != "")
        .distinct()
        .order_by(Proceso.tipo)
        .all()
    ]
    areas = Area.query.filter(func.lower(Area.estado) != "inactivo").order_by(Area.nombre).all()
    return jsonify({"areas": [a.to_dict() for a in areas], "tipos": tipos})


@procesos_bp.get("/criticos")
@login_requerido
def criticos():
    procesos = (
        Proceso.query.options(selectinload(Proceso.area), selectinload(Proceso.documentos))
        .join(Area)
        .filter(
            Proceso.es_critico.is_(True),
            func.lower(Proceso.estado) != "inactivo",
            func.lower(Area.estado) != "inactivo",
        )
        .order_by(Proceso.nombre)
        .all()
    )
    return jsonify({"procesos": [full(x) for x in procesos]})


@procesos_bp.get("/<int:pid>")
@login_requerido
def detalle(pid):
    proceso = (
        Proceso.query.options(selectinload(Proceso.area), selectinload(Proceso.documentos))
        .filter(Proceso.id == pid)
        .first()
    )
    if not proceso:
        return jsonify({"error": "Proceso no encontrado"}), 404
    return jsonify({"proceso": full(proceso)})


def validar(data, pid=None):
    codigo = str(data.get("codigo", "")).strip().upper()
    nombre = str(data.get("nombre", "")).strip()
    try:
        area_id = int(data.get("area_id"))
    except (TypeError, ValueError):
        area_id = None
    if not codigo or not nombre or not area_id:
        return None, "Código, área y nombre son obligatorios"
    if not db.session.get(Area, area_id):
        return None, "El área seleccionada no existe"
    query = Proceso.query.filter(func.upper(func.trim(Proceso.codigo)) == codigo)
    if pid:
        query = query.filter(Proceso.id != pid)
    if query.first():
        return None, "Ya existe un proceso con ese código"
    return {"codigo": codigo, "nombre": nombre, "area_id": area_id}, None


def aplicar(proceso, data):
    proceso.tipo = str(data.get("tipo", "")).strip() or None
    proceso.responsable = str(data.get("responsable", "")).strip() or None
    proceso.persona_responsable = str(data.get("persona_responsable", "")).strip() or None
    proceso.objetivo = str(data.get("objetivo", "")).strip() or None
    proceso.es_critico = bool(data.get("es_critico", False))
    proceso.areas_relacionadas = str(data.get("areas_relacionadas", "")).strip() or None
    proceso.fecha_actualizacion = fecha(data.get("fecha_actualizacion"))
    estado = str(data.get("estado", proceso.estado or "Activo")).strip().title()
    proceso.estado = estado if estado in {"Activo", "Inactivo"} else "Activo"


@procesos_bp.post("")
@roles_requeridos("administrador")
def crear():
    data = request.get_json(silent=True) or {}
    base, error = validar(data)
    if error:
        return jsonify({"error": error}), 409 if "existe un proceso" in error else 400
    proceso = Proceso(**base)
    aplicar(proceso, data)
    db.session.add(proceso)
    db.session.commit()
    return jsonify({"proceso": full(proceso)}), 201


@procesos_bp.put("/<int:pid>")
@roles_requeridos("administrador")
def editar(pid):
    proceso = db.session.get(Proceso, pid)
    if not proceso:
        return jsonify({"error": "Proceso no encontrado"}), 404
    data = request.get_json(silent=True) or {}
    base, error = validar(data, pid)
    if error:
        return jsonify({"error": error}), 409 if "existe un proceso" in error else 400
    proceso.codigo = base["codigo"]
    proceso.nombre = base["nombre"]
    proceso.area_id = base["area_id"]
    aplicar(proceso, data)
    db.session.commit()
    return jsonify({"proceso": full(proceso)})


@procesos_bp.delete("/<int:pid>")
@roles_requeridos("administrador")
def eliminar(pid):
    proceso = db.session.get(Proceso, pid)
    if not proceso:
        return jsonify({"error": "Proceso no encontrado"}), 404
    db.session.delete(proceso)
    db.session.commit()
    return jsonify({"status": "ok"})
