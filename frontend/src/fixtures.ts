// ⚠️ SOLO DESARROLLO / PREVIEW — datos de ejemplo para revisar la UI sin un CSV real.
// NO se conectan al flujo real: en producción el motor Pyodide (cabida_core.py)
// es la única fuente de verdad. Este archivo no se importa desde App.tsx.

import { type Matriz } from "./GraficoCabida";
import { type Venta } from "./GraficoVenta";
import { type GfaEstac } from "./Estacionamientos";
import { type Tabla, type Ediciones } from "./TablaElementos";
import { type ColorCanonico } from "./PaletaColores";

export const fxColores: Record<string, string> = {
  "Residencial Util": "#2E74B5",
  "Residencial Terraza": "#9DC3E6",
  "Comercial Util": "#C55A11",
  "Oficinas Util": "#548235",
  "Circulación": "#BFBFBF",
  "Estacionamientos": "#808080",
  "Bodegas": "#7B6FA6",
  "Otro": "#D9D9D9",
};
export const fxFunciones = Object.keys(fxColores);

export const fxMatriz: Matriz = {
  etiquetas: ["N5", "N4", "N3", "N2", "N1", "ST-1", "ST-2"],
  funciones: fxFunciones,
  colores: fxColores,
  datos: [
    { etiqueta: "N5", es_sub: false, "Residencial Util": 420, "Residencial Terraza": 60, "Circulación": 80 },
    { etiqueta: "N4", es_sub: false, "Residencial Util": 480, "Circulación": 80 },
    { etiqueta: "N3", es_sub: false, "Residencial Util": 480, "Circulación": 80 },
    { etiqueta: "N2", es_sub: false, "Oficinas Util": 300, "Comercial Util": 120, "Circulación": 90 },
    { etiqueta: "N1", es_sub: false, "Comercial Util": 380, "Circulación": 70, "Otro": 40 },
    { etiqueta: "ST-1", es_sub: true, "Estacionamientos": 760, "Bodegas": 120, "Circulación": 60 },
    { etiqueta: "ST-2", es_sub: true, "Estacionamientos": 800, "Bodegas": 90, "Circulación": 60 },
  ],
};

export const fxVenta: Venta = {
  total: 2180,
  items: [
    { funcion: "Residencial Util", venta: 1380, pct: 1380 / 2180, color: "#2E74B5" },
    { funcion: "Comercial Util", venta: 500, pct: 500 / 2180, color: "#C55A11" },
    { funcion: "Oficinas Util", venta: 300, pct: 300 / 2180, color: "#548235" },
  ],
};

export const fxEstac: GfaEstac = { gfa: 1560, n_elementos: 2 };

export const fxResumen = { elementos: 631, venta: 2180, construido: 4570, eficiencia: 0.477 };

export const fxTabla: Tabla = {
  funciones_canonicas: fxFunciones,
  n_otro: 2,
  filas: [
    { id: "e1", type: "Floor", function: "Logement", canonica: "Residencial Util", gfa: 420, nivel: 6, etiqueta: "N5", integra: true, es_otro: false, es_manual: false },
    { id: "e2", type: "Floor", function: "Logement", canonica: "Residencial Util", gfa: 480, nivel: 5, etiqueta: "N4", integra: true, es_otro: false, es_manual: false },
    { id: "e3", type: "Floor", function: "Logement", canonica: "Residencial Util", gfa: 480, nivel: 4, etiqueta: "N3", integra: true, es_otro: false, es_manual: false },
    { id: "e4", type: "Floor", function: "Bureau", canonica: "Oficinas Util", gfa: 300, nivel: 3, etiqueta: "N2", integra: true, es_otro: false, es_manual: false },
    { id: "e5", type: "Floor", function: "Commerce", canonica: "Comercial Util", gfa: 120, nivel: 3, etiqueta: "N2", integra: true, es_otro: false, es_manual: false },
    { id: "e6", type: "Floor", function: "Commerce", canonica: "Comercial Util", gfa: 380, nivel: 2, etiqueta: "N1", integra: true, es_otro: false, es_manual: false },
    { id: "e7", type: "Floor", function: "", canonica: "Otro", gfa: 40, nivel: 2, etiqueta: "N1", integra: true, es_otro: true, es_manual: false },
    { id: "e8", type: "Floor", function: "Parking", canonica: "Estacionamientos", gfa: 760, nivel: 1, etiqueta: "ST-1", integra: true, es_otro: false, es_manual: false },
    { id: "e9", type: "Floor", function: "Cave", canonica: "Bodegas", gfa: 120, nivel: 1, etiqueta: "ST-1", integra: true, es_otro: false, es_manual: false },
    { id: "e10", type: "Floor", function: "Parking", canonica: "Estacionamientos", gfa: 800, nivel: 0, etiqueta: "ST-2", integra: true, es_otro: false, es_manual: false },
    { id: "e11", type: "Floor", function: "???", canonica: "Otro", gfa: 30, nivel: 0, etiqueta: "ST-2", integra: true, es_otro: true, es_manual: false },
    { id: "e12", type: "Floor", function: "Terrasse", canonica: "Residencial Terraza", gfa: 60, nivel: 6, etiqueta: "N5", integra: true, es_otro: false, es_manual: false },
  ],
};

export const fxEdiciones: Ediciones = {
  reclasificar: {},
  gfa: {},
  nivel: {},
  excluir: ["e10"], // muestra el estado «excluido» en la preview
  agregar: [],
};

export const fxPaleta: ColorCanonico[] = [
  { funcion: "Residencial Util", hex: "#2E74B5", rgb: [46, 116, 181], rgb_str: "46, 116, 181" },
  { funcion: "Residencial Terraza", hex: "#9DC3E6", rgb: [157, 195, 230], rgb_str: "157, 195, 230" },
  { funcion: "Comercial Util", hex: "#C55A11", rgb: [197, 90, 17], rgb_str: "197, 90, 17" },
  { funcion: "Oficinas Util", hex: "#548235", rgb: [84, 130, 53], rgb_str: "84, 130, 53" },
  { funcion: "Circulación", hex: "#BFBFBF", rgb: [191, 191, 191], rgb_str: "191, 191, 191" },
  { funcion: "Estacionamientos", hex: "#808080", rgb: [128, 128, 128], rgb_str: "128, 128, 128" },
  { funcion: "Bodegas", hex: "#7B6FA6", rgb: [123, 111, 166], rgb_str: "123, 111, 166" },
  { funcion: "Otro", hex: "#D9D9D9", rgb: [217, 217, 217], rgb_str: "217, 217, 217" },
];
