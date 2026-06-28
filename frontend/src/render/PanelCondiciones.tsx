import type { CondicionesToma, Ubicacion } from "./tipos";
import { VOCAB } from "./vocabulario.generated";
import MapaUbicacion from "./MapaUbicacion";

// Sentinela: vegetation/season "auto" → el prompt usa lo inferido del clima.
// (Es un option_key real del Excel, no un literal especial.)
export const AUTO_CLIMA = "auto";
// Sentinela del dropdown: "Personalizado…" → habilita texto libre en cualquier eje.
const CUSTOM = "__custom__";

// Mapa eje de la toma → param_key del Excel (clave en VOCAB). El <select> muestra
// labelEs y su value es el option_key. La cámara/vista NO se elige: viene bloqueada.
const PARAM: Record<keyof CondicionesToma, string> = {
  register: "register",
  light: "light",
  sky: "sky",
  colorGrade: "color_grade",
  shadows: "shadows",
  finish: "finish",
  detail: "detail",
  photoReference: "photo_reference",
  people: "people",
  urbanEdge: "urban_edge",
  tectonics: "tectonics",
  accent: "accent",
  vegetation: "vegetation",
  season: "season",
  sustainability: "sustainability",
};

const GRUPOS: { titulo: string; campos: { key: keyof CondicionesToma; label: string }[] }[] = [
  { titulo: "Atmósfera", campos: [
    { key: "register", label: "Registro / escuela" },
    { key: "light", label: "Luz" }, { key: "sky", label: "Cielo" },
    { key: "colorGrade", label: "Paleta de tono" }, { key: "shadows", label: "Sombras" },
    { key: "finish", label: "Acabado" }, { key: "detail", label: "Detalle" },
    { key: "people", label: "Gente y actividad" },
    { key: "photoReference", label: "Referencia fotográfica" },
  ]},
  { titulo: "Expresión arquitectónica", campos: [
    { key: "urbanEdge", label: "Encuentro urbano" },
    { key: "tectonics", label: "Tectónica de fachada" },
    { key: "accent", label: "Acento material" },
  ]},
  { titulo: "Contexto", campos: [
    { key: "vegetation", label: "Vegetación" },
    { key: "season", label: "Estación" },
    { key: "sustainability", label: "Sustentabilidad visible" },
  ]},
];

export default function PanelCondiciones({
  climaInferido,
  toma,
  ubicacion,
  perfiles,
  onPerfil,
  onToma,
  onUbicacion,
}: {
  climaInferido: string;
  toma: CondicionesToma;
  ubicacion: Ubicacion;
  perfiles: Record<string, { nombre: string; patch: Partial<CondicionesToma> }>;
  onPerfil: (id: string) => void;
  onToma: (patch: Partial<CondicionesToma>) => void;
  onUbicacion: (u: Ubicacion) => void;
}) {
  const set = (key: keyof CondicionesToma, value: string) =>
    onToma({ [key]: value } as Partial<CondicionesToma>);

  const campo = (label: string, key: keyof CondicionesToma) => {
    const opciones = VOCAB[PARAM[key]] ?? [];
    const valor = toma[key];
    // Si el valor actual no es un option_key conocido → modo personalizado (texto libre).
    const esCustom = !opciones.some((o) => o.key === valor);
    return (
      <div className="field rnd-field" key={key}>
        <label>{label}</label>
        <select
          value={esCustom ? CUSTOM : valor}
          onChange={(e) => set(key, e.target.value === CUSTOM ? (esCustom ? valor : "") : e.target.value)}
        >
          {opciones.map((o) => <option key={o.key} value={o.key}>{o.labelEs}</option>)}
          <option value={CUSTOM}>✏️ Personalizado…</option>
        </select>
        {esCustom && (
          <input
            type="text"
            className="rnd-campo-libre"
            placeholder="Escribe la instrucción en inglés a mano…"
            value={valor}
            onChange={(e) => set(key, e.target.value)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="rnd-cond">
      {/* Perfil de atmósfera: aplica un set coherente de ejes de una vez */}
      <div className="rnd-cond-cap">
        <span className="rnd-cap-tit">Perfil de atmósfera</span>
        <div className="rnd-perfiles">
          {Object.entries(perfiles).map(([id, p]) => (
            <button key={id} type="button" className="btn-link rnd-perfil-btn" onClick={() => onPerfil(id)}>
              {p.nombre}
            </button>
          ))}
          <span className="rnd-perfil-hint">aplica luz, paleta, registro y estilo de una vez</span>
        </div>
      </div>

      {/* Ubicación = única fuente. El mapa fija lat/lng → clima inferido. */}
      <div className="rnd-cond-cap">
        <span className="rnd-cap-tit">Ubicación del proyecto</span>
        <MapaUbicacion ubicacion={ubicacion} onChange={onUbicacion} />
        <div className="rnd-clima-inferido">
          <span className="rnd-clima-lbl">Clima inferido</span>
          <span className="rnd-clima-val">{climaInferido}</span>
          <span className="rnd-clima-hint">se deduce de la latitud · ajusta el marcador en el mapa</span>
        </div>
      </div>

      {/* Ejes de la toma, agrupados */}
      {GRUPOS.map((g) => (
        <div className="rnd-cond-cap" key={g.titulo}>
          <span className="rnd-cap-tit">{g.titulo}</span>
          <div className="rnd-cond-grid">
            {g.campos.map((c) => campo(c.label, c.key))}
          </div>
        </div>
      ))}
    </div>
  );
}
