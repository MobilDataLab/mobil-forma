import type {
  UsoDetectado, Preset, CondicionesToma, RenderContractV2, Ubicacion, ElementoPrograma,
} from "./tipos";
import { PROMPT_EN, LUZ_DERIVADA, defaultKeys } from "./vocabulario.generated";
import { promptMaterial } from "./materialidad.generated";

// option_key sentinela: vegetation/season "auto" → se usa lo inferido del clima.
const AUTO = "auto";

// Versión del contrato (doc). Fecha fija de corte de generación del esquema.
const META_VERSION = "2.0";
const META_UPDATED = "2026-06-28";

// Resuelve la prosa EN de un eje por option_key. Si la clave existe en PROMPT_EN
// se usa su valor (puede ser "" para none/auto); si no existe, es texto libre del
// usuario ("Personalizado…") → se usa tal cual (cae en inglés si así lo escribió).
function prosa(param: string, key: string): string {
  const dic = PROMPT_EN[param];
  if (dic && key in dic) return dic[key];
  return key;
}

// Infiere la tipología (en inglés) desde el conjunto de usos confirmados.
function tipologia(usos: UsoDetectado[]): string {
  const f = usos.map((u) => u.funcion).join(" ");
  const res = /Residencial/.test(f);
  const com = /Comercial/.test(f);
  const ofi = /Oficinas/.test(f);
  if (res && (com || ofi)) return "mixed-use residential building";
  if (ofi && com) return "mixed-use office and retail building";
  if (res) return "residential building";
  if (ofi) return "office building";
  if (com) return "retail building";
  return "architectural project";
}

// Materialidad de un uso → prosa EN. Usa el banco por función (option_key) y cae
// al texto crudo si es uso libre / personalizado.
function materialProsa(u: UsoDetectado): string {
  return promptMaterial(u.funcion, u.materialidad);
}

// Une la materialidad de cada uso en prosa: "Residencial Útil as exposed brick; …".
function materialidadEnProsa(usos: UsoDetectado[]): string {
  return usos
    .map((u) => `${conTilde(u.funcion)} as ${materialProsa(u)}`)
    .join("; ");
}

function conTilde(funcion: string): string {
  return funcion.replace(/Util/g, "Útil").replace(/Comun/g, "Común");
}

// Compone el brief arquitectónico en prosa, 100% inglés, desde los option_key elegidos.
// Capa primaria del contrato (el campo que más rinde en Gemini/GPT-image). El opener
// usa el REGISTER elegido (no "Editorial" hardcodeado). people + detail entran a la
// prosa (ya no son controles inertes). La geometría/cámara se afirman bloqueadas (preset).
export function componerPrompt(
  usos: UsoDetectado[],
  preset: Preset,
  toma: CondicionesToma,
  ubic: Ubicacion
): string {
  const lugar = ubic.etiqueta || preset.location;
  const especies = preset.vegetacion.especies.join(", ");
  const sotobosque = preset.vegetacion.sotobosque.join(", ");

  // Override de vegetación/estación: "auto" → lo inferido del clima; resto → su prosa.
  const vegOverride = toma.vegetation === AUTO ? "" : `${prosa("vegetation", toma.vegetation)}; `;
  const seasonTxt = toma.season === AUTO ? "" : `, ${prosa("season", toma.season)}`;

  const register = prosa("register", toma.register);
  const light = prosa("light", toma.light);
  const sky = prosa("sky", toma.sky);
  const grade = prosa("color_grade", toma.colorGrade);
  const shadows = prosa("shadows", toma.shadows);
  const finish = prosa("finish", toma.finish);
  const detail = prosa("detail", toma.detail);
  const people = prosa("people", toma.people);
  const photoRef = prosa("photo_reference", toma.photoReference);
  const urbanEdge = prosa("urban_edge", toma.urbanEdge);
  const tectonics = prosa("tectonics", toma.tectonics);
  const accent = prosa("accent", toma.accent);
  const sust = prosa("sustainability", toma.sustainability);

  const partes: string[] = [];

  // 1. Opener: registro elegido + tipología + lugar + clima.
  partes.push(
    `${cap(register)} visualization of a ${tipologia(usos)} in ${lugar} (${preset.clima} climate).`
  );
  // 2. Geometry-lock (mención 1/2 — la otra vive en `locked`).
  partes.push(
    "Treat the source image as locked geometry, camera and aspect ratio — only materiality and atmosphere are rendered."
  );
  // 3. Programa: color → materialidad real.
  partes.push(`Translate each color into its real material: ${materialidadEnProsa(usos)}.`);
  if (accent) partes.push(`Give the whole composition ${accent}.`);
  // 4. Encuentro urbano + tectónica.
  partes.push(`The building meets the city through ${urbanEdge}, presenting ${tectonics}.`);
  // 5. Vegetación nativa del sitio.
  partes.push(
    cap(`${vegOverride}vegetation native to the site (${especies}${seasonTxt}); ground with ${sotobosque}.`)
  );
  // 6. Atmósfera: luz / cielo / sombras / grade / acabado.
  partes.push(
    `${cap(light)}, ${sky}, ${shadows}; ${grade}; ${finish}.`
  );
  // 7. Detalle + gente (controles ahora activos).
  partes.push(`${cap(detail)}; ${people}.`);
  if (sust) partes.push(`Visible sustainability: ${sust}.`);
  if (photoRef) partes.push(`Rendered ${photoRef}.`);
  // 8. Cierre: constraints en positivo.
  partes.push(
    "Keep verticals corrected, materials matte and true-to-life, white volumes as neutral existing context."
  );

  return partes.join(" ");
}

// Capitaliza la primera letra (para abrir frases con prosa que viene en minúscula).
function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Un uso confirmado → elemento de programa v2 (color → uso → material en prosa EN).
function elementoDe(u: UsoDetectado): ElementoPrograma {
  return { color: u.hex, use: conTilde(u.funcion), material: materialProsa(u) };
}

// Intención de diseño (ADN Mobil) — capa de documentación, el modelo no la lee.
function designIntent(toma: CondicionesToma): Record<string, string> {
  const urbanEdge = prosa("urban_edge", toma.urbanEdge);
  const tectonics = prosa("tectonics", toma.tectonics);
  const sust = prosa("sustainability", toma.sustainability);
  return {
    city:
      `Project integrated into its setting, meeting the city through ${urbanEdge}; ` +
      "not an isolated object.",
    user_experience:
      "Clear pedestrian routes, interior green areas, active edges, visual continuity to the surroundings.",
    wellbeing: "Shade, vegetation, views, human scale and shared spaces between buildings.",
    urban_identity:
      `Recognisable Mobil register: presenting ${tectonics}` +
      `${sust ? `, with ${sust}` : ""}, integrated with topography and vegetal mass.`,
  };
}

// Data / sustentabilidad / constructabilidad — capa de documentación.
function dataSustConst(toma: CondicionesToma, especies: string): Record<string, string[]> {
  const sust = prosa("sustainability", toma.sustainability);
  return {
    data: [
      "evaluate density per hectare",
      "measure walkable distance between buildings, accesses and services",
      "evaluate sunlight and shadow cast between blocks",
    ],
    sustainability: [
      `use vegetation native or adapted to the site (${especies})`,
      "keep existing vegetal mass where possible",
      "incorporate permeable areas and surface drainage",
      ...(sust ? [`visible strategy: ${sust}`] : []),
    ],
    constructability: [
      "keep blocks simple and repeatable",
      "order accesses and internal roads for construction phasing",
      "favour repeatable, low-maintenance façade systems",
    ],
  };
}

// option_key del banco que solo tiene sentido sembrar en climas áridos/semiáridos
// (evitar vegetación tropical). Solo afecta el SEED inicial; tras eso la lista es manual.
const AVOID_CLIMA_GATED = new Set(["vegetacion_tropical"]);

// Texto inglés inicial (seed) de un banco de restricciones (preserve/avoid) desde el
// Excel: toma las opciones default y devuelve su prompt_en. Para `avoid`, las opciones
// "climáticas" (tropical) solo se siembran si el clima es árido/semiárido. A partir del
// seed, la lista es texto libre editable en la UI (esta función NO se usa en cada render).
export function seedRestricciones(param: string, clima: string): string[] {
  const dic = PROMPT_EN[param] ?? {};
  const arido = clima.includes("semiárido") || clima.includes("árido");
  // defaultKeys(param) = option_keys marcadas default en el Excel, en orden.
  return defaultKeys(param)
    .filter((k) => !AVOID_CLIMA_GATED.has(k) || arido)
    .map((k) => dic[k])
    .filter(Boolean);
}

// Ensambla el contrato v2 (prosa-primero, por capas).
export function construirJSON(
  usosConfirmados: UsoDetectado[],
  preset: Preset,
  toma: CondicionesToma,
  ubicacion: Ubicacion
): RenderContractV2 {
  const especies = preset.vegetacion.especies.join(", ");
  const sotobosque = preset.vegetacion.sotobosque.join(", ");
  const lugar = ubicacion.etiqueta || preset.location;

  const accent = prosa("accent", toma.accent);
  const luz = LUZ_DERIVADA[toma.light] ?? { direction: "", intensity: "", colorTemperature: "" };

  // preserve / avoid: lista de texto inglés editada a mano en la UI (sembrada desde el
  // banco del Excel). Lo que está en la lista es literal lo que va al JSON — sin resolver
  // keys ni filtrar. Geometry-lock vive aquí una sola vez (mención 2/2).
  const preserve = toma.preserve.map((s) => s.trim()).filter(Boolean);
  const avoid = toma.avoid.map((s) => s.trim()).filter(Boolean);

  const elements: ElementoPrograma[] = usosConfirmados.map(elementoDe);

  return {
    meta: {
      version: META_VERSION,
      updated: META_UPDATED,
      intent: `${prosa("register", toma.register)} — architectural communication piece`,
    },
    prompt: componerPrompt(usosConfirmados, preset, toma, ubicacion),
    locked: {
      role: "Forma color-coded massing: each flat color is a USE, not a final material",
      geometry_and_camera: "keep exact volumes, proportions, positions and viewpoint",
      aspect_ratio: "do not change the input image aspect ratio",
    },
    program: {
      elements,
      ...(accent ? { accent } : {}),
    },
    scene: {
      place: lugar,
      climate: preset.clima,
      context: "volumes set among a native vegetal mass and gentle topography, not isolated objects",
      vegetation: `native ${especies}; ground with ${sotobosque}`,
      urban_edge: prosa("urban_edge", toma.urbanEdge),
      tectonics: prosa("tectonics", toma.tectonics),
    },
    atmosphere: {
      register: prosa("register", toma.register),
      light: {
        type: prosa("light", toma.light),
        direction: luz.direction,
        intensity: luz.intensity,
        color_temperature: luz.colorTemperature,
      },
      sky: prosa("sky", toma.sky),
      shadows: prosa("shadows", toma.shadows),
      color_grade: prosa("color_grade", toma.colorGrade),
      finish: prosa("finish", toma.finish),
      people: prosa("people", toma.people),
    },
    preserve,
    avoid,
    _meta_mobil: {
      design_intent: designIntent(toma),
      data_sustainability_constructability: dataSustConst(toma, especies),
    },
  };
}

// Serializa indentado, listo para clipboard.
export function aTexto(contract: RenderContractV2): string {
  return JSON.stringify(contract, null, 2);
}
