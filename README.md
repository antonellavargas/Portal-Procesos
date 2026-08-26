# Portal de Gestión de Procesos — Migración paso 1

Objetivo de este paso: separar frontend y backend y validar la comunicación local mediante `/api/health`.

## Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Probar: `http://127.0.0.1:8000/api/health`

## Frontend

Abrir otra terminal desde la raíz:

```bash
python -m http.server 5500 --directory docs
```

Abrir: `http://127.0.0.1:5500`

El frontend debe mostrar `Backend conectado ✅`.

## Siguiente paso

Migrar autenticación a API y posteriormente Áreas, Procesos, Documentos y Dashboard.
