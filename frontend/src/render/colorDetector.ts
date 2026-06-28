import type { InspeccionImagen, RGB, UsoDetectado, ColorEscena } from "./tipos";
import type { ColorCanonico } from "../PaletaColores";
import { defaultMaterialKey } from "./materialidad.generated";

export type OpcionesDeteccion = {
  umbral?: number;    // distancia RGB máx. para considerar match (default 40)
  minPct?: number;    // % bajo el cual se descarta como ruido (default 2)
  downscale?: number; // ancho objetivo para muestreo (default 240)
};

// Colores de escena (contexto/cielo/follaje). Se EXCLUYEN de los usos.
// Ojo a las colisiones con la paleta del motor (de ahí el paso humano de confirmación):
//   verde follaje ~ Oficinas Util (lima 146,208,80); gris cielo/contexto ~ Estac. (127,143,166).
// Ante la duda, clasificar como escena: el usuario puede recuperarlo si era un uso.
const ESCENA: { etiqueta: string; rgb: RGB }[] = [
  { etiqueta: "Contexto blanco", rgb: [255, 255, 255] },
  { etiqueta: "Contexto claro",  rgb: [235, 235, 235] },
  { etiqueta: "Cielo",           rgb: [180, 210, 235] },
  { etiqueta: "Cielo gris",      rgb: [205, 212, 220] },
  { etiqueta: "Follaje",         rgb: [90, 130, 60] },
  { etiqueta: "Follaje claro",   rgb: [150, 180, 110] },
  { etiqueta: "Suelo / tierra",  rgb: [150, 130, 100] },
  { etiqueta: "Sombra",          rgb: [40, 40, 45] },
];

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function dist2(a: RGB, b: RGB): number {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return dr * dr + dg * dg + db * db; // distancia² (evita sqrt)
}

// Clasifica un píxel: ¿es un uso del proyecto (paleta del motor) o escena?
// Gana el objetivo más cercano entre proyecto+escena; si el mejor proyecto está
// dentro del umbral Y es más cercano que cualquier escena → proyecto.
export function clasificarPixel(
  rgb: RGB,
  objetivos: { funcion: string; rgb: RGB }[],
  umbral: number
): { tipo: "proyecto"; funcion: string } | { tipo: "escena"; etiqueta: string } {
  const u2 = umbral * umbral;

  let mejorProy = { d: Infinity, funcion: "" };
  for (const o of objetivos) {
    const d = dist2(rgb, o.rgb);
    if (d < mejorProy.d) mejorProy = { d, funcion: o.funcion };
  }
  let mejorEsc = { d: Infinity, etiqueta: "" };
  for (const e of ESCENA) {
    const d = dist2(rgb, e.rgb);
    if (d < mejorEsc.d) mejorEsc = { d, etiqueta: e.etiqueta };
  }

  if (mejorProy.d <= u2 && mejorProy.d <= mejorEsc.d) {
    return { tipo: "proyecto", funcion: mejorProy.funcion };
  }
  return { tipo: "escena", etiqueta: mejorEsc.etiqueta || "Escena" };
}

// ImageData del PNG + paleta canónica del motor → usos y escena con % de área.
export function detectarColores(
  imageData: ImageData,
  paleta: ColorCanonico[],
  opts: OpcionesDeteccion = {}
): InspeccionImagen {
  const umbral = opts.umbral ?? 40;
  const minPct = opts.minPct ?? 2;

  const objetivos = paleta.map((p) => ({
    funcion: p.funcion,
    rgb: (p.rgb ?? hexToRgb(p.hex)) as RGB,
    hex: p.hex,
  }));
  const hexDe = new Map(objetivos.map((o) => [o.funcion, o.hex]));

  const { data, width, height } = imageData;
  const contProy = new Map<string, number>();
  const contEsc = new Map<string, number>();
  let total = 0;

  // Muestreo: recorre todos los píxeles del ImageData (ya viene downscalado por el canvas).
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue; // transparente → ignorar
    const rgb: RGB = [data[i], data[i + 1], data[i + 2]];
    total++;
    const c = clasificarPixel(rgb, objetivos, umbral);
    if (c.tipo === "proyecto") contProy.set(c.funcion, (contProy.get(c.funcion) ?? 0) + 1);
    else contEsc.set(c.etiqueta, (contEsc.get(c.etiqueta) ?? 0) + 1);
  }

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const usos: UsoDetectado[] = [...contProy.entries()]
    .map(([funcion, n]) => ({
      funcion, hex: hexDe.get(funcion) ?? "#000000", pct: pct(n),
      confirmado: true, materialidad: defaultMaterialKey(funcion),
    }))
    .filter((u) => u.pct >= minPct)
    .sort((a, b) => b.pct - a.pct);

  const escena: ColorEscena[] = [...contEsc.entries()]
    .map(([etiqueta, n]) => ({ etiqueta, pct: pct(n) }))
    .filter((e) => e.pct >= minPct)
    .sort((a, b) => b.pct - a.pct);

  return { usos, escena, ancho: width, alto: height };
}
