// Banco de vocabulario tectónico para el módulo Render Controlado.
// Regla de archviz: nunca "piedra" genérica, siempre el material específico.
// Lo usan materialidad.ts (sube especificidad) y componerPrompt() (prosa).

// Materiales reales y específicos. Cada entrada lleva su término en inglés entre
// paréntesis, que rinde mejor en Gemini/GPT-image.
export const MATERIALES_TECTONICOS = [
  "hormigón encofrado en tablas (board-formed concrete)",
  "hormigón visto liso (smooth fair-faced concrete)",
  "ladrillo a la vista, aparejo de soga (exposed brick, stretcher bond)",
  "madera laminada CLT vista (exposed CLT timber)",
  "madera carbonizada (shou sugi ban charred timber)",
  "acero cortén (weathering corten steel)",
  "zinc junta alzada (standing-seam zinc)",
  "muro cortina de aluminio y vidrio (aluminium-and-glass curtain wall)",
  "celosía cerámica (ceramic brise-soleil)",
  "quiebravistas de madera (timber louvers)",
  "travertino apomazado (honed travertine)",
  "piedra local aparejada (coursed local stone)",
  "estuco mineral (mineral render)",
  "aluminio anodizado (anodised aluminium)",
  "U-glass translúcido (translucent channel glass)",
  "policarbonato celular (cellular polycarbonate)",
] as const;

// Atmósfera / escuela de render → cualidad descrita (no se copia el estudio: IP limpia).
// La clave es la opción que ve el usuario; el valor es la frase atmosférica en prosa.
export const ESCUELAS: Record<string, string> = {
  "editorial atmosférico (luz difusa, paleta sobria, integrado al paisaje)":
    "editorial atmospheric register: soft diffuse light, restrained earthy palette, the building quietly integrated into its landscape, subtle atmospheric depth",
  "documental (realismo de obra, luz natural directa, vida real)":
    "documentary register: honest as-built realism, direct natural light, real lived-in activity, candid framing",
  "narrativo urbano (saturado, energía de calle)":
    "urban narrative register: richer saturation, lively street energy, dynamic city life around the building",
  "conceptual / maqueta (diagramático, sin pretensión fotográfica)":
    "conceptual model register: diagrammatic and abstract, clearly a study model, no photographic pretension",
};

// Cualidades de la fotografía de referencia (describen el LOOK, no nombran al fotógrafo).
export const REFERENCIAS_FOTO: Record<string, string> = {
  "ninguna": "",
  "líneas rectas / verticales corregidas (gran formato)":
    "with the quality of large-format architectural photography: perfectly corrected verticals, straight precise lines, tilt-shift rigor and orthogonal framing",
  "documental humano (contexto vivo, escala peatonal)":
    "with the candid quality of documentary architectural photography: living context and pedestrian scale",
  "blanco y negro de luz y sombra (abstracción tectónica)":
    "with the quality of black-and-white architectural photography focused on light, shadow and tectonic abstraction",
  "modernista soleado, líneas limpias":
    "with the quality of sunlit modernist architectural photography: crisp light and clean lines",
};

// Cómo el edificio toca la ciudad → ADN Mobil. Clave = opción; valor = prosa.
export const ENCUENTROS_URBANOS: Record<string, string> = {
  "zócalo comercial permeable, vereda activa":
    "a permeable commercial plinth with an active sidewalk",
  "pórtico y retranqueo, transición público-privado":
    "a portico and setback that mediate the public-to-private transition",
  "acceso jerarquizado con plaza de recibo":
    "a hierarchical entrance opening onto a welcoming forecourt",
  "fachada continua a línea de vereda":
    "a continuous façade aligned to the street edge",
  "basamento macizo, cuerpo liviano":
    "a solid base carrying a lighter upper body",
};

// Tectónica / profundidad de fachada. Clave = opción; valor = prosa.
export const TECTONICAS: Record<string, string> = {
  "fachada profunda con sombra y ritmo estructural":
    "a deep façade with cast shadow and structural rhythm",
  "envolvente lisa y abstracta":
    "a smooth, abstract envelope",
  "ritmo modular de llenos y vacíos":
    "a modular rhythm of solids and voids",
  "expresión de estructura vista":
    "an expressed, visible structure",
};

// Estrategia sustentable visible. Clave = opción; valor = prosa ("" = no mencionar).
export const SUSTENTABILIDADES: Record<string, string> = {
  "ninguna visible": "",
  "cubierta vegetal y vegetación nativa":
    "a green roof and native planting",
  "paneles solares integrados":
    "integrated solar panels",
  "diseño biofílico, sombra pasiva, materiales naturales":
    "biophilic design with passive shading and natural materials",
};

// Luz honesta primero (anti-cliché comercial). Se inyecta en OPC.luz.
export const LUCES_EDITORIALES = [
  "soft diffuse overcast light",
  "blue hour with warm interior glow",
  "misty morning light",
] as const;

// Acento material del conjunto: da carácter tectónico unificado al proyecto.
// "ninguno" = no forzar (la materialidad por uso manda). Resto = del banco tectónico.
export const ACENTOS_MATERIALES: Record<string, string> = {
  "ninguno (según materialidad por uso)": "",
  "hormigón encofrado en tablas": "a unifying accent of board-formed concrete",
  "ladrillo a la vista": "a unifying accent of exposed brick",
  "madera (CLT / carbonizada)": "a unifying accent of exposed timber (CLT or charred shou sugi ban)",
  "acero cortén": "a unifying accent of weathering corten steel",
  "piedra local aparejada": "a unifying accent of coursed local stone",
  "celosía cerámica / quiebravistas": "a unifying accent of ceramic brise-soleil and timber louvers",
  "muro cortina aluminio y vidrio": "a unifying accent of aluminium-and-glass curtain wall",
};
