import type { UsoDetectado, Preset, CondicionesToma, RenderContract, Ubicacion } from "./tipos";
import {
  ESCUELAS, REFERENCIAS_FOTO, ENCUENTROS_URBANOS, TECTONICAS, SUSTENTABILIDADES,
  ACENTOS_MATERIALES,
} from "./vocabulario";

// Sentinela de "auto (del clima)" para vegetación/estación (igual que en el panel).
const AUTO_CLIMA = "auto (del clima)";

// Negativos base (constantes Forma): geometría/cámara/contexto que NO debe cambiar,
// más guardrails anti-CGI para empujar el resultado a registro arquitectónico.
const NEGATIVOS_BASE = [
  "no cambiar la geometría, las proporciones ni la composición de los volúmenes",
  "no mover ni alterar el punto de vista / la cámara",
  "no reinterpretar el color plano como decoración, textura impresa ni grafiti",
  "no convertir los volúmenes blancos de contexto en edificios de color",
  "no agregar edificios, pisos ni volúmenes que no estén en la imagen",
  // Anti-CGI / anti-look inmobiliario
  "keep verticals corrected (no keystoning / no converging verticals)",
  "no plastic, oversaturated or videogame-CGI look",
  "no fake lens flare, no HDR halos, no glowing edges",
  "no stock-looking rigid people or copy-paste trees",
  "no commercial real-estate gloss; restrained architectural palette",
];

// Infiere la tipología (en inglés) desde el conjunto de usos confirmados.
function tipologia(usos: UsoDetectado[]): string {
  const f = usos.map((u) => u.funcion).join(" ");
  const res = /Residencial/.test(f);
  const com = /Comercial/.test(f);
  const ofi = /Oficinas/.test(f);
  if (res && (com || ofi)) return "mixed-use residential building";
  if (ofi && com) return "mixed-use office and retail building";
  if (res) return "residential building";
  if (ofi) return "office building";
  if (com) return "retail building";
  return "architectural project";
}

// Une la materialidad de cada uso en prosa: "Residencial Útil as exposed brick; ...".
function materialidadEnProsa(usos: UsoDetectado[]): string {
  return usos
    .map((u) => `${u.funcion.replace(/Util/g, "Útil").replace(/Comun/g, "Común")} as ${u.materialidad}`)
    .join("; ");
}

// Compone el brief arquitectónico en prosa atmosférica editorial desde las selecciones.
// Capa primaria del contrato (el campo que más rinde en Gemini/GPT-image).
// La cámara/vista/geometría se afirman BLOQUEADAS (preset): no hay ejes que las cambien.
export function componerPrompt(
  usos: UsoDetectado[],
  preset: Preset,
  toma: CondicionesToma,
  ubic: Ubicacion
): string {
  const lugar = ubic.etiqueta || preset.location;
  const especies = preset.vegetacion.especies.join(", ");
  const sotobosque = preset.vegetacion.sotobosque.join(", ");
  // Vegetación/estación: "auto" → lo inferido del clima; override → texto del usuario.
  const estacionTxt = toma.estacion === AUTO_CLIMA ? "" : `, ${toma.estacion}`;
  const densVeg = toma.vegetacion === AUTO_CLIMA ? "" : `${toma.vegetacion} `;

  // Traduce una opción a su prosa. Si la clave existe en el diccionario, usa su
  // valor (puede ser "" para opciones tipo "ninguna"); si no existe, es texto
  // libre del usuario ("Personalizado…") → se usa tal cual.
  const vocab = (dic: Record<string, string>, val: string): string =>
    val in dic ? dic[val] : val;

  const escuela = vocab(ESCUELAS, toma.escuela);
  const refFoto = vocab(REFERENCIAS_FOTO, toma.referenciaFoto);
  const encuentro = vocab(ENCUENTROS_URBANOS, toma.encuentroUrbano);
  const tecto = vocab(TECTONICAS, toma.tectonica);
  const acento = vocab(ACENTOS_MATERIALES, toma.materialGlobal);
  const sust = vocab(SUSTENTABILIDADES, toma.sustentabilidad);

  const partes: string[] = [];

  partes.push(
    `Editorial architectural visualization of a ${tipologia(usos)} in ${lugar} (${preset.clima} climate).`
  );
  // El preset: la imagen manda la geometría y el punto de vista.
  partes.push(
    "Treat the source image as the locked design: keep its exact geometry, proportions, volumes and camera viewpoint unchanged — this is the project, only its materiality and atmosphere are being rendered."
  );
  partes.push(
    `Translate each color of the legend into its real materiality: ${materialidadEnProsa(usos)}.`
  );
  if (acento) partes.push(`Give the whole composition ${acento}.`);
  // Atmósfera / escuela + luz / sombras / cielo + grade + acabado
  partes.push(
    `${escuela}: ${toma.luz}, ${toma.sombras} shadows, ${toma.cielo} sky; ${toma.paletaTono} color grade; ${toma.acabado} finish.`
  );
  if (refFoto) partes.push(`Render ${refFoto}.`);
  // ADN urbano + tectónica
  partes.push(`The building meets the city through ${encuentro}.`);
  partes.push(`Façade with ${tecto}.`);
  if (sust) partes.push(`Visible sustainability strategy: ${sust}.`);
  // Vegetación (densidad opcional) + escala humana
  partes.push(
    `${densVeg}vegetation native to the site (${especies}${estacionTxt}); ground with ${sotobosque}.`
  );
  partes.push("Human figures as silhouettes for scale, not stock characters.");
  partes.push(
    "Corrected verticals, restrained architectural palette, subtle atmospheric depth. White volumes stay as neutral existing context."
  );

  return partes.join(" ");
}

// Texto del eje (clave de vocabulario → prosa; o texto libre tal cual).
const vocab = (dic: Record<string, string>, val: string): string =>
  val in dic ? dic[val] : val;

// Convierte un uso confirmado en un elemento de proyecto estructurado.
function elementoDe(u: UsoDetectado): import("./tipos").ElementoProyecto {
  const use = u.funcion.replace(/Util/g, "Útil").replace(/Comun/g, "Común");
  return {
    color: u.hex,
    use,
    description: u.materialidad,
    ...(u.altura ? { height: u.altura } : {}),
    ...(u.distribucion ? { distribution: u.distribucion } : {}),
    ...(u.rol ? { role: u.rol } : {}),
  };
}

// Intención de diseño (ADN Mobil) derivada de los ejes + plantilla editorial.
function designIntent(toma: CondicionesToma): RenderContract["design_intent"] {
  const encuentro = vocab(ENCUENTROS_URBANOS, toma.encuentroUrbano) || toma.encuentroUrbano;
  const tecto = vocab(TECTONICAS, toma.tectonica) || toma.tectonica;
  const sust = vocab(SUSTENTABILIDADES, toma.sustentabilidad);
  return {
    city_relation:
      `Build an image of a project integrated into its setting, meeting the city through ${encuentro}; ` +
      "avoid buildings reading as isolated objects.",
    user_experience:
      "Prioritise clear pedestrian routes, interior green areas, active edges and visual continuity toward the surroundings.",
    wellbeing:
      "Reinforce shade, vegetation, views, human scale and shared spaces between buildings.",
    urban_identity:
      `A recognisable Mobil-register project: ${tecto}${sust ? `, with ${sust}` : ""}, ` +
      "integrated with the topography and the vegetal mass.",
  };
}

// Lista explícita de "no cambiar" (lo que viene bloqueado de la imagen).
const NO_CAMBIAR = [
  "encuadre y relación de aspecto de la imagen",
  "punto de vista / cámara",
  "posición, altura y proporción de cada volumen",
  "trazado de calles y accesos",
  "topografía y fondo",
  "distribución general de la vegetación estructural",
  "volúmenes blancos de contexto (se mantienen neutros)",
];

// Criterios de data / sustentabilidad / constructabilidad (plantilla editable).
function dataSustConst(
  toma: CondicionesToma,
  especies: string
): RenderContract["data_sustainability_constructability"] {
  const sust = vocab(SUSTENTABILIDADES, toma.sustentabilidad);
  return {
    data: [
      "evaluar densidad por hectárea",
      "medir distancia caminable entre edificios, accesos y servicios",
      "evaluar asoleamiento y sombra proyectada entre bloques",
    ],
    sustainability: [
      `usar vegetación nativa o adaptada al lugar (${especies})`,
      "mantener masa vegetal existente cuando sea posible",
      "incorporar áreas permeables y drenaje superficial",
      ...(sust ? [`estrategia visible: ${sust}`] : []),
    ],
    constructability: [
      "mantener bloques simples y repetibles",
      "ordenar accesos y vialidades internas para fases de obra",
      "priorizar sistemas de fachada repetibles y de bajo mantenimiento",
    ],
  };
}

// Ensambla el contrato estructurado por dominio (espejo de referencia).
export function construirJSON(
  usosConfirmados: UsoDetectado[],
  preset: Preset,
  toma: CondicionesToma,
  ubicacion: Ubicacion
): RenderContract {
  const color_legend: Record<string, string> = {};
  for (const u of usosConfirmados) {
    color_legend[u.hex] = `${u.funcion} — ${u.materialidad}`;
  }

  const especies = preset.vegetacion.especies.join(", ");
  const sotobosque = preset.vegetacion.sotobosque.join(", ");
  const lugar = ubicacion.etiqueta || preset.location;

  // Negativos derivados del preset (clima): evita vegetación ajena al lugar.
  const negDerivados =
    preset.clima.includes("semiárido") || preset.clima.includes("árido")
      ? ["no agregar vegetación tropical, palmeras ni césped húmedo exuberante"]
      : [];

  return {
    task: "render arquitectónico controlado a partir de un volumen coloreado de Forma",
    source: "captura de Autodesk Forma",
    image_role:
      "la imagen es un modelo volumétrico de Forma; cada color plano codifica un USO, no un material final",
    interpretation_mode: "traducir color → uso → materialidad, conservando la geometría exacta",

    camera: {
      type: "vista de la imagen (no inferir nueva cámara)",
      framing: "encuadre exacto de la captura de Forma",
      aspect_ratio: "el de la imagen original",
      camera_lock: true,
    },

    location: { place: lugar, lat: ubicacion.lat, lng: ubicacion.lng },
    context: {
      territory: `entorno propio de ${lugar}`,
      climate: preset.clima,
      landscape_character: `paisaje ${preset.clima}, con vegetación nativa (${especies})`,
      existing_buildings: "volúmenes blancos: contexto existente, mantener neutros y secundarios",
      roads: "calles grises: vialidades existentes o internas, conservar trazado",
      vegetation: `árboles y sotobosque propios del lugar: ${especies}; suelo: ${sotobosque}`,
    },

    project_elements: usosConfirmados.map(elementoDe),
    color_legend,

    design_intent: designIntent(toma),

    render_prompt: {
      prompt: componerPrompt(usosConfirmados, preset, toma, ubicacion),
      negative: [...NEGATIVOS_BASE, ...negDerivados],
      no_cambiar: NO_CAMBIAR,
    },

    data_sustainability_constructability: dataSustConst(toma, especies),

    render_params: {
      school: toma.escuela,
      light: toma.luz,
      sky: toma.cielo,
      shadows: toma.sombras,
      color_grade: toma.paletaTono,
      urban_edge: toma.encuentroUrbano,
      tectonics: toma.tectonica,
      material_accent: toma.materialGlobal,
      finish: toma.acabado,
      sustainability: toma.sustentabilidad,
      vegetation: toma.vegetacion === AUTO_CLIMA ? `auto: ${especies}` : toma.vegetacion,
      season: toma.estacion === AUTO_CLIMA ? "auto (clima)" : toma.estacion,
      people_and_cars: toma.genteAutos,
      detail: toma.detalle,
      photo_reference: toma.referenciaFoto,
    },
  };
}

// Serializa indentado, listo para clipboard.
export function aTexto(contract: RenderContract): string {
  return JSON.stringify(contract, null, 2);
}
