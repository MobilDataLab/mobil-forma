// Logotipo MOBIL (hexágono con líneas). Portado tal cual desde mobil-carga
// (src/components/MobilMark.tsx) para mantener la identidad consistente.
interface Props {
  size?: number;
  color?: string;
}

export function MobilMark({ size = 28, color = "#fff" }: Props) {
  return (
    <svg viewBox="0 0 960 840" width={size} height={size} aria-hidden="true">
      <g
        fill="none"
        stroke={color}
        strokeWidth={60}
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <line x1="30" y1="419.22" x2="261.3" y2="30" />
        <line x1="261.3" y1="30" x2="714" y2="30" />
        <line x1="714" y1="30" x2="930" y2="419.22" />
        <line x1="930" y1="419.22" x2="716.7" y2="810" />
        <line x1="716.7" y1="810" x2="261.3" y2="808.44" />
        <line x1="261.3" y1="808.44" x2="30" y2="419.22" />
        <line x1="480" y1="419.22" x2="30" y2="419.22" />
        <line x1="480" y1="419.22" x2="261.3" y2="30" />
        <line x1="480" y1="419.22" x2="714" y2="30" />
        <line x1="480" y1="419.22" x2="930" y2="419.22" />
        <line x1="480" y1="419.22" x2="716.7" y2="810" />
        <line x1="480" y1="419.22" x2="261.3" y2="808.44" />
      </g>
    </svg>
  );
}
