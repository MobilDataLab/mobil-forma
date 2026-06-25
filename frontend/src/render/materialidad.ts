// Función canónica (= motor) → opciones de materialidad. La primera de cada lista
// es el default. Las claves deben coincidir EXACTO con el motor (sin tilde: Util, Comun).
export const MATERIALIDAD_OPCIONES: Record<string, string[]> = {
  "Residencial Util": [
    "hormigón visto + ladrillo, balcones, ventanas reales, ritmo de fachada residencial",
    "estuco color tierra + madera, balcones con baranda metálica",
    "ladrillo a la vista cálido, antepechos macizos, ventanas verticales",
    "fachada ventilada de paneles, balcones vidriados, líneas contemporáneas",
  ],
  "Residencial Comun": [
    "núcleos y circulaciones, materialidad sobria, menos aberturas",
    "muro estucado neutro, celosías de ventilación, accesos marcados",
    "hormigón visto sobrio, aberturas mínimas",
  ],
  "Residencial Terraza": [
    "terrazas exteriores, barandas vidriadas o metálicas, vegetación en balcón",
    "pérgolas de madera, jardineras, baranda de vidrio",
    "terrazas con celosía de madera y vegetación abundante",
  ],
  "Residencial Loggia": [
    "logias, celosías, quiebravistas, fachada profunda",
    "logias vidriadas, perfilería metálica fina",
    "quiebravistas de madera, fachada profunda con sombra",
  ],
  "Comercial Util": [
    "vitrinas, fachada activa, gran transparencia, acceso peatonal",
    "zócalo comercial vidriado, toldos, señalética integrada",
    "fachada activa de cristal, pilares revestidos, iluminación de vitrina",
  ],
  "Comercial Comun": [
    "bodegas y servicio comercial, fachada cerrada",
    "muro opaco con accesos de servicio, portones metálicos",
    "revestimiento metálico industrial, aberturas técnicas",
  ],
  "Oficinas Util": [
    "muro cortina, vidrio, ritmo modular, parasoles",
    "fachada de vidrio con quiebrasoles horizontales",
    "muro cortina reflectante, módulos opacos y vidriados alternados",
    "envolvente de aluminio y vidrio, parasoles verticales",
  ],
  "Oficinas Comun": [
    "núcleos de oficina, materialidad sobria",
    "muro técnico revestido, aberturas modulares",
    "hormigón y panel metálico, sobrio",
  ],
  "Estacionamientos": [
    "reja o celosía metálica, ventilación, sin vidrio, fachada permeable",
    "malla metálica expandida, vegetación trepadora",
    "celosía de hormigón perforado, ventilación cruzada",
  ],
  "Ascensores": [
    "núcleo vertical, verticalidad marcada",
    "torre técnica revestida, franja vertical de color sobrio",
    "núcleo de hormigón visto, verticalidad limpia",
  ],
  "Otro": [
    "edificación existente del entorno, mantener blanca y neutra",
    "volumen neutro de contexto, sin materialidad protagónica",
    "preexistencia gris, integrada al fondo",
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
