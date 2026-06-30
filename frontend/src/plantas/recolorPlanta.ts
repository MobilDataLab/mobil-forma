// Camino A — Recolor por píxel (determinista, frontend-only).
//
// Toma el PNG de la vista de plantas de Forma y lo normaliza a la paleta Mobil:
//   1. clasifica cada píxel a una ClasePlanta (color → función),
//   2. aplica un filtro de MAYORÍA 9×9 (2 pasadas) sobre la grilla de clases para
//      borrar los m² "quemados" y los strokes finos (el texto del número queda como
//      pixeles sueltos / huecos; la mayoría del vecindario impone el color de la unidad),
//   3. repinta cada clase con su color (canónico o suave) dejando el fondo transparente.
//
// Todo corre en <canvas>; nada se sube. La geometría es la del raster (buena, no
// vectorial-perfecta); los m² del PNG no son fiables → se re-rotulan aparte (texto vivo).

import { clasificarPixel, CLASES, rgb, type ClasePlanta } from "./paletaPlantas";

export type VarianteColor = "canonico" | "suave";

export type RecolorOpts = {
  variante?: VarianteColor;  // paleta de pintado (def. "canonico")
  radio?: number;            // radio del filtro de mayoría (def. 4 → ventana 9×9)
  pasadas?: number;          // nº de pasadas del filtro (def. 2)
};

// Índices de clase para la grilla compacta (Uint8Array).
const ORDEN: ClasePlanta[] = ["fondo", "residencial", "nucleo", "otros", "comercial", "oficinas"];
const IDX: Record<ClasePlanta, number> = { fondo: 0, residencial: 1, nucleo: 2, otros: 3, comercial: 4, oficinas: 5 };

// Recolorea un ImageData de la planta y devuelve un ImageData nuevo (fondo transparente).
export function recolorPlanta(src: ImageData, opts: RecolorOpts = {}): ImageData {
  const { variante = "canonico", radio = 4, pasadas = 2 } = opts;
  const { width: w, height: h, data } = src;
  const n = w * h;

  // 1) Clasificar cada píxel → grilla de clases.
  let clase: Uint8Array = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    clase[i] = IDX[clasificarPixel(data[p], data[p + 1], data[p + 2], data[p + 3])];
  }

  // 2) Filtro de mayoría (cuadrado (2·radio+1)²), `pasadas` veces.
  for (let k = 0; k < pasadas; k++) clase = mayoria(clase, w, h, radio);

  // 3) Repintar. Pre-resuelve el RGB de cada clase según la variante.
  const colorDe: ([number, number, number] | null)[] = ORDEN.map((c) => {
    if (c === "fondo") return null;
    const def = CLASES[c as Exclude<ClasePlanta, "fondo">];
    return rgb(variante === "suave" ? def.colorSuave : def.colorCanonico);
  });

  const out = new ImageData(w, h);
  for (let i = 0; i < n; i++) {
    const col = colorDe[clase[i]];
    const p = i * 4;
    if (!col) { out.data[p + 3] = 0; continue; } // fondo → transparente
    out.data[p] = col[0]; out.data[p + 1] = col[1]; out.data[p + 2] = col[2]; out.data[p + 3] = 255;
  }
  return out;
}

// Filtro de mayoría: cada celda toma la clase dominante de su vecindario cuadrado.
// Usa histograma incremental por fila (O(n·radio)) para que sea rápido en imágenes grandes.
function mayoria(src: Uint8Array, w: number, h: number, radio: number): Uint8Array {
  const out = new Uint8Array(src.length);
  const NC = ORDEN.length;
  const hist = new Int32Array(NC);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - radio), y1 = Math.min(h - 1, y + radio);
    // Reinicia el histograma para la primera celda de la fila (x=0).
    hist.fill(0);
    let x1prev = Math.min(w - 1, radio);
    for (let yy = y0; yy <= y1; yy++) {
      const base = yy * w;
      for (let xx = 0; xx <= x1prev; xx++) hist[src[base + xx]]++;
    }
    for (let x = 0; x < w; x++) {
      // Mayoría actual.
      let best = 0, bestC = 0;
      for (let c = 0; c < NC; c++) if (hist[c] > best) { best = hist[c]; bestC = c; }
      out[y * w + x] = bestC;
      // Avanza la ventana: quita la columna que sale, agrega la que entra.
      const xOut = x - radio, xInNext = x + 1 + radio;
      if (xOut >= 0) for (let yy = y0; yy <= y1; yy++) hist[src[yy * w + xOut]]--;
      if (xInNext < w) for (let yy = y0; yy <= y1; yy++) hist[src[yy * w + xInNext]]++;
    }
  }
  return out;
}

// Carga un object URL → ImageData (vía canvas). Útil para el pipeline desde un File.
export function imagenAImageData(url: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) { reject(new Error("No se pudo crear el canvas.")); return; }
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    img.src = url;
  });
}

// ImageData → dataURL PNG (con transparencia).
export function imageDataAPng(img: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = img.width; canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas de salida.");
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}
