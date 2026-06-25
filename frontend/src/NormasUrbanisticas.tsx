import { useEffect, useState } from "react";

export type Normas = {
  constructibilidad: number;
  ocupacion_p1: number;
  viviendas: number;
  desglose: { residencial_util: number; comercio_gfa: number; oficinas_gfa: number };
};

// Qué métrica de la cabida alimenta una fila "roja" en la columna Propuesto.
type FuenteCabida = "constructibilidad" | "ocupacion_p1" | "viviendas" | "habitantes" | null;

type Param = { id: string; label: string; unidad?: string; cabida?: FuenteCabida; grupo?: boolean };

// Parámetros por defecto (de la planilla Mobil). `cabida` marca las celdas rojas.
const PARAMS: Param[] = [
  { id: "subdivision", label: "Subdivisión predial mínima", unidad: "m²" },
  { id: "terreno_bruto", label: "Superficie Terreno Bruto", unidad: "m²" },
  { id: "terreno_neto", label: "Superficie Terreno Neto", unidad: "m²" },
  { id: "agrupamiento", label: "Agrupamiento" },
  { id: "coef_const", label: "Coef. Constructibilidad" },
  { id: "sup_const", label: "Superficie Constructibilidad", unidad: "m²", cabida: "constructibilidad" },
  { id: "coef_ocup", label: "Coef. Ocupación de Suelo Piso 1" },
  { id: "sup_ocup", label: "Superficie Ocupación de Suelo P1", unidad: "m²", cabida: "ocupacion_p1" },
  { id: "dens_max_ha", label: "Densidad Bruta máxima (hab/há)" },
  { id: "dens_max_hab", label: "Densidad Bruta máxima (habitantes)" },
  { id: "dens_viv", label: "Densidad aplicada (viviendas)", cabida: "viviendas" },
  { id: "dens_hab", label: "Densidad aplicada (habitantes)", cabida: "habitantes" },
  { id: "altura_pisos", label: "Altura máxima en pisos" },
  { id: "altura_metros", label: "Altura máxima en metros", unidad: "m" },
  { id: "distanciamiento", label: "Distanciamiento a deslindes" },
  { id: "antejardin", label: "Antejardín" },
  { id: "rasante", label: "Rasante" },
  { id: "sep_excav", label: "Superficies", grupo: true },
  { id: "excavable", label: "Superficie excavable P-1", unidad: "m²" },
  { id: "estac_autos", label: "Estacionamientos autos" },
  { id: "estac_bici", label: "Estacionamientos bicicletas" },
];

type Columna = { id: string; nombre: string; propuesto?: boolean };
const COLS_INICIALES: Columna[] = [
  { id: "zona1", nombre: "Zona 1" },
  { id: "fusion", nombre: "Resumen Fusión" },
  { id: "propuesto", nombre: "Propuesto", propuesto: true },
];

const fmt = (n: number) => n.toLocaleString("es-CL", { maximumFractionDigits: 2 });
const LS_KEY = "mobil-normas";

// Arma el payload de la hoja "Normativa" del Excel con lo que el usuario tiene en
// pantalla (localStorage) + los valores de cabida. Lo usa App al generar el Excel.
export function normasParaExcel(normas: Normas): {
  columnas: { id: string; nombre: string }[];
  filas: { label: string; grupo?: boolean; valores?: Record<string, string> }[];
} {
  let cols: Columna[] = COLS_INICIALES;
  let valores: Record<string, Record<string, string>> = {};
  let factorHab = "4";
  try {
    const d = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    if (d.cols?.length) cols = d.cols;
    if (d.valores) valores = d.valores;
    if (d.factorHab) factorHab = d.factorHab;
  } catch { /* defaults */ }

  const viviendas = normas.viviendas;
  const habitantes = Math.round(viviendas * (Number(factorHab) || 0));
  const cabidaVal = (f: FuenteCabida): string => {
    switch (f) {
      case "constructibilidad": return fmt(normas.constructibilidad);
      case "ocupacion_p1": return fmt(normas.ocupacion_p1);
      case "viviendas": return fmt(viviendas);
      case "habitantes": return fmt(habitantes);
      default: return "";
    }
  };

  const propId = cols.find((c) => c.propuesto)?.id;
  const filas = PARAMS.map((p) => {
    if (p.grupo) return { label: p.label, grupo: true };
    const vals: Record<string, string> = {};
    for (const c of cols) {
      if (c.propuesto && p.cabida) vals[c.id] = cabidaVal(p.cabida);
      else vals[c.id] = valores[c.id]?.[p.id] ?? "";
    }
    // Por si la métrica de cabida cae en Propuesto aunque no esté en valores.
    if (propId && p.cabida && !vals[propId]) vals[propId] = cabidaVal(p.cabida);
    return { label: p.unidad ? `${p.label} (${p.unidad})` : p.label, valores: vals };
  });
  return { columnas: cols.map((c) => ({ id: c.id, nombre: c.nombre })), filas };
}

export default function NormasUrbanisticas({ normas }: { normas: Normas }) {
  // Estado persistido: columnas, valores a mano {col: {param: valor}} y factor hab/viv.
  const [cols, setCols] = useState<Columna[]>(COLS_INICIALES);
  const [valores, setValores] = useState<Record<string, Record<string, string>>>({});
  const [factorHab, setFactorHab] = useState<string>("4");

  // Cargar de localStorage al montar.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.cols?.length) setCols(d.cols);
        if (d.valores) setValores(d.valores);
        if (d.factorHab) setFactorHab(d.factorHab);
      }
    } catch { /* ignorar */ }
  }, []);
  // Guardar en cada cambio.
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ cols, valores, factorHab }));
  }, [cols, valores, factorHab]);

  const viviendas = normas.viviendas;
  const habitantes = Math.round(viviendas * (Number(factorHab) || 0));

  // Valor "de cabida" para la columna Propuesto.
  const valorCabida = (fuente: FuenteCabida): string => {
    switch (fuente) {
      case "constructibilidad": return fmt(normas.constructibilidad);
      case "ocupacion_p1": return fmt(normas.ocupacion_p1);
      case "viviendas": return fmt(viviendas);
      case "habitantes": return fmt(habitantes);
      default: return "";
    }
  };

  const setValor = (col: string, param: string, v: string) =>
    setValores((prev) => ({ ...prev, [col]: { ...(prev[col] ?? {}), [param]: v } }));

  const agregarZona = () => {
    const n = cols.filter((c) => !c.propuesto && c.id !== "fusion").length + 1;
    const propIdx = cols.findIndex((c) => c.propuesto);
    const nueva = { id: `zona-${Date.now()}`, nombre: `Zona ${n}` };
    const next = [...cols];
    next.splice(propIdx >= 0 ? propIdx : next.length, 0, nueva);
    setCols(next);
  };
  const quitarZona = (id: string) => setCols(cols.filter((c) => c.id !== id));
  const renombrar = (id: string, nombre: string) =>
    setCols(cols.map((c) => (c.id === id ? { ...c, nombre } : c)));

  return (
    <div className="normas">
      <div className="tabla-head">
        <div className="grafico-titulo">Normas <span className="acento">urbanísticas</span></div>
        <div className="tabla-tools">
          <label className="nrm-factor">
            Factor hab/viv
            <input type="number" min={0} step="0.1" value={factorHab}
              onChange={(e) => setFactorHab(e.target.value)} />
          </label>
          <button className="btn-link" onClick={agregarZona}>+ Agregar zona</button>
        </div>
      </div>

      <div className="sf-scroll">
        <table className="tbl nrm-tbl">
          <thead>
            <tr>
              <th className="nrm-param-h">Parámetro</th>
              {cols.map((c) => (
                <th key={c.id} className={"nrm-col-h" + (c.propuesto ? " nrm-prop" : "")}>
                  <div className="nrm-col-cab">
                    <input type="text" value={c.nombre} onChange={(e) => renombrar(c.id, e.target.value)} />
                    {!c.propuesto && c.id !== "fusion" && (
                      <button className="nrm-x" title="Quitar zona" onClick={() => quitarZona(c.id)}>×</button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PARAMS.map((p) =>
              p.grupo ? (
                <tr key={p.id} className="nrm-grupo">
                  <td colSpan={cols.length + 1}>{p.label}</td>
                </tr>
              ) : (
                <tr key={p.id}>
                  <td className="nrm-param">{p.label}{p.unidad ? ` (${p.unidad})` : ""}</td>
                  {cols.map((c) => {
                    const esCabida = c.propuesto && p.cabida;
                    if (esCabida) {
                      return (
                        <td key={c.id} className="num nrm-cabida" title="Calculado desde la cabida (CSV)">
                          {valorCabida(p.cabida!)}
                        </td>
                      );
                    }
                    return (
                      <td key={c.id} className={c.propuesto ? "nrm-prop-cell" : ""}>
                        <input
                          type="text"
                          value={valores[c.id]?.[p.id] ?? ""}
                          onChange={(e) => setValor(c.id, p.id, e.target.value)}
                        />
                      </td>
                    );
                  })}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <p className="nrm-nota">
        <span className="nrm-leg nrm-cabida-leg" /> Celdas calculadas desde la cabida (CSV) ·
        el resto se edita a mano y se guarda en este navegador.
      </p>
    </div>
  );
}
