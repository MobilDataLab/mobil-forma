import { exportarCsv } from "./exportar";
import { IconoDescarga } from "./iconos";

export type EdificioFuncion = {
  funcion: string;
  unidades: number;
  gfa: number;
  venta: number;
  pct: number;
  color: string;
};
export type EdificioItem = {
  edificio: string;
  unidades: number;
  gfa: number;
  venta: number;
  funciones: EdificioFuncion[];
};
export type Edificios = {
  n_edificios: number;
  funciones: string[];
  edificios: EdificioItem[];
  total: { unidades: number; gfa: number; venta: number };
};

const fmt = (n: number, dec = 0) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: dec, minimumFractionDigits: dec });
const pct = (n: number) => (n * 100).toLocaleString("es-CL", { maximumFractionDigits: 1 }) + "%";

export default function CabidaEdificios({ edificios }: { edificios: Edificios }) {
  const { edificios: lista, n_edificios, total } = edificios;

  const exportar = () => {
    const filas: (string | number)[][] = [];
    for (const ed of lista) {
      for (const f of ed.funciones) {
        filas.push([ed.edificio, f.funcion, f.unidades, f.gfa, f.venta, (f.pct * 100).toFixed(1) + "%"]);
      }
      filas.push([ed.edificio, "Subtotal", ed.unidades, ed.gfa, ed.venta, "100%"]);
    }
    filas.push(["TOTAL PROYECTO", "", total.unidades, total.gfa, total.venta, ""]);
    exportarCsv(
      "cabida-por-edificio",
      ["Edificio", "Función", "Unidades", "m² (GFA)", "Venta m²", "% del edificio"],
      filas
    );
  };

  return (
    <div className="edificios">
      <div className="tabla-head">
        <div className="grafico-titulo">
          Cabida por <span className="acento">edificio</span>
          <span className="edif-count">{n_edificios} {n_edificios === 1 ? "edificio" : "edificios"}</span>
        </div>
        <div className="tabla-tools">
          <button className="btn-export" onClick={exportar} title="Descargar el desglose por edificio como CSV">
            <IconoDescarga /> CSV
          </button>
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="tbl-vacio">No se identificaron edificios en el CSV.</p>
      ) : (
        <div className="edif-grid">
          {lista.map((ed) => (
            <section className="edif-card" key={ed.edificio}>
              <header className="edif-card-head">
                <div className="edif-id" title={ed.edificio}>{ed.edificio}</div>
                <div className="edif-kpis">
                  <div className="edif-kpi"><span>{fmt(ed.unidades)}</span>unidades</div>
                  <div className="edif-kpi"><span>{fmt(ed.gfa)}</span>m² GFA</div>
                  <div className="edif-kpi"><span>{fmt(ed.venta)}</span>venta m²</div>
                </div>
              </header>

              <table className="tbl edif-tbl">
                <thead>
                  <tr>
                    <th>Función</th>
                    <th className="num">Unid.</th>
                    <th className="num">m² (GFA)</th>
                    <th className="num">Venta m²</th>
                    <th className="num">%</th>
                  </tr>
                </thead>
                <tbody>
                  {ed.funciones.map((f) => (
                    <tr key={f.funcion}>
                      <td className="col-fn">
                        <span className="swatch swatch-sm" style={{ background: f.color }} />
                        {f.funcion}
                      </td>
                      <td className="num">{fmt(f.unidades)}</td>
                      <td className="num">{fmt(f.gfa)}</td>
                      <td className="num">{fmt(f.venta)}</td>
                      <td className="num edif-pct">{pct(f.pct)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="edif-subtotal">
                    <td>Subtotal</td>
                    <td className="num">{fmt(ed.unidades)}</td>
                    <td className="num">{fmt(ed.gfa)}</td>
                    <td className="num">{fmt(ed.venta)}</td>
                    <td className="num">100%</td>
                  </tr>
                </tfoot>
              </table>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
