import { useRef } from "react";
import { rankPiso } from "./pisos";
import { exportarSvgPng } from "./exportar";
import { IconoDescarga } from "./iconos";

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
  const svgRef = useRef<SVGSVGElement>(null);

  // Orden vertical (arriba → abajo): N alto … N1, ST-1 … ST alto.
  const filas = [...datos].sort(
    (a, b) => rankPiso(b.etiqueta as string) - rankPiso(a.etiqueta as string)
  );

  // Máximo total por piso → escala del eje X
  const totalFila = (f: Fila) =>
    funciones.reduce((s, fn) => s + (Number(f[fn]) || 0), 0);
  const maxTotal = Math.max(1, ...filas.map(totalFila));

  // Geometría
  const rowH = 26;
  const gap = 7;
  const labelW = 58;
  const plotW = 620;
  const padTop = 10;
  const padBottom = 30;
  const height = padTop + filas.length * (rowH + gap) + padBottom;
  const width = labelW + plotW + 54;
  const x = (v: number) => (v / maxTotal) * plotW;

  // Marcas del eje X (~5 ticks redondos)
  const step = niceStep(maxTotal / 5);
  const ticks: number[] = [];
  for (let t = 0; t <= maxTotal; t += step) ticks.push(t);

  return (
    <div className="grafico">
      <div className="panel-head">
        <h2 className="titulo">Cabida por piso · <span className="acento">m² construidos por función</span></h2>
        <div className="tools">
          <button
            className="btn-export"
            onClick={() => exportarSvgPng(svgRef.current, "cabida-por-piso")}
            title="Descargar gráfico como PNG"
          >
            <IconoDescarga /> PNG
          </button>
        </div>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} width="100%" role="img"
        aria-label="Gráfico de barras apiladas: m² construidos por función en cada piso"
        style={{ fontFamily: 'var(--ff)' }}>
        {/* grilla + ticks eje X */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={labelW + x(t)} x2={labelW + x(t)}
              y1={padTop} y2={height - padBottom}
              stroke="#EAF0F7" strokeWidth={1}
            />
            <text
              x={labelW + x(t)} y={height - padBottom + 17}
              textAnchor="middle" fontSize={9.5} fill="#8A97AB"
            >
              {fmt(t)}
            </text>
          </g>
        ))}
        {/* eje base */}
        <line x1={labelW} x2={labelW} y1={padTop} y2={height - padBottom} stroke="#D2DEEC" strokeWidth={1} />

        {filas.map((f, i) => {
          const y = padTop + i * (rowH + gap);
          let acc = 0;
          return (
            <g key={f.etiqueta as string}>
              {/* pista de fondo (referencia visual hasta el piso más cargado) */}
              <rect
                x={labelW} y={y} width={plotW} height={rowH} rx={4}
                fill={f.es_sub ? "#F1F5FA" : "#F6F9FC"}
              />
              {/* etiqueta del piso */}
              <text
                x={labelW - 10} y={y + rowH / 2}
                textAnchor="end" dominantBaseline="central"
                fontSize={10.5} fontWeight={f.es_sub ? 700 : 500}
                fill={f.es_sub ? "#1F3864" : "#56657C"}
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
                    fill={colores[fn]} stroke="#fff" strokeWidth={0.75}
                  >
                    <title>{`${f.etiqueta} · ${fn}: ${fmt(v)} m²`}</title>
                  </rect>
                );
              })}

              {/* total al final de la barra */}
              {totalFila(f) > 0 && (
                <text
                  x={labelW + x(totalFila(f)) + 7} y={y + rowH / 2}
                  dominantBaseline="central" fontSize={9.5} fontWeight={600} fill="#56657C"
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
