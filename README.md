# mobil-forma

Aplicación de análisis de cabida para Autodesk Forma — Mobil Arquitectos.
A partir de un CSV exportado de Forma y un número de subdivisiones, genera un
Excel con formato institucional (Datos, Cabida, Programa y Tipologías).

**100% frontend (sin backend).** El motor Python corre en el navegador con
Pyodide (WebAssembly). El CSV nunca se sube a ningún servidor.

## Estructura

```
mobil-forma/
└── frontend/                 React + Vite + TypeScript
    ├── public/
    │   └── cabida_core.py     motor de cabida (Python, in-memory)
    └── src/
        ├── App.tsx            UI: carga CSV + n_sub → KPIs → descarga Excel
        └── index.css          branding Mobil
```

## Desarrollo

```bash
cd frontend
npm install
npm run dev
```

## Deploy (Vercel, sitio estático)

- Importar el repo en Vercel.
- **Root Directory:** `frontend`
- Framework: Vite · Build: `npm run build` · Output: `dist`
- Sin variables de entorno.

## Motor

`frontend/public/cabida_core.py` es la lógica de la skill v1.8 adaptada a memoria
(`generar_cabida(csv_text, n_sub)` → xlsx en base64). Mejora sobre v1.8: soporta
el header `Fonction` (export de Forma en francés) además de `Función`/`Function`.
Validado con un CSV real de 631 elementos (4 hojas, totales correctos).
