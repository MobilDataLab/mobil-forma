// Genera el "Informe de Cabida" como PPTX editable (texto y formas nativas), a partir
// del objeto Informe consolidado. Frontend-only: pptxgenjs corre en el navegador y el
// archivo se descarga sin pasar por backend. Las imágenes que el usuario adjunta se
// insertan como imágenes; todo lo demás (títulos, KPIs, tablas, barras) es editable.
//
// Diseño: Design System v3 de Mobil (colores y tipografía del handoff_informe_pptx).
// pptxgenjs se importa de forma dinámica para no pesar en el arranque de la app.

import type PptxGenJSType from "pptxgenjs";
import type { Informe } from "./Informe";
import { redactarDescripcion } from "./Informe";

// ── Tokens v3 (HEX sin "#", como espera pptxgenjs) ──
const C = {
  azul: "006BFF",
  azulTexto: "0256CA",
  azulProfundo: "011D41",
  amarillo: "FFF81D",
  ink: "1A1A1A",
  gris700: "555555",
  gris400: "A3A3A3",
  gris200: "DEDEDE",
  gris50: "F5F5F5",
  ok: "1F8A5B",
  blanco: "FFFFFF",
};
// Tipografía: condensada Mobil para títulos/labels, Roboto para cuerpo.
// PowerPoint busca la fuente por su nombre instalado en el PC que abre el archivo;
// "Swis721 Cn BT" es el nombre estándar (Bitstream) que tienen los equipos de Mobil.
// En un PC sin esa fuente, PowerPoint cae al fallback condensado automáticamente.
const F_HEAD = "Swis721 Cn BT";
const F_BODY = "Roboto";

// Lámina 16:9 en pulgadas (13.333 × 7.5). Helpers de proporción contra ese lienzo.
const W = 13.333;
const H = 7.5;
const MARGEN = 0.62;

const fmt = (n: number, dec = 0) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: dec, minimumFractionDigits: dec });

type Slide = ReturnType<PptxGenJSType["addSlide"]>;

// Barra de pie de lámina (4px ≈ 0.05in). Azul por defecto, amarilla en normativa.
function barraPie(slide: Slide, color = C.azul) {
  slide.addShape("rect", { x: 0, y: H - 0.06, w: W, h: 0.06, fill: { color } });
}

// Texto vertical "MOBIL ARQUITECTOS" en el margen izquierdo de láminas de contenido.
function margenVertical(slide: Slide) {
  slide.addText("MOBIL ARQUITECTOS", {
    x: -2.45, y: 3.35, w: 5.5, h: 0.4, rotate: 270,
    fontFace: F_HEAD, fontSize: 9, color: C.gris400, charSpacing: 3, align: "center",
  });
}

// Kicker azul + título con la palabra clave resaltada (encabezado de lámina de contenido).
function encabezado(slide: Slide, kicker: string, titulo: string, acento: string) {
  slide.addText(kicker, {
    x: MARGEN, y: 0.5, w: 8, h: 0.3, fontFace: F_HEAD, fontSize: 12,
    color: C.azulTexto, charSpacing: 2, bold: true,
  });
  slide.addText(
    [
      { text: titulo + " ", options: { color: C.ink } },
      { text: acento, options: { color: C.azul } },
    ],
    { x: MARGEN, y: 0.78, w: 11, h: 0.7, fontFace: F_HEAD, fontSize: 34, charSpacing: 1 }
  );
}

// ── Lámina 1 · Portada ──
function laminaPortada(pptx: PptxGenJSType, inf: Informe) {
  const s = pptx.addSlide();
  s.background = { color: C.blanco };
  const tieneHero = !!inf.imagenes.portada;
  const colW = tieneHero ? 6.6 : 11;

  s.addText("MOBIL ARQUITECTOS", {
    x: MARGEN, y: 0.55, w: 8, h: 0.3, fontFace: F_HEAD, fontSize: 12, color: C.gris700, charSpacing: 2, bold: true,
  });
  s.addText("INFORME DE CABIDA", {
    x: MARGEN, y: 2.0, w: colW, h: 0.4, fontFace: F_HEAD, fontSize: 16, color: C.azulTexto, charSpacing: 3, bold: true,
  });
  s.addText(inf.proyecto.nombre, {
    x: MARGEN, y: 2.4, w: colW, h: 1.6, fontFace: F_HEAD, fontSize: 54, color: C.ink, charSpacing: 1,
  });
  s.addText(inf.proyecto.ubicacion, {
    x: MARGEN, y: 4.0, w: colW, h: 0.5, fontFace: F_BODY, fontSize: 16, color: C.gris700,
  });
  s.addText(
    `${inf.proyecto.fecha}   ·   Origen: Autodesk Forma   ·   Informe v1`,
    { x: MARGEN, y: 4.6, w: colW, h: 0.35, fontFace: F_BODY, fontSize: 11, color: C.gris400 }
  );

  if (tieneHero) {
    s.addImage({ data: inf.imagenes.portada!, x: 7.0, y: 0, w: W - 7.0, h: H, sizing: { type: "cover", w: W - 7.0, h: H } });
  }
  barraPie(s, C.azul);
}

// ── Lámina 2 · Descripción del proyecto ──
function laminaDescripcion(pptx: PptxGenJSType, inf: Informe) {
  const s = pptx.addSlide();
  s.background = { color: C.blanco };
  margenVertical(s);
  encabezado(s, "01 — Proyecto", "Descripción del", "proyecto");

  s.addText(redactarDescripcion(inf), {
    x: MARGEN, y: 1.7, w: 6.6, h: 2.6, fontFace: F_BODY, fontSize: 14, color: C.ink, lineSpacingMultiple: 1.25, valign: "top",
  });

  // Ficha de datos (label + valor).
  const r = inf.cabida.resumen;
  const ficha: [string, string][] = [
    ["Ubicación", inf.proyecto.ubicacion],
    ["Clima", inf.proyecto.clima],
    ["Construido", `${fmt(r.construido)} m²`],
    ["Venta", `${fmt(r.venta)} m²`],
    ["Eficiencia", `${Math.round(r.eficiencia * 100)} %`],
    ["Elementos", fmt(r.elementos)],
  ];
  ficha.forEach(([k, v], i) => {
    const fy = 4.55 + i * 0.5;
    s.addText(k.toUpperCase(), { x: MARGEN, y: fy, w: 2.2, h: 0.4, fontFace: F_HEAD, fontSize: 10, color: C.gris400, charSpacing: 1, bold: true, valign: "middle" });
    s.addText(v, { x: MARGEN + 2.2, y: fy, w: 4.2, h: 0.4, fontFace: F_BODY, fontSize: 13, color: C.ink, valign: "middle" });
  });

  if (inf.imagenes.emplazamiento) {
    s.addImage({ data: inf.imagenes.emplazamiento, x: 7.5, y: 1.7, w: 5.2, h: 3.6, sizing: { type: "cover", w: 5.2, h: 3.6 } });
  } else {
    s.addShape("rect", { x: 7.5, y: 1.7, w: 5.2, h: 3.6, fill: { color: C.gris50 }, line: { color: C.gris200, width: 1 } });
    s.addText("Emplazamiento (adjunta una imagen)", { x: 7.5, y: 3.3, w: 5.2, h: 0.4, fontFace: F_BODY, fontSize: 11, color: C.gris400, align: "center" });
  }
  barraPie(s, C.azul);
}

// ── Lámina 3 · Cabida resumen (KPIs + barra de venta por función) ──
function laminaResumen(pptx: PptxGenJSType, inf: Informe) {
  const s = pptx.addSlide();
  s.background = { color: C.blanco };
  margenVertical(s);
  encabezado(s, "02 — Cabida", "Cabida —", "resumen");

  const r = inf.cabida.resumen;
  const kpis: { label: string; valor: string; callout?: boolean }[] = [
    { label: "Elementos", valor: fmt(r.elementos) },
    { label: "Construido m²", valor: fmt(r.construido) },
    { label: "Venta m²", valor: fmt(r.venta) },
    { label: "Eficiencia", valor: `${Math.round(r.eficiencia * 100)} %`, callout: true },
  ];
  const kw = 2.85, gap = 0.25;
  kpis.forEach((k, i) => {
    const x = MARGEN + i * (kw + gap);
    s.addShape("rect", { x, y: 1.8, w: kw, h: 1.6, fill: { color: k.callout ? C.amarillo : C.gris50 }, line: { color: C.gris200, width: 1 } });
    s.addText(k.valor, { x, y: 2.0, w: kw, h: 0.9, fontFace: F_HEAD, fontSize: 40, color: C.ink, align: "center", valign: "middle" });
    s.addText(k.label.toUpperCase(), { x, y: 2.95, w: kw, h: 0.35, fontFace: F_HEAD, fontSize: 11, color: k.callout ? C.ink : C.gris700, charSpacing: 1, bold: true, align: "center" });
  });

  // Barra 100% apilada de venta por función, con etiqueta de % dentro de los
  // segmentos anchos + leyenda con m² y % (colores del motor).
  const items = inf.cabida.venta?.items ?? [];
  const total = inf.cabida.venta?.total ?? items.reduce((s2, i) => s2 + i.venta, 0);
  if (items.length && total > 0) {
    s.addText(`VENTA POR FUNCIÓN — ${fmt(total)} m² TOTAL`, { x: MARGEN, y: 4.0, w: 11, h: 0.35, fontFace: F_HEAD, fontSize: 11, color: C.gris700, charSpacing: 1, bold: true });
    const barX = MARGEN, barY = 4.45, barW = W - MARGEN * 2, barH = 0.6;
    let cx = barX;
    for (const it of items) {
      const w = barW * (it.venta / total);
      const pctNum = Math.round(it.pct * 100); // pct viene como fracción 0..1
      s.addShape("rect", { x: cx, y: barY, w, h: barH, fill: { color: hex(it.color) } });
      // % dentro del segmento solo si hay ancho suficiente (~0.6in) para que se lea.
      if (w >= 0.6 && pctNum >= 5) {
        s.addText(`${pctNum}%`, { x: cx, y: barY, w, h: barH, fontFace: F_HEAD, fontSize: 12, bold: true, color: legibleSobre(it.color), align: "center", valign: "middle" });
      }
      cx += w;
    }
    // Leyenda: chip + función + m² + %.
    items.forEach((it, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const lx = MARGEN + col * 4.0, ly = 5.4 + row * 0.42;
      s.addShape("rect", { x: lx, y: ly + 0.04, w: 0.18, h: 0.18, fill: { color: hex(it.color) } });
      s.addText(
        [
          { text: `${it.funcion}  `, options: { color: C.ink, bold: false } },
          { text: `${fmt(it.venta)} m² · ${Math.round(it.pct * 100)}%`, options: { color: C.gris400 } },
        ],
        { x: lx + 0.28, y: ly, w: 3.6, h: 0.28, fontFace: F_BODY, fontSize: 11, valign: "middle" }
      );
    });
  }
  barraPie(s, C.azul);
}

// ── Lámina 4 · Cabida por piso (barras horizontales apiladas, línea de terreno) ──
function laminaPorPiso(pptx: PptxGenJSType, inf: Informe) {
  const m = inf.cabida.matriz;
  if (!m) return;
  const s = pptx.addSlide();
  s.background = { color: C.blanco };
  margenVertical(s);
  encabezado(s, "02 — Cabida", "Cabida por", "piso");

  // Orden: pisos sobre tierra arriba, subterráneos abajo (es_sub al final).
  const filas = [...m.datos];
  const totalFila = (f: typeof filas[number]) => m.funciones.reduce((acc, fn) => acc + (Number(f[fn]) || 0), 0);
  const maxTotal = Math.max(1, ...filas.map(totalFila));

  const x0 = MARGEN + 1.2;            // espacio para etiqueta de piso
  const wTot = W - x0 - MARGEN;
  const y0 = 1.8;
  const rowH = Math.min(0.32, (H - y0 - 1.0) / Math.max(filas.length, 1));
  let yLinea: number | null = null;
  let prevSub = false;

  filas.forEach((f, i) => {
    const y = y0 + i * rowH;
    // Línea de terreno entre el último piso sobre tierra y el primer subterráneo.
    if (f.es_sub && !prevSub && i > 0) yLinea = y;
    prevSub = f.es_sub;

    s.addText(String(f.etiqueta), { x: MARGEN, y, w: 1.1, h: rowH, fontFace: F_BODY, fontSize: 9, color: f.es_sub ? C.gris400 : C.gris700, align: "right", valign: "middle" });
    let cx = x0;
    for (const fn of m.funciones) {
      const v = Number(f[fn]) || 0;
      if (v <= 0) continue;
      const w = wTot * (v / maxTotal);
      s.addShape("rect", { x: cx, y: y + rowH * 0.12, w, h: rowH * 0.76, fill: { color: hex(m.colores[fn] || C.gris200) } });
      cx += w;
    }
    // Total m² del piso al final de la barra.
    const tot = totalFila(f);
    if (tot > 0) {
      s.addText(`${fmt(tot)} m²`, { x: cx + 0.08, y, w: 1.3, h: rowH, fontFace: F_BODY, fontSize: 8, color: C.gris400, valign: "middle" });
    }
  });
  // Marca de escala (máximo) bajo las barras.
  s.addText(`escala: 0 → ${fmt(maxTotal)} m² por nivel`, { x: x0, y: y0 + filas.length * rowH + 0.08, w: 6, h: 0.3, fontFace: F_BODY, fontSize: 8, color: C.gris400, italic: true });
  if (yLinea != null) {
    s.addShape("line", { x: MARGEN, y: yLinea, w: W - MARGEN * 2, h: 0, line: { color: C.ink, width: 1.5, dashType: "dash" } });
  }

  // Leyenda de funciones.
  m.funciones.forEach((fn, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const lx = MARGEN + col * 3.0, ly = H - 0.85 + row * 0.32;
    s.addShape("rect", { x: lx, y: ly + 0.03, w: 0.16, h: 0.16, fill: { color: hex(m.colores[fn] || C.gris200) } });
    s.addText(fn, { x: lx + 0.24, y: ly, w: 2.7, h: 0.26, fontFace: F_BODY, fontSize: 9, color: C.ink, valign: "middle" });
  });
  barraPie(s, C.azul);
}

// ── Lámina 5 · Cabida por edificio (tabla + fila total) ──
function laminaPorEdificio(pptx: PptxGenJSType, inf: Informe) {
  const e = inf.cabida.edificios;
  if (!e || !e.edificios.length) return;
  const s = pptx.addSlide();
  s.background = { color: C.blanco };
  margenVertical(s);
  encabezado(s, "02 — Cabida", "Cabida por", "edificio");

  const head = ["Edificio", "Deptos", "Construido m²", "Venta m²", "Eficiencia"];
  const rows: PptxGenJSType.TableRow[] = [
    head.map((h) => ({ text: h, options: { fontFace: F_HEAD, fontSize: 11, bold: true, color: C.blanco, fill: { color: C.azul }, charSpacing: 1, align: "center" as const } })),
  ];
  for (const ed of e.edificios) {
    rows.push([
      { text: ed.edificio, options: { fontFace: F_BODY, fontSize: 12, color: C.ink, align: "left" } },
      { text: fmt(ed.departamentos), options: { fontFace: F_BODY, fontSize: 12, align: "center" } },
      { text: fmt(ed.construido), options: { fontFace: F_BODY, fontSize: 12, align: "center" } },
      { text: fmt(ed.venta), options: { fontFace: F_BODY, fontSize: 12, align: "center" } },
      { text: `${Math.round(ed.eficiencia * 100)} %`, options: { fontFace: F_BODY, fontSize: 12, align: "center" } },
    ]);
  }
  const t = e.total;
  rows.push([
    { text: "Total proyecto", options: { fontFace: F_HEAD, fontSize: 12, bold: true, color: C.ink, fill: { color: C.gris50 }, align: "left" } },
    { text: fmt(t.departamentos), options: { fontFace: F_HEAD, fontSize: 12, bold: true, fill: { color: C.gris50 }, align: "center" } },
    { text: fmt(t.construido), options: { fontFace: F_HEAD, fontSize: 12, bold: true, fill: { color: C.gris50 }, align: "center" } },
    { text: fmt(t.venta), options: { fontFace: F_HEAD, fontSize: 12, bold: true, fill: { color: C.gris50 }, align: "center" } },
    { text: `${Math.round(t.eficiencia * 100)} %`, options: { fontFace: F_HEAD, fontSize: 12, bold: true, fill: { color: C.gris50 }, align: "center" } },
  ]);

  s.addTable(rows, {
    x: MARGEN, y: 1.8, w: W - MARGEN * 2, colW: [4.6, 1.7, 2.3, 2.3, 1.9],
    border: { type: "solid", color: C.gris200, pt: 1 }, valign: "middle", rowH: 0.45,
  });
  barraPie(s, C.azul);
}

// ── Lámina 6 · Normativa urbanística (tabla de parámetros) ──
function laminaNormativa(pptx: PptxGenJSType, inf: Informe) {
  const tabla = inf.normativa.tabla;
  if (!tabla) return;
  const s = pptx.addSlide();
  s.background = { color: C.blanco };
  margenVertical(s);
  encabezado(s, "03 — Normativa", "Normativa", "urbanística");

  // Mantener la tabla dentro de la lámina 16:9: limitar columnas (Parámetro +
  // hasta 3 columnas de valores) y filas (las que caben holgadas). Si se recorta,
  // se avisa al pie. Esto evita el desborde y el archivo gigante.
  const MAX_COLS = 3, MAX_FILAS = 16;
  const cols = tabla.columnas.slice(0, MAX_COLS);
  const head = ["Parámetro", ...cols.map((c) => c.nombre)];
  const rows: PptxGenJSType.TableRow[] = [
    head.map((h) => ({ text: h, options: { fontFace: F_HEAD, fontSize: 10, bold: true, color: C.blanco, fill: { color: C.azul }, charSpacing: 1, align: "center" as const } })),
  ];
  let usadas = 0, recortado = false;
  for (const f of tabla.filas) {
    if (usadas >= MAX_FILAS) { recortado = true; break; }
    if (f.grupo) {
      rows.push([{ text: f.label, options: { fontFace: F_HEAD, fontSize: 10, bold: true, color: C.azulTexto, fill: { color: C.gris50 }, colspan: head.length } }]);
      usadas++;
      continue;
    }
    const cells: PptxGenJSType.TableCell[] = [
      { text: f.label, options: { fontFace: F_BODY, fontSize: 9, color: C.ink, align: "left" } },
    ];
    for (const c of cols) {
      cells.push({ text: f.valores?.[c.id] ?? "—", options: { fontFace: F_BODY, fontSize: 9, color: C.ink, align: "center" } });
    }
    rows.push(cells);
    usadas++;
  }
  if (tabla.columnas.length > MAX_COLS) recortado = true;

  const colCount = head.length;
  const tableW = W - MARGEN * 2;
  const firstW = 4.6;
  const restW = (tableW - firstW) / Math.max(colCount - 1, 1);
  s.addTable(rows, {
    x: MARGEN, y: 1.75, w: tableW, colW: [firstW, ...Array(colCount - 1).fill(restW)],
    border: { type: "solid", color: C.gris200, pt: 1 }, valign: "middle", rowH: 0.32, autoPage: false,
  });
  if (recortado) {
    s.addText("Tabla resumida — ver el detalle completo en la app / Excel de normativa.", { x: MARGEN, y: H - 0.55, w: 10, h: 0.3, fontFace: F_BODY, fontSize: 9, color: C.gris400, italic: true });
  }
  barraPie(s, C.amarillo);
}

// ── Lámina 7 · Estacionamientos (tabla de bloques + ratio) ──
function laminaEstacionamientos(pptx: PptxGenJSType, inf: Informe) {
  const bloques = inf.normativa.estac.bloques.filter((b) => b.gfa > 0 || b.cajones > 0);
  if (!bloques.length) return;
  const s = pptx.addSlide();
  s.background = { color: C.blanco };
  margenVertical(s);
  encabezado(s, "03 — Normativa", "", "Estacionamientos");

  const head = ["Bloque", "Superficie m²", "Cajones", "m² / cajón"];
  const rows: PptxGenJSType.TableRow[] = [
    head.map((h) => ({ text: h, options: { fontFace: F_HEAD, fontSize: 11, bold: true, color: C.blanco, fill: { color: C.azul }, charSpacing: 1, align: "center" as const } })),
  ];
  let totGfa = 0, totCaj = 0;
  for (const b of bloques) {
    totGfa += b.gfa; totCaj += b.cajones;
    rows.push([
      { text: b.titulo, options: { fontFace: F_BODY, fontSize: 12, color: C.ink, align: "left" } },
      { text: fmt(b.gfa), options: { fontFace: F_BODY, fontSize: 12, align: "center" } },
      { text: fmt(b.cajones), options: { fontFace: F_BODY, fontSize: 12, align: "center" } },
      { text: b.ratio ? fmt(b.ratio, 1) : (b.cajones ? fmt(b.gfa / b.cajones, 1) : "—"), options: { fontFace: F_BODY, fontSize: 12, align: "center" } },
    ]);
  }
  s.addTable(rows, {
    x: MARGEN, y: 1.8, w: W - MARGEN * 2, colW: [4.6, 3.2, 2.3, 2.0],
    border: { type: "solid", color: C.gris200, pt: 1 }, valign: "middle", rowH: 0.5,
  });

  // 2 KPIs: superficie total modelada y ratio global.
  const ratioGlobal = totCaj ? totGfa / totCaj : 0;
  const kpis: [string, string][] = [
    ["Superficie modelada", `${fmt(totGfa)} m²`],
    ["Ratio global", ratioGlobal ? `${fmt(ratioGlobal, 1)} m²/cajón` : "—"],
  ];
  kpis.forEach(([k, v], i) => {
    const x = MARGEN + i * 3.4;
    const y = 1.8 + (bloques.length + 1) * 0.5 + 0.5;
    s.addShape("rect", { x, y, w: 3.1, h: 1.2, fill: { color: C.gris50 }, line: { color: C.gris200, width: 1 } });
    s.addText(v, { x, y: y + 0.12, w: 3.1, h: 0.6, fontFace: F_HEAD, fontSize: 26, color: C.ink, align: "center", valign: "middle" });
    s.addText(k.toUpperCase(), { x, y: y + 0.78, w: 3.1, h: 0.3, fontFace: F_HEAD, fontSize: 10, color: C.gris700, charSpacing: 1, bold: true, align: "center" });
  });
  barraPie(s, C.amarillo);
}

// ── Láminas 8–11 · Anexo gráfico (una imagen full-bleed por lámina) ──
function laminaAnexo(pptx: PptxGenJSType, data: string, rotulo: string) {
  const s = pptx.addSlide();
  s.background = { color: "E7ECF2" };
  s.addImage({ data, x: 0, y: 0, w: W, h: H, sizing: { type: "cover", w: W, h: H } });
  // Kicker azul arriba-izq.
  s.addText("04 — ANEXO GRÁFICO", { x: 0, y: 0.5, w: 3.3, h: 0.4, fontFace: F_HEAD, fontSize: 12, color: C.blanco, fill: { color: C.azul }, charSpacing: 2, bold: true, align: "center", valign: "middle" });
  // Rótulo en franja ink abajo-izq.
  s.addText(rotulo.toUpperCase(), { x: 0, y: H - 1.1, w: 5.2, h: 0.6, fontFace: F_HEAD, fontSize: 28, color: C.blanco, fill: { color: C.ink }, charSpacing: 1, valign: "middle" });
}

// ── Lámina 12 · Cierre ──
function laminaCierre(pptx: PptxGenJSType) {
  const s = pptx.addSlide();
  s.background = { color: C.azulProfundo };
  s.addText("◆", { x: 0, y: 2.4, w: W, h: 1.0, fontFace: F_BODY, fontSize: 54, color: C.amarillo, align: "center" });
  s.addText("MOBIL ARQUITECTOS", { x: 0, y: 3.7, w: W, h: 0.6, fontFace: F_HEAD, fontSize: 30, color: C.blanco, charSpacing: 3, align: "center" });
  s.addText("Informe de cabida generado con mobil-forma", { x: 0, y: 4.4, w: W, h: 0.4, fontFace: F_BODY, fontSize: 13, color: C.gris400, align: "center" });
  barraPie(s, C.amarillo);
}

// Normaliza un color del motor (puede venir como "#RRGGBB") a HEX sin "#".
function hex(c: string | undefined): string {
  if (!c) return C.gris200;
  return c.replace("#", "").toUpperCase();
}

// Elige texto blanco o ink según la luminancia del color de fondo (contraste legible).
function legibleSobre(c: string | undefined): string {
  const h = hex(c);
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? C.ink : C.blanco;
}

// Construye y descarga el PPTX. Importa pptxgenjs dinámicamente.
export async function generarInformePptx(inf: Informe): Promise<void> {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "MOBIL_16x9", width: W, height: H });
  pptx.layout = "MOBIL_16x9";

  // Láminas de contenido (siempre).
  laminaPortada(pptx, inf);
  laminaDescripcion(pptx, inf);
  laminaResumen(pptx, inf);
  laminaPorPiso(pptx, inf);
  laminaPorEdificio(pptx, inf);
  laminaNormativa(pptx, inf);
  laminaEstacionamientos(pptx, inf);

  // Anexo gráfico: solo las imágenes que el usuario adjuntó.
  const anexos: [string | undefined, string][] = [
    [inf.imagenes.render, "Render principal"],
    [inf.imagenes.emplazamiento, "Emplazamiento"],
    [inf.imagenes.planta, "Planta tipo"],
    [inf.imagenes.peatonal, "Vista peatonal"],
  ];
  for (const [data, rotulo] of anexos) {
    if (data) laminaAnexo(pptx, data, rotulo);
  }

  laminaCierre(pptx);

  const nombreArchivo = `Informe de cabida - ${inf.proyecto.nombre}.pptx`.replace(/[\\/:*?"<>|]/g, "_");
  await pptx.writeFile({ fileName: nombreArchivo });
}
