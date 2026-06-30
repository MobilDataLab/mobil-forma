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
import { VOCAB, defaultKey } from "./vocabulario.generated";
import { IconoArchivo, IconoSubir, IconoDescarga } from "../iconos";

// Default = el option_key marcado isDefault de cada eje en el Excel (fuente de verdad).
const TOMA_DEFAULT: CondicionesToma = {
  // Origen del render base
  source: defaultKey("source"),
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

// Batuco por defecto (coincide con el preset).
const UBIC_DEFAULT: Ubicacion = { lat: -33.222, lng: -70.808, etiqueta: "Batuco, Lampa, Región Metropolitana, Chile" };

// Ancho objetivo del downscale para muestreo de color (rápido y suficiente).
const DOWNSCALE = 240;

// Los 4 pasos del flujo. El índice + 1 es el número del paso.
const PASOS = ["Imagen", "Usos", "Condiciones", "Salida"] as const;
type Paso = 1 | 2 | 3 | 4;
type OutTab = "prompt" | "restric" | "json";

// Etiqueta corta del origen (para el resumen lateral).
function labelSource(key: string): string {
  return (VOCAB.source ?? []).find((o) => o.key === key)?.labelEs ?? key;
}

type Props = { paleta: ColorCanonico[] };

export default function RenderControlado({ paleta }: Props) {
  const [nombre, setNombre] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [inspeccion, setInspeccion] = useState<InspeccionImagen | null>(null);
  const [toma, setToma] = useState<CondicionesToma>(TOMA_DEFAULT);
  const [ubicacion, setUbicacion] = useState<Ubicacion>(UBIC_DEFAULT);

  // Paso actual del flujo + pestaña de salida activa (paso 4). Estado de UI puro.
  const [paso, setPaso] = useState<Paso>(1);
  const [outTab, setOutTab] = useState<OutTab>("prompt");
  // Ejes cuyo valor vino de "Capturar referencia" → etiqueta "ref" en el paso 3.
  const [refKeys, setRefKeys] = useState<Set<string>>(new Set());

  // El preset (clima + vegetación) se DERIVA de la ubicación: el mapa es la única
  // fuente. La etiqueta del lugar alimenta el campo `location` del JSON.
  const preset: Preset = useMemo(() => {
    const base = climaDesdeCoords(ubicacion.lat, ubicacion.lng);
    return { ...base, location: ubicacion.etiqueta || base.location };
  }, [ubicacion.lat, ubicacion.lng, ubicacion.etiqueta]);
  const [copiado, setCopiado] = useState(false);
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
      setPaso(2); // imagen lista → avanza al paso de usos
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

  // Aplica un patch de "Capturar referencia": setea los ejes y los marca como "ref".
  const aplicarReferencia = (patch: Partial<CondicionesToma>, campos: string[]) => {
    setToma((t) => ({ ...t, ...patch }));
    setRefKeys((prev) => { const next = new Set(prev); campos.forEach((c) => next.add(c)); return next; });
  };

  // Cambiar un eje a mano lo saca del modo "ref" (deja de ser de la referencia).
  const cambiarToma = (patch: Partial<CondicionesToma>) => {
    setToma((t) => ({ ...t, ...patch }));
    const keys = Object.keys(patch);
    setRefKeys((prev) => {
      if (!keys.some((k) => prev.has(k))) return prev;
      const next = new Set(prev); keys.forEach((k) => next.delete(k)); return next;
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
    return [bloque("PRESERVE", preserve), bloque("AVOID", avoid)].join("\n\n");
  }, [contrato]);

  // Texto activo de la pestaña de salida (paso 4).
  const salidaText = outTab === "prompt" ? promptText : outTab === "restric" ? restriccionesText : jsonText;

  const copiarSalida = () => {
    if (!salidaText) return;
    navigator.clipboard?.writeText(salidaText).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });
  };

  // Navegación entre pasos (libre: las celdas y el footer comparten esta función).
  const irA = (p: Paso) => { setPaso(p); setCopiado(false); };
  const hayInspeccion = !!inspeccion;
  const progreso = (paso / 4) * 100;

  const thumb = previewUrl
    ? <img src={previewUrl} alt="vista previa del modelo" />
    : <div className="rndw-img-empty">sin imagen</div>;

  return (
    <div className="render">
      <div className="tabla-head">
        <div className="grafico-titulo">Render <span className="acento">controlado</span></div>
        <span className="topbar-meta">PNG de Forma → JSON para render externo · todo en tu navegador</span>
      </div>

      <div className="rndw-frame">
        {/* Franja vertical (motivo Mobil) */}
        <div className="rndw-rail-margin"><span>Render Controlado</span></div>

        <div className="rndw-body">
          {/* Riel de 4 pasos */}
          <div className="rndw-steps">
            {PASOS.map((label, i) => {
              const n = (i + 1) as Paso;
              const estado = n === paso ? "is-actual" : n < paso ? "is-done" : "is-pending";
              const num = n < paso ? `0${n} ✓` : n === paso ? `0${n} · Actual` : `0${n}`;
              // Pasos 2–4 requieren imagen cargada.
              const bloqueado = n > 1 && !hayInspeccion;
              return (
                <button
                  key={label}
                  type="button"
                  className={`rndw-step ${estado}`}
                  disabled={bloqueado}
                  onClick={() => irA(n)}
                >
                  <div className="rndw-step-num">{num}</div>
                  <div className="rndw-step-label">{label}</div>
                </button>
              );
            })}
          </div>
          {/* Barra de progreso */}
          <div className="rndw-progress">
            <div className="rndw-progress-fill" style={{ width: `${progreso}%` }} />
            <div className="rndw-progress-rest" />
          </div>

          <div className="rndw-grid">
            {/* ════════ Cuerpo del paso ════════ */}
            <div className="rndw-main">
              {/* ── Paso 1 · Imagen base ── */}
              {paso === 1 && (
                <>
                  <h3 className="rndw-step-title">Paso 1 — <span className="acento">Imagen base</span></h3>
                  <p className="rndw-step-sub">Un PNG del modelo de Forma con colores por uso. La imagen no se sube: se procesa en tu navegador.</p>

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

                  {error && <div className="msg err" style={{ marginTop: 12 }}>{error}</div>}

                  <div className="rndw-img-grid">
                    <div className="rndw-img-box">{thumb}</div>
                    <div>
                      {inspeccion ? (
                        <>
                          <span className="rndw-grp">{inspeccion.usos.length} colores detectados → paleta del motor</span>
                          <div className="rndw-det-list">
                            {inspeccion.usos.map((u) => (
                              <div className="rndw-det-row" key={u.funcion}>
                                <span className="rnd-sw" style={{ background: u.hex }} />
                                {u.funcion}
                                <span className="pct">{u.pct > 0 ? `${u.pct}%` : "—"}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <span className="rndw-grp">Carga una imagen para detectar los usos por color.</span>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── Paso 2 · Usos del proyecto ── */}
              {paso === 2 && inspeccion && (
                <>
                  <h3 className="rndw-step-title">Paso 2 — <span className="acento">Usos del proyecto</span></h3>
                  <p className="rndw-step-sub">Confirma qué colores son usos del edificio y asigna su materialidad. Desmarca los que sean contexto o escena.</p>
                  <TablaColores
                    inspeccion={inspeccion}
                    onToggle={toggle}
                    onMaterialidad={cambiarMaterialidad}
                    onAtributo={cambiarAtributo}
                    onQuitar={quitarUso}
                    onAbrirPicker={previewUrl ? () => setPickerAbierto(true) : undefined}
                  />
                </>
              )}

              {/* ── Paso 3 · Condiciones de la toma ── */}
              {paso === 3 && inspeccion && (
                <>
                  <h3 className="rndw-step-title">Paso 3 — <span className="acento">Condiciones de la toma</span></h3>
                  <p className="rndw-step-sub">Cómo se ve este render. La geometría y la cámara quedan bloqueadas desde tu PNG.</p>
                  {/* Capturar referencia (callout amarillo, arriba del paso) */}
                  <PanelReferencia onAplicar={aplicarReferencia} />
                  {/* Condiciones: origen + ubicación/clima + ejes + restricciones */}
                  <PanelCondiciones
                    climaInferido={preset.clima}
                    toma={toma}
                    ubicacion={ubicacion}
                    refKeys={refKeys}
                    onToma={cambiarToma}
                    onUbicacion={setUbicacion}
                  />
                </>
              )}

              {/* ── Paso 4 · Contrato de render ── */}
              {paso === 4 && inspeccion && (
                <>
                  <h3 className="rndw-step-title">Paso 4 — <span className="acento">Contrato de render</span></h3>
                  <p className="rndw-step-sub">Se regenera solo con tus usos y condiciones. Copia el bloque que necesites.</p>
                  <div className="rndw-otabs">
                    <button className={"rndw-otab" + (outTab === "prompt" ? " on" : "")} onClick={() => setOutTab("prompt")}>Prompt</button>
                    <button className={"rndw-otab" + (outTab === "restric" ? " on" : "")} onClick={() => setOutTab("restric")}>Restricciones</button>
                    <button className={"rndw-otab" + (outTab === "json" ? " on" : "")} onClick={() => setOutTab("json")}>JSON</button>
                  </div>
                  <div className="rndw-out-head">
                    <button className="btn-export" onClick={copiarSalida} disabled={!salidaText}>
                      <IconoDescarga /> {copiado ? "¡Copiado!" : "Copiar"}
                    </button>
                  </div>
                  <pre className="rndw-pre">{salidaText || "Confirma al menos un uso para generar el contrato."}</pre>
                </>
              )}

              {/* Footer de navegación */}
              <div className="rndw-nav">
                <button
                  className={"rndw-nav-prev" + (paso === 1 ? " rndw-nav-hidden" : "")}
                  onClick={() => irA((paso - 1) as Paso)}
                >
                  ← {(PASOS as readonly string[])[paso - 2] ?? ""}
                </button>
                <button
                  className={"rndw-nav-next" + (paso === 4 || !hayInspeccion ? " rndw-nav-hidden" : "")}
                  onClick={() => irA((paso + 1) as Paso)}
                >
                  {(PASOS as readonly string[])[paso] ?? ""} →
                </button>
              </div>
            </div>

            {/* ════════ Resumen persistente ════════ */}
            <aside className="rndw-sum">
              <span className="rndw-grp">Resumen</span>
              <div className="rndw-sum-thumb">{thumb}</div>
              <div className="rndw-sum-row rndw-sum-div">
                <span className="k">Usos confirmados</span>
                <span className="v">{confirmados.length} / {inspeccion?.usos.length ?? 0}</span>
              </div>
              {confirmados.length > 0 && (
                <div className="rndw-sum-conf">
                  {confirmados.map((u) => (
                    <div className="rndw-sum-conf-row" key={u.funcion}>
                      <span className="rnd-sw" style={{ background: u.hex }} />
                      {u.funcion}
                      <span className="pct">{u.pct > 0 ? `${u.pct}%` : "—"}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="rndw-sum-row"><span className="k">Origen</span><span className="v">{labelSource(toma.source)}</span></div>
              <div className="rndw-sum-row"><span className="k">Ubicación</span><span className="v">{ubicacion.etiqueta.split(",")[0]}</span></div>
              <div className="rndw-sum-row"><span className="k">Clima</span><span className="v blue">{preset.clima}</span></div>
            </aside>
          </div>

          <div className="rndw-yellowbar" />
        </div>
      </div>

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
