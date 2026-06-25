// Utilidades de exportación — sin dependencias, solo APIs nativas del navegador.
// PNG: rasteriza un <svg> con canvas. CSV: arma texto separado por ; con BOM
// (acentos correctos al abrir en Excel es-CL).

function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

// Limpia un nombre para usarlo como archivo.
function nombreArchivo(base: string, ext: string): string {
  const limpio = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${limpio || "mobil-cabida"}.${ext}`;
}

// SVG → PNG (canvas nativo). `escala` controla la resolución del export.
export function exportarSvgPng(
  svg: SVGSVGElement | null,
  base: string,
  escala = 2,
  fondo = "#ffffff"
): void {
  if (!svg) return;
  const vb = svg.viewBox?.baseVal;
  const rect = svg.getBoundingClientRect();
  const w = vb && vb.width ? vb.width : rect.width || 600;
  const h = vb && vb.height ? vb.height : rect.height || 400;

  const clon = svg.cloneNode(true) as SVGSVGElement;
  clon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clon.setAttribute("width", String(w));
  clon.setAttribute("height", String(h));
  // Asegura la fuente al rasterizar (si no, el SVG aislado cae a serif).
  const ff = getComputedStyle(svg).fontFamily || "system-ui, sans-serif";
  clon.style.fontFamily = ff;

  const data = new XMLSerializer().serializeToString(clon);
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(w * escala);
    canvas.height = Math.ceil(h * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((b) => {
      if (b) descargarBlob(b, nombreArchivo(base, "png"));
    }, "image/png");
  };
  img.src = src;
}

// Base64 (xlsx generado por openpyxl en Pyodide) → archivo .xlsx descargable.
export function descargarXlsxBase64(b64: string, base: string): void {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  descargarBlob(blob, nombreArchivo(base, "xlsx"));
}

// Filas → CSV descargable.
export function exportarCsv(
  base: string,
  encabezados: string[],
  filas: (string | number)[][]
): void {
  const esc = (v: string | number): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const sep = ";";
  const lineas = [encabezados, ...filas].map((r) => r.map(esc).join(sep));
  const blob = new Blob(["\uFEFF" + lineas.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  descargarBlob(blob, nombreArchivo(base, "csv"));
}
