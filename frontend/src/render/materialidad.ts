// Función canónica (= motor) → materialidad base. NO incluye color (eso viene del motor).
// Las claves deben coincidir EXACTO con los nombres del motor (sin tilde: Util, Comun).
export const MATERIALIDAD_BASE: Record<string, string> = {
  "Residencial Util":    "hormigón visto + ladrillo, balcones, ventanas reales, ritmo de fachada residencial",
  "Residencial Comun":   "núcleos y circulaciones, materialidad sobria, menos aberturas",
  "Residencial Terraza": "terrazas exteriores, barandas vidriadas o metálicas, vegetación en balcón",
  "Residencial Loggia":  "logias, celosías, quiebravistas, fachada profunda",
  "Comercial Util":      "vitrinas, fachada activa, gran transparencia, acceso peatonal",
  "Comercial Comun":     "bodegas y servicio comercial, fachada cerrada",
  "Oficinas Util":       "muro cortina, vidrio, ritmo modular, parasoles",
  "Oficinas Comun":      "núcleos de oficina, materialidad sobria",
  "Estacionamientos":    "reja o celosía metálica, ventilación, sin vidrio, fachada permeable",
  "Ascensores":          "núcleo vertical, verticalidad marcada",
  "Otro":                "edificación existente del entorno, mantener blanca y neutra",
};

// Materialidad para una función (cae a un genérico si no está mapeada).
export function materialidadDe(funcion: string): string {
  return MATERIALIDAD_BASE[funcion] ?? "volumen arquitectónico neutro";
}
