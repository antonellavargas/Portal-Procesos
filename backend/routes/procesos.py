from datetime import datetime
from flask import Blueprint, jsonify, request
from sqlalchemy import func
from extensions import db
from models import Area, Proceso
from auth_utils import login_requerido, roles_requeridos

procesos_bp=Blueprint('procesos',__name__,url_prefix='/api/procesos')

def fecha(v):
    if not v: return None
    try: return datetime.strptime(v,'%Y-%m-%d').date()
    except (TypeError,ValueError): return None

def full(p):
    d=p.to_dict(); d['area']=p.area.to_dict() if p.area else None; d['total_documentos']=len(p.documentos); return d

@procesos_bp.get('')
@login_requerido
def listar():
    q=(request.args.get('q') or '').strip(); area_id=request.args.get('area_id',type=int); tipo=(request.args.get('tipo') or '').strip(); critico=(request.args.get('critico') or '').lower()
    query=Proceso.query.join(Area)
    if q:
        p=f'%{q}%'; query=query.filter(db.or_(Proceso.codigo.ilike(p),Proceso.nombre.ilike(p),Proceso.responsable.ilike(p),Proceso.persona_responsable.ilike(p),Area.nombre.ilike(p)))
    if area_id: query=query.filter(Proceso.area_id==area_id)
    if tipo: query=query.filter(Proceso.tipo==tipo)
    if critico in ('1','true','si','sí'): query=query.filter(Proceso.es_critico.is_(True))
    if critico in ('0','false','no'): query=query.filter(Proceso.es_critico.is_(False))
    return jsonify({'procesos':[full(x) for x in query.order_by(Proceso.nombre.asc()).all()]})

@procesos_bp.get('/meta')
@login_requerido
def meta():
    tipos=[x[0] for x in db.session.query(Proceso.tipo).filter(Proceso.tipo.isnot(None),Proceso.tipo!='').distinct().order_by(Proceso.tipo).all()]
    return jsonify({'areas':[a.to_dict() for a in Area.query.order_by(Area.nombre).all()],'tipos':tipos})

@procesos_bp.get('/criticos')
@login_requerido
def criticos(): return jsonify({'procesos':[full(x) for x in Proceso.query.filter_by(es_critico=True).order_by(Proceso.nombre).all()]})

@procesos_bp.get('/<int:pid>')
@login_requerido
def detalle(pid):
    p=db.session.get(Proceso,pid)
    if not p: return jsonify({'error':'Proceso no encontrado'}),404
    d=full(p); d['documentos']=[x.to_dict() for x in p.documentos]; return jsonify({'proceso':d})

def validar(d,pid=None):
    codigo=str(d.get('codigo','')).strip().upper(); nombre=str(d.get('nombre','')).strip(); aid=d.get('area_id')
    try: aid=int(aid)
    except: aid=None
    if not codigo or not nombre or not aid: return None,'Código, área y nombre son obligatorios'
    if not db.session.get(Area,aid): return None,'El área seleccionada no existe'
    q=Proceso.query.filter(func.upper(func.trim(Proceso.codigo))==codigo)
    if pid: q=q.filter(Proceso.id!=pid)
    if q.first(): return None,'Ya existe un proceso con ese código'
    return {'codigo':codigo,'nombre':nombre,'area_id':aid},None

@procesos_bp.post('')
@roles_requeridos('administrador')
def crear():
    d=request.get_json(silent=True) or {}; base,err=validar(d)
    if err:return jsonify({'error':err}),409 if 'existe un proceso' in err else 400
    p=Proceso(**base); aplicar(p,d); db.session.add(p); db.session.commit(); return jsonify({'proceso':full(p)}),201

@procesos_bp.put('/<int:pid>')
@roles_requeridos('administrador')
def editar(pid):
    p=db.session.get(Proceso,pid)
    if not p:return jsonify({'error':'Proceso no encontrado'}),404
    d=request.get_json(silent=True) or {}; base,err=validar(d,pid)
    if err:return jsonify({'error':err}),409 if 'existe un proceso' in err else 400
    p.codigo=base['codigo'];p.nombre=base['nombre'];p.area_id=base['area_id']; aplicar(p,d); db.session.commit(); return jsonify({'proceso':full(p)})

def aplicar(p,d):
    p.tipo=str(d.get('tipo','')).strip() or None; p.responsable=str(d.get('responsable','')).strip() or None; p.persona_responsable=str(d.get('persona_responsable','')).strip() or None; p.objetivo=str(d.get('objetivo','')).strip() or None; p.es_critico=bool(d.get('es_critico',False)); p.areas_relacionadas=str(d.get('areas_relacionadas','')).strip() or None; p.fecha_actualizacion=fecha(d.get('fecha_actualizacion'))

@procesos_bp.delete('/<int:pid>')
@roles_requeridos('administrador')
def eliminar(pid):
    p=db.session.get(Proceso,pid)
    if not p:return jsonify({'error':'Proceso no encontrado'}),404
    db.session.delete(p); db.session.commit(); return jsonify({'status':'ok'})
