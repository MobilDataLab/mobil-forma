# mobil-forma — frontend (React + Vite)

UI de carga de CSV de Forma y descarga del Excel de cabida. Branding Mobil.

## Desarrollo

```bash
cd frontend
npm install
cp .env.example .env   # ajustar VITE_API_URL si el backend no esta en localhost:8000
npm run dev
```

## Build / Deploy (Vercel)

- Build command: `npm run build`
- Output dir: `dist`
- Variable de entorno: `VITE_API_URL` = URL del backend FastAPI.
