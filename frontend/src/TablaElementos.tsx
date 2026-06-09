import { useEffect, useMemo, useRef, useState } from "react";
import { ordenarPisos, rankPiso, nivelDeEtiqueta } from "./pisos";
import { type Matriz } from "./GraficoCabida";
import { exportarCsv } from "./exportar";
import { IconoDescarga } from "./iconos";

export type FilaElemento = {
  id: string;
  type: string;
  function: string;   // función raw del CSV
  canonica: string;   // función canónica resultante (tras ediciones)
  gfa: number;
  nivel: number | null;
  etiqueta: string;
  integra: boolean;
  es_otro: boolean;
  es_manual: boolean;
};

export type Tabla = {
  filas: FilaElemento[];
  funciones_canonicas: string[];
  n_otro: number;
};

// Estructura de ediciones que viaja a Python
export type Ediciones = {
  reclasificar: Record<string, string>;
  gfa: Record<string, number>;
  nivel: Record<string, number>;
  excluir: string[];
  agregar: { id: string; funcion: string; gfa: number; nivel: number | null; type: string }[];
};

export const edicionesVacias = (): Ediciones => ({
  reclasificar: {},
  gfa: {},
  nivel: {},
  excluir: [],
  agregar: [],
});

export default function TablaElementos({
  tabla,
  matriz,
  ediciones,
  setEdiciones,
  nSub,
}: {
  tabla: Tabla;
  matriz: Matriz | null;
  ediciones: Ediciones;
  setEdiciones: (e: Ediciones) => void;
  nSub: number;
}) {
  const [soloOtro, setSoloOtro] = useState(false);
  // null = sin filtrar (todos); de lo contrario, el set explícito de pisos visibles.
  const [pisosSel, setPisosSel] = useState<Set<string> | null>(null);
  const [filtroAbierto, setFiltroAbierto] = useState(false);
  const filtroRef = useRef<HTMLDivElement>(null);
  const funcs = tabla.funciones_canonicas;

  // Cerrar el popover de pisos al hacer clic afuera o con Escape
  useEffect(() => {
    if (!filtroAbierto) return;
    const onDown = (e: MouseEvent) => {
      if (filtroRef.current && !filtroRef.current.contains(e.target as Node)) {
        setFiltroAbierto(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFiltroAbierto(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [filtroAbierto]);
  const excluidos = useMemo(() => new Set(ediciones.excluir), [ediciones.excluir]);

  // Pisos presentes, ordenados como el edificio (N alto → ST alto)
  const pisos = useMemo(
    () => ordenarPisos([...new Set(tabla.filas.map((f) => f.etiqueta))]),
    [tabla.filas]
  );

  const filas = useMemo(() => {
    let f = tabla.filas;
    if (soloOtro) f = f.filter((x) => x.es_otro);
    if (pisosSel !== null) f = f.filter((x) => pisosSel.has(x.etiqueta));
    // Orden edificio; dentro del mismo piso, los "Otro" primero
    return [...f].sort((a, b) => {
      const dp = rankPiso(b.etiqueta) - rankPiso(a.etiqueta);
      if (dp !== 0) return dp;
      return Number(b.es_otro) - Number(a.es_otro);
    });
  }, [tabla.filas, soloOtro, pisosSel]);

  const reclasificar = (id: string, fn: string) =>
    setEdiciones({ ...ediciones, reclasificar: { ...ediciones.reclasificar, [id]: fn } });

  const editarGfa = (id: string, v: string) => {
    const next = { ...ediciones.gfa };
    if (v === "") delete next[id];
    else next[id] = Number(v);
    setEdiciones({ ...ediciones, gfa: next });
  };

  const editarNivel = (id: string, v: string) => {
    const next = { ...ediciones.nivel };
    if (v === "") delete next[id];
    else next[id] = Number(v);
    setEdiciones({ ...ediciones, nivel: next });
  };

  const toggleExcluir = (id: string) => {
    const s = new Set(ediciones.excluir);
    s.has(id) ? s.delete(id) : s.add(id);
    setEdiciones({ ...ediciones, excluir: [...s] });
  };

  const togglePiso = (etq: string) => {
    // null = todos; al destildar uno partimos de la lista completa.
    const base = pisosSel === null ? new Set(pisos) : new Set(pisosSel);
    base.has(etq) ? base.delete(etq) : base.add(etq);
    // Si quedaron todos, volvemos a null (sin filtro).
    setPisosSel(base.size === pisos.length ? null : base);
  };

  const hayEdiciones =
    Object.keys(ediciones.reclasificar).length ||
    Object.keys(ediciones.gfa).length ||
    Object.keys(ediciones.nivel).length ||
    ediciones.excluir.length ||
    ediciones.agregar.length;

  // Exporta las filas visibles (con las ediciones aplicadas) a CSV.
  const exportarTabla = () => {
    exportarCsv(
      "elementos-cabida",
      ["Incluido", "Función original", "Función canónica", "m²", "Nivel", "Piso"],
      filas.map((f) => [
        excluidos.has(f.id) ? "No" : "Sí",
        f.function,
        f.canonica,
        ediciones.gfa[f.id] ?? f.gfa,
        (ediciones.nivel[f.id] ?? f.nivel ?? "") as string | number,
        f.etiqueta,
      ])
    );
  };

  return (
    <div className="tabla-el">
      <div className="tabla-head">
        <div className="grafico-titulo">Elementos · <span className="acento">corrige áreas y funciones</span></div>
        <div className="tabla-tools">
          {tabla.n_otro > 0 && (
            <label className="chk-otro">
              <input type="checkbox" checked={soloOtro} onChange={(e) => setSoloOtro(e.target.checked)} />
              Solo «Otro» ({tabla.n_otro})
            </label>
          )}
          {/* Filtro multi-piso */}
          <div className="filtro-piso" ref={filtroRef}>
            <button className="btn-link" onClick={() => setFiltroAbierto((v) => !v)}>
              Pisos {pisosSel === null ? "(todos)" : `(${pisosSel.size})`} ▾
            </button>
            {filtroAbierto && (
              <div className="filtro-pop">
                <div className="filtro-pop-acc">
                  <button className="btn-link" onClick={() => setPisosSel(null)}>Todos</button>
                  <button className="btn-link" onClick={() => setPisosSel(new Set())}>Ninguno</button>
                </div>
                <div className="filtro-pop-list">
                  {pisos.map((p) => (
                    <label key={p} className="filtro-pop-item">
                      <input
                        type="checkbox"
                        checked={pisosSel === null || pisosSel.has(p)}
                        onChange={() => togglePiso(p)}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          {!!hayEdiciones && (
            <button className="btn-link" onClick={() => setEdiciones(edicionesVacias())}>
              Restablecer
            </button>
          )}
          <button className="btn-export" onClick={exportarTabla} title="Descargar la tabla como CSV">
            <IconoDescarga /> CSV
          </button>
        </div>
      </div>

      <div className="tabla-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th></th>
              <th>Función original</th>
              <th>Función canónica</th>
              <th className="num">m²</th>
              <th className="num">Nivel</th>
              <th>Piso</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const excl = excluidos.has(f.id);
              const gfaVal = ediciones.gfa[f.id] ?? f.gfa;
              const nivelVal = ediciones.nivel[f.id] ?? f.nivel ?? "";
              return (
                <tr key={f.id} className={(f.es_otro ? "row-otro " : "") + (excl ? "row-excl" : "")}>
                  <td>
                    <input
                      type="checkbox"
                      title={excl ? "Excluido del cálculo" : "Incluido"}
                      checked={!excl}
                      onChange={() => toggleExcluir(f.id)}
                    />
                  </td>
                  <td className="raw" title={f.function}>
                    {f.function || <em>—</em>}
                  </td>
                  <td>
                    <select value={f.canonica} onChange={(e) => reclasificar(f.id, e.target.value)}>
                      {funcs.map((fn) => (
                        <option key={fn} value={fn}>
                          {fn}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="num">
                    <input
                      type="number"
                      className="in-num"
                      value={gfaVal}
                      onChange={(e) => editarGfa(f.id, e.target.value)}
                    />
                  </td>
                  <td className="num">
                    <input
                      type="number"
                      className="in-num in-nivel"
                      value={nivelVal}
                      onChange={(e) => editarNivel(f.id, e.target.value)}
                    />
                  </td>
                  <td className="piso">{f.etiqueta}</td>
                </tr>
              );
            })}
            {filas.length === 0 && (
              <tr><td colSpan={6} className="tbl-vacio">Sin elementos para el filtro actual.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AgregarAreas
        funcs={funcs}
        pisos={pisos}
        nSub={nSub}
        matriz={matriz}
        ediciones={ediciones}
        setEdiciones={setEdiciones}
      />
    </div>
  );
}

// Bases de útil disponibles para el cálculo por %.
const BASES_UTIL = ["Residencial Util", "Oficinas Util", "Comercial Util"];

// Base sugerida según la función elegida.
function baseUtilDe(funcion: string): string {
  if (funcion.startsWith("Oficinas")) return "Oficinas Util";
  if (funcion.startsWith("Comercial")) return "Comercial Util";
  return "Residencial Util";
}

// ── Bloque "Agregar áreas" con multi-piso (m² fijo o % del útil) ─────────
function AgregarAreas({
  funcs,
  pisos,
  nSub,
  matriz,
  ediciones,
  setEdiciones,
}: {
  funcs: string[];
  pisos: string[];
  nSub: number;
  matriz: Matriz | null;
  ediciones: Ediciones;
  setEdiciones: (e: Ediciones) => void;
}) {
  const [funcion, setFuncion] = useState("Residencial Terraza");
  const [modo, setModo] = useState<"m2" | "pct">("m2");
  const [valor, setValor] = useState<string>("");
  const [pisosSel, setPisosSel] = useState<Set<string>>(new Set());
  // Base del % (útil). null = seguir la función automáticamente.
  const [baseOverride, setBaseOverride] = useState<string | null>(null);

  const baseUtil = baseOverride ?? baseUtilDe(funcion);
  // Solo cuenta como "presente" si la matriz tiene ese útil
  const baseDisponible = !!matriz && matriz.funciones.includes(baseUtil);

  // Útil (m²) del uso base por piso (etiqueta) según la matriz en vivo.
  const utilPorPiso = useMemo(() => {
    const m = new Map<string, number>();
    if (!matriz || !baseUtil) return m;
    if (!matriz.funciones.includes(baseUtil)) return m;
    for (const fila of matriz.datos) {
      m.set(fila.etiqueta as string, Number(fila[baseUtil]) || 0);
    }
    return m;
  }, [matriz, baseUtil]);

  const togglePiso = (etq: string) => {
    const s = new Set(pisosSel);
    s.has(etq) ? s.delete(etq) : s.add(etq);
    setPisosSel(s);
  };
  const rango = (desde: string, hasta: string) => {
    const rA = rankPiso(desde), rB = rankPiso(hasta);
    const [lo, hi] = rA <= rB ? [rA, rB] : [rB, rA];
    setPisosSel(new Set(pisos.filter((p) => rankPiso(p) >= lo && rankPiso(p) <= hi)));
  };

  // m² que tocaría a un piso dado el modo y valor actuales.
  const m2DePiso = (etq: string): number => {
    const v = Number(valor) || 0;
    if (v <= 0) return 0;
    if (modo === "m2") return v;
    const util = utilPorPiso.get(etq) ?? 0;
    return Math.round(util * (v / 100) * 100) / 100;
  };

  // Vista previa: pisos que efectivamente recibirán área (>0).
  const pisosEfectivos = useMemo(
    () => [...pisosSel].filter((p) => m2DePiso(p) > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pisosSel, modo, valor, utilPorPiso]
  );
  const totalPreview = pisosEfectivos.reduce((s, p) => s + m2DePiso(p), 0);

  const modoPctSinBase = modo === "pct" && !baseDisponible;

  const agregar = () => {
    if (Number(valor) <= 0 || pisosEfectivos.length === 0 || modoPctSinBase) return;
    const base = Date.now();
    const nuevas = pisosEfectivos
      .sort((a, b) => rankPiso(b) - rankPiso(a))
      .map((etq, i) => ({
        id: `manual-${base}-${i}`,
        funcion,
        gfa: m2DePiso(etq), // por cada piso (fijo o % del útil del piso)
        nivel: nivelDeEtiqueta(etq, nSub),
        type: "Manual",
      }));
    setEdiciones({ ...ediciones, agregar: [...ediciones.agregar, ...nuevas] });
    setValor("");
    setPisosSel(new Set());
  };

  const quitarManual = (id: string) =>
    setEdiciones({ ...ediciones, agregar: ediciones.agregar.filter((a) => a.id !== id) });

  const etiquetaDeNivel = (nivel: number | null) => {
    if (nivel === null) return "S/N";
    return nivel < nSub ? `ST-${nSub - nivel}` : `N${nivel - nSub + 1}`;
  };

  const fmt = (n: number) => n.toLocaleString("es-CL", { maximumFractionDigits: 1 });

  return (
    <div className="manual-zone">
      <div className="manual-head">
        <span>Áreas agregadas (no modeladas)</span>
      </div>

      {/* Formulario multi-piso */}
      <div className="manual-form">
        <div className="mf-row">
          <select
            value={funcion}
            onChange={(e) => { setFuncion(e.target.value); setBaseOverride(null); }}
          >
            {funcs.map((fn) => (
              <option key={fn} value={fn}>{fn}</option>
            ))}
          </select>
          <select className="mf-modo" value={modo} onChange={(e) => setModo(e.target.value as "m2" | "pct")}>
            <option value="m2">m² por piso</option>
            <option value="pct">% del útil</option>
          </select>
          {modo === "pct" && (
            <select
              className="mf-base"
              value={baseUtil}
              onChange={(e) => setBaseOverride(e.target.value)}
              title="Área útil sobre la que se calcula el porcentaje"
            >
              {BASES_UTIL.map((b) => (
                <option key={b} value={b}>% sobre {b}</option>
              ))}
            </select>
          )}
          <input
            type="number"
            className="in-num mf-gfa"
            placeholder={modo === "m2" ? "m² por piso" : "%"}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <button
            className="btn-add"
            onClick={agregar}
            disabled={!(Number(valor) > 0) || pisosEfectivos.length === 0 || modoPctSinBase}
          >
            + Agregar a {pisosEfectivos.length || 0} piso{pisosEfectivos.length === 1 ? "" : "s"}
          </button>
        </div>

        {modo === "pct" && (
          modoPctSinBase ? (
            <p className="mf-aviso">
              El proyecto no tiene <b>{baseUtil}</b> en ningún piso, así que el % daría 0. Elige otra base o usa «m² por piso».
            </p>
          ) : (
            <p className="mf-aviso">
              {Number(valor) > 0 && pisosSel.size > 0 ? (
                <>≈ <b>{fmt(totalPreview)} m²</b> en {pisosEfectivos.length} piso{pisosEfectivos.length === 1 ? "" : "s"} ·
                {" "}{Number(valor)}% del <b>{baseUtil}</b> de cada piso
                {pisosSel.size > pisosEfectivos.length && (
                  <> · se omiten {pisosSel.size - pisosEfectivos.length} sin útil</>
                )}</>
              ) : (
                <>El % se aplica al <b>{baseUtil}</b> de cada piso seleccionado.</>
              )}
            </p>
          )
        )}

        <div className="mf-pisos">
          <div className="mf-pisos-acc">
            <span>Pisos:</span>
            <button className="btn-link" onClick={() => setPisosSel(new Set(pisos))}>Todos</button>
            <button className="btn-link" onClick={() => setPisosSel(new Set())}>Ninguno</button>
            {pisos.some((p) => p.startsWith("N")) && (
              <button
                className="btn-link"
                onClick={() => setPisosSel(new Set(pisos.filter((p) => p.startsWith("N"))))}
              >
                Solo sobre rasante
              </button>
            )}
            {pisos.length >= 2 && (
              <button
                className="btn-link"
                onClick={() => rango(pisos[pisos.length - 1], pisos[0])}
                title="Selecciona el rango completo (de abajo arriba)"
              >
                Rango completo
              </button>
            )}
          </div>
          <div className="mf-pisos-chips">
            {pisos.map((p) => (
              <button
                key={p}
                className={"chip" + (pisosSel.has(p) ? " on" : "")}
                onClick={() => togglePiso(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de áreas ya agregadas */}
      {ediciones.agregar.length === 0 ? (
        <p className="manual-empty">Sin áreas manuales. Útil para terrazas u otras superficies que faltan en el modelo.</p>
      ) : (
        <table className="tbl tbl-manual">
          <thead>
            <tr>
              <th>Función</th>
              <th className="num">m²</th>
              <th>Piso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[...ediciones.agregar]
              .sort((a, b) => rankPiso(etiquetaDeNivel(b.nivel)) - rankPiso(etiquetaDeNivel(a.nivel)))
              .map((a) => (
                <tr key={a.id}>
                  <td>{a.funcion}</td>
                  <td className="num">{a.gfa.toLocaleString("es-CL")}</td>
                  <td className="piso">{etiquetaDeNivel(a.nivel)}</td>
                  <td>
                    <button className="btn-x" onClick={() => quitarManual(a.id)} title="Quitar">×</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
      <p className="manual-hint">
        <b>m² por piso</b>: el área se repite igual en cada piso. <b>% del útil</b>: se calcula
        sobre el área útil (Residencial / Oficinas / Comercial) de cada piso; se omiten los
        pisos sin ese útil.
      </p>
    </div>
  );
}
