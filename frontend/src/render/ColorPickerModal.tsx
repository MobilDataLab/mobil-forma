import { useEffect, useRef, useState } from "react";
import type { ColorCanonico } from "../PaletaColores";
import type { UsoDetectado } from "./tipos";
import { defaultMaterialKey } from "./materialidad.generated";

// Convierte [r,g,b] a "#rrggbb".
function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

// Modal de color picker: abre la imagen cargada, el usuario hace click sobre un
// color y lo asigna a una función del motor O a un uso libre (nombre + materialidad).
export default function ColorPickerModal({
  imagenUrl,
  paleta,
  onAgregar,
  onCerrar,
}: {
  imagenUrl: string;
  paleta: ColorCanonico[];
  onAgregar: (uso: UsoDetectado) => void;
  onCerrar: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [hex, setHex] = useState<string>("");          // color pickeado
  const [modo, setModo] = useState<"funcion" | "libre">("funcion");
  const [funcion, setFuncion] = useState<string>(paleta[0]?.funcion ?? "");
  const [nombreLibre, setNombreLibre] = useState<string>("");
  const [materialLibre, setMaterialLibre] = useState<string>("");

  // Dibuja la imagen en el canvas (a tamaño natural, contenida por CSS).
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx?.drawImage(img, 0, 0);
    };
    img.src = imagenUrl;
  }, [imagenUrl]);

  // Cerrar con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);

  // Click sobre la imagen → lee el píxel exacto (mapeando coords CSS → canvas).
  const pickear = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const d = ctx?.getImageData(x, y, 1, 1).data;
    if (d) setHex(rgbToHex(d[0], d[1], d[2]));
  };

  const puedeAgregar =
    !!hex && (modo === "funcion" ? !!funcion : !!nombreLibre.trim());

  const agregar = () => {
    if (!puedeAgregar) return;
    if (modo === "funcion") {
      onAgregar({
        funcion, hex, pct: 0, confirmado: true,
        materialidad: defaultMaterialKey(funcion), origen: "manual",
      });
    } else {
      onAgregar({
        funcion: nombreLibre.trim(), hex, pct: 0, confirmado: true,
        materialidad: materialLibre.trim() || "materialidad a definir",
        origen: "manual", libre: true,
      });
    }
    onCerrar();
  };

  return (
    <div className="rnd-modal-backdrop" onClick={onCerrar}>
      <div className="rnd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rnd-modal-head">
          <span className="rnd-cap-tit">Pickear color de la imagen</span>
          <button className="nrm-x" title="Cerrar" onClick={onCerrar}>×</button>
        </div>

        <div className="rnd-pick-body">
          <div className="rnd-pick-canvas-wrap">
            <canvas ref={canvasRef} className="rnd-pick-canvas" onClick={pickear} />
            <span className="rnd-pick-hint">Haz click sobre un color del modelo</span>
          </div>

          <div className="rnd-pick-form">
            <div className="rnd-pick-color">
              <span className="rnd-sw rnd-sw-lg" style={{ background: hex || "transparent" }} />
              <span className="rnd-pick-hex">{hex || "— sin color —"}</span>
            </div>

            <div className="rnd-pick-modo">
              <button
                type="button"
                className={"btn-link" + (modo === "funcion" ? " rnd-modo-on" : "")}
                onClick={() => setModo("funcion")}
              >Función del motor</button>
              <button
                type="button"
                className={"btn-link" + (modo === "libre" ? " rnd-modo-on" : "")}
                onClick={() => setModo("libre")}
              >Uso libre</button>
            </div>

            {modo === "funcion" ? (
              <div className="field rnd-field">
                <label>Función (paleta del motor)</label>
                <select value={funcion} onChange={(e) => setFuncion(e.target.value)}>
                  {paleta.map((p) => <option key={p.funcion} value={p.funcion}>{p.funcion}</option>)}
                </select>
              </div>
            ) : (
              <>
                <div className="field rnd-field">
                  <label>Nombre del uso</label>
                  <input type="text" placeholder="ej. Equipamiento, Hotel…"
                    value={nombreLibre} onChange={(e) => setNombreLibre(e.target.value)} />
                </div>
                <div className="field rnd-field">
                  <label>Materialidad (texto libre)</label>
                  <input type="text" placeholder="ej. madera laminada CLT vista…"
                    value={materialLibre} onChange={(e) => setMaterialLibre(e.target.value)} />
                </div>
              </>
            )}

            <button className="btn-export" onClick={agregar} disabled={!puedeAgregar}>
              Asignar uso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
