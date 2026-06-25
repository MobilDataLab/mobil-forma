import { useMemo, useState } from "react";
import GraficoCabida, { type Matriz } from "./GraficoCabida";
import { IconoDescarga } from "./iconos";

type Celdas = Record<string, number>;
type Agreg = { celdas: Celdas; construido: number; vendible: number; total: number };
type Piso = Agreg & { etiqueta: string; es_sub: boolean; celdas_manual?: Celdas };
type Bloque = {
  pisos: Piso[];
  subtotal_bajo: Agreg | null;
  subtotal_sobre: Agreg | null;
  total: Agreg;
  ratio: number;
};
type Grupo = { grupo: string; funciones: string[]; colores: Record<string, string> };

export type Superficies = {
  edificios: { id: string; nombre: string }[];
  funciones: string[];
  colores: Record<string, string>;
  grupos: Grupo[];
  por_edificio: Record<string, Bloque>;
};

const fmt = (n: number) => (n ? n.toLocaleString("es-CL", { maximumFractionDigits: 0 }) : "");
const pct = (n: number) => (n * 100).toLocaleString("es-CL", { maximumFractionDigits: 1 }) + "%";

// "Util"/"Comun" a partir del nombre canónico, para el subencabezado del grupo.
const subLabel = (fn: string) => {
  if (/Util$/i.test(fn)) return "Útil";
  if (/Comun$/i.test(fn)) return "Común";
  if (/Terraza$/i.test(fn)) return "Terraza";
  if (/Loggia$/i.test(fn)) return "Loggia";
  return fn;
};

export default function CabidaSuperficies({
  superficies,
  onDescargarExcel,
}: {
  superficies: Superficies;
  onDescargarExcel?: () => void;
}) {
  const opciones = [{ id: "__total__", nombre: "Total proyecto" }, ...superficies.edificios];
  const [sel, setSel] = useState<string>("__total__");
  const bloque = superficies.por_edificio[sel] ?? superficies.por_edificio["__total__"];

  // Columnas planas (en el orden de los grupos) para la tabla.
  const cols = useMemo(
    () => superficies.grupos.flatMap((g) => g.funciones),
    [superficies.grupos]
  );

  // Matriz para el gráfico (mismas etiquetas/celdas del bloque seleccionado).
  const matriz: Matriz = useMemo(
    () => ({
      etiquetas: bloque.pisos.map((p) => p.etiqueta),
      funciones: superficies.funciones,
      colores: superficies.colores,
      datos: bloque.pisos.map((p) => ({
        etiqueta: p.etiqueta,
        es_sub: p.es_sub,
        ...p.celdas,
      })),
    }),
    [bloque, superficies.funciones, superficies.colores]
  );

  const filaTotales = (a: Agreg, clase: string, etiqueta: string) => (
    <tr className={clase}>
      <td className="sf-piso">{etiqueta}</td>
      {cols.map((fn) => (
        <td key={fn} className="num">{fmt(a.celdas[fn] ?? 0)}</td>
      ))}
      <td className="num sf-constr">{fmt(a.construido)}</td>
      <td className="num sf-vend">{fmt(a.vendible)}</td>
    </tr>
  );

  return (
    <div className="superficies">
      <div className="tabla-head">
        <div className="grafico-titulo">Cabida por piso · <span className="acento">superficies por función</span></div>
        <div className="tabla-tools">
          <div className="sf-selector">
            {opciones.map((o) => (
              <button
                key={o.id}
                className={"sf-tab" + (sel === o.id ? " on" : "")}
                onClick={() => setSel(o.id)}
              >
                {o.nombre}
              </button>
            ))}
          </div>
          <button
            className="btn-export"
            onClick={onDescargarExcel}
            disabled={!onDescargarExcel}
            title="Descargar el cuadro de superficies como Excel (Total + edificios)"
          >
            <IconoDescarga /> Excel
          </button>
        </div>
      </div>

      <div className="sf-scroll">
        <table className="tbl sf-tbl">
          <thead>
            <tr>
              <th rowSpan={2} className="sf-piso-h">Piso</th>
              {superficies.grupos.map((g) => (
                <th key={g.grupo} colSpan={g.funciones.length} className="sf-grupo-h">{g.grupo}</th>
              ))}
              <th rowSpan={2} className="num sf-constr-h">Construido</th>
              <th rowSpan={2} className="num sf-vend-h">Vendible</th>
            </tr>
            <tr>
              {superficies.grupos.flatMap((g) =>
                g.funciones.map((fn) => (
                  <th key={fn} className="num sf-sub-h">
                    <span className="sf-sw" style={{ background: g.colores[fn] }} />
                    {subLabel(fn)}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {bloque.pisos.map((p) => (
              <tr key={p.etiqueta} className={p.es_sub ? "sf-sub" : ""}>
                <td className="sf-piso">{p.etiqueta}</td>
                {cols.map((fn) => (
                  <td key={fn} className="num">{fmt(p.celdas[fn] ?? 0)}</td>
                ))}
                <td className="num sf-constr">{fmt(p.construido)}</td>
                <td className="num sf-vend">{fmt(p.vendible)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {bloque.subtotal_sobre && filaTotales(bloque.subtotal_sobre, "sf-subtot", "Total sobre NTN")}
            {bloque.subtotal_bajo && filaTotales(bloque.subtotal_bajo, "sf-subtot", "Total bajo NTN")}
            {filaTotales(bloque.total, "sf-total", "TOTAL")}
          </tfoot>
        </table>
      </div>

      <div className="sf-ratio">
        Vendible / Construido · <b>{pct(bloque.ratio)}</b>
      </div>

      <div className="sf-grafico">
        <GraficoCabida matriz={matriz} />
      </div>
    </div>
  );
}
