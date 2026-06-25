import type { InspeccionImagen } from "./tipos";
import { materialidadDe } from "./materialidad";

// Presentacional: lista los usos detectados (con checkbox de confirmación) y la escena.
export default function TablaColores({
  inspeccion,
  onToggle,
}: {
  inspeccion: InspeccionImagen;
  onToggle: (funcion: string, confirmado: boolean) => void;
}) {
  return (
    <div className="rnd-colores">
      <table className="tbl rnd-tbl">
        <thead>
          <tr>
            <th className="rnd-chk-h"></th>
            <th></th>
            <th>Uso detectado</th>
            <th className="num">% área</th>
            <th>Materialidad asignada</th>
          </tr>
        </thead>
        <tbody>
          {inspeccion.usos.length === 0 && (
            <tr><td colSpan={5} className="tbl-vacio">No se detectaron usos de la paleta en la imagen.</td></tr>
          )}
          {inspeccion.usos.map((u) => (
            <tr key={u.funcion} className={u.confirmado ? "" : "rnd-off"}>
              <td className="rnd-chk">
                <input
                  type="checkbox"
                  checked={u.confirmado}
                  onChange={(e) => onToggle(u.funcion, e.target.checked)}
                />
              </td>
              <td><span className="rnd-sw" style={{ background: u.hex }} /></td>
              <td className="rnd-fn">{u.funcion}</td>
              <td className="num">{u.pct}%</td>
              <td className="rnd-mat">{materialidadDe(u.funcion)}</td>
            </tr>
          ))}
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
