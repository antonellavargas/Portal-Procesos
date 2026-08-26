# Portal de Gestión de Procesos — Migración Paso 3

Objetivo: validar autenticación por token y roles antes de migrar los módulos funcionales.

## Backend

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

Endpoints de prueba:

- `GET http://127.0.0.1:8000/api/health`
- `GET http://127.0.0.1:8000/api/health/db`
- `POST http://127.0.0.1:8000/api/auth/login`
- `GET http://127.0.0.1:8000/api/auth/me` (Bearer token)
- `GET http://127.0.0.1:8000/api/auth/admin-check` (solo administrador)

## Frontend

En otra terminal, desde la raíz:

```powershell
python -m http.server 5500 --directory docs
```

Abrir:

`http://127.0.0.1:5500`

El token se guarda en `sessionStorage`, por lo que se elimina al cerrar la sesión del navegador mediante el botón del portal o al limpiar el almacenamiento de la pestaña/sesión.

## Próximo paso

Migrar CRUD y vistas del módulo **Áreas** a endpoints JSON + GitHub Pages.


> Compatibilidad: el rol de solo lectura se conserva internamente como `usuario`, igual que en el proyecto original; funcionalmente corresponde al perfil de consulta.
