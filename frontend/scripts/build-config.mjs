// Compilador Excel → TS (build-time, dev-only).
// Lee config/render-config.xlsx (hoja `config`) y genera el vocabulario tipado que
// consume el módulo de render. El browser NUNCA parsea Excel: importa los .generated.ts.
//
// Schema de `config` (fila 1 = banner; fila 2 = header; datos desde fila 3):
//   grupo | json_path | param_key | scope | option_key | label_es | prompt_en | default
//   + (solo filas light) light_direction | light_intensity | light_color_temp
//
// Regla de oro: el código referencia opciones por option_key, nunca por texto.
// Si la validación falla → exit(1) (rompe el build antes de deployar).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const XLSX_PATH = resolve(ROOT, "config/render-config.xlsx");
const OUT_VOCAB = resolve(ROOT, "src/render/vocabulario.generated.ts");
const OUT_MAT = resolve(ROOT, "src/render/materialidad.generated.ts");

// option_key que legítimamente pueden tener prompt_en vacío (no es instrucción de prosa).
const VACIO_OK = new Set(["none", "auto"]);

function die(msg) {
  console.error("\n[build-config] ERROR:\n  " + msg + "\n");
  process.exit(1);
}

function leerFilas() {
  if (!existsSync(XLSX_PATH)) die(`no existe ${XLSX_PATH}`);
  const wb = XLSX.read(readFileSync(XLSX_PATH), { type: "buffer" });
  const ws = wb.Sheets["config"];
  if (!ws) die("la hoja `config` no existe en el Excel");
  // range:1 → salta la fila 1 (banner) y usa la fila 2 como header.
  return XLSX.utils.sheet_to_json(ws, { range: 1, defval: "" });
}

const COLS = [
  "grupo", "json_path", "param_key", "scope",
  "option_key", "label_es", "prompt_en", "default",
];

function validarColumnas(filas) {
  if (!filas.length) die("la hoja `config` no tiene filas de datos");
  const presentes = new Set(Object.keys(filas[0]));
  const faltan = COLS.filter((c) => !presentes.has(c));
  if (faltan.length) die(`faltan columnas en config: ${faltan.join(", ")}`);
}

function esTrue(v) {
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1" || s === "verdadero" || s === "x";
}

// Agrupa por (param_key, scope) y valida unicidad de option_key, default único,
// y prompt_en no vacío salvo opciones none/auto.
function validarYAgrupar(filas) {
  const grupos = new Map(); // `${param}␟${scope}` → { param, scope, opciones: [] }
  for (const f of filas) {
    const param = String(f.param_key).trim();
    const optKey = String(f.option_key).trim();
    if (!param || !optKey) continue; // filas vacías / separadores
    const scope = String(f.scope ?? "").trim();
    const k = `${param}␟${scope}`;
    // multi=TRUE → grupo multi-select (preserve/avoid): puede haber varias activas
    // por defecto. Si una sola fila del grupo lo marca, el grupo es multi.
    const multi = esTrue(f.multi);
    if (!grupos.has(k)) grupos.set(k, { param, scope, multi: false, opciones: [] });
    const g = grupos.get(k);
    if (multi) g.multi = true;
    g.opciones.push({
      key: optKey,
      labelEs: String(f.label_es ?? "").trim(),
      promptEn: String(f.prompt_en ?? "").trim(),
      isDefault: esTrue(f.default),
      // metadatos de luz (solo presentes en filas light; "" en el resto)
      lightDirection: String(f.light_direction ?? "").trim(),
      lightIntensity: String(f.light_intensity ?? "").trim(),
      lightColorTemp: String(f.light_color_temp ?? "").trim(),
    });
  }

  for (const { param, scope, multi, opciones } of grupos.values()) {
    const etq = scope ? `${param} / ${scope}` : param;
    // option_key único
    const vistos = new Set();
    for (const o of opciones) {
      if (vistos.has(o.key)) die(`option_key duplicado "${o.key}" en (${etq})`);
      vistos.add(o.key);
    }
    // default: grupos multi-select aceptan ≥1 (activas por defecto); los demás, exactamente 1.
    const defs = opciones.filter((o) => o.isDefault);
    if (multi) {
      if (defs.length < 1) die(`(${etq}) multi-select debe tener al menos un default=TRUE`);
    } else if (defs.length !== 1) {
      die(`(${etq}) debe tener exactamente un default=TRUE; tiene ${defs.length}`);
    }
    // prompt_en no vacío salvo none/auto
    for (const o of opciones) {
      if (!o.promptEn && !VACIO_OK.has(o.key)) {
        die(`(${etq}) opción "${o.key}" tiene prompt_en vacío (solo none/auto pueden)`);
      }
    }
  }
  return grupos;
}

// ──────────────────────────────────────────────────────────────────────────
// Generación de TS
// ──────────────────────────────────────────────────────────────────────────
const BANNER =
  "// GENERADO por scripts/build-config.mjs desde config/render-config.xlsx.\n" +
  "// NO EDITAR A MANO: corre `npm run build:config` tras editar el Excel.\n";

const q = (s) => JSON.stringify(s);

function genVocabulario(grupos) {
  // Ejes globales: scope vacío y param_key !== material.
  const ejes = [...grupos.values()].filter((g) => !g.scope && g.param !== "material");

  const vocabEntries = [];
  const promptEntries = [];
  const lightEntries = [];
  const defaults = {};       // single-select: param → key
  const multiDefaults = {};  // multi-select: param → key[] (activas por defecto)

  for (const { param, multi, opciones } of ejes) {
    const arr = opciones
      .map(
        (o) =>
          `    { key: ${q(o.key)}, labelEs: ${q(o.labelEs)}, promptEn: ${q(o.promptEn)}, isDefault: ${o.isDefault} }`
      )
      .join(",\n");
    vocabEntries.push(`  ${q(param)}: [\n${arr}\n  ]`);

    const pe = opciones.map((o) => `    ${q(o.key)}: ${q(o.promptEn)}`).join(",\n");
    promptEntries.push(`  ${q(param)}: {\n${pe}\n  }`);

    if (multi) {
      multiDefaults[param] = opciones.filter((o) => o.isDefault).map((o) => o.key);
    } else {
      defaults[param] = (opciones.find((o) => o.isDefault) ?? opciones[0]).key;
    }

    // Solo el eje light aporta derivación de luz.
    if (param === "light") {
      const le = opciones
        .map(
          (o) =>
            `    ${q(o.key)}: { direction: ${q(o.lightDirection)}, intensity: ${q(o.lightIntensity)}, colorTemperature: ${q(o.lightColorTemp)} }`
        )
        .join(",\n");
      lightEntries.push(le);
    }
  }

  const defaultsLiteral = Object.entries(defaults)
    .map(([k, v]) => `  ${q(k)}: ${q(v)}`)
    .join(",\n");
  const multiDefaultsLiteral = Object.entries(multiDefaults)
    .map(([k, v]) => `  ${q(k)}: [${v.map(q).join(", ")}]`)
    .join(",\n");

  return (
    BANNER +
    "\n" +
    "export type Opcion = { key: string; labelEs: string; promptEn: string; isDefault: boolean };\n" +
    "export type LuzDerivada = { direction: string; intensity: string; colorTemperature: string };\n\n" +
    "export const VOCAB: Record<string, Opcion[]> = {\n" +
    vocabEntries.join(",\n") +
    "\n};\n\n" +
    "export const PROMPT_EN: Record<string, Record<string, string>> = {\n" +
    promptEntries.join(",\n") +
    "\n};\n\n" +
    "// Derivación de luz (direction/intensity/color_temperature) por option_key del eje `light`.\n" +
    "export const LUZ_DERIVADA: Record<string, LuzDerivada> = {\n" +
    (lightEntries.join(",\n") || "") +
    "\n};\n\n" +
    "const DEFAULTS: Record<string, string> = {\n" +
    defaultsLiteral +
    "\n};\n\n" +
    "// Grupos multi-select (preserve/avoid): option_keys activas por defecto.\n" +
    "const MULTI_DEFAULTS: Record<string, string[]> = {\n" +
    multiDefaultsLiteral +
    "\n};\n\n" +
    "export function defaultKey(param: string): string {\n" +
    "  return DEFAULTS[param] ?? \"\";\n" +
    "}\n\n" +
    "export function defaultKeys(param: string): string[] {\n" +
    "  return MULTI_DEFAULTS[param] ?? [];\n" +
    "}\n"
  );
}

function genMateriales(grupos) {
  // material: agrupado por scope (= función del motor).
  const funcs = [...grupos.values()].filter((g) => g.param === "material" && g.scope);

  const matEntries = [];
  const promptEntries = [];
  const defaults = {};

  for (const { scope, opciones } of funcs) {
    const arr = opciones
      .map(
        (o) =>
          `    { key: ${q(o.key)}, labelEs: ${q(o.labelEs)}, promptEn: ${q(o.promptEn)}, isDefault: ${o.isDefault} }`
      )
      .join(",\n");
    matEntries.push(`  ${q(scope)}: [\n${arr}\n  ]`);

    const pe = opciones.map((o) => `    ${q(o.key)}: ${q(o.promptEn)}`).join(",\n");
    promptEntries.push(`  ${q(scope)}: {\n${pe}\n  }`);

    defaults[scope] = (opciones.find((o) => o.isDefault) ?? opciones[0]).key;
  }

  const defaultsLiteral = Object.entries(defaults)
    .map(([k, v]) => `  ${q(k)}: ${q(v)}`)
    .join(",\n");

  return (
    BANNER +
    "\n" +
    'import type { Opcion } from "./vocabulario.generated";\n\n' +
    "// Materialidad por función canónica del motor (scope). La primera marcada isDefault manda.\n" +
    "export const MATERIALIDAD: Record<string, Opcion[]> = {\n" +
    matEntries.join(",\n") +
    "\n};\n\n" +
    "export const PROMPT_EN_MATERIAL: Record<string, Record<string, string>> = {\n" +
    promptEntries.join(",\n") +
    "\n};\n\n" +
    "const DEFAULT_MATERIAL: Record<string, string> = {\n" +
    defaultsLiteral +
    "\n};\n\n" +
    "export function materialKeysDe(funcion: string): Opcion[] {\n" +
    "  return MATERIALIDAD[funcion] ?? [];\n" +
    "}\n\n" +
    "export function defaultMaterialKey(funcion: string): string {\n" +
    "  return DEFAULT_MATERIAL[funcion] ?? \"\";\n" +
    "}\n\n" +
    "// prompt_en de una materialidad por (función, option_key); fallback al texto crudo.\n" +
    "export function promptMaterial(funcion: string, key: string): string {\n" +
    "  return PROMPT_EN_MATERIAL[funcion]?.[key] ?? key;\n" +
    "}\n"
  );
}

// ──────────────────────────────────────────────────────────────────────────
function main() {
  const filas = leerFilas();
  validarColumnas(filas);
  const grupos = validarYAgrupar(filas);

  writeFileSync(OUT_VOCAB, genVocabulario(grupos), "utf8");
  writeFileSync(OUT_MAT, genMateriales(grupos), "utf8");

  const nEjes = [...grupos.values()].filter((g) => !g.scope && g.param !== "material").length;
  const nFunc = [...grupos.values()].filter((g) => g.param === "material" && g.scope).length;
  console.log(
    `[build-config] OK · ${nEjes} ejes → vocabulario.generated.ts · ${nFunc} funciones → materialidad.generated.ts`
  );
}

main();
