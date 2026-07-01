// Camino B — Prompt + contrato JSON para un LLM multimodal (a partir de UN PNG).
//
// El usuario pega la captura de planta de Forma (unidades coloreadas + m² + contexto)
// junto a este prompt en un LLM con visión, y obtiene la planta diagramática flat en la
// paleta Mobil. Una sola imagen: de ahí se leen contornos, color→función y los m². No se
// sube nada desde la app. El contrato usa la paleta canónica del motor (no se inventan hex).

import { PALETA_CANONICA } from "./paletaPlantas";

export const PROMPT_PLANTA = [
  "Eres un dibujante de plantas arquitectónicas. Te entrego UNA imagen PNG: una captura de",
  "planta de Autodesk Forma (unidades coloreadas por función + etiquetas de m² + contexto de",
  "sitio con árboles y sombras).",
  "",
  "Redibújala como una PLANTA DIAGRAMÁTICA FLAT estilo Mobil siguiendo el contrato JSON de abajo:",
  "- La imagen es la fuente ÚNICA: lee de ahí los contornos de cada unidad, su color → función,",
  "  y el texto de m². NO reinterpretes la forma (respeta 1:1 ángulos, proporciones y subdivisiones).",
  "- Recolorea cada unidad a la PALETA CANÓNICA del JSON (no uses los colores crudos; mapéalos).",
  "- Copia los m² EXACTOS que aparecen en el PNG, sin recalcular ni cambiar dígitos.",
  "- Elimina todo el contexto: árboles, sombras, grilla, terreno y estacionamientos de fondo.",
  "- Relleno plano por función, borde blanco entre unidades, contorno exterior ink, esquinas rectas.",
  "- Rotula cada unidad con NOMBRE DE FUNCIÓN (condensada mayúsculas, pequeña) + ÁREA m² (grande).",
  "- Encabezado con piso · edificio · GFA total + barra azul, y leyenda de las funciones presentes.",
  "",
  "Devuelve un PNG con fondo transparente: la planta flat en estilo Mobil, función + m² por unidad.",
].join("\n");

// Contrato JSON con la paleta canónica del motor. Encabezado y m² como placeholders
// (genérico: sirve para cualquier piso/edificio, no solo el ejemplo de referencia).
export function contratoPlantaJSON(): string {
  const paleta: Record<string, string> = {};
  for (const [fn, hex] of Object.entries(PALETA_CANONICA)) paleta[fn] = "#" + hex;
  // El motor no distingue "Núcleo"/"Circulación" como funciones aparte; se añaden alias
  // de mapeo para que el LLM sepa a qué canónico llevar esos colores del PNG.
  paleta["Ascensores / Núcleo"] = "#808080";
  paleta["Circulación / Común"] = "#EDF0F3";

  const contrato = {
    task: "Redibujar como planta diagramática flat estilo Mobil, a partir de una imagen PNG",
    input: {
      imagen_png: "Captura de planta de Forma (unidades coloreadas + m² + contexto de sitio con árboles y sombras).",
      rol: "Fuente única. Leer de aquí: contornos de cada unidad, su color→función, y el texto de m². NO reinterpretar la forma.",
    },
    paleta_canonica: paleta,
    mapeo_color_input: {
      azul: "Residencial Util → #2E74B5",
      purpura_lila: "Ascensores / Núcleo → #808080",
      gris_azulado_bloques: "Estacionamientos / núcleo → OMITIR (no es programa)",
      verde_circulos: "árboles → OMITIR",
      gris_claro_grilla_sombras: "contexto de sitio → OMITIR",
    },
    estilo_salida: {
      nombre: "Diagrama Mobil · flat",
      fondo: "#FFFFFF transparente",
      relleno: "color canónico plano 100% por función (sin gradiente, sin sombra, sin textura)",
      borde_entre_unidades: "blanco 3px",
      contorno_exterior: "ink #16181C 2px",
      esquinas: "radius 0",
      tipografia: {
        familia: "condensada, mayúsculas (Archivo Narrow / Swis721 Cn)",
        etiqueta_funcion: "700, pequeña, letter-spacing .14em",
        etiqueta_area: "700, grande, tomada TAL CUAL del PNG",
      },
      encabezado: "PISO {N} · EDIFICIO {XXX} · GFA {TOTAL} M², con barra 4px #006BFF",
      leyenda: "chips de color + nombre de función presentes",
      omitir: ["árboles", "sombras", "grilla", "terreno", "estacionamiento contexto"],
    },
    reglas: [
      "Respetar 1:1 la geometría del PNG: mismos ángulos, proporciones y subdivisiones de cada unidad.",
      "Recolorear cada unidad según su color en el PNG mapeado a la paleta canónica.",
      "Copiar los m² EXACTOS que aparecen en el PNG. No recalcular, no cambiar dígitos.",
      "No inventar espacios, no fusionar ni dividir unidades, no rotar la planta.",
      "Eliminar todo el contexto (árboles, sombras, calles, estacionamientos de fondo).",
    ],
    salida_esperada: "PNG fondo transparente, planta flat en paleta Mobil, FUNCIÓN + m² por unidad, encabezado + leyenda.",
  };
  return JSON.stringify(contrato, null, 2);
}
