import { useEffect, useRef, useState } from "react";
import GraficoCabida, { type Matriz } from "./GraficoCabida";
import TablaElementos, {
  type Tabla,
  type Ediciones,
  edicionesVacias,
} from "./TablaElementos";
import PaletaColores, { type ColorCanonico } from "./PaletaColores";
import GraficoVenta, { type Venta } from "./GraficoVenta";
import Estacionamientos, { type GfaEstac } from "./Estacionamientos";
import CabidaEdificios, { type Edificios } from "./CabidaEdificios";
import { IconoArchivo, IconoSubir } from "./iconos";
import { MobilMark } from "./MobilMark";

type Estado = "cargando" | "listo" | "error";
type Resumen = { elementos: number; venta: number; construido: number; eficiencia: number };

// Secciones (vista por páginas). El orden define el de las pestañas.
const VISTAS = [
  { id: "resumen", label: "Resumen" },
  { id: "cabida", label: "Cabida por piso" },
  { id: "edificios", label: "Edificios" },
  { id: "venta", label: "Venta" },
  { id: "elementos", label: "Elementos" },
  { id: "estac", label: "Estacionamientos" },
  { id: "paleta", label: "Paleta" },
] as const;
type Vista = (typeof VISTAS)[number]["id"];

export default function App() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [paso, setPaso] = useState("Iniciando Python en el navegador…");
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [nSub, setNSub] = useState(1);
  const [working, setWorking] = useState(false);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [matriz, setMatriz] = useState<Matriz | null>(null);
  const [venta, setVenta] = useState<Venta | null>(null);
  const [estac, setEstac] = useState<GfaEstac | null>(null);
  const [edificios, setEdificios] = useState<Edificios | null>(null);
  const [tabla, setTabla] = useState<Tabla | null>(null);
  const [paleta, setPaleta] = useState<ColorCanonico[] | null>(null);
  const [ediciones, setEdiciones] = useState<Ediciones>(edicionesVacias());
  const [msg, setMsg] = useState<{ t: "err" | "ok"; x: string } | null>(null);
  // Sección activa (se recuerda entre recargas).
  const [vista, setVista] = useState<Vista>(() => {
    const v = localStorage.getItem("mobil-vista");
    return VISTAS.some((x) => x.id === v) ? (v as Vista) : "resumen";
  });
  const pyRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calcula tabla + resumen + matriz aplicando las ediciones (en vivo)
  function recalcular(csv: string, ns: number, ed: Ediciones) {
    const py = pyRef.current;
    if (!py) return;
    py.globals.set("csv_text", csv);
    py.globals.set("n_sub", ns);
    py.globals.set("ed_json", JSON.stringify(ed));
    try {
      const out = py.runPython(`
import json
_ed = json.loads(ed_json)
json.dumps({
  "tabla":   tabla_elementos(csv_text, n_sub, _ed),
  "resumen": resumen_cabida(csv_text, n_sub, _ed),
  "matriz":  matriz_cabida(csv_text, n_sub, _ed),
  "venta":   venta_por_funcion(csv_text, n_sub, _ed),
  "estac":   gfa_estacionamientos(csv_text, n_sub, _ed),
  "edificios": cabida_por_edificio(csv_text, n_sub, _ed),
})`);
      const { tabla, resumen, matriz, venta, estac, edificios } = JSON.parse(out);
      setTabla(tabla);
      setResumen(resumen);
      setMatriz(matriz);
      setVenta(venta);
      setEstac(estac);
      setEdificios(edificios);
      setMsg(null);
    } catch (e) {
      setMsg({ t: "err", x: (e as Error).message });
    }
  }

  // Carga un archivo nuevo: lee texto, resetea ediciones y recalcula
  async function cargarArchivo(f: File | null) {
    setFile(f);
    setResumen(null); setMatriz(null); setTabla(null); setVenta(null); setEstac(null); setEdificios(null);
    const ed = edicionesVacias();
    setEdiciones(ed);
    if (!f) { setCsvText(null); return; }
    const csv = await f.text();
    setCsvText(csv);
    recalcular(csv, nSub, ed);
  }

  // Recalcula en vivo (debounce) cuando cambian ediciones o n_sub
  useEffect(() => {
    if (!csvText || estado !== "listo") return;
    const id = setTimeout(() => recalcular(csvText, nSub, ediciones), 200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ediciones, nSub, csvText, estado]);

  // Inicializa Pyodide + paquetes + motor (una sola vez)
  useEffect(() => {
    (async () => {
      try {
        setPaso("Descargando Pyodide…");
        const py = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
        });
        setPaso("Cargando pandas…");
        await py.loadPackage(["pandas", "micropip"]);
        setPaso("Instalando openpyxl…");
        const micropip = py.pyimport("micropip");
        await micropip.install("openpyxl");
        setPaso("Cargando motor de cabida…");
        const code = await (await fetch("/cabida_core.py")).text();
        py.runPython(code);
        pyRef.current = py;
        try {
          const pal = py.runPython("import json; json.dumps(paleta_canonica())");
          setPaleta(JSON.parse(pal));
        } catch { /* paleta opcional */ }
        setEstado("listo");
      } catch (e) {
        setEstado("error");
        setMsg({ t: "err", x: "No se pudo iniciar el motor: " + (e as Error).message });
      }
    })();
  }, []);

  async function generar() {
    if (!csvText) { setMsg({ t: "err", x: "Selecciona el CSV exportado de Forma." }); return; }
    const py = pyRef.current;
    setWorking(true); setMsg(null);
    try {
      py.globals.set("csv_text", csvText);
      py.globals.set("n_sub", nSub);
      py.globals.set("ed_json", JSON.stringify(ediciones));

      const b64: string = py.runPython(
        "import json; generar_cabida(csv_text, n_sub, json.loads(ed_json))"
      );
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Cabida.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ t: "ok", x: "Excel de cabida generado y descargado." });
    } catch (e) {
      setMsg({ t: "err", x: (e as Error).message });
    } finally {
      setWorking(false);
    }
  }

  const fmt = (n: number) => n.toLocaleString("es-CL");

  // Persistir la pestaña elegida.
  useEffect(() => { localStorage.setItem("mobil-vista", vista); }, [vista]);

  // Qué secciones tienen datos para mostrarse (las demás quedan deshabilitadas).
  const dispo: Record<Vista, boolean> = {
    resumen: true,
    cabida: !!matriz,
    edificios: !!edificios,
    venta: !!venta,
    elementos: !!tabla,
    estac: !!estac,
    paleta: !!paleta,
  };
  // Si la pestaña recordada aún no tiene datos, caemos a «Resumen».
  const vistaActiva: Vista = dispo[vista] ? vista : "resumen";

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark"><MobilMark size={20} /></span>
            <div className="brand-text">
              <h1>MOBIL · CABIDA</h1>
              <span className="brand-tag">Análisis de cabida · Autodesk Forma → Excel</span>
            </div>
          </div>
          <span className="topbar-meta">100% en tu navegador · el CSV no se sube</span>
        </div>
        <nav className="tabnav"><div className="tabnav-inner">
          {VISTAS.map((v) => (
            <button
              key={v.id}
              className={"tab" + (vistaActiva === v.id ? " on" : "")}
              onClick={() => setVista(v.id)}
              disabled={!dispo[v.id]}
              title={dispo[v.id] ? undefined : "Carga un CSV para ver esta sección"}
            >
              {v.label}
              {v.id === "elementos" && tabla && <span className="tab-badge">{tabla.filas.length}</span>}
            </button>
          ))}
        </div></nav>
      </header>

      <main className="shell">
        {vistaActiva === "resumen" && (
          <>
            <section className="panel panel-control">
              {estado !== "listo" && estado !== "error" && (
                <div className="boot"><span className="spin" /> {paso}</div>
              )}

              <div className="control-grid">
                <div className="field">
                  <label>Archivo CSV (export de Forma)</label>
                  <div
                    className={"dropzone" + (file ? " has" : "")}
                    role="button"
                    tabIndex={0}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); }
                    }}
                  >
                    <span className="dz-icon">{file ? <IconoArchivo /> : <IconoSubir />}</span>
                    <span className="dz-text">
                      <span className="dz-main">{file ? file.name : "Selecciona un archivo .csv"}</span>
                      <span className="dz-sub">{file ? "Click para reemplazar" : "Exportado desde Autodesk Forma"}</span>
                    </span>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv"
                    hidden
                    onChange={(e) => { cargarArchivo(e.target.files?.[0] ?? null); }}
                  />
                </div>

                <div className="field">
                  <label htmlFor="nsub">Subterráneos</label>
                  <input
                    id="nsub"
                    type="number"
                    min={0}
                    value={nSub}
                    onChange={(e) => setNSub(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                <div className="field field-cta">
                  <button className="btn-primary" onClick={generar} disabled={working || estado !== "listo"}>
                    {working ? "Generando…" : estado === "listo" ? "Generar cabida" : "Cargando motor…"}
                  </button>
                </div>
              </div>

              {msg && <div className={"msg " + msg.t} style={{ marginTop: 16 }}>{msg.x}</div>}
            </section>

            {resumen && (
              <section className="kpi-band">
                <div className="kpi"><span>{fmt(resumen.elementos)}</span>Elementos</div>
                <div className="kpi"><span>{fmt(resumen.construido)}</span>Construido m²</div>
                <div className="kpi"><span>{fmt(resumen.venta)}</span>Venta m²</div>
                <div className="kpi"><span>{(resumen.eficiencia * 100).toFixed(1)}%</span>Eficiencia</div>
              </section>
            )}
          </>
        )}

        {vistaActiva === "cabida" && matriz && (
          <div className="grid">
            <section className="panel col-12"><GraficoCabida matriz={matriz} /></section>
          </div>
        )}

        {vistaActiva === "edificios" && edificios && (
          <div className="grid">
            <section className="panel col-12"><CabidaEdificios edificios={edificios} /></section>
          </div>
        )}

        {vistaActiva === "venta" && venta && (
          <div className="grid">
            <section className="panel col-12"><GraficoVenta venta={venta} /></section>
          </div>
        )}

        {vistaActiva === "elementos" && tabla && (
          <div className="grid">
            <section className="panel col-12">
              <TablaElementos tabla={tabla} matriz={matriz} ediciones={ediciones} setEdiciones={setEdiciones} nSub={nSub} />
            </section>
          </div>
        )}

        {vistaActiva === "estac" && estac && (
          <div className="grid">
            <section className="panel col-12"><Estacionamientos estac={estac} /></section>
          </div>
        )}

        {vistaActiva === "paleta" && paleta && (
          <div className="grid">
            <section className="panel col-12 panel-paleta"><PaletaColores paleta={paleta} /></section>
          </div>
        )}
      </main>

      <footer className="foot">mobil-forma v1.8 · MobilDataLab · Pyodide</footer>
    </div>
  );
}
