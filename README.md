# Portal de Gestión de Procesos — versión consolidada

Esta es la base única del proyecto. Ya no es necesario copiar archivos desde los ZIP de pasos anteriores.

## Incluye

- Frontend estático en `docs/` preparado para GitHub Pages.
- Backend Flask API en `backend/` preparado para Azure App Service.
- SQLAlchemy con SQLite como fallback local y Azure Database for MySQL mediante variables de entorno.
- JWT para autenticación.
- Roles administrador/consulta.
- CRUD de Áreas, Procesos y Documentos.
- Dashboard y Reportes.
- CORS configurable.
- Conexión MySQL con TLS.
- GitHub Actions para desplegar el backend a Azure App Service.

## Desarrollo local

### Backend

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

API local: `http://127.0.0.1:8000`

### Frontend

Desde la raíz, en otra terminal:

```powershell
python -m http.server 5500 --directory docs
```

Frontend local: `http://127.0.0.1:5500`

## Azure / GitHub

Consulta `DEPLOYMENT.md`.
