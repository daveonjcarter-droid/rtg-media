// Anonymous 8-bit avatar, generated deterministically from a seed.
// 5x5 mirrored identicon on a framed tile — no faces, no photos.

function rng(seed: number) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

export function OperatorAvatar({ seed, size = 56, dim, codename }: { seed: number; size?: number; dim?: boolean; codename?: string }) {
  const r = rng(seed + 1);
  const cells: [number, number][] = [];
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 3; x++)
      if (r() > 0.45) {
        cells.push([x, y]);
        if (x < 2) cells.push([4 - x, y]);
      }
  const variant = seed % 3;
  return (
    <span className={`avatar avatar--v${variant} ${dim ? "avatar--dim" : ""}`} style={{ width: size, height: size, padding: Math.round(size * 0.14) }} title={codename}>
      <svg viewBox="-1 -1 7 7" shapeRendering="crispEdges" aria-hidden="true">
        {cells.map(([x, y]) => (
          <rect key={`${x}${y}`} x={x} y={y} width={1} height={1} />
        ))}
      </svg>
    </span>
  );
}
