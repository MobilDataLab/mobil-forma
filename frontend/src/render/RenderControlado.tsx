import { useMemo, useRef, useState } from "react";
import type { ColorCanonico } from "../PaletaColores";
import type { InspeccionImagen, CondicionesToma, Preset, Ubicacion, UsoDetectado } from "./tipos";
import { detectarColores } from "./colorDetector";
import { construirJSON, aTexto, seedRestricciones } from "./jsonBuilder";
import { climaDesdeCoords } from "./clima";
import TablaColores from "./TablaColores";
import ColorPickerModal from "./ColorPickerModal";
import PanelCondiciones from "./PanelCondiciones";
import PanelReferencia from "./PanelReferencia";
import { defaultKey } from "./vocabulario.generated";
import { IconoArchivo, IconoSubir, IconoDescarga } from "../iconos";

// Default = el option_key marcado isDefault de cada eje en el Excel (fuente de verdad).
const TOMA_DEFAULT: CondicionesToma = {
  // Atmósfera
  register: defaultKey("register"),
  light: defaultKey("light"),
  sky: defaultKey("sky"),
  colorGrade: defaultKey("color_grade"),
  shadows: defaultKey("shadows"),
  finish: defaultKey("finish"),
  detail: defaultKey("detail"),
  photoReference: defaultKey("photo_reference"),
  people: defaultKey("people"),
  // Expresión arquitectónica
  urbanEdge: defaultKey("urban_edge"),
  tectonics: defaultKey("tectonics"),
  accent: defaultKey("accent"),
  // Contexto
  vegetation: defaultKey("vegetation"),
  season: defaultKey("season"),
  sustainability: defaultKey("sustainability"),
  // Restricciones: lista de texto inglés editable, sembrada del banco del Excel.
  // El seed inicial usa el clima del preset por defecto (Batuco, semiárido → incluye
  // "evitar tropical"). Si el usuario cambia la ubicación, puede editar la lista a mano.
  preserve: seedRestricciones("preserve", "semiárido mediterráneo"),
  avoid: seedRestricciones("avoid", "semiárido mediterráneo"),
};

// Perfiles de arranque: aplican un set coherente de ejes (por option_key) de una vez.
const PERFILES: Record<string, { nombre: string; patch: Partial<CondicionesToma> }> = {
  editorial: {
    nombre: "Editorial / arquitectura",
    patch: {
      register: "editorial_atmospheric",
      light: "soft_diffuse_overcast",
      sky: "soft_overcast",
      shadows: "soft_long",
      colorGrade: "earthy_restrained",
      people: "minimal_silhouettes",
      finish: "matte_weathered",
    },
  },
  comercial: {
    nombre: "Comunicación comercial",
    patch: {
      register: "urban_narrative",
      light: "raking_late",
      sky: "clear",
      shadows: "raking",
      colorGrade: "warm_golden",
      people: "integrated",
      finish: "matte_new",
    },
  },
};

// Batuco por defecto (coincide con el preset).
const UBIC_DEFAULT: Ubicacion = { lat: -33.222, lng: -70.808, etiqueta: "Batuco, Lampa, Región Metropolitana, Chile" };

// Ancho objetivo del downscale para muestreo de color (rápido y suficiente).
const DOWNSCALE = 240;

type Props = { paleta: ColorCanonico[] };

export default function RenderControlado({ paleta }: Props) {
  const [nombre, setNombre] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [inspeccion, setInspeccion] = useState<InspeccionImagen | null>(null);
  const [toma, setToma] = useState<CondicionesToma>(TOMA_DEFAULT);
  const [ubicacion, setUbicacion] = useState<Ubicacion>(UBIC_DEFAULT);

  // El preset (clima + vegetación) se DERIVA de la ubicación: el mapa es la única
  // fuente. La etiqueta del lugar alimenta el campo `location` del JSON.
  const preset: Preset = useMemo(() => {
    const base = climaDesdeCoords(ubicacion.lat, ubicacion.lng);
    return { ...base, location: ubicacion.etiqueta || base.location };
  }, [ubicacion.lat, ubicacion.lng, ubicacion.etiqueta]);
  const [copiado, setCopiado] = useState(false);
  const [copiadoPrompt, setCopiadoPrompt] = useState(false);
  const [copiadoRestric, setCopiadoRestric] = useState(false);
  const [pickerAbierto, setPickerAbierto] = useState(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // PNG → <canvas> (downscale) → getImageData → detectarColores(paleta del motor).
  async function cargarImagen(file: File | null) {
    setError(""); setCopiado(false);
    if (!file) return;
    setNombre(file.name);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    try {
      const img = await cargarBitmap(url);
      const escala = img.width > DOWNSCALE ? DOWNSCALE / img.width : 1;
      const w = Math.max(1, Math.round(img.width * escala));
      const h = Math.max(1, Math.round(img.height * escala));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) { setError("No se pudo leer la imagen (canvas)."); return; }
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      setInspeccion(detectarColores(data, paleta, { downscale: DOWNSCALE }));
    } catch (e) {
      setError("No se pudo procesar la imagen: " + (e as Error).message);
    }
  }

  const toggle = (funcion: string, confirmado: boolean) => {
    if (!inspeccion) return;
    setInspeccion({
      ...inspeccion,
      usos: inspeccion.usos.map((u) => (u.funcion === funcion ? { ...u, confirmado } : u)),
    });
  };

  const cambiarMaterialidad = (funcion: string, materialidad: string) => {
    if (!inspeccion) return;
    setInspeccion({
      ...inspeccion,
      usos: inspeccion.usos.map((u) => (u.funcion === funcion ? { ...u, materialidad } : u)),
    });
  };

  // Agrega un uso pickeado a mano. Si el nombre choca, lo desambigua con sufijo.
  const agregarUsoManual = (nuevo: UsoDetectado) => {
    if (!inspeccion) return;
    let funcion = nuevo.funcion;
    const nombres = new Set(inspeccion.usos.map((u) => u.funcion));
    if (nombres.has(funcion)) {
      let i = 2;
      while (nombres.has(`${funcion} (${i})`)) i++;
      funcion = `${funcion} (${i})`;
    }
    setInspeccion({ ...inspeccion, usos: [...inspeccion.usos, { ...nuevo, funcion }] });
  };

  // Quita un uso (solo los agregados a mano; los detectados se ocultan con el checkbox).
  const quitarUso = (funcion: string) => {
    if (!inspeccion) return;
    setInspeccion({ ...inspeccion, usos: inspeccion.usos.filter((u) => u.funcion !== funcion) });
  };

  // Edita un atributo estructurado del elemento (altura / distribución / rol).
  const cambiarAtributo = (funcion: string, campo: "altura" | "distribucion" | "rol", v: string) => {
    if (!inspeccion) return;
    setInspeccion({
      ...inspeccion,
      usos: inspeccion.usos.map((u) => (u.funcion === funcion ? { ...u, [campo]: v } : u)),
    });
  };

  const confirmados = inspeccion?.usos.filter((u) => u.confirmado) ?? [];
  const contrato =
    inspeccion && confirmados.length ? construirJSON(confirmados, preset, toma, ubicacion) : null;
  const jsonText = contrato ? aTexto(contrato) : "";
  const promptText = contrato?.prompt ?? "";

  // Restricciones en texto plano: lo que se PRESERVA (geometría, cámara, contexto)
  // en positivo + lo que se debe EVITAR. Salen del contrato v2, en dos bloques.
  const restriccionesText = useMemo(() => {
    if (!contrato) return "";
    const { preserve, avoid } = contrato;
    const bloque = (titulo: string, items: string[]) =>
      `${titulo}:\n${items.map((i) => `- ${i}`).join("\n")}`;
    return [
      bloque("PRESERVE", preserve),
      bloque("AVOID", avoid),
    ].join("\n\n");
  }, [contrato]);

  const copiar = () => {
    if (!jsonText) return;
    navigator.clipboard?.writeText(jsonText).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });
  };

  const copiarPrompt = () => {
    if (!promptText) return;
    navigator.clipboard?.writeText(promptText).then(() => {
      setCopiadoPrompt(true);
      setTimeout(() => setCopiadoPrompt(false), 1500);
    });
  };

  const copiarRestricciones = () => {
    if (!restriccionesText) return;
    navigator.clipboard?.writeText(restriccionesText).then(() => {
      setCopiadoRestric(true);
      setTimeout(() => setCopiadoRestric(false), 1500);
    });
  };

  return (
    <div className="render">
      <div className="tabla-head">
        <div className="grafico-titulo">Render <span className="acento">controlado</span></div>
        <span className="topbar-meta">PNG de Forma → JSON para render externo · todo en tu navegador</span>
      </div>

      {/* 1. Cargar PNG */}
      <div className="rnd-drop-row">
        <div
          className={"dropzone" + (nombre ? " has" : "")}
          role="button" tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        >
          <span className="dz-icon">{nombre ? <IconoArchivo /> : <IconoSubir />}</span>
          <span className="dz-text">
            <span className="dz-main">{nombre || "Selecciona un PNG del modelo de Forma"}</span>
            <span className="dz-sub">{nombre ? "Click para reemplazar" : "Imagen volumétrica con colores por uso"}</span>
          </span>
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg" hidden
          onChange={(e) => cargarImagen(e.target.files?.[0] ?? null)} />
        {previewUrl && <img className="rnd-preview" src={previewUrl} alt="vista previa" />}
      </div>

      {error && <div className="msg err" style={{ marginTop: 12 }}>{error}</div>}

      {inspeccion && (
        <>
          {/* 2. Confirmar usos detectados + materialidad por función */}
          <TablaColores
            inspeccion={inspeccion}
            onToggle={toggle}
            onMaterialidad={cambiarMaterialidad}
            onAtributo={cambiarAtributo}
            onQuitar={quitarUso}
            onAbrirPicker={previewUrl ? () => setPickerAbierto(true) : undefined}
          />

          {/* 3a. Capturar referencia (foto → parámetros vía Gemini, en Personalizado) */}
          <PanelReferencia onAplicar={(patch) => setToma((t) => ({ ...t, ...patch }))} />

          {/* 3b. Condiciones (ubicación → clima derivado + mapa + ejes de toma) */}
          <PanelCondiciones
            climaInferido={preset.clima}
            toma={toma}
            ubicacion={ubicacion}
            perfiles={PERFILES}
            onPerfil={(id) => { const p = PERFILES[id]; if (p) setToma((t) => ({ ...t, ...p.patch })); }}
            onToma={(patch) => setToma((t) => ({ ...t, ...patch }))}
            onUbicacion={setUbicacion}
          />

          {/* 4a. Prompt en prosa (capa primaria) + copiar */}
          <div className="rnd-json-head">
            <span className="rnd-cap-tit">Prompt arquitectónico (prosa)</span>
            <button className="btn-export" onClick={copiarPrompt} disabled={!promptText}>
              <IconoDescarga /> {copiadoPrompt ? "¡Copiado!" : "Copiar prompt"}
            </button>
          </div>
          <pre className="rnd-prompt">{promptText || "Confirma al menos un uso para generar el prompt."}</pre>

          {/* 4a-bis. Restricciones: bloque consolidado para copiar (se editan en la lista arriba) */}
          <div className="rnd-json-head">
            <span className="rnd-cap-tit">Restricciones del render (PRESERVE / AVOID)</span>
            <button className="btn-export" onClick={copiarRestricciones} disabled={!restriccionesText}>
              <IconoDescarga /> {copiadoRestric ? "¡Copiado!" : "Copiar restricciones"}
            </button>
          </div>
          <pre className="rnd-prompt">{restriccionesText || "Confirma al menos un uso para generar las restricciones."}</pre>

          {/* 4b. JSON completo (prompt + params + negative) + copiar */}
          <div className="rnd-json-head">
            <span className="rnd-cap-tit">JSON completo para el render ({confirmados.length} uso{confirmados.length === 1 ? "" : "s"})</span>
            <button className="btn-export" onClick={copiar} disabled={!jsonText}>
              <IconoDescarga /> {copiado ? "¡Copiado!" : "Copiar JSON"}
            </button>
          </div>
          <pre className="rnd-json">{jsonText || "Confirma al menos un uso para generar el JSON."}</pre>
        </>
      )}

      {pickerAbierto && previewUrl && (
        <ColorPickerModal
          imagenUrl={previewUrl}
          paleta={paleta}
          onAgregar={agregarUsoManual}
          onCerrar={() => setPickerAbierto(false)}
        />
      )}
    </div>
  );
}

// Carga un bitmap desde un object URL (Promise).
function cargarBitmap(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("imagen inválida"));
    img.src = url;
  });
}
