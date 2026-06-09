// Orden vertical de pisos (arriba → abajo): N alto … N1, ST-1 … ST alto, S/N al fondo.
// rank mayor = más arriba.
export function rankPiso(etq: string): number {
  if (etq.startsWith("N")) {
    const n = parseInt(etq.slice(1), 10);
    return Number.isFinite(n) ? 1000 + n : 999;
  }
  if (etq.startsWith("ST-")) {
    const n = parseInt(etq.slice(3), 10);
    return Number.isFinite(n) ? -n : -999;
  }
  return -1000; // S/N
}

// Ordena etiquetas de piso de arriba hacia abajo.
export function ordenarPisos(etiquetas: string[]): string[] {
  return [...etiquetas].sort((a, b) => rankPiso(b) - rankPiso(a));
}

// nivel_raw a partir de la etiqueta y el nº de subterráneos.
// Inverso de etiqueta_fn en cabida_core.py.
export function nivelDeEtiqueta(etq: string, nSub: number): number | null {
  if (etq.startsWith("N")) {
    const n = parseInt(etq.slice(1), 10);
    return Number.isFinite(n) ? n + nSub - 1 : null;
  }
  if (etq.startsWith("ST-")) {
    const n = parseInt(etq.slice(3), 10);
    return Number.isFinite(n) ? nSub - n : null;
  }
  return null;
}
