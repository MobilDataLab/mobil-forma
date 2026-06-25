import type { Preset, CondicionesToma, Ubicacion } from "./tipos";
import { PRESETS_LISTA } from "./presetsProyecto";
import MapaUbicacion from "./MapaUbicacion";

// Opciones por eje (etiquetas, no valores continuos: el modelo externo
// interpreta mejor etiquetas que números exactos).
const OPC: Record<keyof CondicionesToma, string[]> = {
  // Luz / cámara
  luz: ["warm late-afternoon daylight", "soft morning light", "overcast diffuse light", "blue hour", "dramatic sunset", "midday sun"],
  hora: ["tarde", "mañana", "mediodía", "atardecer", "amanecer", "hora azul"],
  sombras: ["suaves", "marcadas", "largas", "difusas", "sin sombra dura"],
  camara: ["vista peatonal", "vista a media altura", "aérea baja (dron)", "aérea alta", "contrapicado"],
  lente: ["normal (35-50mm)", "gran angular", "teleobjetivo", "tilt-shift arquitectónico"],
  // Estilo
  estilo: ["fotorrealista", "render arquitectónico limpio", "acuarela", "maqueta física", "boceto a lápiz", "atardecer cinematográfico"],
  detalle: ["alto detalle", "detalle medio", "esquemático"],
  postproceso: ["natural", "alto contraste", "tonos pastel", "blanco y negro", "look editorial"],
  // Entorno
  estacion: ["seco", "florecido", "otoño", "invierno"],
  cielo: ["despejado", "nublado suave", "parcialmente nublado", "dramático con nubes"],
  vegetacionDensidad: ["media", "abundante", "escasa / xerófita", "sin vegetación"],
  mobiliario: ["básico (bancas, luminarias)", "completo (paraderos, ciclovías, áreas verdes)", "mínimo", "sin mobiliario"],
  fondo: ["ciudad", "cerros / cordillera", "agua / costa", "campo abierto", "neutro"],
  atmosfera: ["acogedor, familiar, seguro", "urbano dinámico", "sereno y residencial", "premium / aspiracional"],
  genteAutos: ["integrados", "mínimos", "sin gente", "alta actividad"],
  // Materiales globales
  acabado: ["mate", "satinado", "brillante", "mixto"],
  reflejos: ["sutiles", "marcados", "sin reflejos"],
  desgaste: ["nuevo / impecable", "uso natural leve", "envejecido"],
  paletaTono: ["neutra", "cálida", "fría", "tierra / natural"],
};

const GRUPOS: { titulo: string; campos: { key: keyof CondicionesToma; label: string }[] }[] = [
  { titulo: "Luz y cámara", campos: [
    { key: "luz", label: "Luz" }, { key: "hora", label: "Hora" }, { key: "sombras", label: "Sombras" },
    { key: "camara", label: "Cámara" }, { key: "lente", label: "Lente" },
  ]},
  { titulo: "Estilo de render", campos: [
    { key: "estilo", label: "Estilo" }, { key: "detalle", label: "Detalle" }, { key: "postproceso", label: "Postproceso" },
  ]},
  { titulo: "Entorno y contexto", campos: [
    { key: "estacion", label: "Estación" }, { key: "cielo", label: "Cielo" },
    { key: "vegetacionDensidad", label: "Vegetación" }, { key: "mobiliario", label: "Mobiliario urbano" },
    { key: "fondo", label: "Fondo" }, { key: "atmosfera", label: "Atmósfera" }, { key: "genteAutos", label: "Gente y autos" },
  ]},
  { titulo: "Materiales globales", campos: [
    { key: "acabado", label: "Acabado" }, { key: "reflejos", label: "Reflejos" },
    { key: "desgaste", label: "Desgaste" }, { key: "paletaTono", label: "Paleta de tono" },
  ]},
];

export default function PanelCondiciones({
  presetId,
  toma,
  ubicacion,
  onPreset,
  onToma,
  onUbicacion,
}: {
  presetId: string;
  toma: CondicionesToma;
  ubicacion: Ubicacion;
  onPreset: (p: Preset) => void;
  onToma: (patch: Partial<CondicionesToma>) => void;
  onUbicacion: (u: Ubicacion) => void;
}) {
  const campo = (label: string, key: keyof CondicionesToma) => (
    <div className="field rnd-field" key={key}>
      <label>{label}</label>
      <select value={toma[key]} onChange={(e) => onToma({ [key]: e.target.value } as Partial<CondicionesToma>)}>
        {OPC[key].map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="rnd-cond">
      {/* Capa preset + mapa */}
      <div className="rnd-cond-cap">
        <span className="rnd-cap-tit">Ubicación y preset del proyecto</span>
        <div className="rnd-preset-row">
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
        <MapaUbicacion ubicacion={ubicacion} onChange={onUbicacion} />
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
