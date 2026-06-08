# mobil-forma — app (React + Vite + Pyodide)

App 100% frontend. El motor de cabida (`public/cabida_core.py`) corre en el
navegador vía Pyodide (Python/WASM); no hay backend. El CSV nunca sale del equipo.

## Desarrollo

```bash
cd frontend
npm install
npm run dev
```

## Build / Deploy (Vercel — sitio estático)

- Framework preset: Vite
- Build command: `npm run build`
- Output dir: `dist`
- Sin variables de entorno ni backend.

## Cómo funciona

1. Al abrir, carga Pyodide + pandas + openpyxl (≈ una vez, se cachea).
2. `public/cabida_core.py` define `generar_cabida(csv_text, n_sub)` (devuelve xlsx base64)
   y `resumen_cabida(...)` para los KPIs.
3. La UI lee el CSV, lo pasa a Python, recibe el Excel y lo descarga.

> El motor es el de la skill v1.8, adaptado a memoria y con soporte del header
> `Fonction` (export de Forma en francés), además de `Función`/`Function`.
