// GENERADO por scripts/build-config.mjs desde config/render-config.xlsx.
// NO EDITAR A MANO: corre `npm run build:config` tras editar el Excel.

export type Opcion = { key: string; labelEs: string; promptEn: string; isDefault: boolean };
export type LuzDerivada = { direction: string; intensity: string; colorTemperature: string };

export const VOCAB: Record<string, Opcion[]> = {
  "register": [
    { key: "editorial_atmospheric", labelEs: "editorial atmosférico", promptEn: "editorial atmospheric (soft diffuse light, restrained earthy palette, integrated into landscape)", isDefault: true },
    { key: "nordic_atmospheric", labelEs: "atmosférico nórdico", promptEn: "nordic atmospheric (dim, weighty light, clay and stone, soft shadow)", isDefault: false },
    { key: "documentary", labelEs: "documental de obra", promptEn: "documentary (honest as-built realism, lived-in, pedestrian scale)", isDefault: false },
    { key: "urban_narrative", labelEs: "narrativo urbano", promptEn: "urban narrative (richer saturation, lively street energy)", isDefault: false },
    { key: "cinematic", labelEs: "cinematográfico", promptEn: "cinematic (dramatic light, depth, film grain)", isDefault: false },
    { key: "conceptual_model", labelEs: "conceptual / maqueta", promptEn: "conceptual model (diagrammatic, abstract)", isDefault: false }
  ],
  "light": [
    { key: "soft_diffuse_overcast", labelEs: "soft diffuse overcast", promptEn: "soft diffuse overcast light", isDefault: true },
    { key: "nordic_diffuse", labelEs: "luz nórdica difusa", promptEn: "diffuse nordic daylight", isDefault: false },
    { key: "blue_hour_glow", labelEs: "hora azul + interiores cálidos", promptEn: "blue hour with warm interior glow", isDefault: false },
    { key: "raking_late", labelEs: "luz rasante de tarde", promptEn: "raking late-afternoon light", isDefault: false },
    { key: "misty_morning", labelEs: "mañana brumosa", promptEn: "misty, foggy morning light", isDefault: false },
    { key: "golden_hour", labelEs: "hora dorada", promptEn: "golden hour, low sun", isDefault: false }
  ],
  "sky": [
    { key: "soft_overcast", labelEs: "nublado suave", promptEn: "soft overcast sky", isDefault: true },
    { key: "uniform_overcast", labelEs: "encapotado uniforme", promptEn: "uniform white overcast sky", isDefault: false },
    { key: "partly_cloudy", labelEs: "parcialmente nublado", promptEn: "partly cloudy sky", isDefault: false },
    { key: "clear", labelEs: "despejado limpio", promptEn: "clear, clean sky", isDefault: false },
    { key: "dramatic_clouds", labelEs: "dramático cargado", promptEn: "dramatic, cloud-laden sky", isDefault: false },
    { key: "hazy_mist", labelEs: "brumoso con neblina", promptEn: "hazy sky with atmospheric mist", isDefault: false }
  ],
  "color_grade": [
    { key: "earthy_restrained", labelEs: "tierra / natural sobria", promptEn: "earthy, restrained, slightly desaturated grade", isDefault: true },
    { key: "nordic_cool", labelEs: "nórdica fría", promptEn: "cool, desaturated nordic grade", isDefault: false },
    { key: "warm_golden", labelEs: "cálida dorada", promptEn: "warm, golden grade", isDefault: false },
    { key: "neutral", labelEs: "neutra", promptEn: "neutral, balanced grade", isDefault: false },
    { key: "monochrome", labelEs: "monocroma", promptEn: "near-monochrome, black-and-white grade", isDefault: false },
    { key: "saturated_contrast", labelEs: "saturada alto contraste", promptEn: "saturated, high-contrast grade", isDefault: false }
  ],
  "shadows": [
    { key: "soft_long", labelEs: "difusas y largas", promptEn: "soft, long shadows", isDefault: true },
    { key: "soft_overcast", labelEs: "suaves de día nublado", promptEn: "soft overcast shadows", isDefault: false },
    { key: "raking", labelEs: "rasantes marcadas", promptEn: "raking, pronounced shadows", isDefault: false },
    { key: "deep_midday", labelEs: "profundas de mediodía", promptEn: "deep midday shadows", isDefault: false },
    { key: "shadowless", labelEs: "apenas perceptibles", promptEn: "barely perceptible, shadowless", isDefault: false },
    { key: "dramatic", labelEs: "dramáticas", promptEn: "dramatic, high-contrast shadows", isDefault: false }
  ],
  "finish": [
    { key: "matte_weathered", labelEs: "mate, uso natural leve", promptEn: "matte, lightly weathered finish", isDefault: true },
    { key: "matte_new", labelEs: "mate impecable", promptEn: "matte, pristine as-new finish", isDefault: false },
    { key: "aged_patina", labelEs: "envejecido / pátina", promptEn: "aged finish with noble patina", isDefault: false },
    { key: "satin", labelEs: "satinado", promptEn: "satin finish with subtle reflections", isDefault: false },
    { key: "tectonic_texture", labelEs: "textura tectónica", promptEn: "pronounced tectonic texture (formwork, joints visible)", isDefault: false },
    { key: "glossy", labelEs: "pulido / brillante", promptEn: "polished, glossy finish", isDefault: false }
  ],
  "detail": [
    { key: "high", labelEs: "alto detalle", promptEn: "high detail, real physical textures", isDefault: true },
    { key: "medium", labelEs: "detalle medio", promptEn: "balanced medium detail", isDefault: false },
    { key: "tectonic_macro", labelEs: "macro tectónico", promptEn: "tectonic macro detail (joints, panel layout, formwork)", isDefault: false },
    { key: "atmospheric", labelEs: "atmosférico", promptEn: "atmospheric detail, softened by haze and depth", isDefault: false },
    { key: "schematic", labelEs: "esquemático / maqueta", promptEn: "schematic, conceptual-model detail", isDefault: false }
  ],
  "photo_reference": [
    { key: "none", labelEs: "ninguna", promptEn: "", isDefault: true },
    { key: "large_format", labelEs: "gran formato, verticales corregidas", promptEn: "large-format quality: corrected verticals, tilt-shift rigor", isDefault: false },
    { key: "documentary_human", labelEs: "documental humano", promptEn: "candid documentary quality: living context, pedestrian scale", isDefault: false },
    { key: "bw_light_shadow", labelEs: "b/n luz y sombra", promptEn: "black-and-white quality: light, shadow, tectonic abstraction", isDefault: false },
    { key: "sunlit_modernist", labelEs: "modernista soleado", promptEn: "sunlit modernist quality: crisp light, clean lines", isDefault: false },
    { key: "editorial_landscape", labelEs: "editorial de paisaje", promptEn: "editorial landscape quality: building quietly integrated", isDefault: false }
  ],
  "people": [
    { key: "minimal_silhouettes", labelEs: "mínimos / siluetas", promptEn: "minimal people as silhouettes for human scale", isDefault: true },
    { key: "integrated", labelEs: "integrados", promptEn: "people integrated, everyday life", isDefault: false },
    { key: "high_activity", labelEs: "alta actividad", promptEn: "high activity, lively urban life", isDefault: false },
    { key: "none", labelEs: "sin gente", promptEn: "no people, pure architectural focus", isDefault: false }
  ],
  "urban_edge": [
    { key: "permeable_plinth", labelEs: "zócalo permeable + vereda activa", promptEn: "a permeable commercial plinth with an active sidewalk", isDefault: true },
    { key: "portico_setback", labelEs: "pórtico y retranqueo", promptEn: "a portico and setback mediating the public-to-private transition", isDefault: false },
    { key: "entrance_forecourt", labelEs: "acceso + plaza", promptEn: "a hierarchical entrance onto a welcoming forecourt", isDefault: false },
    { key: "continuous_facade", labelEs: "fachada continua", promptEn: "a continuous façade aligned to the street edge", isDefault: false },
    { key: "base_body", labelEs: "basamento + cuerpo liviano", promptEn: "a solid base carrying a lighter upper body", isDefault: false },
    { key: "green_edge", labelEs: "borde verde que penetra", promptEn: "a green edge that penetrates the project", isDefault: false }
  ],
  "tectonics": [
    { key: "deep_facade", labelEs: "fachada profunda con sombra y ritmo", promptEn: "a deep façade with cast shadow and structural rhythm", isDefault: true },
    { key: "smooth_envelope", labelEs: "envolvente lisa", promptEn: "a smooth, abstract envelope", isDefault: false },
    { key: "modular_rhythm", labelEs: "ritmo modular", promptEn: "a modular rhythm of solids and voids", isDefault: false },
    { key: "expressed_structure", labelEs: "estructura vista", promptEn: "an expressed, visible structure", isDefault: false },
    { key: "louver_skin", labelEs: "celosías / quiebravistas", promptEn: "a skin of brise-soleil and louvers filtering light", isDefault: false },
    { key: "stone_base", labelEs: "basamento pétreo + cuerpo ligero", promptEn: "a stone base with a lighter body above", isDefault: false }
  ],
  "vegetation": [
    { key: "auto", labelEs: "auto (del clima)", promptEn: "", isDefault: true },
    { key: "abundant", labelEs: "abundante / masa densa", promptEn: "abundant, dense vegetal mass", isDefault: false },
    { key: "moderate", labelEs: "media", promptEn: "moderate, balanced planting", isDefault: false },
    { key: "sparse", labelEs: "escasa / xerófita", promptEn: "sparse, xerophytic planting", isDefault: false },
    { key: "designed_native", labelEs: "paisaje nativo diseñado", promptEn: "designed native landscape", isDefault: false },
    { key: "none", labelEs: "sin vegetación", promptEn: "no vegetation", isDefault: false }
  ],
  "season": [
    { key: "auto", labelEs: "auto (del clima)", promptEn: "", isDefault: true },
    { key: "dry", labelEs: "seco / estío", promptEn: "dry summer", isDefault: false },
    { key: "bloom", labelEs: "florecido / primavera", promptEn: "spring bloom", isDefault: false },
    { key: "autumn", labelEs: "otoño", promptEn: "autumn, warm foliage", isDefault: false },
    { key: "winter", labelEs: "invierno", promptEn: "winter", isDefault: false }
  ],
  "accent": [
    { key: "none", labelEs: "ninguno", promptEn: "", isDefault: true },
    { key: "board_formed", labelEs: "hormigón encofrado en tablas", promptEn: "a unifying accent of board-formed concrete", isDefault: false },
    { key: "exposed_brick", labelEs: "ladrillo a la vista", promptEn: "a unifying accent of exposed brick", isDefault: false },
    { key: "timber", labelEs: "madera CLT / carbonizada", promptEn: "a unifying accent of exposed timber (CLT or charred shou sugi ban)", isDefault: false },
    { key: "corten", labelEs: "acero cortén", promptEn: "a unifying accent of weathering corten steel", isDefault: false },
    { key: "stone", labelEs: "piedra / travertino", promptEn: "a unifying accent of coursed local stone / honed travertine", isDefault: false }
  ],
  "sustainability": [
    { key: "none", labelEs: "ninguna visible", promptEn: "", isDefault: true },
    { key: "green_roof", labelEs: "cubierta vegetal + nativa", promptEn: "a green roof and native planting", isDefault: false },
    { key: "solar", labelEs: "paneles solares", promptEn: "integrated solar panels", isDefault: false },
    { key: "biophilic", labelEs: "biofílico", promptEn: "biophilic design with passive shading and natural materials", isDefault: false },
    { key: "green_walls", labelEs: "muros verdes", promptEn: "green walls / vegetal façade", isDefault: false },
    { key: "suds", labelEs: "SUDS", promptEn: "rainwater harvesting / sustainable urban drainage", isDefault: false }
  ],
  "preserve": [
    { key: "geometria_camara", labelEs: "geometría, cámara y relación de aspecto exactas de la imagen", promptEn: "exact geometry, camera viewpoint and aspect ratio of the input image", isDefault: true },
    { key: "contexto_blanco", labelEs: "volúmenes blancos de contexto neutros y secundarios", promptEn: "white context volumes kept neutral and secondary", isDefault: true },
    { key: "trazado_calles", labelEs: "trazado de calles, accesos y topografía de fondo", promptEn: "street layout, accesses and background topography", isDefault: true },
    { key: "vegetacion_estructural", labelEs: "distribución estructural de la vegetación existente", promptEn: "structural distribution of the existing vegetation", isDefault: true },
    { key: "materiales_verticales", labelEs: "materiales mate y realistas, verticales corregidas", promptEn: "materials matte and true-to-life, corrected verticals", isDefault: true }
  ],
  "avoid": [
    { key: "vegetacion_tropical", labelEs: "vegetación tropical o palmeras", promptEn: "tropical vegetation or palm trees", isDefault: true },
    { key: "gloss_inmobiliario", labelEs: "brillo inmobiliario comercial o sobresaturación", promptEn: "commercial real-estate gloss or oversaturation", isDefault: true }
  ]
};

export const PROMPT_EN: Record<string, Record<string, string>> = {
  "register": {
    "editorial_atmospheric": "editorial atmospheric (soft diffuse light, restrained earthy palette, integrated into landscape)",
    "nordic_atmospheric": "nordic atmospheric (dim, weighty light, clay and stone, soft shadow)",
    "documentary": "documentary (honest as-built realism, lived-in, pedestrian scale)",
    "urban_narrative": "urban narrative (richer saturation, lively street energy)",
    "cinematic": "cinematic (dramatic light, depth, film grain)",
    "conceptual_model": "conceptual model (diagrammatic, abstract)"
  },
  "light": {
    "soft_diffuse_overcast": "soft diffuse overcast light",
    "nordic_diffuse": "diffuse nordic daylight",
    "blue_hour_glow": "blue hour with warm interior glow",
    "raking_late": "raking late-afternoon light",
    "misty_morning": "misty, foggy morning light",
    "golden_hour": "golden hour, low sun"
  },
  "sky": {
    "soft_overcast": "soft overcast sky",
    "uniform_overcast": "uniform white overcast sky",
    "partly_cloudy": "partly cloudy sky",
    "clear": "clear, clean sky",
    "dramatic_clouds": "dramatic, cloud-laden sky",
    "hazy_mist": "hazy sky with atmospheric mist"
  },
  "color_grade": {
    "earthy_restrained": "earthy, restrained, slightly desaturated grade",
    "nordic_cool": "cool, desaturated nordic grade",
    "warm_golden": "warm, golden grade",
    "neutral": "neutral, balanced grade",
    "monochrome": "near-monochrome, black-and-white grade",
    "saturated_contrast": "saturated, high-contrast grade"
  },
  "shadows": {
    "soft_long": "soft, long shadows",
    "soft_overcast": "soft overcast shadows",
    "raking": "raking, pronounced shadows",
    "deep_midday": "deep midday shadows",
    "shadowless": "barely perceptible, shadowless",
    "dramatic": "dramatic, high-contrast shadows"
  },
  "finish": {
    "matte_weathered": "matte, lightly weathered finish",
    "matte_new": "matte, pristine as-new finish",
    "aged_patina": "aged finish with noble patina",
    "satin": "satin finish with subtle reflections",
    "tectonic_texture": "pronounced tectonic texture (formwork, joints visible)",
    "glossy": "polished, glossy finish"
  },
  "detail": {
    "high": "high detail, real physical textures",
    "medium": "balanced medium detail",
    "tectonic_macro": "tectonic macro detail (joints, panel layout, formwork)",
    "atmospheric": "atmospheric detail, softened by haze and depth",
    "schematic": "schematic, conceptual-model detail"
  },
  "photo_reference": {
    "none": "",
    "large_format": "large-format quality: corrected verticals, tilt-shift rigor",
    "documentary_human": "candid documentary quality: living context, pedestrian scale",
    "bw_light_shadow": "black-and-white quality: light, shadow, tectonic abstraction",
    "sunlit_modernist": "sunlit modernist quality: crisp light, clean lines",
    "editorial_landscape": "editorial landscape quality: building quietly integrated"
  },
  "people": {
    "minimal_silhouettes": "minimal people as silhouettes for human scale",
    "integrated": "people integrated, everyday life",
    "high_activity": "high activity, lively urban life",
    "none": "no people, pure architectural focus"
  },
  "urban_edge": {
    "permeable_plinth": "a permeable commercial plinth with an active sidewalk",
    "portico_setback": "a portico and setback mediating the public-to-private transition",
    "entrance_forecourt": "a hierarchical entrance onto a welcoming forecourt",
    "continuous_facade": "a continuous façade aligned to the street edge",
    "base_body": "a solid base carrying a lighter upper body",
    "green_edge": "a green edge that penetrates the project"
  },
  "tectonics": {
    "deep_facade": "a deep façade with cast shadow and structural rhythm",
    "smooth_envelope": "a smooth, abstract envelope",
    "modular_rhythm": "a modular rhythm of solids and voids",
    "expressed_structure": "an expressed, visible structure",
    "louver_skin": "a skin of brise-soleil and louvers filtering light",
    "stone_base": "a stone base with a lighter body above"
  },
  "vegetation": {
    "auto": "",
    "abundant": "abundant, dense vegetal mass",
    "moderate": "moderate, balanced planting",
    "sparse": "sparse, xerophytic planting",
    "designed_native": "designed native landscape",
    "none": "no vegetation"
  },
  "season": {
    "auto": "",
    "dry": "dry summer",
    "bloom": "spring bloom",
    "autumn": "autumn, warm foliage",
    "winter": "winter"
  },
  "accent": {
    "none": "",
    "board_formed": "a unifying accent of board-formed concrete",
    "exposed_brick": "a unifying accent of exposed brick",
    "timber": "a unifying accent of exposed timber (CLT or charred shou sugi ban)",
    "corten": "a unifying accent of weathering corten steel",
    "stone": "a unifying accent of coursed local stone / honed travertine"
  },
  "sustainability": {
    "none": "",
    "green_roof": "a green roof and native planting",
    "solar": "integrated solar panels",
    "biophilic": "biophilic design with passive shading and natural materials",
    "green_walls": "green walls / vegetal façade",
    "suds": "rainwater harvesting / sustainable urban drainage"
  },
  "preserve": {
    "geometria_camara": "exact geometry, camera viewpoint and aspect ratio of the input image",
    "contexto_blanco": "white context volumes kept neutral and secondary",
    "trazado_calles": "street layout, accesses and background topography",
    "vegetacion_estructural": "structural distribution of the existing vegetation",
    "materiales_verticales": "materials matte and true-to-life, corrected verticals"
  },
  "avoid": {
    "vegetacion_tropical": "tropical vegetation or palm trees",
    "gloss_inmobiliario": "commercial real-estate gloss or oversaturation"
  }
};

// Derivación de luz (direction/intensity/color_temperature) por option_key del eje `light`.
export const LUZ_DERIVADA: Record<string, LuzDerivada> = {
    "soft_diffuse_overcast": { direction: "high, even", intensity: "soft", colorTemperature: "neutral-cool" },
    "nordic_diffuse": { direction: "high, even, wraparound", intensity: "soft", colorTemperature: "cool" },
    "blue_hour_glow": { direction: "low ambient, glowing interiors", intensity: "low", colorTemperature: "cool exterior, warm interior" },
    "raking_late": { direction: "low, raking from the side", intensity: "medium-strong", colorTemperature: "warm" },
    "misty_morning": { direction: "diffuse, low contrast", intensity: "soft", colorTemperature: "cool, hazy" },
    "golden_hour": { direction: "low, frontal-side", intensity: "strong", colorTemperature: "warm-golden" }
};

const DEFAULTS: Record<string, string> = {
  "register": "editorial_atmospheric",
  "light": "soft_diffuse_overcast",
  "sky": "soft_overcast",
  "color_grade": "earthy_restrained",
  "shadows": "soft_long",
  "finish": "matte_weathered",
  "detail": "high",
  "photo_reference": "none",
  "people": "minimal_silhouettes",
  "urban_edge": "permeable_plinth",
  "tectonics": "deep_facade",
  "vegetation": "auto",
  "season": "auto",
  "accent": "none",
  "sustainability": "none"
};

// Grupos multi-select (preserve/avoid): option_keys activas por defecto.
const MULTI_DEFAULTS: Record<string, string[]> = {
  "preserve": ["geometria_camara", "contexto_blanco", "trazado_calles", "vegetacion_estructural", "materiales_verticales"],
  "avoid": ["vegetacion_tropical", "gloss_inmobiliario"]
};

export function defaultKey(param: string): string {
  return DEFAULTS[param] ?? "";
}

export function defaultKeys(param: string): string[] {
  return MULTI_DEFAULTS[param] ?? [];
}
