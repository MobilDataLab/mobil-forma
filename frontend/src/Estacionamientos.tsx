import { useState } from "react";

export type GfaEstac = { gfa: number; n_elementos: number };

const fmt = (n: number, dec = 0) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: dec, minimumFractionDigits: dec });

export default function Estacionamientos({ estac }: { estac: GfaEstac }) {
  const [cajones, setCajones] = useState<string>("");
  const n = Number(cajones) || 0;
  const gfa = estac.gfa;

  const m2PorCajon = n > 0 ? gfa / n : 0;
  const cajonesPorM2 = gfa > 0 ? n / gfa : 0;

  return (
    <div className="estac">
      <div className="grafico-titulo">Estacionamientos · <span className="acento">ratio por cajón</span></div>

      <div className="estac-top">
        <div className="estac-area">
          <span className="estac-area-val">{fmt(gfa)} m²</span>
          <span className="estac-area-lbl">
            Superficie modelada de estacionamientos
            {estac.n_elementos > 0 && ` · ${estac.n_elementos} elemento${estac.n_elementos === 1 ? "" : "s"}`}
          </span>
        </div>

        <div className="estac-input">
          <label>Nº de cajones</label>
          <input
            type="number"
            min={0}
            placeholder="ej. 120"
            value={cajones}
            onChange={(e) => setCajones(e.target.value)}
          />
        </div>
      </div>

      {gfa <= 0 ? (
        <p className="manual-empty">No hay superficie de Estacionamientos en el modelo. Asigna esa función a algún elemento o agrégala.</p>
      ) : n > 0 ? (
        <div className="estac-kpis">
          <div className="kpi">
            <span>{fmt(m2PorCajon, 1)}</span>
            m² por cajón
          </div>
          <div className="kpi">
            <span>{fmt(cajonesPorM2 * 1000, 1)}</span>
            cajones / 1.000 m²
          </div>
          <div className={"kpi " + holguraClase(m2PorCajon)}>
            <span className="holgura"><span className="punto" />{holguraTxt(m2PorCajon)}</span>
            Holgura (ref. 25–35 m²/cajón)
          </div>
        </div>
      ) : (
        <p className="estac-hint">Ingresa la cantidad de cajones para ver el ratio de superficie por estacionamiento.</p>
      )}
    </div>
  );
}

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
