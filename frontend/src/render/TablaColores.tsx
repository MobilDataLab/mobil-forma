import { useState } from "react";
import type { InspeccionImagen } from "./tipos";
import { materialKeysDe } from "./materialidad.generated";

// Sentinela del dropdown: "Personalizado…" → habilita texto libre de materialidad.
const PERSONALIZADO = "__custom__";

// Presentacional: usos detectados/agregados con checkbox de confirmación,
// materialidad por fila (dropdown + texto libre), atributos expandibles y picker.
export default function TablaColores({
  inspeccion,
  onToggle,
  onMaterialidad,
  onAtributo,
  onQuitar,
  onAbrirPicker,
}: {
  inspeccion: InspeccionImagen;
  onToggle: (funcion: string, confirmado: boolean) => void;
  onMaterialidad: (funcion: string, materialidad: string) => void;
  onAtributo: (funcion: string, campo: "altura" | "distribucion" | "rol", v: string) => void;
  onQuitar: (funcion: string) => void;
  onAbrirPicker?: () => void;
}) {
  // Filas expandidas (muestran altura / distribución / rol).
  const [abierta, setAbierta] = useState<string | null>(null);
  return (
    <div className="rnd-colores">
      <div className="rnd-colores-head">
        <span className="rnd-cap-tit">Usos del proyecto</span>
        <button
          className="btn-export"
          onClick={onAbrirPicker}
          disabled={!onAbrirPicker}
          title="Abrir la imagen y pickear un color para asignarle un uso"
        >
          + Pickear color de la imagen
        </button>
      </div>

      <table className="tbl rnd-tbl">
        <thead>
          <tr>
            <th className="rnd-chk-h"></th>
            <th></th>
            <th>Uso</th>
            <th className="num">% área</th>
            <th>Materialidad asignada</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {inspeccion.usos.length === 0 && (
            <tr><td colSpan={6} className="tbl-vacio">No hay usos. Pickea un color de la imagen para agregar uno.</td></tr>
          )}
          {inspeccion.usos.map((u) => {
            const opciones = u.libre ? [] : materialKeysDe(u.funcion);
            // ¿La materialidad actual (option_key) está fuera del banco? → modo personalizado.
            const esCustom = u.libre || !opciones.some((o) => o.key === u.materialidad);
            return (
              <tr key={u.funcion} className={u.confirmado ? "" : "rnd-off"}>
                <td className="rnd-chk">
                  <input
                    type="checkbox"
                    checked={u.confirmado}
                    onChange={(e) => onToggle(u.funcion, e.target.checked)}
                  />
                </td>
                <td><span className="rnd-sw" style={{ background: u.hex }} /></td>
                <td className="rnd-fn">
                  {u.funcion}
                  {u.origen === "manual" && <span className="rnd-tag-man">manual</span>}
                </td>
                <td className="num">{u.pct > 0 ? `${u.pct}%` : "—"}</td>
                <td className="rnd-mat-cell">
                  <div className="rnd-mat-stack">
                    <select
                      className="rnd-mat-sel"
                      value={esCustom ? PERSONALIZADO : u.materialidad}
                      disabled={!u.confirmado}
                      onChange={(e) => {
                        const v = e.target.value;
                        // Al elegir "Personalizado…", arranca con el texto actual (o vacío).
                        onMaterialidad(u.funcion, v === PERSONALIZADO ? (esCustom ? u.materialidad : "") : v);
                      }}
                    >
                      {opciones.map((m) => <option key={m.key} value={m.key}>{m.labelEs}</option>)}
                      <option value={PERSONALIZADO}>✏️ Personalizado…</option>
                    </select>
                    {esCustom && (
                      <input
                        type="text"
                        className="rnd-mat-libre"
                        placeholder="Materialidad a mano (ej. madera laminada CLT vista)"
                        value={u.materialidad}
                        disabled={!u.confirmado}
                        onChange={(e) => onMaterialidad(u.funcion, e.target.value)}
                      />
                    )}
                  </div>
                </td>
                <td className="rnd-quitar-cell">
                  <button
                    className="rnd-mas"
                    title="Atributos del elemento (altura, distribución, rol)"
                    onClick={() => setAbierta(abierta === u.funcion ? null : u.funcion)}
                  >⋯</button>
                  {u.origen === "manual" && (
                    <button className="nrm-x" title="Quitar uso" onClick={() => onQuitar(u.funcion)}>×</button>
                  )}
                </td>
              </tr>
            );
          })}
          {/* Sub-filas: atributos estructurados del elemento expandido. */}
          {inspeccion.usos.map((u) =>
            abierta === u.funcion ? (
              <tr key={u.funcion + "-attr"} className="rnd-attr-row">
                <td colSpan={6}>
                  <div className="rnd-attr-grid">
                    <label>
                      Altura
                      <input type="text" placeholder="ej. 4–6 pisos"
                        value={u.altura ?? ""}
                        onChange={(e) => onAtributo(u.funcion, "altura", e.target.value)} />
                    </label>
                    <label>
                      Distribución
                      <input type="text" placeholder="ej. bloques en torno a áreas verdes"
                        value={u.distribucion ?? ""}
                        onChange={(e) => onAtributo(u.funcion, "distribucion", e.target.value)} />
                    </label>
                    <label>
                      Rol urbano
                      <input type="text" placeholder="ej. equipamiento de baja altura"
                        value={u.rol ?? ""}
                        onChange={(e) => onAtributo(u.funcion, "rol", e.target.value)} />
                    </label>
                  </div>
                </td>
              </tr>
            ) : null
          )}
        </tbody>
      </table>

      {inspeccion.escena.length > 0 && (
        <div className="rnd-escena">
          <span className="rnd-escena-tit">Escena (no son usos)</span>
          {inspeccion.escena.map((e) => (
            <span key={e.etiqueta} className="rnd-escena-chip">{e.etiqueta} · {e.pct}%</span>
          ))}
        </div>
      )}
    </div>
  );
}
