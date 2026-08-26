from flask import Blueprint, g, jsonify, request
from sqlalchemy import func
from extensions import db
from models import Area
from auth_utils import login_requerido, roles_requeridos

areas_bp = Blueprint('areas', __name__, url_prefix='/api/areas')

@areas_bp.get('')
@login_requerido
def listar():
    q = (request.args.get('q') or '').strip()
    query = Area.query
    if q:
        p = f'%{q}%'
        query = query.filter(db.or_(Area.codigo.ilike(p), Area.nombre.ilike(p), Area.responsable_area.ilike(p), Area.nombre_personal.ilike(p)))
    areas = query.order_by(Area.nombre.asc()).all()
    data=[]
    for a in areas:
        item=a.to_dict(); item['total_procesos']=len(a.procesos); data.append(item)
    return jsonify({'areas': data})

@areas_bp.get('/<int:area_id>')
@login_requerido
def detalle(area_id):
    a = db.session.get(Area, area_id)
    if not a: return jsonify({'error':'Área no encontrada'}),404
    item=a.to_dict(); item['procesos']=[p.to_dict() for p in sorted(a.procesos,key=lambda x:x.nombre.lower())]
    return jsonify({'area':item})

@areas_bp.post('')
@roles_requeridos('administrador')
def crear():
    d=request.get_json(silent=True) or {}
    codigo=str(d.get('codigo','')).strip().upper(); nombre=str(d.get('nombre','')).strip()
    if not codigo or not nombre: return jsonify({'error':'Código y nombre son obligatorios'}),400
    if Area.query.filter(func.upper(func.trim(Area.codigo))==codigo).first(): return jsonify({'error':'Ya existe un área con ese código'}),409
    if Area.query.filter(func.lower(func.trim(Area.nombre))==nombre.lower()).first(): return jsonify({'error':'Ya existe un área con ese nombre'}),409
    a=Area(codigo=codigo,nombre=nombre,responsable_area=str(d.get('responsable_area','')).strip() or None,nombre_personal=str(d.get('nombre_personal','')).strip() or None,descripcion=str(d.get('descripcion','')).strip() or None)
    db.session.add(a); db.session.commit(); return jsonify({'area':a.to_dict()}),201

@areas_bp.put('/<int:area_id>')
@roles_requeridos('administrador')
def editar(area_id):
    a=db.session.get(Area,area_id)
    if not a: return jsonify({'error':'Área no encontrada'}),404
    d=request.get_json(silent=True) or {}; codigo=str(d.get('codigo','')).strip().upper(); nombre=str(d.get('nombre','')).strip()
    if not codigo or not nombre: return jsonify({'error':'Código y nombre son obligatorios'}),400
    dup=Area.query.filter(Area.id!=a.id, func.upper(func.trim(Area.codigo))==codigo).first()
    if dup: return jsonify({'error':'Ya existe otra área con ese código'}),409
    dup=Area.query.filter(Area.id!=a.id, func.lower(func.trim(Area.nombre))==nombre.lower()).first()
    if dup: return jsonify({'error':'Ya existe otra área con ese nombre'}),409
    a.codigo=codigo; a.nombre=nombre; a.responsable_area=str(d.get('responsable_area','')).strip() or None; a.nombre_personal=str(d.get('nombre_personal','')).strip() or None; a.descripcion=str(d.get('descripcion','')).strip() or None
    db.session.commit(); return jsonify({'area':a.to_dict()})

@areas_bp.delete('/<int:area_id>')
@roles_requeridos('administrador')
def eliminar(area_id):
    a=db.session.get(Area,area_id)
    if not a: return jsonify({'error':'Área no encontrada'}),404
    if a.procesos: return jsonify({'error':'No se puede eliminar un área que tiene procesos asociados'}),409
    db.session.delete(a); db.session.commit(); return jsonify({'status':'ok'})
