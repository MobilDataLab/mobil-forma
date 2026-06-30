import { useMemo, useRef, useState } from "react";
import { recolorPlanta, imagenAImageData, imageDataAPng, type VarianteColor } from "./recolorPlanta";
import { CLASES, type ClasePlanta } from "./paletaPlantas";
import { PROMPT_PLANTA, contratoPlantaJSON } from "./promptPlanta";
import { IconoArchivo, IconoSubir, IconoDescarga } from "../iconos";

// Variantes de estilo del plano (handoff): bloques sólidos / plano técnico / editorial.
type Estilo = "bloques" | "tecnico" | "editorial";
const ESTILOS: { id: Estilo; label: string }[] = [
  { id: "bloques", label: "Bloques sólidos" },
  { id: "tecnico", label: "Plano técnico" },
  { id: "editorial", label: "Editorial oscuro" },
];

// Clases que aparecen como leyenda (todas menos fondo).
const LEYENDA = Object.values(CLASES) as { clase: ClasePlanta; funcion: string; colorCanonico: string; colorSuave: string }[];

export default function PanelPlantas() {
  const [nombre, setNombre] = useState("");
  const [pngRecolor, setPngRecolor] = useState<string>("");
  const [variante, setVariante] = useState<VarianteColor>("canonico");
  const [estilo, setEstilo] = useState<Estilo>("editorial");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState<"prompt" | "json" | "">("");
  // ImageData crudo guardado para re-recolorear al cambiar de variante sin re-leer el archivo.
  const srcRef = useRef<ImageData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const jsonText = useMemo(() => contratoPlantaJSON(), []);

  async function cargar(file: File | null) {
    setError(""); if (!file) return;
    setNombre(file.name);
    setProcesando(true);
    try {
      const url = URL.createObjectURL(file);
      const src = await imagenAImageData(url);
      URL.revokeObjectURL(url);
      srcRef.current = src;
      regenerar(variante);
    } catch (e) {
      setError("No se pudo procesar la imagen: " + (e as Error).message);
    } finally {
      setProcesando(false);
    }
  }

  // Recolorea el ImageData guardado con la variante dada y actualiza el preview.
  function regenerar(v: VarianteColor) {
    const src = srcRef.current;
    if (!src) return;
    const out = recolorPlanta(src, { variante: v });
    setPngRecolor(imageDataAPng(out));
  }

  const cambiarVariante = (v: VarianteColor) => { setVariante(v); regenerar(v); };

  const copiar = (cual: "prompt" | "json", texto: string) => {
    navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(cual);
      setTimeout(() => setCopiado(""), 1500);
    });
  };

  const descargarPng = () => {
    if (!pngRecolor) return;
    const a = document.createElement("a");
    a.href = pngRecolor;
    a.download = `planta-diagrama-${variante}.png`;
    a.click();
  };

  return (
    <div className="plantas">
      <div className="tabla-head">
        <div className="grafico-titulo">Planta <span className="acento">diagramática</span></div>
        <span className="topbar-meta">PNG de Forma → plano on-brand · todo en tu navegador</span>
      </div>

      {/* Cargar PNG de la vista de plantas */}
      <div className="pl-bloque">
        <span className="rnd-cap-tit">Imagen de la planta (PNG de Forma)</span>
        <div
          className={"dropzone" + (nombre ? " has" : "")}
          role="button" tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        >
          <span className="dz-icon">{nombre ? <IconoArchivo /> : <IconoSubir />}</span>
          <span className="dz-text">
            <span className="dz-main">{nombre || "Sube el PNG coloreado de la vista de plantas"}</span>
            <span className="dz-sub">{procesando ? "Procesando…" : nombre ? "Click para reemplazar" : "El PNG con colores por función (no el SVG de líneas)"}</span>
          </span>
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg" hidden
          onChange={(e) => cargar(e.target.files?.[0] ?? null)} />
        {error && <div className="msg err" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      {pngRecolor && (
        <>
          {/* Controles: variante de color + estilo de fondo */}
          <div className="pl-controles">
            <div className="pl-seg-grupo">
              <span className="rnd-cap-tit">Paleta</span>
              <div className="pl-seg">
                <button className={"pl-seg-btn" + (variante === "canonico" ? " on" : "")} onClick={() => cambiarVariante("canonico")}>Canónica</button>
                <button className={"pl-seg-btn" + (variante === "suave" ? " on" : "")} onClick={() => cambiarVariante("suave")}>Suave</button>
              </div>
            </div>
            <div className="pl-seg-grupo">
              <span className="rnd-cap-tit">Estilo</span>
              <div className="pl-seg">
                {ESTILOS.map((e) => (
                  <button key={e.id} className={"pl-seg-btn" + (estilo === e.id ? " on" : "")} onClick={() => setEstilo(e.id)}>{e.label}</button>
                ))}
              </div>
            </div>
            <button className="btn-export pl-descargar" onClick={descargarPng}>
              <IconoDescarga /> Descargar PNG
            </button>
          </div>

          {/* Escenario del plano recoloreado */}
          <div className={"pl-stage pl-stage-" + estilo}>
            <img className="pl-img" src={pngRecolor} alt="planta diagramática" />
          </div>

          {/* Leyenda de funciones detectadas */}
          <div className="pl-leyenda">
            {LEYENDA.map((c) => (
              <span className="pl-leg-item" key={c.clase}>
                <span className="pl-sw" style={{ background: "#" + (variante === "suave" ? c.colorSuave : c.colorCanonico) }} />
                {c.funcion}
              </span>
            ))}
          </div>
          <p className="pl-nota">
            Recolor determinista por color de píxel (Camino A): conserva la geometría, las divisiones
            entre unidades y los m² rotulados del PNG; solo cambia los colores a la paleta Mobil y vuelve
            transparente el fondo exterior. Para precisión 1:1 / re-rotulado con el dato real, ver el
            Camino B (prompt para LLM) abajo o el GeoJSON del SDK.
          </p>
        </>
      )}

      {/* Camino B — prompt + JSON para LLM multimodal */}
      <div className="pl-bloque pl-camino-b">
        <span className="rnd-cap-tit">Camino B — redibujar con un LLM (estilo)</span>
        <p className="pl-hint">
          Pega <b>2 imágenes</b> (A = vector de líneas / forma · B = PNG coloreado / función + m²) + este
          prompt en un LLM con visión (ChatGPT, Gemini, Claude) y obtienes la planta diagramática en la
          paleta Mobil. No garantiza geometría exacta; es el atajo de estilo.
        </p>
        <div className="pl-copy-row">
          <button className="btn-export" onClick={() => copiar("prompt", PROMPT_PLANTA)}>
            <IconoDescarga /> {copiado === "prompt" ? "¡Copiado!" : "Copiar prompt"}
          </button>
          <button className="btn-export" onClick={() => copiar("json", jsonText)}>
            <IconoDescarga /> {copiado === "json" ? "¡Copiado!" : "Copiar contrato JSON"}
          </button>
        </div>
        <pre className="pl-pre">{jsonText}</pre>
      </div>
    </div>
  );
}
