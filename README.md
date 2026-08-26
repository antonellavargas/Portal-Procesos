# Portal Gestión de Procesos REFAX — Migración hasta Paso 8

Arquitectura objetivo: **GitHub Pages (frontend) → Flask API en Azure App Service → Azure Database for MySQL Flexible Server**.

## Incluido
- Paso 1: frontend ↔ API + `/api/health`
- Paso 2: SQLAlchemy, modelos y conexión preparada para MySQL
- Paso 3: login JWT + roles `administrador` / `usuario`
- Paso 4: Áreas (listar, buscar, crear, editar, eliminar)
- Paso 5: Procesos (listar, filtrar, críticos, crear, editar, eliminar)
- Paso 6: Documentos (listar, filtrar, enlaces, crear, editar, eliminar)
- Paso 7: Dashboard real con KPIs y resúmenes
- Paso 8: Reportes consolidados e impresión/PDF desde navegador

## Ejecutar local
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
flask --app app init-db
flask --app app create-admin
python app.py
```

En otra terminal, desde la raíz:
```powershell
python -m http.server 5500 --directory docs
```
Abrir `http://127.0.0.1:5500`.

## Health checks
- `http://127.0.0.1:8000/api/health`
- `http://127.0.0.1:8000/api/health/db`

## MySQL
Localmente se usa SQLite si `DATABASE_URL` está vacío. Para Azure MySQL, establecer una URL compatible con SQLAlchemy/PyMySQL en `DATABASE_URL`.

## Importante
Esta versión migra primero los campos funcionales del modelo original. Los campos nuevos que estaban visibles en algunas plantillas antiguas pero no existían en el modelo se incorporarán después de estabilizar la migración a Azure.
