// Modelo de datos del "Informe de Cabida" (handoff_informe_pptx).
//
// El informe NO recalcula nada: consolida lo que la app ya tiene en estado tras
// procesar el CSV (resumen, matriz, venta, edificios, normas) más la ubicación/clima
// del módulo render y las imágenes que el usuario adjunte en la vista de informe.
// Reusa los tipos reales de cada módulo (no se inventan formas de datos).

import type { Matriz } from "../GraficoCabida";
import type { Venta } from "../GraficoVenta";
import type { Edificios } from "../CabidaEdificios";
import type { Superficies } from "../CabidaSuperficies";
import type { Normas } from "../NormasUrbanisticas";
import { normasParaExcel } from "../NormasUrbanisticas";
import { estacParaExcel } from "../Estacionamientos";

// Igual que el type local de App.tsx (no se exporta allí); se replica aquí.
export type ResumenCabida = { elementos: number; venta: number; construido: number; eficiencia: number };

// Imágenes opcionales que el usuario adjunta en la vista de informe (dataURL base64).
// Cada una alimenta una lámina; si falta, la lámina se omite.
export type ImagenesInforme = {
  portada?: string;       // hero de la portada (lámina 1)
  emplazamiento?: string; // lámina 2 (ficha) y anexo (lámina 9)
  render?: string;        // anexo lámina 8 (render principal)
  planta?: string;        // anexo lámina 10 (planta tipo)
  peatonal?: string;      // anexo lámina 11 (vista peatonal)
};

// Salida de normasParaExcel: tabla de parámetros normativos lista para mostrar.
export type NormasTabla = ReturnType<typeof normasParaExcel>;
// Salida de estacParaExcel: bloques Superficie / Subterráneo con gfa·cajones·ratio.
export type EstacTabla = ReturnType<typeof estacParaExcel>;

// Objeto consolidado que consume el generador de PPTX.
export type Informe = {
  proyecto: {
    nombre: string;        // editable por el usuario
    ubicacion: string;     // ubicacion.etiqueta del módulo render
    clima: string;         // preset.clima (derivado de las coords)
    fecha: string;         // fecha legible es-CL
  };
  cabida: {
    resumen: ResumenCabida;
    venta: Venta | null;         // venta por función (items + total)
    matriz: Matriz | null;       // cabida por piso (con es_sub)
    edificios: Edificios | null;
    superficies: Superficies | null; // matriz piso×función con construido/vendible
  };
  normativa: {
    tabla: NormasTabla | null; // de normasParaExcel(normas)
    estac: EstacTabla;         // de estacParaExcel() (lee localStorage)
  };
  imagenes: ImagenesInforme;
};

// Insumos que la vista de informe junta desde el estado existente de la app.
export type InsumosInforme = {
  nombre: string;
  ubicacion: string;
  clima: string;
  resumen: ResumenCabida;
  venta: Venta | null;
  matriz: Matriz | null;
  edificios: Edificios | null;
  superficies: Superficies | null;
  normas: Normas | null;
  imagenes: ImagenesInforme;
};

// Fecha legible (es-CL) sin depender de Date.now en módulos puros: se calcula al armar.
function fechaHoy(): string {
  return new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}

// Consolida los insumos en el objeto Informe. No toca el motor ni recalcula.
export function construirInforme(ins: InsumosInforme): Informe {
  return {
    proyecto: {
      nombre: ins.nombre.trim() || "Proyecto sin nombre",
      ubicacion: ins.ubicacion || "—",
      clima: ins.clima || "—",
      fecha: fechaHoy(),
    },
    cabida: {
      resumen: ins.resumen,
      venta: ins.venta,
      matriz: ins.matriz,
      edificios: ins.edificios,
      superficies: ins.superficies,
    },
    normativa: {
      tabla: ins.normas ? normasParaExcel(ins.normas) : null,
      estac: estacParaExcel(),
    },
    imagenes: ins.imagenes,
  };
}

const fmt = (n: number, dec = 0) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: dec, minimumFractionDigits: dec });

// Redacta el párrafo narrativo de la lámina 2 a partir de los datos: ubicación,
// clima, programa (funciones de venta) y magnitudes. Editable en PowerPoint.
export function redactarDescripcion(inf: Informe): string {
  const { proyecto, cabida } = inf;
  const partes: string[] = [];

  // Frase de emplazamiento solo si hay ubicación real (si no, se omite para no dejar "en —").
  const hayUbic = !!proyecto.ubicacion && proyecto.ubicacion.trim() !== "" && proyecto.ubicacion.trim() !== "—";
  const hayClima = !!proyecto.clima && proyecto.clima.trim() !== "" && proyecto.clima.trim() !== "—";
  if (hayUbic) {
    partes.push(
      `${proyecto.nombre} se emplaza en ${proyecto.ubicacion}` +
      (hayClima ? `, en un contexto de clima ${proyecto.clima}.` : ".")
    );
  } else if (hayClima) {
    partes.push(`${proyecto.nombre}, en un contexto de clima ${proyecto.clima}.`);
  }

  // Programa: principales funciones por venta (las que más superan en m²).
  // OJO: `pct` viene como fracción 0..1 del motor → ×100 para mostrar el porcentaje.
  const items = cabida.venta?.items ?? [];
  if (items.length) {
    const top = [...items].sort((a, b) => b.venta - a.venta).slice(0, 3)
      .map((i) => `${i.funcion.toLowerCase()} (${Math.round(i.pct * 100)}%)`);
    partes.push(`El programa se compone principalmente de ${top.join(", ")}.`);
  }

  // Magnitudes.
  const r = cabida.resumen;
  partes.push(
    `La cabida propuesta alcanza ${fmt(r.construido)} m² construidos y ` +
    `${fmt(r.venta)} m² vendibles, con una eficiencia de ${Math.round(r.eficiencia * 100)}% ` +
    `sobre ${fmt(r.elementos)} elementos.`
  );

  if (cabida.edificios && cabida.edificios.n_edificios > 0) {
    const e = cabida.edificios;
    partes.push(
      `El conjunto se organiza en ${e.n_edificios} ` +
      `${e.n_edificios === 1 ? "edificio" : "edificios"}, ` +
      `con un total de ${fmt(e.total.departamentos)} departamentos.`
    );
  }

  return partes.join(" ");
}
