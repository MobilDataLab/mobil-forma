import { useMemo, useState } from "react";
import { PROMPT_PLANTA, contratoPlantaJSON } from "./promptPlanta";
import { IconoDescarga } from "../iconos";

// Pestaña Plantas: genera el prompt + contrato JSON para redibujar la planta de Forma
// en un LLM con visión (ChatGPT, Gemini, Claude). El usuario pega su PNG + este prompt
// en el modelo; la app no procesa la imagen (nada se sube desde aquí).
export default function PanelPlantas() {
  const [copiado, setCopiado] = useState<"prompt" | "json" | "">("");
  const jsonText = useMemo(() => contratoPlantaJSON(), []);

  const copiar = (cual: "prompt" | "json", texto: string) => {
    navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(cual);
      setTimeout(() => setCopiado(""), 1500);
    });
  };

  return (
    <div className="plantas">
      <div className="tabla-head">
        <div className="grafico-titulo">Planta <span className="acento">diagramática</span></div>
        <span className="topbar-meta">Prompt + JSON para redibujar tu planta en un LLM</span>
      </div>

      <div className="pl-bloque pl-camino-b">
        <p className="pl-hint">
          Copia el <b>prompt</b> y el <b>contrato JSON</b> y pégalos en un LLM con visión (ChatGPT,
          Gemini, Claude) junto al <b>PNG</b> de la planta de Forma. El modelo redibuja la planta
          diagramática flat en la paleta Mobil, con función + m² por unidad: lee la forma, el color
          y los m² de tu imagen; el estilo lo define el contrato. Nada se sube desde la app.
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
