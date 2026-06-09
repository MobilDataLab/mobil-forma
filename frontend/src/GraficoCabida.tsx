import { rankPiso } from "./pisos";

type Fila = { etiqueta: string; es_sub: boolean; [fn: string]: number | string | boolean };
export type Matriz = {
  etiquetas: string[];
  funciones: string[];
  colores: Record<string, string>;
  datos: Fila[];
};

const fmt = (n: number) => Math.round(n).toLocaleString("es-CL");

export default function GraficoCabida({ matriz }: { matriz: Matriz }) {
  const { funciones, colores, datos } = matriz;

  // Orden vertical (arriba → abajo): N alto … N1, ST-1 … ST alto.
  const filas = [...datos].sort(
    (a, b) => rankPiso(b.etiqueta as string) - rankPiso(a.etiqueta as string)
  );

  // Máximo total por piso → escala del eje X
  const totalFila = (f: Fila) =>
    funciones.reduce((s, fn) => s + (Number(f[fn]) || 0), 0);
  const maxTotal = Math.max(1, ...filas.map(totalFila));

  // Geometría
  const rowH = 24;
  const gap = 4;
  const labelW = 56;
  const plotW = 620;
  const padTop = 8;
  const padBottom = 28;
  const height = padTop + filas.length * (rowH + gap) + padBottom;
  const width = labelW + plotW + 12;
  const x = (v: number) => (v / maxTotal) * plotW;

  // Marcas del eje X (~5 ticks redondos)
  const step = niceStep(maxTotal / 5);
  const ticks: number[] = [];
  for (let t = 0; t <= maxTotal; t += step) ticks.push(t);

  return (
    <div className="grafico">
      <div className="grafico-titulo">Cabida por piso · m² construidos por función</div>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img">
        {/* grilla + ticks eje X */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={labelW + x(t)} x2={labelW + x(t)}
              y1={padTop} y2={height - padBottom}
              stroke="#e5edf6" strokeWidth={1}
            />
            <text
              x={labelW + x(t)} y={height - padBottom + 16}
              textAnchor="middle" fontSize={9} fill="#7a8aa0"
            >
              {fmt(t)}
            </text>
          </g>
        ))}

        {filas.map((f, i) => {
          const y = padTop + i * (rowH + gap);
          let acc = 0;
          return (
            <g key={f.etiqueta as string}>
              {/* etiqueta del piso */}
              <text
                x={labelW - 8} y={y + rowH / 2}
                textAnchor="end" dominantBaseline="central"
                fontSize={10} fontWeight={f.es_sub ? 700 : 500}
                fill={f.es_sub ? "#1F3864" : "#33415c"}
              >
                {f.etiqueta as string}
              </text>

              {/* segmentos apilados */}
              {funciones.map((fn) => {
                const v = Number(f[fn]) || 0;
                if (v <= 0) return null;
                const segX = labelW + x(acc);
                const segW = x(v);
                acc += v;
                return (
                  <rect
                    key={fn}
                    x={segX} y={y} width={Math.max(segW, 0.5)} height={rowH}
                    fill={colores[fn]} stroke="#fff" strokeWidth={0.5}
                  >
                    <title>{`${f.etiqueta} · ${fn}: ${fmt(v)} m²`}</title>
                  </rect>
                );
              })}

              {/* total al final de la barra */}
              {totalFila(f) > 0 && (
                <text
                  x={labelW + x(totalFila(f)) + 6} y={y + rowH / 2}
                  dominantBaseline="central" fontSize={9} fill="#5a6b85"
                >
                  {fmt(totalFila(f))}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* leyenda */}
      <div className="leyenda">
        {funciones.map((fn) => (
          <span key={fn} className="leyenda-item">
            <span className="leyenda-color" style={{ background: colores[fn] }} />
            {fn}
          </span>
        ))}
      </div>
    </div>
  );
}

function niceStep(raw: number) {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const m = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
  return m * pow;
}
