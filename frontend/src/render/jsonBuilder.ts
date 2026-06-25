import type { UsoDetectado, Preset, CondicionesToma, RenderContract, Ubicacion } from "./tipos";

// Negativos base (constantes Forma): geometría/cámara/contexto que NO debe cambiar.
const NEGATIVOS_BASE = [
  "no cambiar la geometría, las proporciones ni la composición de los volúmenes",
  "no mover ni alterar el punto de vista / la cámara",
  "no reinterpretar el color plano como decoración, textura impresa ni grafiti",
  "no convertir los volúmenes blancos de contexto en edificios de color",
  "no agregar edificios, pisos ni volúmenes que no estén en la imagen",
];

// Ensambla el contrato. color_legend SOLO con los usos confirmados (con su materialidad elegida).
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
    task: "render arquitectónico controlado a partir de un volumen coloreado",
    image_role:
      "la imagen es un modelo volumétrico de Forma; cada color plano codifica un USO, no un material final",
    interpretation_mode: "traducir color → uso → materialidad, conservando la geometría exacta",
    instruction:
      `Renderiza este proyecto en ${lugar} (clima ${preset.clima}). ` +
      `Traduce cada color de la leyenda a su materialidad arquitectónica, manteniendo intactas ` +
      `la geometría, las proporciones y el encuadre. Vegetación coherente con el lugar ` +
      `(${especies}); estación: ${toma.estacion}. Estilo: ${toma.estilo}.`,
    location: { place: lugar, lat: ubicacion.lat, lng: ubicacion.lng },
    color_legend,
    context_rules: {
      white_volumes: "los volúmenes blancos son contexto existente: mantener neutros, sin color de uso",
      trees: `árboles y sotobosque propios del lugar: ${especies}; suelo: ${sotobosque}`,
    },
    render_params: {
      light: toma.luz,
      time_of_day: toma.hora,
      shadows: toma.sombras,
      camera: toma.camara,
      lens: toma.lente,
      style: toma.estilo,
      detail: toma.detalle,
      post: toma.postproceso,
      sky: toma.cielo,
      vegetation_density: toma.vegetacionDensidad,
      street_furniture: toma.mobiliario,
      background: toma.fondo,
      atmosphere: toma.atmosfera,
      people_and_cars: toma.genteAutos,
      finish: toma.acabado,
      reflections: toma.reflejos,
      weathering: toma.desgaste,
      color_grade: toma.paletaTono,
    },
    negative: [...NEGATIVOS_BASE, ...negDerivados],
  };
}

// Serializa indentado, listo para clipboard.
export function aTexto(contract: RenderContract): string {
  return JSON.stringify(contract, null, 2);
}
