import { useId } from "react";

// Generated B&W halftone "cutout" portrait placeholder. Swap in a real photo via `photo`.
// Deterministic from seed so every take looks identical.

export function Portrait({ seed, photo, alt, className = "" }: { seed: number; photo?: string; alt: string; className?: string }) {
  const uid = useId().replace(/:/g, "");
  if (photo) return <img className={`portrait portrait--photo ${className}`} src={photo} alt={alt} />;

  const v = (n: number) => ((seed * 7919 + n * 104729) % 1000) / 1000;
  const headW = 30 + v(1) * 8;
  const headH = 38 + v(2) * 6;
  const tilt = (v(3) - 0.5) * 8;
  const shoulder = 78 + v(4) * 14;
  const hair = v(5);
  const lightX = 30 + v(6) * 40;
  const cx = 100;
  const hy = 82;

  const neck = hy + headH * 0.75;
  const body = `M ${cx - shoulder} 260 C ${cx - shoulder} 190, ${cx - 44} 158, ${cx - 18} 146 L ${cx - 15} ${neck} L ${cx + 15} ${neck} L ${cx + 18} 146 C ${cx + 44} 158, ${cx + shoulder} 190, ${cx + shoulder} 260 Z`;
  const hairPath =
    hair > 0.66
      ? `M ${cx - headW - 2} ${hy} C ${cx - headW - 6} ${hy - headH - 18}, ${cx + headW + 6} ${hy - headH - 18}, ${cx + headW + 2} ${hy} C ${cx + headW} ${hy - 20}, ${cx - headW} ${hy - 20}, ${cx - headW - 2} ${hy} Z`
      : hair > 0.33
        ? `M ${cx - headW - 1} ${hy - 6} C ${cx - headW} ${hy - headH - 10}, ${cx + headW} ${hy - headH - 10}, ${cx + headW + 1} ${hy - 6} C ${cx + 10} ${hy - headH + 2}, ${cx - 20} ${hy - headH + 6}, ${cx - headW - 1} ${hy - 6} Z`
        : `M ${cx - headW - 4} ${hy + 30} C ${cx - headW - 10} ${hy - headH - 16}, ${cx + headW + 10} ${hy - headH - 16}, ${cx + headW + 4} ${hy + 30} L ${cx + headW - 4} ${hy} C ${cx + 10} ${hy - headH + 4}, ${cx - 10} ${hy - headH + 4}, ${cx - headW + 4} ${hy} Z`;

  return (
    <svg className={`portrait ${className}`} viewBox="0 0 200 250" preserveAspectRatio="xMidYMax slice" role="img" aria-label={alt}>
      <defs>
        <pattern id={`dots${uid}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="2" cy="2" r="1.35" fill="#f2efe6" />
        </pattern>
        <radialGradient id={`light${uid}`} cx={`${lightX}%`} cy="32%" r="55%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`mask${uid}`}>
          <rect width="200" height="250" fill={`url(#light${uid})`} />
        </mask>
        <clipPath id={`clip${uid}`}>
          <path d={body} />
          <ellipse cx={cx} cy={hy} rx={headW} ry={headH} transform={`rotate(${tilt} ${cx} ${hy})`} />
        </clipPath>
      </defs>
      <rect width="200" height="250" className="portrait__bg" />
      <g className="portrait__figure">
        <path d={body} />
        <ellipse cx={cx} cy={hy} rx={headW} ry={headH} transform={`rotate(${tilt} ${cx} ${hy})`} />
      </g>
      <g clipPath={`url(#clip${uid})`}>
        <rect width="200" height="250" fill={`url(#dots${uid})`} mask={`url(#mask${uid})`} />
      </g>
      <path d={hairPath} className="portrait__hair" transform={`rotate(${tilt} ${cx} ${hy})`} />
    </svg>
  );
}
