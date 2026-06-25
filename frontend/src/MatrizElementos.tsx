import { useMemo, useState } from "react";
import { rankPiso, nivelDeEtiqueta } from "./pisos";
import { type Ediciones } from "./TablaElementos";
import { type Superficies } from "./CabidaSuperficies";
import { exportarCsv } from "./exportar";
import { IconoDescarga } from "./iconos";

const fmt = (n: number) => (n ? n.toLocaleString("es-CL", { maximumFractionDigits: 0 }) : "");
const pct = (n: number) => (n * 100).toLocaleString("es-CL", { maximumFractionDigits: 1 }) + "%";

const subLabel = (fn: string) => {
  if (/Util$/i.test(fn)) return "Útil";
  if (/Comun$/i.test(fn)) return "Común";
  if (/Terraza$/i.test(fn)) return "Terraza";
  if (/Loggia$/i.test(fn)) return "Loggia";
  return fn;
};

// Bases de útil para el modo "% del útil".
const BASES_UTIL = ["Residencial Util", "Oficinas Util", "Comercial Util"];
const baseUtilDe = (fn: string) =>
  fn.startsWith("Oficinas") ? "Oficinas Util" : fn.startsWith("Comercial") ? "Comercial Util" : "Residencial Util";

export default function MatrizElementos({
  superficies,
  funcionesCanonicas,
  ediciones,
  setEdiciones,
}: {
  superficies: Superficies;
  funcionesCanonicas: string[];
  ediciones: Ediciones;
  setEdiciones: (e: Ediciones) => void;
}) {
  const opciones = [{ id: "__total__", nombre: "Total proyecto" }, ...superficies.edificios];
  const [sel, setSel] = useState<string>(superficies.edificios[0]?.id ?? "__total__");
  const bloque = superficies.por_edificio[sel] ?? superficies.por_edificio["__total__"];
  const esTotal = sel === "__total__";
  const subPorEd = ediciones.subterraneos ?? {};
  const nSubSel = esTotal ? 0 : subPorEd[sel] ?? 0;

  // Columnas: funciones presentes + las agregadas manualmente como columna extra.
  const [colsExtra, setColsExtra] = useState<string[]>([]);
  const cols = useMemo(() => {
    const base = superficies.funciones.slice();
    for (const c of colsExtra) if (!base.includes(c)) base.push(c);
    return base;
  }, [superficies.funciones, colsExtra]);

  const colores = superficies.colores;

  // Formulario de agregado (contextual al edificio seleccionado).
  const [funcion, setFuncion] = useState<string>("Residencial Terraza");
  const [modo, setModo] = useState<"m2" | "pct">("m2");
  const [valor, setValor] = useState<string>("");
  const [pisosSel, setPisosSel] = useState<Set<string>>(new Set());
  const baseUtil = baseUtilDe(funcion);

  const pisos = bloque.pisos.map((p) => p.etiqueta);

  // m² del útil base por piso (de la matriz del bloque actual), para modo %.
  const utilPorPiso = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of bloque.pisos) m.set(p.etiqueta, p.celdas[baseUtil] ?? 0);
    return m;
  }, [bloque, baseUtil]);

  const m2DePiso = (etq: string): number => {
    const v = Number(valor) || 0;
    if (v <= 0) return 0;
    if (modo === "m2") return v;
    return Math.round((utilPorPiso.get(etq) ?? 0) * (v / 100) * 100) / 100;
  };
  const pisosEfectivos = useMemo(
    () => [...pisosSel].filter((p) => m2DePiso(p) > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pisosSel, modo, valor, utilPorPiso]
  );
  const totalPreview = pisosEfectivos.reduce((s, p) => s + m2DePiso(p), 0);

  const togglePiso = (etq: string) => {
    const s = new Set(pisosSel);
    s.has(etq) ? s.delete(etq) : s.add(etq);
    setPisosSel(s);
  };

  const agregar = () => {
    if (esTotal || Number(valor) <= 0 || pisosEfectivos.length === 0) return;
    const base = Date.now();
    const nuevas = pisosEfectivos
      .sort((a, b) => rankPiso(b) - rankPiso(a))
      .map((etq, i) => ({
        id: `manual-${base}-${i}`,
        funcion,
        gfa: m2DePiso(etq),
        nivel: nivelDeEtiqueta(etq, nSubSel),
        type: "Manual",
        edificio: sel, // edificio destino
      }));
    setEdiciones({ ...ediciones, agregar: [...ediciones.agregar, ...nuevas] });
    setValor("");
    setPisosSel(new Set());
    if (!cols.includes(funcion)) setColsExtra([...colsExtra, funcion]);
  };

  // Quitar el aporte manual de una celda (piso × función) del edificio actual.
  const quitarCelda = (etq: string, fn: string) => {
    const nivel = nivelDeEtiqueta(etq, nSubSel);
    setEdiciones({
      ...ediciones,
      agregar: ediciones.agregar.filter(
        (a) => !(a.funcion === fn && a.nivel === nivel && (a as any).edificio === sel)
      ),
    });
  };

  const funcionesAusentes = funcionesCanonicas.filter((f) => !cols.includes(f));

  const exportar = () => {
    const enc = ["Piso", ...cols, "Construido", "Vendible"];
    const filas: (string | number)[][] = bloque.pisos.map((p) => [
      p.etiqueta,
      ...cols.map((fn) => p.celdas[fn] ?? 0),
      p.construido,
      p.vendible,
    ]);
    filas.push(["TOTAL", ...cols.map((fn) => bloque.total.celdas[fn] ?? 0), bloque.total.construido, bloque.total.vendible]);
    const nombre = opciones.find((o) => o.id === sel)?.nombre ?? "matriz";
    exportarCsv(`elementos-${nombre}`, enc, filas);
  };

  return (
    <div className="matriz-el">
      <div className="tabla-head">
        <div className="grafico-titulo">Elementos · <span className="acento">superficies por piso y función</span></div>
        <div className="tabla-tools">
          <div className="sf-selector">
            {opciones.map((o) => (
              <button key={o.id} className={"sf-tab" + (sel === o.id ? " on" : "")} onClick={() => setSel(o.id)}>
                {o.nombre}
              </button>
            ))}
          </div>
          <button className="btn-export" onClick={exportar} title="Descargar la tabla como CSV">
            <IconoDescarga /> CSV
          </button>
        </div>
      </div>

      <div className="sf-scroll">
        <table className="tbl sf-tbl mx-tbl">
          <thead>
            <tr>
              <th className="sf-piso-h">Piso</th>
              {cols.map((fn) => (
                <th key={fn} className="num sf-sub-h">
                  <span className="sf-sw" style={{ background: colores[fn] ?? "#A6A6A6" }} />
                  {subLabel(fn)}
                </th>
              ))}
              <th className="num sf-constr-h">Construido</th>
              <th className="num sf-vend-h">Vendible</th>
            </tr>
          </thead>
          <tbody>
            {bloque.pisos.map((p) => (
              <tr key={p.etiqueta} className={p.es_sub ? "sf-sub" : ""}>
                <td className="sf-piso">{p.etiqueta}</td>
                {cols.map((fn) => {
                  const man = p.celdas_manual?.[fn] ?? 0;
                  return (
                    <td key={fn} className={"num" + (man ? " mx-man" : "")}
                        title={man ? `Incluye ${fmt(man)} m² manual · click para quitar` : undefined}
                        onClick={man && !esTotal ? () => quitarCelda(p.etiqueta, fn) : undefined}>
                      {fmt(p.celdas[fn] ?? 0)}
                      {man ? <span className="mx-dot" /> : null}
                    </td>
                  );
                })}
                <td className="num sf-constr">{fmt(p.construido)}</td>
                <td className="num sf-vend">{fmt(p.vendible)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="sf-total">
              <td className="sf-piso">TOTAL</td>
              {cols.map((fn) => (
                <td key={fn} className="num">{fmt(bloque.total.celdas[fn] ?? 0)}</td>
              ))}
              <td className="num">{fmt(bloque.total.construido)}</td>
              <td className="num">{fmt(bloque.total.vendible)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="sf-ratio">Vendible / Construido · <b>{pct(bloque.ratio)}</b></div>

      {/* Agregar áreas a una función × pisos del edificio seleccionado */}
      {esTotal ? (
        <p className="mx-hint">Selecciona un edificio para agregar áreas (terrazas u otras superficies no modeladas).</p>
      ) : (
        <div className="manual-form mx-form">
          <div className="manual-head"><span>Agregar área a {opciones.find((o) => o.id === sel)?.nombre}</span></div>
          <div className="mf-row">
            <select value={funcion} onChange={(e) => setFuncion(e.target.value)}>
              {funcionesCanonicas.map((fn) => <option key={fn} value={fn}>{fn}</option>)}
            </select>
            <select className="mf-modo" value={modo} onChange={(e) => setModo(e.target.value as "m2" | "pct")}>
              <option value="m2">m² por piso</option>
              <option value="pct">% del útil</option>
            </select>
            <input
              type="number" className="in-num mf-gfa"
              placeholder={modo === "m2" ? "m²" : "%"}
              value={valor} onChange={(e) => setValor(e.target.value)}
            />
            <button
              className="btn-add" onClick={agregar}
              disabled={!(Number(valor) > 0) || pisosEfectivos.length === 0}
            >
              + Agregar a {pisosEfectivos.length || 0} piso{pisosEfectivos.length === 1 ? "" : "s"}
            </button>
          </div>
          {modo === "pct" && Number(valor) > 0 && pisosSel.size > 0 && (
            <p className="mf-aviso">≈ <b>{fmt(totalPreview)} m²</b> · {Number(valor)}% del <b>{baseUtil}</b> de cada piso</p>
          )}
          <div className="mf-pisos">
            <div className="mf-pisos-acc">
              <span>Pisos:</span>
              <button className="btn-link" onClick={() => setPisosSel(new Set(pisos))}>Todos</button>
              <button className="btn-link" onClick={() => setPisosSel(new Set())}>Ninguno</button>
            </div>
            <div className="mf-pisos-chips">
              {pisos.map((p) => (
                <button key={p} className={"chip" + (pisosSel.has(p) ? " on" : "")} onClick={() => togglePiso(p)}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {funcionesAusentes.length > 0 && (
        <div className="mx-addcol">
          <span>Mostrar columna:</span>
          {funcionesAusentes.map((f) => (
            <button key={f} className="chip" onClick={() => setColsExtra([...colsExtra, f])}>+ {f}</button>
          ))}
        </div>
      )}
    </div>
  );
}
