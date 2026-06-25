import { useRef, useState } from "react";
import type { ColorCanonico } from "../PaletaColores";
import type { InspeccionImagen, CondicionesToma, Preset } from "./tipos";
import { detectarColores } from "./colorDetector";
import { construirJSON, aTexto } from "./jsonBuilder";
import { PRESETS } from "./presetsProyecto";
import TablaColores from "./TablaColores";
import PanelCondiciones from "./PanelCondiciones";
import { IconoArchivo, IconoSubir, IconoDescarga } from "../iconos";

const TOMA_DEFAULT: CondicionesToma = {
  luz: "warm late-afternoon daylight",
  estacion: "seco",
  cielo: "despejado",
  atmosfera: "acogedor, familiar, seguro",
  genteAutos: "integrados",
};

// Ancho objetivo del downscale para muestreo de color (rápido y suficiente).
const DOWNSCALE = 240;

type Props = { paleta: ColorCanonico[] };

export default function RenderControlado({ paleta }: Props) {
  const [nombre, setNombre] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [inspeccion, setInspeccion] = useState<InspeccionImagen | null>(null);
  const [preset, setPreset] = useState<Preset>(PRESETS.batuco);
  const [toma, setToma] = useState<CondicionesToma>(TOMA_DEFAULT);
  const [copiado, setCopiado] = useState(false);
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

  const confirmados = inspeccion?.usos.filter((u) => u.confirmado) ?? [];
  const jsonText =
    inspeccion && confirmados.length
      ? aTexto(construirJSON(confirmados, preset, toma))
      : "";

  const copiar = () => {
    if (!jsonText) return;
    navigator.clipboard?.writeText(jsonText).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
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
          {/* 2. Confirmar usos detectados */}
          <TablaColores inspeccion={inspeccion} onToggle={toggle} />

          {/* 3. Condiciones (preset + toma) */}
          <PanelCondiciones
            presetId={preset.id}
            toma={toma}
            onPreset={setPreset}
            onToma={(patch) => setToma((t) => ({ ...t, ...patch }))}
          />

          {/* 4. JSON de salida + copiar */}
          <div className="rnd-json-head">
            <span className="rnd-cap-tit">JSON para el render ({confirmados.length} uso{confirmados.length === 1 ? "" : "s"})</span>
            <button className="btn-export" onClick={copiar} disabled={!jsonText}>
              <IconoDescarga /> {copiado ? "¡Copiado!" : "Copiar JSON"}
            </button>
          </div>
          <pre className="rnd-json">{jsonText || "Confirma al menos un uso para generar el JSON."}</pre>
        </>
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
