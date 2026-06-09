# mobil-forma

Aplicación de análisis de cabida para Autodesk Forma — Mobil Arquitectos.
A partir de un CSV exportado de Forma y un número de subdivisiones, genera un
Excel con formato institucional (Datos, Cabida, Programa y Tipologías).

**100% frontend (sin backend).** El motor Python corre en el navegador con
Pyodide (WebAssembly). El CSV nunca se sube a ningún servidor.

## Estructura

```
mobil-forma/
└── frontend/                  React + Vite + TypeScript
    ├── public/
    │   └── cabida_core.py      MOTOR de cabida (Python, in-memory) — no tocar*
    └── src/
        ├── App.tsx             layout + flujo: carga CSV, recálculo en vivo, descarga Excel
        ├── TablaElementos.tsx  tabla de elementos editable + agregar áreas
        ├── GraficoCabida.tsx   gráfico de barras por piso (SVG)
        ├── GraficoVenta.tsx    torta de venta por función (SVG)
        ├── Estacionamientos.tsx panel de ratio por cajón
        ├── PaletaColores.tsx   tabla de colores canónicos (copiable)
        ├── pisos.ts            helpers de orden/nivel de pisos
        └── index.css           branding Mobil (todas las variables y estilos)
```

\* Ver «Trabajar en la UI».

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

Funciones que la UI consume (todas aceptan un dict opcional `ediciones` y
respetan reclasificaciones / m² / nivel / exclusiones / áreas agregadas):
`tabla_elementos`, `resumen_cabida`, `matriz_cabida`, `venta_por_funcion`,
`gfa_estacionamientos`, `paleta_canonica`. Comparten `_construir_df`, que es la
única fuente de verdad del cálculo.

## Trabajar en la UI

El rediseño visual es bienvenido, pero **el contenido y la lógica no se tocan**.

**NO modificar:**
- `frontend/public/cabida_core.py` (el motor) ni la forma de los datos que
  expone. Si la UI necesita un dato nuevo, pídelo / déjalo anotado — no lo
  calcules cambiando el motor.
- Los **colores canónicos** ni los nombres de funciones: vienen del motor
  (`matriz.colores`, `paleta_canonica`) y deben coincidir con el Excel.
- Las **secciones, KPIs, columnas de tablas y campos**: mismo contenido, mejor
  presentación.
- El flujo **frontend-only con Pyodide** (sin backend).

**Sí se puede / se busca:**
- Mejorar estética, tipografía, espaciado, jerarquía, estados (hover/focus/
  loading/empty) y responsividad. El estilo vive en `src/index.css` (variables CSS).
- Estética de tablas y de los gráficos SVG existentes.
- Botones discretos para **descargar** cada gráfico (PNG) y cada tabla (CSV).

**Restricciones:** React 18 + Vite + TypeScript; evitar dependencias pesadas
(preferir CSS propio y APIs nativas). Antes de entregar: `npx tsc --noEmit` y
`npm run dev` sin errores.

**Handoff:** trabajar en una rama (`redesign-ui`) y abrir un **PR** contra `main`
(no commitear directo). En el PR: lista de archivos tocados, confirmar que el
motor no cambió, y dependencias nuevas (idealmente ninguna).
