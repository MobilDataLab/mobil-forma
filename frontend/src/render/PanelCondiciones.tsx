import type { Preset, CondicionesToma } from "./tipos";
import { PRESETS_LISTA } from "./presetsProyecto";

// Opciones de la capa "toma" (etiquetas, no valores continuos: el modelo externo
// interpreta mejor etiquetas que horas/sliders exactos).
const OPC = {
  luz: ["warm late-afternoon daylight", "soft morning light", "overcast diffuse light", "blue hour"],
  estacion: ["seco", "florecido"],
  cielo: ["despejado", "nublado suave"],
  atmosfera: ["acogedor, familiar, seguro", "urbano dinámico", "sereno y residencial"],
  genteAutos: ["integrados", "mínimos", "sin gente"],
};

export default function PanelCondiciones({
  presetId,
  toma,
  onPreset,
  onToma,
}: {
  presetId: string;
  toma: CondicionesToma;
  onPreset: (p: Preset) => void;
  onToma: (patch: Partial<CondicionesToma>) => void;
}) {
  const campo = (label: string, key: keyof CondicionesToma, opciones: string[]) => (
    <div className="field rnd-field">
      <label>{label}</label>
      <select value={toma[key]} onChange={(e) => onToma({ [key]: e.target.value } as Partial<CondicionesToma>)}>
        {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="rnd-cond">
      {/* Capa preset (proyecto, 1 vez) */}
      <div className="rnd-cond-cap">
        <span className="rnd-cap-tit">Preset del proyecto</span>
        <div className="field rnd-field">
          <label>Clima / contexto</label>
          <select
            value={presetId}
            onChange={(e) => {
              const p = PRESETS_LISTA.find((x) => x.id === e.target.value);
              if (p) onPreset(p);
            }}
          >
            {PRESETS_LISTA.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Capa toma (por render) */}
      <div className="rnd-cond-cap">
        <span className="rnd-cap-tit">Condiciones de la toma</span>
        <div className="rnd-cond-grid">
          {campo("Luz", "luz", OPC.luz)}
          {campo("Estación", "estacion", OPC.estacion)}
          {campo("Cielo", "cielo", OPC.cielo)}
          {campo("Atmósfera", "atmosfera", OPC.atmosfera)}
          {campo("Gente y autos", "genteAutos", OPC.genteAutos)}
        </div>
      </div>
    </div>
  );
}
