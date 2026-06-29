import { useState } from "react";
import type { CondicionesToma } from "./tipos";
import { generarExtractor, aplicarReferencia } from "./referencia";
import { IconoDescarga } from "../iconos";

// Bloque "Capturar referencia": copia un prompt extractor (para pegar en Gemini junto a
// una foto de referencia), recibe el JSON de vuelta y aplica sus parámetros a la toma en
// modo texto libre (Personalizado…). No sube ninguna imagen.
export default function PanelReferencia({
  onAplicar,
}: {
  onAplicar: (patch: Partial<CondicionesToma>) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pegado, setPegado] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  const copiarExtractor = () => {
    navigator.clipboard?.writeText(generarExtractor()).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });
  };

  const aplicar = () => {
    const r = aplicarReferencia(pegado);
    if (!r.ok) {
      setMsg({ tipo: "err", texto: r.error });
      return;
    }
    onAplicar(r.patch);
    setMsg({ tipo: "ok", texto: `Referencia aplicada · ${r.campos.length} ejes en Personalizado.` });
  };

  return (
    <div className="rnd-cond-cap rnd-ref">
      <button
        type="button"
        className="rnd-ref-toggle"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
      >
        <span className="rnd-cap-tit">Capturar referencia (foto → parámetros)</span>
        <span className="rnd-ref-chevron">{abierto ? "▾" : "▸"}</span>
      </button>

      {abierto && (
        <div className="rnd-ref-body">
          <ol className="rnd-ref-steps">
            <li>
              <div className="rnd-ref-step-head">
                <span>Copia el extractor y pégalo en tu modelo con visión (ChatGPT, Gemini, Claude…) junto a tu foto de referencia.</span>
                <button className="btn-export" onClick={copiarExtractor}>
                  <IconoDescarga /> {copiado ? "¡Copiado!" : "Copiar extractor"}
                </button>
              </div>
            </li>
            <li>El modelo devuelve un JSON con los parámetros de la foto.</li>
            <li>
              <span>Pega ese JSON aquí y aplícalo:</span>
              <textarea
                className="rnd-ref-textarea"
                placeholder='{ "register": "...", "light": "...", ... }'
                value={pegado}
                onChange={(e) => { setPegado(e.target.value); setMsg(null); }}
                rows={5}
              />
              <div className="rnd-ref-actions">
                <button className="btn-export" onClick={aplicar} disabled={!pegado.trim()}>
                  Aplicar referencia
                </button>
                {msg && <span className={"rnd-ref-msg " + msg.tipo}>{msg.texto}</span>}
              </div>
            </li>
          </ol>
          <p className="rnd-ref-nota">
            La foto NO se sube desde la app: tú la pasas a tu modelo. Los valores entran en modo
            “Personalizado…”, así que puedes ajustarlos a mano después.
          </p>
        </div>
      )}
    </div>
  );
}
