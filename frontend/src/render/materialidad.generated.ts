// GENERADO por scripts/build-config.mjs desde config/render-config.xlsx.
// NO EDITAR A MANO: corre `npm run build:config` tras editar el Excel.

import type { Opcion } from "./vocabulario.generated";

// Materialidad por función canónica del motor (scope). La primera marcada isDefault manda.
export const MATERIALIDAD: Record<string, Opcion[]> = {
  "Residencial Util": [
    { key: "residencial_util_1", labelEs: "ladrillo a la vista (soga) + antepechos macizos", promptEn: "exposed brick, stretcher bond, solid sills, vertical windows", isDefault: true },
    { key: "residencial_util_2", labelEs: "hormigón encofrado en tablas + balcones", promptEn: "board-formed concrete with balconies", isDefault: false },
    { key: "residencial_util_3", labelEs: "estuco mineral tierra + madera + baranda metálica", promptEn: "earth-toned mineral render with timber and metal railings", isDefault: false },
    { key: "residencial_util_4", labelEs: "fachada ventilada + logias vidriadas", promptEn: "ventilated panel façade with glazed loggias", isDefault: false }
  ],
  "Residencial Comun": [
    { key: "residencial_comun_1", labelEs: "hormigón visto sobrio (núcleos)", promptEn: "sober fair-faced concrete cores", isDefault: true },
    { key: "residencial_comun_2", labelEs: "muro estucado neutro + celosías", promptEn: "neutral rendered wall with ventilation louvers", isDefault: false },
    { key: "residencial_comun_3", labelEs: "ladrillo macizo, aberturas mínimas", promptEn: "solid brick with minimal openings", isDefault: false }
  ],
  "Residencial Terraza": [
    { key: "residencial_terraza_1", labelEs: "baranda vidriada + vegetación en balcón", promptEn: "glazed balustrade with balcony planting", isDefault: true },
    { key: "residencial_terraza_2", labelEs: "pérgolas de madera + jardineras", promptEn: "timber pergolas with planters", isDefault: false },
    { key: "residencial_terraza_3", labelEs: "celosía de madera + vegetación abundante", promptEn: "timber lattice with lush planting", isDefault: false }
  ],
  "Residencial Loggia": [
    { key: "residencial_loggia_1", labelEs: "logias profundas + quiebravistas de madera", promptEn: "deep loggias with timber louvers", isDefault: true },
    { key: "residencial_loggia_2", labelEs: "logias vidriadas, perfilería fina", promptEn: "glazed loggias, slim framing", isDefault: false },
    { key: "residencial_loggia_3", labelEs: "celosía cerámica filtrando luz", promptEn: "ceramic brise-soleil filtering light", isDefault: false }
  ],
  "Comercial Util": [
    { key: "comercial_util_1", labelEs: "zócalo vidriado activo + acceso peatonal", promptEn: "active glazed plinth with pedestrian access", isDefault: true },
    { key: "comercial_util_2", labelEs: "vitrinas + toldos + señalética integrada", promptEn: "shopfront windows, awnings, integrated signage", isDefault: false },
    { key: "comercial_util_3", labelEs: "cristal + iluminación cálida de vitrina", promptEn: "glass front with warm display lighting", isDefault: false }
  ],
  "Comercial Comun": [
    { key: "comercial_comun_1", labelEs: "muro mineral opaco + accesos de servicio", promptEn: "opaque mineral wall with service access", isDefault: true },
    { key: "comercial_comun_2", labelEs: "revestimiento metálico industrial", promptEn: "industrial metal cladding", isDefault: false },
    { key: "comercial_comun_3", labelEs: "hormigón visto + portones técnicos", promptEn: "fair-faced concrete with service gates", isDefault: false }
  ],
  "Oficinas Util": [
    { key: "oficinas_util_1", labelEs: "muro cortina aluminio y vidrio + parasoles", promptEn: "aluminium-and-glass curtain wall with sunshades", isDefault: true },
    { key: "oficinas_util_2", labelEs: "vidrio + quiebrasoles horizontales", promptEn: "glazing with horizontal brise-soleil", isDefault: false },
    { key: "oficinas_util_3", labelEs: "módulos opacos y vidriados alternados", promptEn: "alternating opaque and glazed modules", isDefault: false },
    { key: "oficinas_util_4", labelEs: "piel reflectante + parasoles verticales", promptEn: "reflective skin with vertical fins", isDefault: false }
  ],
  "Oficinas Comun": [
    { key: "oficinas_comun_1", labelEs: "núcleo técnico revestido sobrio", promptEn: "sober clad technical core", isDefault: true },
    { key: "oficinas_comun_2", labelEs: "hormigón + panel metálico", promptEn: "concrete and metal panel", isDefault: false },
    { key: "oficinas_comun_3", labelEs: "muro ciego, aberturas modulares", promptEn: "blind wall with modular openings", isDefault: false }
  ],
  "Estacionamientos": [
    { key: "estacionamientos_1", labelEs: "celosía metálica permeable ventilada", promptEn: "permeable ventilated metal louver screen", isDefault: true },
    { key: "estacionamientos_2", labelEs: "malla expandida + vegetación trepadora", promptEn: "expanded mesh with climbing plants", isDefault: false },
    { key: "estacionamientos_3", labelEs: "celosía de hormigón perforado", promptEn: "perforated concrete screen", isDefault: false }
  ],
  "Ascensores": [
    { key: "ascensores_1", labelEs: "hormigón visto vertical (núcleo)", promptEn: "vertical fair-faced concrete core", isDefault: true },
    { key: "ascensores_2", labelEs: "torre técnica revestida + franja vertical", promptEn: "clad technical tower with vertical band", isDefault: false },
    { key: "ascensores_3", labelEs: "verticalidad ciega marcada", promptEn: "marked blind verticality", isDefault: false }
  ],
  "Otro": [
    { key: "otro_1", labelEs: "contexto existente blanco y neutro", promptEn: "existing context, kept white and neutral", isDefault: true },
    { key: "otro_2", labelEs: "volumen gris integrado al fondo", promptEn: "grey volume blended into the background", isDefault: false },
    { key: "otro_3", labelEs: "preexistencia sin materialidad protagónica", promptEn: "pre-existing volume, no prominent materiality", isDefault: false }
  ]
};

export const PROMPT_EN_MATERIAL: Record<string, Record<string, string>> = {
  "Residencial Util": {
    "residencial_util_1": "exposed brick, stretcher bond, solid sills, vertical windows",
    "residencial_util_2": "board-formed concrete with balconies",
    "residencial_util_3": "earth-toned mineral render with timber and metal railings",
    "residencial_util_4": "ventilated panel façade with glazed loggias"
  },
  "Residencial Comun": {
    "residencial_comun_1": "sober fair-faced concrete cores",
    "residencial_comun_2": "neutral rendered wall with ventilation louvers",
    "residencial_comun_3": "solid brick with minimal openings"
  },
  "Residencial Terraza": {
    "residencial_terraza_1": "glazed balustrade with balcony planting",
    "residencial_terraza_2": "timber pergolas with planters",
    "residencial_terraza_3": "timber lattice with lush planting"
  },
  "Residencial Loggia": {
    "residencial_loggia_1": "deep loggias with timber louvers",
    "residencial_loggia_2": "glazed loggias, slim framing",
    "residencial_loggia_3": "ceramic brise-soleil filtering light"
  },
  "Comercial Util": {
    "comercial_util_1": "active glazed plinth with pedestrian access",
    "comercial_util_2": "shopfront windows, awnings, integrated signage",
    "comercial_util_3": "glass front with warm display lighting"
  },
  "Comercial Comun": {
    "comercial_comun_1": "opaque mineral wall with service access",
    "comercial_comun_2": "industrial metal cladding",
    "comercial_comun_3": "fair-faced concrete with service gates"
  },
  "Oficinas Util": {
    "oficinas_util_1": "aluminium-and-glass curtain wall with sunshades",
    "oficinas_util_2": "glazing with horizontal brise-soleil",
    "oficinas_util_3": "alternating opaque and glazed modules",
    "oficinas_util_4": "reflective skin with vertical fins"
  },
  "Oficinas Comun": {
    "oficinas_comun_1": "sober clad technical core",
    "oficinas_comun_2": "concrete and metal panel",
    "oficinas_comun_3": "blind wall with modular openings"
  },
  "Estacionamientos": {
    "estacionamientos_1": "permeable ventilated metal louver screen",
    "estacionamientos_2": "expanded mesh with climbing plants",
    "estacionamientos_3": "perforated concrete screen"
  },
  "Ascensores": {
    "ascensores_1": "vertical fair-faced concrete core",
    "ascensores_2": "clad technical tower with vertical band",
    "ascensores_3": "marked blind verticality"
  },
  "Otro": {
    "otro_1": "existing context, kept white and neutral",
    "otro_2": "grey volume blended into the background",
    "otro_3": "pre-existing volume, no prominent materiality"
  }
};

const DEFAULT_MATERIAL: Record<string, string> = {
  "Residencial Util": "residencial_util_1",
  "Residencial Comun": "residencial_comun_1",
  "Residencial Terraza": "residencial_terraza_1",
  "Residencial Loggia": "residencial_loggia_1",
  "Comercial Util": "comercial_util_1",
  "Comercial Comun": "comercial_comun_1",
  "Oficinas Util": "oficinas_util_1",
  "Oficinas Comun": "oficinas_comun_1",
  "Estacionamientos": "estacionamientos_1",
  "Ascensores": "ascensores_1",
  "Otro": "otro_1"
};

export function materialKeysDe(funcion: string): Opcion[] {
  return MATERIALIDAD[funcion] ?? [];
}

export function defaultMaterialKey(funcion: string): string {
  return DEFAULT_MATERIAL[funcion] ?? "";
}

// prompt_en de una materialidad por (función, option_key); fallback al texto crudo.
export function promptMaterial(funcion: string, key: string): string {
  return PROMPT_EN_MATERIAL[funcion]?.[key] ?? key;
}
