// Función canónica (= motor) → opciones de materialidad. La primera de cada lista
// es el default. Las claves deben coincidir EXACTO con el motor (sin tilde: Util, Comun).
// Materiales reales y específicos (banco tectónico): nunca "piedra", siempre el material.
export const MATERIALIDAD_OPCIONES: Record<string, string[]> = {
  "Residencial Util": [
    "exposed brick (stretcher bond) with solid sills and vertical windows, residential façade rhythm",
    "board-formed concrete with timber balconies and slim metal railings",
    "mineral render in earth tones with timber accents and glazed balconies",
    "ventilated panel façade with deep reveals and contemporary lines",
  ],
  "Residencial Comun": [
    "cores and circulation in sober smooth fair-faced concrete, fewer openings",
    "neutral mineral render with ventilation louvers and marked access",
    "board-formed concrete, minimal openings",
  ],
  "Residencial Terraza": [
    "outdoor terraces with glass railings and balcony planting",
    "timber pergolas and planters with glass balustrades",
    "timber-louvered terraces with abundant greenery",
  ],
  "Residencial Loggia": [
    "loggias with timber louvers and a deep, shadowed façade",
    "glazed loggias with fine metal profiles",
    "timber brise-soleil giving the façade depth and cast shadow",
  ],
  "Comercial Util": [
    "active retail frontage, aluminium-and-glass curtain wall, high transparency, pedestrian access",
    "glazed commercial plinth with awnings and integrated signage",
    "crystal active façade with clad pillars and shopfront lighting",
  ],
  "Comercial Comun": [
    "service/back-of-house in opaque mineral render, closed frontage",
    "opaque wall with service access and metal gates",
    "industrial metal cladding with technical openings",
  ],
  "Oficinas Util": [
    "aluminium-and-glass curtain wall with modular rhythm and vertical sunshades",
    "glass façade with horizontal brise-soleil",
    "reflective curtain wall alternating opaque and glazed modules",
    "anodised aluminium-and-glass envelope with vertical fins",
  ],
  "Oficinas Comun": [
    "office cores in sober materiality",
    "clad technical wall with modular openings",
    "concrete and metal panel, sober",
  ],
  "Estacionamientos": [
    "expanded metal mesh screen, ventilated and permeable, no glazing",
    "expanded metal mesh with climbing greenery",
    "perforated concrete brise-soleil with cross ventilation",
  ],
  "Ascensores": [
    "vertical core with marked verticality, smooth fair-faced concrete",
    "clad technical tower with a sober vertical strip",
    "board-formed concrete core, clean verticality",
  ],
  "Otro": [
    "existing surrounding building, kept white and neutral",
    "neutral context volume, no protagonist materiality",
    "grey pre-existing volume, integrated into the background",
  ],
};

// Lista de opciones para una función (con fallback genérico).
export function opcionesDe(funcion: string): string[] {
  return MATERIALIDAD_OPCIONES[funcion] ?? ["volumen arquitectónico neutro"];
}

// Materialidad por defecto (primera opción) para una función.
export function materialidadDe(funcion: string): string {
  return opcionesDe(funcion)[0];
}
