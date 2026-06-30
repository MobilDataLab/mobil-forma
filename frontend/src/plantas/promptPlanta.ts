// Camino B — Prompt + contrato JSON para un LLM multimodal.
//
// Como en "Capturar referencia" del render: el usuario pega DOS imágenes (A = vector de
// líneas / forma · B = PNG coloreado / función + m²) junto a este prompt en un LLM con
// visión, y obtiene la planta diagramática en la paleta Mobil. No sube nada desde la app.
// Réplica del contrato del handoff (Planta · Prompt LLM.dc.html), con la paleta del motor.

import { PALETA_CANONICA } from "./paletaPlantas";

export const PROMPT_PLANTA = [
  "Eres un dibujante de plantas arquitectónicas. Te entrego DOS imágenes de la MISMA planta:",
  "• Imagen A — plano vectorial de líneas: la GEOMETRÍA exacta (contornos, subdivisiones, ángulos, proporciones). Es la fuente de verdad de la forma.",
  "• Imagen B — la misma planta coloreada por función con etiquetas de m².",
  "",
  "Redibuja la planta como un DIAGRAMA limpio siguiendo el contrato JSON de abajo:",
  "- Usa la imagen A para la forma (replica la geometría 1:1, sin deformar ni inventar espacios).",
  "- Usa la imagen B para asignar la FUNCIÓN de cada polígono (según su color) y para leer los m².",
  "- Colorea cada espacio con la PALETA CANÓNICA del JSON (no uses los colores crudos de B; mapéalos).",
  "- Rotula cada unidad con NOMBRE DE FUNCIÓN (mayúsculas condensadas, pequeño) + ÁREA en m² (grande).",
  "- Fondo transparente. Omite grilla, terreno, árboles y sombras. Esquinas rectas. Borde blanco entre unidades y contorno exterior ink.",
  "",
  "Devuelve una imagen PNG con fondo transparente: la planta diagramática en estilo Mobil, función + m² por unidad.",
].join("\n");

// Contrato JSON con la paleta canónica del motor (no se inventan funciones/colores).
export function contratoPlantaJSON(): string {
  const paleta: Record<string, string> = {};
  for (const [fn, hex] of Object.entries(PALETA_CANONICA)) paleta[fn] = "#" + hex;

  const contrato = {
    task: "Redibujar planta arquitectónica diagramática",
    inputs: {
      imagen_A_vector: "Plano de líneas exacto. Fuente de verdad para contornos, subdivisiones, ángulos y proporciones.",
      imagen_B_color: "Misma planta coloreada por función + etiquetas de m². Fuente para asignar función y leer áreas.",
    },
    paleta_canonica: paleta,
    mapeo_color_imagenB: {
      azul: "Residencial Util",
      purpura_lila: "Ascensores / Otros",
      gris_azulado: "Estacionamientos / núcleo / circulación",
      naranja_cafe: "Comercial",
      verde_lima: "Oficinas",
      gris_claro_grilla_arboles_sombras: "contexto -> OMITIR",
    },
    estilo_salida: {
      fondo: "transparente",
      relleno: "color canonico plano por funcion (sin gradientes ni sombras)",
      borde: "blanco 2-3px entre unidades; contorno exterior ink #1A1A1A 2px",
      tipografia: "condensada, mayusculas",
      etiqueta_por_unidad: "NOMBRE_FUNCION (700, pequena) + AREA_m2 (300, grande)",
      esquinas: "radius 0",
      omitir: ["grilla", "terreno", "arboles", "sombras"],
    },
    reglas: [
      "Respetar 1:1 la geometria de la imagen A (mismos angulos, proporciones, subdivisiones).",
      "Asignar funcion segun el color del poligono en la imagen B.",
      "Conservar los m2 de la imagen B, nitidos por unidad.",
      "No inventar espacios ni cambiar la forma.",
    ],
    salida_esperada: "PNG con fondo transparente, planta diagramatica en paleta Mobil, funcion + m2 por unidad.",
  };
  return JSON.stringify(contrato, null, 2);
}
