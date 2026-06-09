import { useState } from "react";
import { exportarCsv } from "./exportar";
import { IconoDescarga } from "./iconos";

export type ColorCanonico = {
  funcion: string;
  hex: string;
  rgb: [number, number, number];
  rgb_str: string;
};

export default function PaletaColores({ paleta }: { paleta: ColorCanonico[] }) {
  const [copiado, setCopiado] = useState<string | null>(null);

  const copiar = (texto: string, clave: string) => {
    navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(clave);
      setTimeout(() => setCopiado((c) => (c === clave ? null : c)), 1200);
    });
  };

  // Texto para "copiar todo" (Función<TAB>rgb por línea, pegable en Excel/Sheets)
  const copiarTodo = () =>
    copiar(paleta.map((p) => `${p.funcion}\t${p.rgb_str}`).join("\n"), "__all__");

  const exportarTabla = () =>
    exportarCsv(
      "paleta-canonica",
      ["Función canónica", "HEX", "RGB"],
      paleta.map((p) => [p.funcion, p.hex, p.rgb_str])
    );

  return (
    <div className="paleta">
      <div className="tabla-head">
        <div className="grafico-titulo">Paleta de <span className="acento">funciones canónicas</span></div>
        <div className="tabla-tools">
          <button className="btn-link" onClick={copiarTodo}>
            {copiado === "__all__" ? "¡Copiado!" : "Copiar tabla"}
          </button>
          <button className="btn-export" onClick={exportarTabla} title="Descargar la paleta como CSV">
            <IconoDescarga /> CSV
          </button>
        </div>
      </div>

      <table className="tbl tbl-paleta">
        <thead>
          <tr>
            <th>Función canónica</th>
            <th className="col-muestra">Color</th>
            <th>RGB</th>
          </tr>
        </thead>
        <tbody>
          {paleta.map((p) => (
            <tr key={p.funcion}>
              <td className="col-fn">{p.funcion}</td>
              <td className="col-muestra">
                <span className="swatch" style={{ background: p.hex }} />
              </td>
              <td>
                <button
                  className="rgb-copia"
                  title="Copiar RGB"
                  onClick={() => copiar(p.rgb_str, p.funcion)}
                >
                  <code>{p.rgb_str}</code>
                  <span className="rgb-hint">{copiado === p.funcion ? "✓" : "⧉"}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
