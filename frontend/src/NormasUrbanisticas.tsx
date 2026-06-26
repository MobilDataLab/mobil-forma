import { useEffect, useState } from "react";
import { IconoDescarga } from "./iconos";

export type Normas = {
  constructibilidad: number;
  ocupacion_p1: number;
  viviendas: number;
  desglose: { residencial_util: number; comercio_gfa: number; oficinas_gfa: number };
};

// Métricas de Forma usadas por los cálculos de estacionamientos.
type MetricasForma = { viviendas: number; comercio_gfa: number };

// Qué métrica de la cabida (CSV de Forma) alimenta la columna Propuesto de una fila.
type FuenteCabida = "constructibilidad" | "ocupacion_p1" | "viviendas" | "habitantes" | null;

// Cómo se obtiene el valor "máximo normativo" de una fila a partir de los inputs de la zona.
type Calculo =
  | "sup_const_max"   // terreno neto × coef. constructibilidad
  | "sup_ocup_max"    // terreno bruto × coef. ocupación
  | "dens_hab_max"    // (terreno bruto / 10.000) × densidad hab/há
  | "excavable"       // terreno bruto × factor excavable (%)
  | "estac_viv"       // viviendas (Forma) × coef. vivienda
  | "estac_com"       // m² comercio (Forma) ÷ coef. comercio (1 cada X m²)
  | "estac_total"     // (estac_viv + estac_com) × (1 − desc. bici − desc. metro)
  | null;

type Param = {
  id: string;
  label: string;
  unidad?: string;
  formula?: string;        // texto de la operación (columna Fórmula)
  calculo?: Calculo;       // valor (máx / derivado) calculado desde inputs de la zona
  cabida?: FuenteCabida;   // valor que viene de Forma (CSV), va en Propuesto
  comparar?: boolean;      // semáforo: compara el valor de Forma contra el calculado de su columna
  factorId?: string;       // id del input de factor editable (excavable %, estac/viv)
  grupo?: boolean;
};

// IDs de input que usan los cálculos (deben coincidir con los Param de la sección Inputs).
const IN_TERRENO_BRUTO = "terreno_bruto";
const IN_TERRENO_NETO = "terreno_neto";
const IN_COEF_CONST = "coef_const";
const IN_COEF_OCUP = "coef_ocup";
const IN_DENS_HA = "dens_max_ha";
// IDs de factores editables (viven en valores[col][factorId]).
const F_EXCAVABLE = "f_excavable";      // % del terreno excavable
const F_COEF_VIV = "f_coef_viv";        // cajones por vivienda
const F_COEF_COM = "f_coef_com";        // m² de comercio por cajón (1 cada X m²)
const F_DESC_BICI = "f_desc_bici";      // % descuento por bicicletas
const F_DESC_METRO = "f_desc_metro";    // % descuento por cercanía al metro
const F_BICIS = "bicicletas";           // nº de bicicletas (a mano)

// Parámetros por defecto (de la planilla Mobil). Cada resultado calculado va
// inmediatamente después del input/coeficiente que lo genera (lista fluida).
const PARAMS: Param[] = [
  // ── DATOS DEL TERRENO Y NORMATIVA ───────────────────────────────────
  { id: "g_inputs", label: "Datos del terreno y normativa", grupo: true },
  { id: "subdivision", label: "Subdivisión predial mínima", unidad: "m²" },
  { id: IN_TERRENO_BRUTO, label: "Superficie Terreno Bruto", unidad: "m²" },
  { id: IN_TERRENO_NETO, label: "Superficie Terreno Neto", unidad: "m²" },
  { id: "agrupamiento", label: "Agrupamiento" },

  // Coef. constructibilidad → su superficie (máx vs Forma)
  { id: IN_COEF_CONST, label: "Coef. Constructibilidad" },
  {
    id: "sup_const", label: "Sup. Constructibilidad", unidad: "m²",
    formula: "Terreno neto × Coef. const.",
    calculo: "sup_const_max", cabida: "constructibilidad", comparar: true,
  },

  // Coef. ocupación → su superficie (máx vs Forma)
  { id: IN_COEF_OCUP, label: "Coef. Ocupación de Suelo Piso 1" },
  {
    id: "sup_ocup", label: "Sup. Ocupación de Suelo P1", unidad: "m²",
    formula: "Terreno bruto × Coef. ocup.",
    calculo: "sup_ocup_max", cabida: "ocupacion_p1", comparar: true,
  },

  // Densidad hab/há → habitantes (máx vs Forma) y viviendas (Forma)
  { id: IN_DENS_HA, label: "Densidad Bruta máxima (hab/há)" },
  {
    id: "dens_hab", label: "Densidad (habitantes)",
    formula: "(Terreno / 10.000) × hab/há  ·  viv × factor",
    calculo: "dens_hab_max", cabida: "habitantes", comparar: true,
  },
  {
    id: "dens_viv", label: "Densidad aplicada (viviendas)",
    formula: "Departamentos detectados en Forma",
    cabida: "viviendas",
  },

  { id: "altura_pisos", label: "Altura máxima en pisos" },
  { id: "altura_metros", label: "Altura máxima en metros", unidad: "m" },
  { id: "distanciamiento", label: "Distanciamiento a deslindes" },
  { id: "antejardin", label: "Antejardín" },
  { id: "rasante", label: "Rasante" },

  // ── SUPERFICIES ─────────────────────────────────────────────────────
  { id: "g_superf", label: "Superficies", grupo: true },
  {
    id: "excavable", label: "Superficie excavable P-1", unidad: "m²",
    formula: "Terreno bruto × ", factorId: F_EXCAVABLE, calculo: "excavable",
  },

  // ── ESTACIONAMIENTOS (cada coeficiente arriba de su resultado) ──────
  { id: "g_estac", label: "Estacionamientos", grupo: true },
  { id: F_COEF_VIV, label: "Coeficiente estacionamientos vivienda", formula: "cajones por vivienda" },
  {
    id: "estac_viv", label: "Estacionamientos vivienda",
    formula: "Viviendas × coef.", calculo: "estac_viv",
  },
  { id: F_COEF_COM, label: "Coeficiente estacionamientos comercio", formula: "1 cajón cada X m²" },
  {
    id: "estac_com", label: "Estacionamientos comercio",
    formula: "m² comercio ÷ coef.", calculo: "estac_com",
  },
  { id: F_DESC_BICI, label: "Descuento por bicicletas", formula: "% que reduce el total" },
  { id: F_BICIS, label: "Bicicletas" },
  { id: F_DESC_METRO, label: "Descuento cercanía al metro", formula: "% que reduce el total" },
  {
    id: "estac_total", label: "Estacionamientos totales",
    formula: "(viv + com) × (1 − desc. bici − desc. metro)", calculo: "estac_total",
  },
];

type Columna = { id: string; nombre: string; propuesto?: boolean; fusion?: boolean };
// La columna "Resumen Fusión" NO se guarda en el estado: se deriva (ver colsVisibles).
const COLS_INICIALES: Columna[] = [
  { id: "zona1", nombre: "Zona 1" },
  { id: "propuesto", nombre: "Propuesto", propuesto: true },
];

const COL_FUSION: Columna = { id: "fusion", nombre: "Resumen Fusión", fusion: true };

// Cuenta las zonas reales (ni fusión ni propuesto).
const contarZonas = (cols: Columna[]) =>
  cols.filter((c) => !c.propuesto && !c.fusion).length;

// Columnas a mostrar: inserta "Resumen Fusión" justo antes de Propuesto SOLO si hay 2+ zonas.
function colsVisibles(cols: Columna[]): Columna[] {
  const base = cols.filter((c) => !c.fusion); // por si quedó guardada de versiones previas
  if (contarZonas(base) < 2) return base;
  const propIdx = base.findIndex((c) => c.propuesto);
  const next = [...base];
  next.splice(propIdx >= 0 ? propIdx : next.length, 0, COL_FUSION);
  return next;
}

const fmt = (n: number) => n.toLocaleString("es-CL", { maximumFractionDigits: 2 });
const LS_KEY = "mobil-normas";

// Teaser: valores de ejemplo para Zona 1, para que la tabla muestre los inputs
// llenos y los cálculos/semáforo "vivos" desde el primer vistazo. El usuario los
// puede sobrescribir; solo se siembran si Zona 1 está totalmente vacía.
const TEASER_ZONA1: Record<string, string> = {
  subdivision: "500",
  terreno_bruto: "5.230",
  terreno_neto: "4.480",
  agrupamiento: "Aislado",
  coef_const: "2,6",
  coef_ocup: "0,6",
  dens_max_ha: "1.250",
  altura_pisos: "12",
  altura_metros: "36",
  distanciamiento: "—",
  antejardin: "5",
  rasante: "Natural",
  [F_EXCAVABLE]: "80%",
  [F_COEF_VIV]: "1",
  [F_COEF_COM]: "50",
  [F_DESC_BICI]: "5%",
  [F_BICIS]: "40",
  [F_DESC_METRO]: "20%",
};

// Convierte el texto de una celda a número (tolera "1.234,5", "1234.5", "80%", espacios).
function num(v: string | undefined): number {
  if (!v) return NaN;
  const limpio = v.trim().replace(/\s| |%/g, "");
  // es-CL: punto miles, coma decimal. Si hay coma, tratamos punto como miles.
  const normal = limpio.includes(",")
    ? limpio.replace(/\./g, "").replace(",", ".")
    : limpio.replace(/(?<=\d)\.(?=\d{3}\b)/g, "");
  const n = parseFloat(normal);
  return Number.isFinite(n) ? n : NaN;
}

// ¿El factor venía con "%"? Entonces es porcentaje (÷100).
const esPct = (v: string | undefined) => !!v && v.includes("%");

// Estac. vivienda + comercio antes de descuentos (para el total). Aislado para reuso.
function estacBase(vCol: Record<string, string>, f: MetricasForma): number {
  const viv = f.viviendas * num(vCol[F_COEF_VIV]);
  const coefCom = num(vCol[F_COEF_COM]);
  const com = coefCom > 0 ? f.comercio_gfa / coefCom : 0;
  return (Number.isFinite(viv) ? viv : 0) + (Number.isFinite(com) ? com : 0);
}

// Valor calculado de una fila, según los inputs de UNA columna y las métricas de Forma.
// El factor de excavable es global (col. Propuesto): se pasa por `factores`.
function valorCalculo(
  calculo: Calculo,
  vCol: Record<string, string> | undefined,
  forma: MetricasForma,
  factores?: { excavable?: string }
): number {
  if (!vCol) return NaN;
  switch (calculo) {
    case "sup_const_max": return num(vCol[IN_TERRENO_NETO]) * num(vCol[IN_COEF_CONST]);
    case "sup_ocup_max": return num(vCol[IN_TERRENO_BRUTO]) * num(vCol[IN_COEF_OCUP]);
    case "dens_hab_max": return (num(vCol[IN_TERRENO_BRUTO]) / 10000) * num(vCol[IN_DENS_HA]);
    case "excavable": {
      const raw = factores?.excavable ?? vCol[F_EXCAVABLE];
      const factor = esPct(raw) ? num(raw) / 100 : num(raw);
      return num(vCol[IN_TERRENO_BRUTO]) * factor;
    }
    case "estac_viv": return forma.viviendas * num(vCol[F_COEF_VIV]);
    case "estac_com": {
      const coef = num(vCol[F_COEF_COM]);
      return coef > 0 ? forma.comercio_gfa / coef : NaN;
    }
    case "estac_total": {
      const base = estacBase(vCol, forma);
      const dBici = esPct(vCol[F_DESC_BICI]) ? num(vCol[F_DESC_BICI]) / 100 : num(vCol[F_DESC_BICI]) || 0;
      const dMetro = esPct(vCol[F_DESC_METRO]) ? num(vCol[F_DESC_METRO]) / 100 : num(vCol[F_DESC_METRO]) || 0;
      const desc = (Number.isFinite(dBici) ? dBici : 0) + (Number.isFinite(dMetro) ? dMetro : 0);
      return base * (1 - desc);
    }
    default: return NaN;
  }
}

// Arma el payload de la hoja "Normativa" del Excel con lo que el usuario tiene en
// pantalla (localStorage) + los valores de cabida. Lo usa App al generar el Excel.
export function normasParaExcel(normas: Normas): {
  columnas: { id: string; nombre: string }[];
  filas: { label: string; formula?: string; grupo?: boolean; valores?: Record<string, string> }[];
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
  const forma: MetricasForma = { viviendas, comercio_gfa: normas.desglose?.comercio_gfa ?? 0 };
  const cabidaVal = (f: FuenteCabida): number => {
    switch (f) {
      case "constructibilidad": return normas.constructibilidad;
      case "ocupacion_p1": return normas.ocupacion_p1;
      case "viviendas": return viviendas;
      case "habitantes": return habitantes;
      default: return NaN;
    }
  };

  const vCol = (colId: string): Record<string, string> => valores[colId] ?? {};
  const visibles = colsVisibles(cols);
  const propId = visibles.find((c) => c.propuesto)?.id;

  // Factor de excavable es global (col. Propuesto), aplica a todas las columnas.
  const factores = { excavable: vCol(propId ?? "")[F_EXCAVABLE] || "" };

  // Texto de la fórmula con el factor real (excavable/estac) embebido.
  const formulaTexto = (p: Param): string | undefined => {
    if (!p.formula) return undefined;
    if (p.factorId) {
      const f = vCol(propId ?? "")[p.factorId] || "—";
      return p.formula + f;
    }
    return p.formula;
  };

  const filas = PARAMS.map((p) => {
    if (p.grupo) return { label: p.label, grupo: true };
    const vals: Record<string, string> = {};
    for (const c of visibles) {
      if (c.propuesto && p.cabida) {
        vals[c.id] = fmt(cabidaVal(p.cabida));
      } else if (p.calculo) {
        const n = valorCalculo(p.calculo, vCol(c.id), forma, factores);
        vals[c.id] = Number.isFinite(n) ? fmt(n) : "";
      } else {
        vals[c.id] = valores[c.id]?.[p.id] ?? "";
      }
    }
    if (propId && p.cabida && !vals[propId]) vals[propId] = fmt(cabidaVal(p.cabida));
    return {
      label: p.unidad ? `${p.label} (${p.unidad})` : p.label,
      formula: formulaTexto(p),
      valores: vals,
    };
  });
  return { columnas: visibles.map((c) => ({ id: c.id, nombre: c.nombre })), filas };
}

export default function NormasUrbanisticas({
  normas,
  onDescargarExcel,
}: {
  normas: Normas;
  onDescargarExcel?: () => void;
}) {
  // Estado persistido: columnas, valores a mano {col: {param: valor}} y factor hab/viv.
  const [cols, setCols] = useState<Columna[]>(COLS_INICIALES);
  const [valores, setValores] = useState<Record<string, Record<string, string>>>({});
  const [factorHab, setFactorHab] = useState<string>("4");

  // Cargar de localStorage al montar.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const d = raw ? JSON.parse(raw) : {};
      // Quitar "fusion" guardada de versiones previas: ahora se deriva.
      if (d.cols?.length) setCols(d.cols.filter((c: Columna) => !c.fusion && c.id !== "fusion"));
      if (d.factorHab) setFactorHab(d.factorHab);

      // Sembrar el teaser si Zona 1 no tiene ningún valor real (navegador nuevo
      // o estado vacío de pruebas), para mostrar la tabla "viva" y editable.
      const valoresGuardados: Record<string, Record<string, string>> = d.valores ?? {};
      const z1 = valoresGuardados.zona1 ?? {};
      const z1Vacia = Object.values(z1).every((v) => !String(v).trim());
      if (z1Vacia) {
        setValores({ ...valoresGuardados, zona1: { ...TEASER_ZONA1 } });
      } else {
        setValores(valoresGuardados);
      }
    } catch { /* ignorar */ }
  }, []);
  // Guardar en cada cambio.
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ cols, valores, factorHab }));
  }, [cols, valores, factorHab]);

  const viviendas = normas.viviendas;
  const habitantes = Math.round(viviendas * (Number(factorHab) || 0));

  // Valor "de cabida" (Forma) para la columna Propuesto.
  const valorCabida = (fuente: FuenteCabida): number => {
    switch (fuente) {
      case "constructibilidad": return normas.constructibilidad;
      case "ocupacion_p1": return normas.ocupacion_p1;
      case "viviendas": return viviendas;
      case "habitantes": return habitantes;
      default: return NaN;
    }
  };

  const setValor = (col: string, param: string, v: string) =>
    setValores((prev) => ({ ...prev, [col]: { ...(prev[col] ?? {}), [param]: v } }));

  // Columnas a mostrar (con "Resumen Fusión" sólo si hay 2+ zonas).
  const visibles = colsVisibles(cols);
  const propId = visibles.find((c) => c.propuesto)?.id;

  // Métricas de Forma para los cálculos de estacionamientos.
  const formaMetricas: MetricasForma = { viviendas, comercio_gfa: normas.desglose?.comercio_gfa ?? 0 };
  // Factor de excavable es global (col. Propuesto), aplica a todas las columnas.
  const factores = { excavable: (propId && valores[propId]?.[F_EXCAVABLE]) || "" };

  const agregarZona = () => {
    const n = contarZonas(cols) + 1;
    const propIdx = cols.findIndex((c) => c.propuesto);
    const nueva = { id: `zona-${Date.now()}`, nombre: `Zona ${n}` };
    const next = [...cols];
    next.splice(propIdx >= 0 ? propIdx : next.length, 0, nueva);
    setCols(next);
  };
  const quitarZona = (id: string) => setCols(cols.filter((c) => c.id !== id));
  const renombrar = (id: string, nombre: string) =>
    setCols(cols.map((c) => (c.id === id ? { ...c, nombre } : c)));

  // Semáforo: el valor de Forma (Propuesto) se compara contra el máximo calculado
  // de SU columna. cumple = Forma ≤ máx (verde) · excede = Forma > máx (rojo).
  const estadoSemaforo = (
    valorForma: number,
    calculo: Calculo | undefined,
    colId: string
  ): "ok" | "excede" | "neutro" => {
    if (!calculo) return "neutro";
    const max = valorCalculo(calculo, valores[colId], formaMetricas, factores);
    if (!Number.isFinite(max) || max <= 0 || !Number.isFinite(valorForma)) return "neutro";
    return valorForma <= max ? "ok" : "excede";
  };

  // Fórmula con el factor real embebido (para filas con factor editable).
  const formulaTexto = (p: Param): string => {
    if (!p.formula) return "";
    if (p.factorId) {
      const f = (propId && valores[propId]?.[p.factorId]) || valores.zona1?.[p.factorId] || "—";
      return p.formula + f;
    }
    return p.formula;
  };

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
          <button
            className="btn-export"
            onClick={onDescargarExcel}
            disabled={!onDescargarExcel}
            title="Descargar la tabla de normativa como Excel (estilo Mobil)"
          >
            <IconoDescarga /> Excel
          </button>
        </div>
      </div>

      <div className="sf-scroll">
        <table className="tbl nrm-tbl">
          <thead>
            <tr>
              <th className="nrm-param-h">Parámetro</th>
              <th className="nrm-formula-h">Fórmula / factor</th>
              {visibles.map((c) => (
                <th key={c.id} className={"nrm-col-h" + (c.propuesto ? " nrm-prop" : "")}>
                  <div className="nrm-col-cab">
                    {c.fusion ? (
                      <span className="nrm-col-fija">{c.nombre}</span>
                    ) : (
                      <input type="text" value={c.nombre} onChange={(e) => renombrar(c.id, e.target.value)} />
                    )}
                    {!c.propuesto && !c.fusion && (
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
                  <td colSpan={visibles.length + 2}>{p.label}</td>
                </tr>
              ) : (
                <tr key={p.id}>
                  <td className="nrm-param">{p.label}{p.unidad ? ` (${p.unidad})` : ""}</td>
                  <td className="nrm-formula">
                    {p.factorId ? (
                      <span className="nrm-formula-edit">
                        {p.formula}
                        <input
                          type="text"
                          className="nrm-factor-inline"
                          value={(propId && valores[propId]?.[p.factorId]) ?? ""}
                          placeholder={p.factorId === F_EXCAVABLE ? "80%" : "1"}
                          title="Factor editable"
                          onChange={(e) => propId && setValor(propId, p.factorId!, e.target.value)}
                        />
                      </span>
                    ) : (
                      formulaTexto(p)
                    )}
                  </td>
                  {visibles.map((c) => {
                    // a) Columna Propuesto con valor de Forma: número + semáforo.
                    if (c.propuesto && p.cabida) {
                      const v = valorCabida(p.cabida);
                      const sem = p.comparar ? estadoSemaforo(v, p.calculo, c.id) : "neutro";
                      const clase =
                        "num nrm-cabida" +
                        (sem === "ok" ? " nrm-ok" : sem === "excede" ? " nrm-excede" : "");
                      return (
                        <td key={c.id} className={clase}
                          title={
                            sem === "ok" ? "Dentro del máximo normativo"
                              : sem === "excede" ? "Supera el máximo normativo"
                                : "Valor desde Forma (CSV)"
                          }>
                          {fmt(v)}
                          {sem === "ok" && <span className="nrm-dot ok" />}
                          {sem === "excede" && <span className="nrm-dot ex" />}
                        </td>
                      );
                    }
                    // b) Fila calculada (máximo / derivado) en una zona.
                    if (p.calculo) {
                      const n = valorCalculo(p.calculo, valores[c.id], formaMetricas, factores);
                      return (
                        <td key={c.id} className="num nrm-calc" title="Calculado desde los inputs de la zona">
                          {Number.isFinite(n) ? fmt(n) : "—"}
                        </td>
                      );
                    }
                    // c) Celda editable a mano.
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
        <span className="nrm-leg nrm-calc-leg" /> Máximo / derivado (fórmula × inputs) ·
        <span className="nrm-leg nrm-cabida-leg" /> valor desde Forma (CSV) ·
        <span className="nrm-dot ok nrm-leg-dot" /> cumple ·
        <span className="nrm-dot ex nrm-leg-dot" /> excede ·
        el resto se edita a mano y se guarda en este navegador.
      </p>
    </div>
  );
}
