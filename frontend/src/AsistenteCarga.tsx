import { useState } from "react";

// Info que entrega el motor (inspeccionar_csv) por cada edificio detectado.
export type EdificioDetectado = {
  id: string;
  nombre_default: string;
  pisos_raw: number[];
  n_pisos: number;
  n_elementos: number;
};
export type Inspeccion = {
  n_edificios: number;
  edificios: EdificioDetectado[];
};

// Resultado del asistente: nombre y subterráneos elegidos por edificio (id → valor).
export type ConfigEdificios = {
  nombres: Record<string, string>;
  subterraneos: Record<string, number>;
};

export default function AsistenteCarga({
  inspeccion,
  nombreArchivo,
  subInicial,
  onConfirmar,
  onCancelar,
}: {
  inspeccion: Inspeccion;
  nombreArchivo: string;
  subInicial?: Record<string, number>;
  onConfirmar: (cfg: ConfigEdificios) => void;
  onCancelar: () => void;
}) {
  const eds = inspeccion.edificios;
  const [nombres, setNombres] = useState<Record<string, string>>(
    () => Object.fromEntries(eds.map((e) => [e.id, e.nombre_default]))
  );
  const [sub, setSub] = useState<Record<string, number>>(
    () => Object.fromEntries(eds.map((e) => [e.id, subInicial?.[e.id] ?? 0]))
  );

  const confirmar = () =>
    onConfirmar({
      nombres,
      subterraneos: Object.fromEntries(
        Object.entries(sub).map(([k, v]) => [k, Math.max(0, Number(v) || 0)])
      ),
    });

  // Etiqueta de un nivel crudo dado el nº de subterráneos (igual que el motor).
  const etq = (nivel: number, ns: number) =>
    nivel < ns ? `ST-${ns - nivel}` : `N${nivel - ns + 1}`;

  return (
    <div className="asis-overlay" role="dialog" aria-modal="true" aria-label="Revisión de edificios">
      <div className="asis-modal">
        <div className="asis-head">
          <h2 className="titulo">Revisar carga · <span className="acento">edificios y subterráneos</span></h2>
          <span className="asis-file">{nombreArchivo}</span>
        </div>

        <p className="asis-intro">
          Identifiqué <b>{inspeccion.n_edificios}</b>{" "}
          {inspeccion.n_edificios === 1 ? "edificio" : "edificios"} en el archivo.
          Ponles nombre e indica cuántos <b>subterráneos</b> tiene cada uno (el nivel más bajo
          se convierte en ST-1). Los edificios sin subterráneo quedan tal cual.
        </p>

        <div className="asis-scroll">
          <table className="tbl asis-tbl">
            <thead>
              <tr>
                <th>Edificio (CSV)</th>
                <th>Nombre</th>
                <th className="num">Pisos</th>
                <th className="num">Elem.</th>
                <th className="num">Subterráneos</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {eds.map((e) => {
                const ns = Math.max(0, Number(sub[e.id]) || 0);
                const pisosOrden = [...e.pisos_raw].sort((a, b) => a - b);
                const resumen = pisosOrden.map((n) => etq(n, ns));
                return (
                  <tr key={e.id}>
                    <td className="asis-id" title={e.id}>{e.id}</td>
                    <td>
                      <input
                        type="text"
                        value={nombres[e.id] ?? ""}
                        onChange={(ev) => setNombres({ ...nombres, [e.id]: ev.target.value })}
                      />
                    </td>
                    <td className="num">{e.n_pisos}</td>
                    <td className="num">{e.n_elementos}</td>
                    <td className="num">
                      <input
                        type="number"
                        className="in-num"
                        min={0}
                        max={pisosOrden.length}
                        value={sub[e.id] ?? 0}
                        onChange={(ev) => setSub({ ...sub, [e.id]: Math.max(0, Number(ev.target.value)) })}
                      />
                    </td>
                    <td className="asis-res">
                      {resumen.map((r, i) => (
                        <span key={i} className={"asis-chip" + (r.startsWith("ST-") ? " sub" : "")}>{r}</span>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="asis-acc">
          <button className="btn-link" onClick={onCancelar}>Cancelar</button>
          <button className="btn-primary asis-ok" onClick={confirmar}>Confirmar y calcular</button>
        </div>
      </div>
    </div>
  );
}
