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

type Estado = "cargando" | "listo" | "error";
type Resumen = { elementos: number; venta: number; construido: number; eficiencia: number };

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
  const [tabla, setTabla] = useState<Tabla | null>(null);
  const [paleta, setPaleta] = useState<ColorCanonico[] | null>(null);
  const [ediciones, setEdiciones] = useState<Ediciones>(edicionesVacias());
  const [msg, setMsg] = useState<{ t: "err" | "ok"; x: string } | null>(null);
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
})`);
      const { tabla, resumen, matriz, venta, estac } = JSON.parse(out);
      setTabla(tabla);
      setResumen(resumen);
      setMatriz(matriz);
      setVenta(venta);
      setEstac(estac);
      setMsg(null);
    } catch (e) {
      setMsg({ t: "err", x: (e as Error).message });
    }
  }

  // Carga un archivo nuevo: lee texto, resetea ediciones y recalcula
  async function cargarArchivo(f: File | null) {
    setFile(f);
    setResumen(null); setMatriz(null); setTabla(null); setVenta(null); setEstac(null);
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

  return (
    <div className="wrap">
      <div className="brand">
        <span className="dot" />
        <h1>MOBIL · CABIDA</h1>
      </div>
      <p className="sub">Análisis de cabida desde Autodesk Forma → Excel formateado. Todo corre en tu navegador; el CSV no se sube a ningún servidor.</p>

      <div className="card">
        {estado !== "listo" && estado !== "error" && (
          <div className="boot"><span className="spin" /> {paso}</div>
        )}

        <label>Archivo CSV (export de Forma)</label>
        <div
          className={"drop" + (file ? " has" : "")}
          onClick={() => inputRef.current?.click()}
        >
          {file ? file.name : "Click para seleccionar un .csv"}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          hidden
          onChange={(e) => { cargarArchivo(e.target.files?.[0] ?? null); }}
        />

        <div className="field">
          <label>Subterráneo</label>
          <input
            type="number"
            min={1}
            value={nSub}
            onChange={(e) => setNSub(Math.max(1, Number(e.target.value)))}
          />
        </div>

        <button onClick={generar} disabled={working || estado !== "listo"}>
          {working ? "Generando…" : estado === "listo" ? "Generar cabida" : "Cargando motor…"}
        </button>

        {resumen && (
          <div className="kpis">
            <div className="kpi"><span>{fmt(resumen.elementos)}</span>Elementos</div>
            <div className="kpi"><span>{fmt(resumen.construido)}</span>Construido m²</div>
            <div className="kpi"><span>{fmt(resumen.venta)}</span>Venta m²</div>
            <div className="kpi"><span>{(resumen.eficiencia * 100).toFixed(1)}%</span>Eficiencia</div>
          </div>
        )}

        {msg && <div className={"msg " + msg.t}>{msg.x}</div>}
      </div>

      {tabla && (
        <div className="card">
          <TablaElementos tabla={tabla} matriz={matriz} ediciones={ediciones} setEdiciones={setEdiciones} nSub={nSub} />
        </div>
      )}

      {matriz && (
        <div className="card">
          <GraficoCabida matriz={matriz} />
        </div>
      )}

      {venta && (
        <div className="card">
          <GraficoVenta venta={venta} />
        </div>
      )}

      {estac && (
        <div className="card">
          <Estacionamientos estac={estac} />
        </div>
      )}

      {paleta && (
        <div className="card">
          <PaletaColores paleta={paleta} />
        </div>
      )}

      <p className="foot">mobil-forma v1.8 · MobilDataLab · Pyodide</p>
    </div>
  );
}
