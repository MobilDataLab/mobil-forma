import { useEffect, useRef, useState } from "react";

type Estado = "cargando" | "listo" | "error";
type Resumen = { elementos: number; venta: number; construido: number; eficiencia: number };

export default function App() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [paso, setPaso] = useState("Iniciando Python en el navegador…");
  const [file, setFile] = useState<File | null>(null);
  const [nSub, setNSub] = useState(1);
  const [working, setWorking] = useState(false);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [msg, setMsg] = useState<{ t: "err" | "ok"; x: string } | null>(null);
  const pyRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Inicializa Pyodide + paquetes + motor (una sola vez)
  useEffect(() => {
    (async () => {
      try {
        setPaso("Descargando Pyodide…");
        const py = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
        });
        setPaso("Cargando pandas y openpyxl…");
        await py.loadPackage(["pandas", "openpyxl"]);
        setPaso("Cargando motor de cabida…");
        const code = await (await fetch("/cabida_core.py")).text();
        py.runPython(code);
        pyRef.current = py;
        setEstado("listo");
      } catch (e) {
        setEstado("error");
        setMsg({ t: "err", x: "No se pudo iniciar el motor: " + (e as Error).message });
      }
    })();
  }, []);

  async function generar() {
    if (!file) { setMsg({ t: "err", x: "Selecciona el CSV exportado de Forma." }); return; }
    const py = pyRef.current;
    setWorking(true); setMsg(null); setResumen(null);
    try {
      const csv = await file.text();
      py.globals.set("csv_text", csv);
      py.globals.set("n_sub", nSub);

      const res = py.runPython("import json; json.dumps(resumen_cabida(csv_text, n_sub))");
      setResumen(JSON.parse(res));

      const b64: string = py.runPython("generar_cabida(csv_text, n_sub)");
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
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResumen(null); }}
        />

        <div className="field">
          <label>Número de subdivisiones (subterráneos)</label>
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

      <p className="foot">mobil-forma v1.8 · MobilDataLab · Pyodide</p>
    </div>
  );
}
