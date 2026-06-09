import { useRef } from "react";
import { exportarSvgPng } from "./exportar";
import { IconoDescarga } from "./iconos";

export type ItemVenta = { funcion: string; venta: number; pct: number; color: string };
export type Venta = { items: ItemVenta[]; total: number };

const fmt = (n: number) => Math.round(n).toLocaleString("es-CL");
const pct = (p: number) => (p * 100).toLocaleString("es-CL", { maximumFractionDigits: 1 }) + "%";

// Punto en el borde del círculo para un ángulo dado (0 = arriba, horario)
function punto(cx: number, cy: number, r: number, ang: number) {
  const a = (ang - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export default function GraficoVenta({ venta }: { venta: Venta }) {
  const { items, total } = venta;
  const svgRef = useRef<SVGSVGElement>(null);
  if (!items.length || total <= 0) {
    return (
      <div className="torta">
        <div className="grafico-titulo">Distribución de venta por función</div>
        <p className="manual-empty">No hay superficie de venta para graficar.</p>
      </div>
    );
  }

  const size = 230;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const rI = r * 0.6;

  let acc = 0; // ángulo acumulado en grados
  const segmentos = items.map((it) => {
    const ini = acc * 360;
    acc += it.pct;
    const fin = acc * 360;
    const grande = fin - ini > 180 ? 1 : 0;
    const [ox1, oy1] = punto(cx, cy, r, ini);
    const [ox2, oy2] = punto(cx, cy, r, fin);
    const [ix2, iy2] = punto(cx, cy, rI, fin);
    const [ix1, iy1] = punto(cx, cy, rI, ini);
    // Anillo (dona). Caso 100%: dos medios arcos para cerrar el aro completo.
    const d =
      it.pct >= 0.9999
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z ` +
          `M ${cx} ${cy - rI} A ${rI} ${rI} 0 1 0 ${cx - 0.01} ${cy - rI} Z`
        : `M ${ox1} ${oy1} A ${r} ${r} 0 ${grande} 1 ${ox2} ${oy2} ` +
          `L ${ix2} ${iy2} A ${rI} ${rI} 0 ${grande} 0 ${ix1} ${iy1} Z`;
    // Posición de la etiqueta de % (en el centro del anillo)
    const medio = (ini + fin) / 2;
    const [lx, ly] = punto(cx, cy, (r + rI) / 2, medio);
    return { ...it, d, lx, ly };
  });

  return (
    <div className="torta">
      <div className="panel-head">
        <h2 className="titulo">Distribución de <span className="acento">venta por función</span></h2>
        <div className="tools">
          <button
            className="btn-export"
            onClick={() => exportarSvgPng(svgRef.current, "venta-por-funcion")}
            title="Descargar gráfico como PNG"
          >
            <IconoDescarga /> PNG
          </button>
        </div>
      </div>

      <div className="torta-body">
        <svg ref={svgRef} viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img"
          aria-label="Gráfico de dona: distribución de superficie de venta por función"
          style={{ fontFamily: 'var(--ff)' }}>
          {segmentos.map((s) => (
            <path key={s.funcion} d={s.d} fill={s.color} fillRule="evenodd" stroke="#fff" strokeWidth={1.5}>
              <title>{`${s.funcion}: ${fmt(s.venta)} m² (${pct(s.pct)})`}</title>
            </path>
          ))}
          {/* Total al centro de la dona */}
          <text x={cx} y={cy - 7} textAnchor="middle" fontSize={20} fontWeight={700} fill="#1F3864">
            {fmt(total)}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fontWeight={600} fill="#8A97AB"
            letterSpacing="0.06em">
            M² VENTA
          </text>
          {/* Etiquetas de % dentro de los segmentos grandes (≥6%) */}
          {segmentos
            .filter((s) => s.pct >= 0.06)
            .map((s) => (
              <text
                key={s.funcion}
                x={s.lx}
                y={s.ly}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fontWeight={700}
                fill={esOscuro(s.color) ? "#fff" : "#1a1a1a"}
              >
                {pct(s.pct)}
              </text>
            ))}
        </svg>

        <div className="torta-leyenda">
          {segmentos.map((s) => (
            <div key={s.funcion} className="tl-item">
              <span className="leyenda-color" style={{ background: s.color }} />
              <span className="tl-fn">{s.funcion}</span>
              <span className="tl-pct">{pct(s.pct)}</span>
              <span className="tl-m2">{fmt(s.venta)} m²</span>
            </div>
          ))}
          <div className="tl-item tl-total">
            <span className="leyenda-color" style={{ background: "transparent" }} />
            <span className="tl-fn">Total venta</span>
            <span className="tl-pct">100%</span>
            <span className="tl-m2">{fmt(total)} m²</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Luminancia aproximada para decidir color de texto sobre el segmento
function esOscuro(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 150;
}
