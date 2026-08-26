from datetime import datetime
from flask import Blueprint, jsonify, request
from extensions import db
from models import Documento, Proceso
from auth_utils import login_requerido, roles_requeridos

documentos_bp=Blueprint('documentos',__name__,url_prefix='/api/documentos')
def fecha(v):
    if not v:return None
    try:return datetime.strptime(v,'%Y-%m-%d').date()
    except:return None
def full(x):
    d=x.to_dict(); d['proceso']={'id':x.proceso.id,'codigo':x.proceso.codigo,'nombre':x.proceso.nombre} if x.proceso else None; return d
@documentos_bp.get('')
@login_requerido
def listar():
    q=(request.args.get('q') or '').strip(); pid=request.args.get('proceso_id',type=int); tipo=(request.args.get('tipo') or '').strip(); query=Documento.query.join(Proceso)
    if pid:query=query.filter(Documento.proceso_id==pid)
    if tipo:query=query.filter(Documento.tipo==tipo)
    if q:
        p=f'%{q}%';query=query.filter(db.or_(Documento.nombre.ilike(p),Documento.tipo.ilike(p),Documento.version.ilike(p),Proceso.nombre.ilike(p),Proceso.codigo.ilike(p)))
    return jsonify({'documentos':[full(x) for x in query.order_by(Documento.nombre).all()]})
@documentos_bp.get('/meta')
@login_requerido
def meta():
    tipos=[x[0] for x in db.session.query(Documento.tipo).filter(Documento.tipo.isnot(None),Documento.tipo!='').distinct().order_by(Documento.tipo).all()]
    return jsonify({'procesos':[{'id':p.id,'codigo':p.codigo,'nombre':p.nombre} for p in Proceso.query.order_by(Proceso.nombre).all()],'tipos':tipos})
@documentos_bp.get('/<int:did>')
@login_requerido
def detalle(did):
    x=db.session.get(Documento,did)
    return jsonify({'documento':full(x)}) if x else (jsonify({'error':'Documento no encontrado'}),404)
def cargar(x,d):
    x.tipo=str(d.get('tipo','')).strip();x.nombre=str(d.get('nombre','')).strip();x.version=str(d.get('version','')).strip() or None;x.fecha_actualizacion=fecha(d.get('fecha_actualizacion'))
    for k in ['enlace_doc','enlace_fluj','enlace_fluj1','enlace_fluj2','enlace_fluj3']:setattr(x,k,str(d.get(k,'')).strip() or None)
def validar(d):
    try:pid=int(d.get('proceso_id'))
    except:pid=None
    if not pid or not str(d.get('tipo','')).strip() or not str(d.get('nombre','')).strip():return None,'Proceso, tipo y nombre son obligatorios'
    if not db.session.get(Proceso,pid):return None,'El proceso seleccionado no existe'
    return pid,None
@documentos_bp.post('')
@roles_requeridos('administrador')
def crear():
    d=request.get_json(silent=True) or {};pid,err=validar(d)
    if err:return jsonify({'error':err}),400
    x=Documento(proceso_id=pid,tipo='',nombre='');cargar(x,d);db.session.add(x);db.session.commit();return jsonify({'documento':full(x)}),201
@documentos_bp.put('/<int:did>')
@roles_requeridos('administrador')
def editar(did):
    x=db.session.get(Documento,did)
    if not x:return jsonify({'error':'Documento no encontrado'}),404
    d=request.get_json(silent=True) or {};pid,err=validar(d)
    if err:return jsonify({'error':err}),400
    x.proceso_id=pid;cargar(x,d);db.session.commit();return jsonify({'documento':full(x)})
@documentos_bp.delete('/<int:did>')
@roles_requeridos('administrador')
def eliminar(did):
    x=db.session.get(Documento,did)
    if not x:return jsonify({'error':'Documento no encontrado'}),404
    db.session.delete(x);db.session.commit();return jsonify({'status':'ok'})
