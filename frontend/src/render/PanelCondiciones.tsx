import type { CondicionesToma, Ubicacion } from "./tipos";
import {
  ESCUELAS, REFERENCIAS_FOTO, ENCUENTROS_URBANOS, TECTONICAS, SUSTENTABILIDADES,
  ACENTOS_MATERIALES, LUCES_EDITORIALES,
} from "./vocabulario";
import MapaUbicacion from "./MapaUbicacion";

// Sentinela: vegetación/estación "auto" → el prompt usa lo inferido del clima.
export const AUTO_CLIMA = "auto (del clima)";
// Sentinela del dropdown: "Personalizado…" → habilita texto libre en cualquier eje.
const CUSTOM = "__custom__";

// Opciones por eje (etiquetas, no valores continuos: el modelo externo
// interpreta mejor etiquetas que números exactos). La cámara/vista NO se elige:
// viene bloqueada de la imagen (preset).
const OPC: Record<keyof CondicionesToma, string[]> = {
  // 1. Atmósfera
  escuela: Object.keys(ESCUELAS),
  luz: [...LUCES_EDITORIALES, "warm late-afternoon daylight", "soft morning light", "blue hour", "dramatic sunset", "midday sun"],
  cielo: ["despejado", "nublado suave", "parcialmente nublado", "dramático con nubes"],
  paletaTono: ["tierra / natural", "neutra", "cálida", "fría"],
  sombras: ["difusas", "suaves", "marcadas", "largas", "sin sombra dura"],
  // 2. Expresión arquitectónica
  encuentroUrbano: Object.keys(ENCUENTROS_URBANOS),
  tectonica: Object.keys(TECTONICAS),
  materialGlobal: Object.keys(ACENTOS_MATERIALES),
  // Acabado fusiona terminación + pátina (el desgaste que vale la pena conservar).
  acabado: [
    "mate, uso natural leve",
    "mate, impecable",
    "satinado, impecable",
    "envejecido / con pátina",
    "brillante",
  ],
  // 3. Contexto
  sustentabilidad: Object.keys(SUSTENTABILIDADES),
  vegetacion: [AUTO_CLIMA, "abundante", "media", "escasa / xerófita", "sin vegetación"],
  estacion: [AUTO_CLIMA, "seco", "florecido", "otoño", "invierno"],
  genteAutos: ["mínimos", "integrados", "sin gente", "alta actividad"],
  // 4. Render
  detalle: ["alto detalle", "detalle medio", "esquemático"],
  referenciaFoto: Object.keys(REFERENCIAS_FOTO),
};

const GRUPOS: { titulo: string; campos: { key: keyof CondicionesToma; label: string }[] }[] = [
  { titulo: "Atmósfera", campos: [
    { key: "escuela", label: "Escuela / registro" },
    { key: "luz", label: "Luz" }, { key: "cielo", label: "Cielo" },
    { key: "paletaTono", label: "Paleta de tono" }, { key: "sombras", label: "Sombras" },
  ]},
  { titulo: "Expresión arquitectónica", campos: [
    { key: "encuentroUrbano", label: "Encuentro urbano" },
    { key: "tectonica", label: "Tectónica de fachada" },
    { key: "materialGlobal", label: "Acento material" },
    { key: "acabado", label: "Acabado" },
  ]},
  { titulo: "Contexto", campos: [
    { key: "sustentabilidad", label: "Sustentabilidad visible" },
    { key: "vegetacion", label: "Vegetación" },
    { key: "estacion", label: "Estación" },
    { key: "genteAutos", label: "Gente y autos" },
  ]},
  { titulo: "Render", campos: [
    { key: "detalle", label: "Detalle" },
    { key: "referenciaFoto", label: "Referencia fotográfica" },
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
    const valor = toma[key];
    // Si el valor actual no está entre las opciones → modo personalizado (texto libre).
    const esCustom = !OPC[key].includes(valor);
    return (
      <div className="field rnd-field" key={key}>
        <label>{label}</label>
        <select
          value={esCustom ? CUSTOM : valor}
          onChange={(e) => set(key, e.target.value === CUSTOM ? (esCustom ? valor : "") : e.target.value)}
        >
          {OPC[key].map((o) => <option key={o} value={o}>{o}</option>)}
          <option value={CUSTOM}>✏️ Personalizado…</option>
        </select>
        {esCustom && (
          <input
            type="text"
            className="rnd-campo-libre"
            placeholder="Escribe un valor a mano…"
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
          <span className="rnd-perfil-hint">aplica luz, paleta, escuela y estilo de una vez</span>
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
