// Camino B — Prompt + contrato JSON para un LLM multimodal (a partir de UN PNG).
//
// El usuario pega la captura de planta de Forma (unidades coloreadas + m² + contexto)
// junto a este prompt en un LLM con visión, y obtiene la planta diagramática flat en la
// paleta Mobil. Una sola imagen: de ahí se leen contornos, color→función y los m². No se
// sube nada desde la app. Los colores del contrato son tonos suaves de la paleta del motor.

export const PROMPT_PLANTA = [
  "Eres un dibujante de plantas arquitectónicas. Te entrego UNA imagen PNG: una captura de",
  "planta de Autodesk Forma (unidades coloreadas por función + etiquetas de m² + contexto de",
  "sitio con árboles y sombras).",
  "",
  "Redibújala como una PLANTA DIAGRAMÁTICA FLAT estilo Mobil siguiendo el contrato JSON de abajo:",
  "- La imagen es la fuente ÚNICA: lee de ahí los contornos de cada unidad, su color → función,",
  "  y el texto de m². NO reinterpretes la forma (respeta 1:1 ángulos, proporciones y subdivisiones).",
  "- Rellena cada unidad ÚTIL con su tono SUAVE de la paleta; las unidades COMUNES van sin relleno",
  "  (solo el contorno). Mapea el color del PNG a la función, no uses el color crudo.",
  "- Copia los m² EXACTOS que aparecen en el PNG, sin recalcular ni cambiar dígitos.",
  "- Elimina todo el contexto: árboles, sombras, grilla, terreno y estacionamientos de fondo.",
  "- Bordes y contornos en NEGRO ink (#16181C) 2px; esquinas levemente redondeadas (~8px).",
  "- En cada unidad muestra SOLO el área en m² (grande, centrada), SIN el nombre de la función.",
  "- Sin encabezado ni leyenda: solo la planta con sus unidades.",
  "",
  "Devuelve un PNG con FONDO BLANCO: la planta flat en estilo Mobil, función + m² por unidad.",
].join("\n");

// Contrato JSON con la paleta canónica del motor. Encabezado y m² como placeholders
// (genérico: sirve para cualquier piso/edificio, no solo el ejemplo de referencia).
export function contratoPlantaJSON(): string {
  const contrato = {
    task: "Redibujar planta diagramática a partir de un PNG",
    input: {
      imagen_png: "Captura de planta de Autodesk Forma (unidades coloreadas + m² + contexto de sitio con árboles y sombras).",
      rol: "Fuente única. Leer de aquí: contornos de cada unidad, su color→función, y el texto de m². NO reinterpretar la forma.",
    },
    // Relleno por función. Las funciones ÚTILES (residencial/comercio/oficinas) y los
    // ascensores usan un tono ~2 niveles más claro que el canónico del motor. Las
    // funciones COMUNES van SIN relleno (solo el contorno de la unidad).
    paleta_relleno: {
      "Residencial Util": "#7CA7D3",     // canónico #2E74B5, aclarado
      "Comercial Util": "#F8AC7C",       // canónico #F4802A, aclarado
      "Oficinas Util": "#BCE196",        // canónico #92D050, aclarado
      "Ascensores": "#C5AFD5",           // canónico #9E7BB5, aclarado
      "Residencial Comun": "solo contorno (sin relleno)",
      "Oficinas Comun": "solo contorno (sin relleno)",
      "Comercial Comun": "solo contorno (sin relleno)",
      "Circulación / Común": "solo contorno (sin relleno)",
    },
    mapeo_color_input: {
      azul: "Residencial Util → #7CA7D3 (tono suave)",
      naranja: "Comercial Util → #F8AC7C (tono suave)",
      verde: "Oficinas Util → #BCE196 (tono suave)",
      purpura_lila: "Ascensores → #C5AFD5 (tono suave)",
      azul_muy_oscuro_o_franja: "Común / circulación → SOLO CONTORNO (sin relleno)",
      gris_azulado_bloques: "Estacionamientos / núcleo → OMITIR (no es programa)",
      verde_circulos: "árboles → OMITIR",
      gris_claro_grilla_sombras: "contexto de sitio → OMITIR",
    },
    estilo_salida: {
      nombre: "Diagrama Mobil · flat",
      fondo: "#FFFFFF (blanco, no transparente)",
      relleno: "color plano por función según paleta_relleno (sin gradiente, sin sombra, sin textura); las funciones comunes quedan sin relleno, solo contorno",
      borde_entre_unidades: "negro ink #16181C 2px",
      contorno_exterior: "negro ink #16181C 2px",
      esquinas: "radius ~8px (levemente redondeadas)",
      etiqueta_por_unidad: "SOLO el área en m² (sin nombre de función), tomada TAL CUAL del PNG",
      tipografia: {
        familia: "condensada, mayúsculas (Archivo Narrow / Swis721 Cn)",
        etiqueta_area: "700, grande, centrada en la unidad",
      },
      sin_encabezado: true,
      sin_leyenda: true,
      sin_nombre_funcion: true,
      omitir: ["árboles", "sombras", "grilla", "terreno", "estacionamiento contexto", "encabezado", "leyenda", "nombre de función en las unidades"],
    },
    reglas: [
      "Respetar 1:1 la geometría del PNG: mismos ángulos, proporciones y subdivisiones de cada unidad.",
      "Rellenar cada unidad ÚTIL con su tono suave de paleta_relleno; las unidades COMUNES van sin relleno (solo contorno).",
      "En cada unidad mostrar SOLO el área en m² (sin el nombre de la función). El color ya indica la función.",
      "Todos los bordes y contornos en negro ink #16181C 2px; esquinas levemente redondeadas (~8px).",
      "Copiar los m² EXACTOS que aparecen en el PNG. No recalcular, no cambiar dígitos.",
      "No inventar espacios, no fusionar ni dividir unidades, no rotar la planta.",
      "Eliminar todo el contexto (árboles, sombras, calles, estacionamientos de fondo).",
    ],
    salida_esperada: "PNG con fondo blanco, planta flat estilo Mobil con tonos suaves, comunes solo contorno, bordes negros y esquinas levemente redondeadas. SOLO el m² por unidad (sin nombre de función). Sin encabezado ni leyenda.",
  };
  return JSON.stringify(contrato, null, 2);
}
