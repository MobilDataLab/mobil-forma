import { useState } from "react";
import type { Matriz } from "../GraficoCabida";
import type { Venta } from "../GraficoVenta";
import type { Edificios } from "../CabidaEdificios";
import type { Normas } from "../NormasUrbanisticas";
import { construirInforme, type ImagenesInforme, type ResumenCabida } from "./Informe";
import { generarInformePptx } from "./generarInformePptx";
import { IconoDescarga, IconoSubir, IconoArchivo } from "../iconos";

// Insumos de cabida que vienen del estado de App (ya calculados por el motor).
type Props = {
  resumen: ResumenCabida | null;
  venta: Venta | null;
  matriz: Matriz | null;
  edificios: Edificios | null;
  normas: Normas | null;
};

// Lee ubicación + clima que el módulo Render dejó en localStorage (puente sin acoplar).
function leerUbicacionRender(): { etiqueta: string; clima: string } {
  try {
    const d = JSON.parse(localStorage.getItem("mobil-render-ubicacion") || "{}");
    return { etiqueta: d.etiqueta || "", clima: d.clima || "" };
  } catch {
    return { etiqueta: "", clima: "" };
  }
}

// Claves de imagen del anexo + su etiqueta visible.
const SLOTS: { key: keyof ImagenesInforme; label: string; hint: string }[] = [
  { key: "portada", label: "Portada / hero", hint: "imagen grande de la portada" },
  { key: "render", label: "Render principal", hint: "anexo gráfico" },
  { key: "emplazamiento", label: "Emplazamiento", hint: "ficha + anexo" },
  { key: "planta", label: "Planta tipo", hint: "anexo gráfico" },
  { key: "peatonal", label: "Vista peatonal", hint: "anexo gráfico" },
];

// Lee un File de imagen como dataURL (base64) para incrustarlo en el PPTX.
function leerDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("No se pudo leer la imagen."));
    fr.readAsDataURL(file);
  });
}

export default function PanelInforme({ resumen, venta, matriz, edificios, normas }: Props) {
  const [nombre, setNombre] = useState("");
  const [imagenes, setImagenes] = useState<ImagenesInforme>({});
  const [generando, setGenerando] = useState(false);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; x: string } | null>(null);

  const hayCabida = !!resumen;

  const adjuntar = async (key: keyof ImagenesInforme, file: File | null) => {
    if (!file) return;
    try {
      const data = await leerDataURL(file);
      setImagenes((prev) => ({ ...prev, [key]: data }));
      setMsg(null);
    } catch (e) {
      setMsg({ t: "err", x: (e as Error).message });
    }
  };

  const quitar = (key: keyof ImagenesInforme) =>
    setImagenes((prev) => { const n = { ...prev }; delete n[key]; return n; });

  const descargar = async () => {
    if (!resumen) { setMsg({ t: "err", x: "Carga un CSV de Forma para generar el informe." }); return; }
    setGenerando(true); setMsg(null);
    try {
      const ubic = leerUbicacionRender();
      const informe = construirInforme({
        nombre,
        ubicacion: ubic.etiqueta,
        clima: ubic.clima,
        resumen, venta, matriz, edificios, normas,
        imagenes,
      });
      await generarInformePptx(informe);
      setMsg({ t: "ok", x: "Informe descargado (PPTX)." });
    } catch (e) {
      setMsg({ t: "err", x: "No se pudo generar el informe: " + (e as Error).message });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="informe">
      <div className="tabla-head">
        <div className="grafico-titulo">Informe de <span className="acento">cabida</span></div>
        <span className="topbar-meta">Descarga un PPTX editable · 100% en tu navegador</span>
      </div>

      {!hayCabida && (
        <div className="msg" style={{ marginTop: 16 }}>
          Carga un CSV de Forma (pestaña Resumen) para poblar el informe con tus datos de cabida.
        </div>
      )}

      {/* Nombre del proyecto (obligatorio para descargar) */}
      <div className="inf-bloque">
        <span className="rnd-cap-tit">Nombre del proyecto <span className="inf-req">· obligatorio</span></span>
        <input
          type="text"
          className={"inf-nombre" + (hayCabida && !nombre.trim() ? " inf-nombre-falta" : "")}
          placeholder="Ej. Conjunto Habitacional Batuco"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      {/* Adjuntar imágenes (cada una opcional → su lámina) */}
      <div className="inf-bloque">
        <span className="rnd-cap-tit">Imágenes del informe (opcionales)</span>
        <p className="inf-hint">Las que adjuntes se incrustan como láminas. Si falta una, esa lámina se omite.</p>
        <div className="inf-slots">
          {SLOTS.map((slot) => {
            const data = imagenes[slot.key];
            return (
              <div className="inf-slot" key={slot.key}>
                <label className={"inf-drop" + (data ? " has" : "")}>
                  <input type="file" accept="image/png,image/jpeg" hidden
                    onChange={(e) => adjuntar(slot.key, e.target.files?.[0] ?? null)} />
                  {data
                    ? <img className="inf-thumb" src={data} alt={slot.label} />
                    : <span className="inf-drop-ico"><IconoSubir /></span>}
                  <span className="inf-slot-label">{slot.label}</span>
                  <span className="inf-slot-hint">{data ? "Click para reemplazar" : slot.hint}</span>
                </label>
                {data && (
                  <button className="nrm-x inf-slot-x" title="Quitar imagen" onClick={() => quitar(slot.key)}>×</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Descargar */}
      <div className="inf-acciones">
        <button className="btn-export inf-descargar" onClick={descargar} disabled={!hayCabida || generando || !nombre.trim()}>
          {generando ? <IconoArchivo /> : <IconoDescarga />}
          {generando ? "Generando…" : "Descargar informe (PPTX)"}
        </button>
        {/* Pista de por qué el botón está deshabilitado (evita que parezca roto). */}
        {hayCabida && !generando && !nombre.trim() && (
          <span className="inf-msg inf-hint-req">Escribe un nombre del proyecto para descargar.</span>
        )}
        {msg && <span className={"inf-msg " + msg.t}>{msg.x}</span>}
      </div>
    </div>
  );
}
