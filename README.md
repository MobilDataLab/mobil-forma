# mobil-forma

Aplicación de análisis de cabida para Autodesk Forma — Mobil Arquitectos.
A partir de un CSV exportado de Forma y un número de subdivisiones, genera un
Excel `Cabida_N.xlsx` con formato institucional (colores canónicos por función,
subtotales y totales).

## Arquitectura

```
mobil-forma/
├── backend/          API FastAPI que envuelve el motor validado
│   ├── engine/       genera_cabida.py (motor v1.8, sin cambios)
│   ├── main.py       endpoints /health y /cabida
│   └── requirements.txt
└── frontend/         React + Vite (UI con branding Mobil)
    └── src/App.tsx   carga CSV + n_sub → descarga Excel
```

## Quickstart

Backend:
```bash
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend:
```bash
cd frontend && npm install && npm run dev
```

## Deploy

- Frontend → Vercel (`npm run build`, output `dist`, var `VITE_API_URL`).
- Backend → Render / Railway (`uvicorn main:app --host 0.0.0.0 --port $PORT`).

## Estado

Skill `mobil-forma` v1.8 en transición a aplicación web.
