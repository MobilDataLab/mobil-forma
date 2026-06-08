import { useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [nSub, setNSub] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ t: "err" | "ok"; x: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function generar() {
    if (!file) { setMsg({ t: "err", x: "Selecciona el CSV exportado de Forma." }); return; }
    setLoading(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("n_sub", String(nSub));
      const res = await fetch(`${API}/cabida`, { method: "POST", body: fd });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? `Error ${res.status}`);
      }
      const blob = await res.blob();
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
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="brand">
        <span className="dot" />
        <h1>MOBIL · CABIDA</h1>
      </div>
      <p className="sub">Análisis de cabida desde Autodesk Forma → Excel formateado.</p>

      <div className="card">
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
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <div className="field">
          <label>Número de subdivisiones</label>
          <input
            type="number"
            min={1}
            value={nSub}
            onChange={(e) => setNSub(Math.max(1, Number(e.target.value)))}
          />
        </div>

        <button onClick={generar} disabled={loading}>
          {loading ? "Generando…" : "Generar cabida"}
        </button>

        {msg && <div className={"msg " + msg.t}>{msg.x}</div>}
      </div>

      <p className="foot">mobil-forma v1.8 · MobilDataLab</p>
    </div>
  );
}
