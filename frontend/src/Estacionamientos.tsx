import { useEffect, useState } from "react";

type Nivel = { gfa: number; n_elementos: number };
export type GfaEstac = {
  gfa: number;
  n_elementos: number;
  superficie?: Nivel;
  subterraneo?: Nivel;
};

const fmt = (n: number, dec = 0) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: dec, minimumFractionDigits: dec });

// Referencia habitual: ~25–35 m²/cajón incluyendo circulación.
function holguraTxt(m2: number): string {
  if (m2 >= 30) return "Amplia";
  if (m2 >= 25) return "Justa";
  return "Ajustada";
}
function holguraClase(m2: number): string {
  if (m2 >= 30) return "kpi-ok";
  if (m2 >= 25) return "kpi-warn";
  return "kpi-bad";
}

// Clave de persistencia por bloque (para que el Excel lea lo que hay en pantalla).
const LS_ESTAC = "mobil-estac";
type EstacStore = Record<string, { gfa: string; cajones: string; ratio: string }>;
function leerEstac(): EstacStore {
  try { return JSON.parse(localStorage.getItem(LS_ESTAC) || "{}"); } catch { return {}; }
}
function guardarEstac(key: string, v: { gfa: string; cajones: string; ratio: string }) {
  const all = leerEstac();
  all[key] = v;
  localStorage.setItem(LS_ESTAC, JSON.stringify(all));
}

// Payload de la hoja "Estacionamientos" del Excel, con lo que hay en pantalla.
export function estacParaExcel(): { bloques: { titulo: string; gfa: number; cajones: number; ratio: number }[] } {
  const st = leerEstac();
  const def = (k: string, titulo: string) => {
    const b = st[k] || { gfa: "", cajones: "", ratio: "" };
    return { titulo, gfa: Number(b.gfa) || 0, cajones: Number(b.cajones) || 0, ratio: Number(b.ratio) || 0 };
  };
  return { bloques: [def("superficie", "Superficie (sobre NTN)"), def("subterraneo", "Subterráneo (bajo NTN)")] };
}

// Un bloque (Superficie o Subterráneo) con m² (ancla) ↔ cajones ↔ ratio editables.
function BloqueEstac({ titulo, claveLS, gfaBase, nBase }: { titulo: string; claveLS: string; gfaBase: number; nBase: number }) {
  const guardado = leerEstac()[claveLS];
  const [gfa, setGfa] = useState<string>(guardado?.gfa ?? (gfaBase > 0 ? String(Math.round(gfaBase)) : ""));
  const [cajones, setCajones] = useState<string>(guardado?.cajones ?? "");
  const [ratio, setRatio] = useState<string>(guardado?.ratio ?? "");

  useEffect(() => { guardarEstac(claveLS, { gfa, cajones, ratio }); }, [claveLS, gfa, cajones, ratio]);

  const g = Number(gfa) || 0;
  const n = Number(cajones) || 0;
  const r = Number(ratio) || 0;

  // m² es el ancla. Al editar cajones → recalcula ratio; al editar ratio → recalcula cajones.
  const editarCajones = (v: string) => {
    setCajones(v);
    const nn = Number(v) || 0;
    setRatio(g > 0 && nn > 0 ? (g / nn).toFixed(1) : "");
  };
  const editarRatio = (v: string) => {
    setRatio(v);
    const rr = Number(v) || 0;
    setCajones(g > 0 && rr > 0 ? String(Math.round(g / rr)) : "");
  };
  // Al cambiar m², mantener cajones y recalcular ratio (si hay cajones).
  const editarGfa = (v: string) => {
    setGfa(v);
    const gg = Number(v) || 0;
    if (n > 0) setRatio(gg > 0 ? (gg / n).toFixed(1) : "");
  };

  const ratioEf = n > 0 && g > 0 ? g / n : r;
  const hayDatos = g > 0 && (n > 0 || r > 0);

  return (
    <div className="estac-bloque">
      <div className="estac-bloque-cab">
        <span className="estac-bloque-tit">{titulo}</span>
        {nBase > 0 && <span className="estac-bloque-sub">{nBase} elemento{nBase === 1 ? "" : "s"} modelado{nBase === 1 ? "" : "s"}</span>}
      </div>

      <div className="estac-edit">
        <div className="field">
          <label>Superficie m²</label>
          <input type="number" min={0} value={gfa} placeholder="0" onChange={(e) => editarGfa(e.target.value)} />
        </div>
        <div className="field">
          <label>Nº de cajones</label>
          <input type="number" min={0} value={cajones} placeholder="ej. 52" onChange={(e) => editarCajones(e.target.value)} />
        </div>
        <div className="field">
          <label>Ratio m²/cajón</label>
          <input type="number" min={0} step="0.1" value={ratio} placeholder="ej. 30" onChange={(e) => editarRatio(e.target.value)} />
        </div>
      </div>

      {hayDatos ? (
        <div className="estac-kpis">
          <div className="kpi"><span>{fmt(ratioEf, 1)}</span>m² por cajón</div>
          <div className="kpi"><span>{fmt(ratioEf > 0 ? (1 / ratioEf) * 1000 : 0, 1)}</span>cajones / 1.000 m²</div>
          <div className={"kpi " + holguraClase(ratioEf)}>
            <span className="holgura"><span className="punto" />{holguraTxt(ratioEf)}</span>
            Holgura · ref. 25–35 m²/cajón
          </div>
        </div>
      ) : (
        <p className="estac-hint">Ingresa cajones o ratio para calcular la relación de superficie por estacionamiento.</p>
      )}
    </div>
  );
}

export default function Estacionamientos({ estac }: { estac: GfaEstac }) {
  // Fallback: si el motor no trae el desglose, todo va a "superficie".
  const sup = estac.superficie ?? { gfa: estac.gfa, n_elementos: estac.n_elementos };
  const subt = estac.subterraneo ?? { gfa: 0, n_elementos: 0 };

  if (estac.gfa <= 0 && sup.gfa <= 0 && subt.gfa <= 0) {
    return (
      <div className="estac">
        <div className="grafico-titulo">Estacionamientos · <span className="acento">ratio por cajón</span></div>
        <p className="manual-empty">No hay superficie de Estacionamientos en el modelo. Asigna esa función a algún elemento o agrégala.</p>
      </div>
    );
  }

  return (
    <div className="estac">
      <div className="grafico-titulo">Estacionamientos · <span className="acento">ratio por cajón</span></div>
      <div className="estac-grid2">
        <BloqueEstac titulo="Superficie (sobre NTN)" claveLS="superficie" gfaBase={sup.gfa} nBase={sup.n_elementos} />
        <BloqueEstac titulo="Subterráneo (bajo NTN)" claveLS="subterraneo" gfaBase={subt.gfa} nBase={subt.n_elementos} />
      </div>
    </div>
  );
}
