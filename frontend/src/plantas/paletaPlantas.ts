// Paleta y clases de función para el recolor de plantas (Camino A) y los rótulos.
//
// Los colores y nombres son los CANÓNICOS del motor (cabida_core.py · COLOR_CANONICO);
// no se inventan funciones. La variante "suave" son los tonos aceptados en la referencia
// del handoff (más claros, para el plano diagramático). El recolor clasifica cada píxel
// del PNG de Forma a una de estas clases por familia de color.

// Color canónico del motor por función (HEX sin '#'). Espejo de COLOR_CANONICO.
export const PALETA_CANONICA: Record<string, string> = {
  "Residencial Util": "2E74B5",
  "Residencial Comun": "1F3864",
  "Residencial Terraza": "5B9BD5",
  "Residencial Loggia": "A9CCE3",
  "Comercial Util": "F4802A",
  "Comercial Comun": "843C0C",
  "Oficinas Util": "92D050",
  "Oficinas Comun": "375623",
  "Estacionamientos": "7F8FA6",
  "Ascensores": "9E7BB5",
  "Otro": "A6A6A6",
};

// Clase de píxel que el recolor reconoce en el PNG de Forma. Cada una mapea a una
// función canónica + un color de pintado. `fondo` se vuelve transparente.
// (El PNG de plantas de Forma trae sobre todo azul=residencial, gris=núcleo/circulación
//  y lila/púrpura=otros; el resto —grilla, árboles, texto quemado— es contexto/fondo.)
export type ClasePlanta = "fondo" | "residencial" | "nucleo" | "otros" | "comercial" | "oficinas";

export type DefClase = {
  clase: ClasePlanta;
  funcion: string;        // nombre canónico para el rótulo
  colorCanonico: string;  // HEX del motor (pintado "duro")
  colorSuave: string;     // HEX suavizado (variante del handoff, pintado "suave")
};

// Mapa clase → función/colores. Los colores suaves salen de la referencia del handoff
// (Residencial #5C8AC2, Núcleo #979DA7, Otros #9380B6) y se extienden coherentes.
export const CLASES: Record<Exclude<ClasePlanta, "fondo">, DefClase> = {
  residencial: { clase: "residencial", funcion: "Residencial", colorCanonico: "2E74B5", colorSuave: "5C8AC2" },
  nucleo:      { clase: "nucleo",      funcion: "Núcleo",      colorCanonico: "7F8FA6", colorSuave: "979DA7" },
  otros:       { clase: "otros",       funcion: "Otros",       colorCanonico: "9E7BB5", colorSuave: "9380B6" },
  comercial:   { clase: "comercial",   funcion: "Comercial",   colorCanonico: "F4802A", colorSuave: "E89B5C" },
  oficinas:    { clase: "oficinas",    funcion: "Oficinas",    colorCanonico: "92D050", colorSuave: "A6CB6F" },
};

// Convierte HEX ("RRGGBB" o "#RRGGBB") a [r,g,b].
export function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Clasifica un píxel (r,g,b,a) a una ClasePlanta. Reglas calibradas con el PNG real de
// Forma según el handoff (el azul de Forma es ~46/116/181, casi el canónico):
//   - chroma alto + azul dominante → familia azul/púrpura/navy:
//       · r > g (cálido dentro de la familia) → otros (púrpura/lila)
//       · verde bajo y azul medio            → núcleo (navy/gris azulado)
//       · azul alto + verde medio            → residencial
//   - naranja/café dominante → comercial · verde lima dominante → oficinas
//   - gris claro / casi blanco / transparente / texto → fondo (se omite)
export function clasificarPixel(r: number, g: number, b: number, a: number): ClasePlanta {
  if (a < 40) return "fondo";
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const chroma = max - min;
  // Casi acromático (grilla clara, blanco, texto gris) → fondo, salvo el gris del núcleo.
  if (chroma < 22) {
    // Gris azulado medio del núcleo/estacionamiento (no demasiado claro ni oscuro).
    if (max >= 96 && max <= 176 && b >= r) return "nucleo";
    return "fondo";
  }
  // Naranja / café (comercial): rojo dominante y verde > azul.
  if (r > g && g > b && r >= 120) return "comercial";
  // Verde lima (oficinas): verde dominante.
  if (g > r && g > b && g >= 120) return "oficinas";
  // Familia azul/púrpura (residencial / otros / núcleo navy): azul es el canal alto.
  if (b >= max - 4) {
    if (r > g + 6 && r > 95) return "otros";        // púrpura/lila (r sube)
    if (g < 76 && b >= 70) return "nucleo";          // navy: verde bajo
    if (g >= 76 && b >= 120) return "residencial";   // azul Forma
    return "residencial";
  }
  return "fondo";
}
