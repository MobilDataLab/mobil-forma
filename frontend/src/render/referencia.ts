// "Capturar referencia" (round-trip con un modelo de visión, v3 del handoff): de una FOTO
// de referencia (un render que gusta) se extraen sus parámetros atmosféricos y se vuelcan
// a la toma en modo texto libre ("Personalizado…"). No sube nada: la app genera un prompt
// extractor que el usuario pega en su modelo (ChatGPT, Gemini, Claude…) junto a su foto;
// el modelo devuelve un JSON; el usuario lo pega de vuelta y se aplica al estado.

import type { CondicionesToma } from "./tipos";
import { VOCAB } from "./vocabulario.generated";

// Eje de la toma ↔ param_key del Excel + etiqueta legible. Solo ejes atmosféricos/de
// expresión que tiene sentido leer de una foto (no vegetation/season → vienen del clima;
// no preserve/avoid → son restricciones, no atmósfera).
export type EjeRef = { campo: keyof CondicionesToma; param: string; label: string };

export const EJES_REFERENCIA: EjeRef[] = [
  { campo: "register", param: "register", label: "visual style / register" },
  { campo: "light", param: "light", label: "light condition" },
  { campo: "sky", param: "sky", label: "sky" },
  { campo: "colorGrade", param: "color_grade", label: "color grade / palette" },
  { campo: "shadows", param: "shadows", label: "shadows" },
  { campo: "finish", param: "finish", label: "material finish" },
  { campo: "detail", param: "detail", label: "level of detail" },
  { campo: "people", param: "people", label: "people / activity" },
  { campo: "urbanEdge", param: "urban_edge", label: "relationship to the street" },
  { campo: "tectonics", param: "tectonics", label: "facade tectonics" },
  { campo: "accent", param: "accent", label: "unifying material accent" },
];

// Genera el PROMPT EXTRACTOR que el usuario pega en Gemini junto a su foto.
// Pide texto libre EN INGLÉS por eje (entra en "Personalizado…"), con las opciones del
// banco como guía de vocabulario (para que Gemini hable el mismo idioma tectónico).
export function generarExtractor(): string {
  const ejes = EJES_REFERENCIA.map((e) => {
    const ejemplos = (VOCAB[e.param] ?? []).map((o) => o.promptEn).filter(Boolean).slice(0, 4);
    const guia = ejemplos.length ? ` (e.g. ${ejemplos.join("; ")})` : "";
    return `  "${e.campo}": "<${e.label}>"${guia}`;
  });

  return [
    "You are an architectural visualization analyst. Look ONLY at the attached reference photo",
    "and describe its ATMOSPHERE so it can be transferred to a different building (do NOT describe",
    "the building's geometry — only light, mood, palette, materials and rendering treatment).",
    "",
    "Return ONLY a JSON object, no prose, with exactly these keys. Each value is a short English",
    "phrase (3–9 words) describing what you see for that axis, in the vocabulary of architectural",
    "rendering. Use the examples only as a guide to register and wording, not as fixed choices:",
    "",
    "{",
    ejes.join(",\n"),
    "}",
    "",
    "Rules: English only; concise noun phrases; no trailing commentary; valid JSON.",
  ].join("\n");
}

// Resultado de aplicar una referencia pegada.
export type ResultadoReferencia =
  | { ok: true; patch: Partial<CondicionesToma>; campos: string[] }
  | { ok: false; error: string };

// Parsea el JSON pegado (devuelto por Gemini) y arma un patch para la toma. Tolerante:
// acepta el objeto crudo o envuelto en ```json … ```; ignora claves desconocidas; solo
// toma valores string no vacíos de los ejes conocidos.
export function aplicarReferencia(texto: string): ResultadoReferencia {
  const limpio = texto
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  if (!limpio) return { ok: false, error: "Pega el JSON que devolvió el modelo." };

  let obj: unknown;
  try {
    obj = JSON.parse(limpio);
  } catch {
    return { ok: false, error: "No es un JSON válido. Copia el objeto completo { … }." };
  }
  if (!obj || typeof obj !== "object") {
    return { ok: false, error: "El JSON no es un objeto de parámetros." };
  }

  const fuente = obj as Record<string, unknown>;
  const patch: Partial<CondicionesToma> = {};
  const campos: string[] = [];
  for (const e of EJES_REFERENCIA) {
    const v = fuente[e.campo];
    if (typeof v === "string" && v.trim()) {
      (patch as Record<string, string>)[e.campo] = v.trim();
      campos.push(e.campo);
    }
  }

  if (!campos.length) {
    return { ok: false, error: "El JSON no traía ninguno de los ejes esperados (register, light, …)." };
  }
  return { ok: true, patch, campos };
}
