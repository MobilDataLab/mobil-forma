import type { UsoDetectado, Preset, CondicionesToma, RenderContract } from "./tipos";
import { materialidadDe } from "./materialidad";

// Negativos base (constantes Forma): geometría/cámara/contexto que NO debe cambiar.
const NEGATIVOS_BASE = [
  "no cambiar la geometría, las proporciones ni la composición de los volúmenes",
  "no mover ni alterar el punto de vista / la cámara",
  "no reinterpretar el color plano como decoración, textura impresa ni grafiti",
  "no convertir los volúmenes blancos de contexto en edificios de color",
  "no agregar edificios, pisos ni volúmenes que no estén en la imagen",
];

// Ensambla el contrato. color_legend SOLO con los usos confirmados.
export function construirJSON(
  usosConfirmados: UsoDetectado[],
  preset: Preset,
  toma: CondicionesToma
): RenderContract {
  // Leyenda color → "hex: materialidad" solo para lo confirmado.
  const color_legend: Record<string, string> = {};
  for (const u of usosConfirmados) {
    color_legend[u.hex] = `${u.funcion} — ${materialidadDe(u.funcion)}`;
  }

  const especies = preset.vegetacion.especies.join(", ");
  const sotobosque = preset.vegetacion.sotobosque.join(", ");

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
      `Renderiza este proyecto en ${preset.location} (clima ${preset.clima}). ` +
      `Traduce cada color de la leyenda a su materialidad arquitectónica, manteniendo intactas ` +
      `la geometría, las proporciones y el encuadre. Vegetación coherente con el lugar ` +
      `(${especies}); estación: ${toma.estacion}.`,
    color_legend,
    context_rules: {
      white_volumes: "los volúmenes blancos son contexto existente: mantener neutros, sin color de uso",
      trees: `árboles y sotobosque propios del lugar: ${especies}; suelo: ${sotobosque}`,
    },
    render_params: {
      light: toma.luz,
      atmosphere: toma.atmosfera,
      sky: toma.cielo,
      people_and_cars: toma.genteAutos,
    },
    negative: [...NEGATIVOS_BASE, ...negDerivados],
  };
}

// Serializa indentado, listo para clipboard.
export function aTexto(contract: RenderContract): string {
  return JSON.stringify(contract, null, 2);
}
