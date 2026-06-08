# mobil-forma — backend (FastAPI)

Envuelve el motor `engine/genera_cabida.py` (validado, sin cambios) como API.

## Desarrollo local

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Endpoints

- `GET /health` — estado del servicio.
- `POST /cabida` — multipart: `file` (CSV de Forma) + `n_sub` (int). Devuelve `Cabida_N.xlsx`.

## Deploy (Render / Railway)

Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Variable opcional `ALLOWED_ORIGINS` = dominio del frontend Vercel.
