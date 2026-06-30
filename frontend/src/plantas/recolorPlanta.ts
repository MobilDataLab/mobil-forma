// Camino A — Recolor por píxel (determinista, frontend-only).
//
// Recolorea la vista de plantas de Forma a la paleta Mobil CONSERVANDO la geometría:
// las divisiones entre unidades, las esquinas rectas y los m² rotulados del PNG se
// mantienen. Solo cambia los colores de función a los canónicos/suaves y vuelve
// transparente el fondo EXTERIOR (grilla, árboles, blanco alrededor del edificio).
//
// Cómo conserva divisiones y m²:
//   1. clasifica cada píxel a una función (por color) o a "fondo",
//   2. identifica el fondo EXTERIOR con un flood-fill desde los bordes: solo ese se
//      vuelve transparente. El "fondo" ENCERRADO dentro de las unidades —las líneas de
//      división y el texto de los m²— se conserva tal cual (no se borra ni se funde),
//   3. repinta los píxeles de función con su color Mobil; deja intactos los demás.
//
// Todo corre en <canvas>; nada se sube.

import { clasificarPixel, CLASES, rgb, type ClasePlanta } from "./paletaPlantas";

export type VarianteColor = "canonico" | "suave";

export type RecolorOpts = {
  variante?: VarianteColor;   // paleta de pintado (def. "canonico")
  limpiarRuido?: boolean;     // si true, atenúa motas de fondo encerradas pequeñas
};

const IDX: Record<ClasePlanta, number> = { fondo: 0, residencial: 1, nucleo: 2, otros: 3, comercial: 4, oficinas: 5 };
const ORDEN: ClasePlanta[] = ["fondo", "residencial", "nucleo", "otros", "comercial", "oficinas"];

// Recolorea un ImageData de la planta y devuelve uno nuevo (fondo exterior transparente).
export function recolorPlanta(src: ImageData, opts: RecolorOpts = {}): ImageData {
  const { variante = "canonico" } = opts;
  const { width: w, height: h, data } = src;
  const n = w * h;

  // 1) Clasificar cada píxel.
  const clase = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    clase[i] = IDX[clasificarPixel(data[p], data[p + 1], data[p + 2], data[p + 3])];
  }

  // 2) Flood-fill del FONDO EXTERIOR desde los bordes (BFS sobre píxeles clase "fondo").
  //    Solo el fondo conectado al borde de la imagen se marca como exterior.
  const exterior = new Uint8Array(n); // 1 = fondo exterior (→ transparente)
  const cola = new Int32Array(n);
  let head = 0, tail = 0;
  const push = (idx: number) => { if (!exterior[idx] && clase[idx] === IDX.fondo) { exterior[idx] = 1; cola[tail++] = idx; } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + (w - 1)); }
  while (head < tail) {
    const idx = cola[head++];
    const x = idx % w, y = (idx / w) | 0;
    if (x > 0) push(idx - 1);
    if (x < w - 1) push(idx + 1);
    if (y > 0) push(idx - w);
    if (y < h - 1) push(idx + w);
  }

  // 3) Repintar. Resuelve el RGB de cada clase de función según la variante.
  const colorDe: ([number, number, number] | null)[] = ORDEN.map((c) => {
    if (c === "fondo") return null;
    const def = CLASES[c as Exclude<ClasePlanta, "fondo">];
    return rgb(variante === "suave" ? def.colorSuave : def.colorCanonico);
  });

  const out = new ImageData(w, h);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    const col = colorDe[clase[i]];
    if (col) {
      // Píxel de función → color Mobil pleno.
      out.data[p] = col[0]; out.data[p + 1] = col[1]; out.data[p + 2] = col[2]; out.data[p + 3] = 255;
    } else if (exterior[i]) {
      // Fondo exterior → transparente.
      out.data[p + 3] = 0;
    } else {
      // Fondo ENCERRADO (división entre unidades, texto de m²) → conservar el píxel
      // original, para que las líneas y los números sigan siendo legibles.
      out.data[p] = data[p]; out.data[p + 1] = data[p + 1]; out.data[p + 2] = data[p + 2]; out.data[p + 3] = data[p + 3];
    }
  }
  return out;
}

// Carga un object URL → ImageData (vía canvas).
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
