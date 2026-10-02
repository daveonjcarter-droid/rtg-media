import { useEffect, useRef, useState } from "react";
import { useScene } from "../state/scene";
// 8-bit LUMA bunny. Cute, minimal, emotionally blank.
// Sprites are plain strings: "#" = body, "." = empty, "o" = eye (punched out).

export type BunnyMood = "idle" | "alert" | "run" | "celebrate" | "glitch";

const FRONT = [
  "....##....##....",
  "....##....##....",
  "....##....##....",
  "....##....##....",
  "....###..###....",
  "....########....",
  "...##########...",
  "...##########...",
  "...##o####o##...",
  "...##########...",
  "....########....",
  "...##########...",
  "..############..",
  "..############..",
  "..############..",
  "...###....###...",
];

// Ears perked: taller, slightly splayed.
const ALERT = [
  "...##......##...",
  "...##......##...",
  "...##......##...",
  "....##....##....",
  "....##....##....",
  "....###..###....",
  "...##########...",
  "...##########...",
  "...##o####o##...",
  "...##########...",
  "....########....",
  "...##########...",
  "..############..",
  "..############..",
  "..############..",
  "...###....###...",
];

const SIDE_A = [
  "................",
  "..........#.#...",
  "..........#.#...",
  "..........#.#...",
  ".........#####..",
  "........###o###.",
  "...############.",
  "..#############.",
  ".##############.",
  "..############..",
  "...##......##...",
  "..##........##..",
];

const SIDE_B = [
  "................",
  "..........#.#...",
  ".........#.#....",
  ".........#.#....",
  ".........#####..",
  "........###o###.",
  "...############.",
  "..#############.",
  ".##############.",
  "..############..",
  "....###..###....",
  ".....##..##.....",
];

function Sprite({ rows, className }: { rows: string[]; className?: string }) {
  const w = rows[0].length;
  const h = rows.length;
  const rects: JSX.Element[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === "#") {
        let run = 1;
        while (row[x + run] === "#") run++;
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} />);
        x += run;
      } else x++;
    }
  });
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden="true">
      <g fill="currentColor">{rects}</g>
    </svg>
  );
}

export function PixelBunny({ mood = "idle", size = 48, className = "" }: { mood?: BunnyMood; size?: number; className?: string }) {
  const style = { width: size, height: size } as React.CSSProperties;
  if (mood === "run") {
    return (
      <span className={`bunny bunny--run ${className}`} style={style}>
        <Sprite rows={SIDE_A} className="bunny__f1" />
        <Sprite rows={SIDE_B} className="bunny__f2" />
      </span>
    );
  }
  return (
    <span className={`bunny bunny--${mood} ${className}`} style={style}>
      <Sprite rows={mood === "alert" || mood === "celebrate" ? ALERT : FRONT} />
      {mood === "glitch" && <Sprite rows={FRONT} className="bunny__ghost" />}
    </span>
  );
}

/** Dashboard bunny: idle, ears perk for a few seconds whenever a new contract / alert arrives. */
export function ReactiveBunny({ size, className }: { size: number; className?: string }) {
  const { state } = useScene();
  const [alert, setAlert] = useState(false);
  const first = useRef(state.bunnyAlert);
  useEffect(() => {
    if (state.bunnyAlert === first.current) return;
    setAlert(true);
    const t = window.setTimeout(() => setAlert(false), 4500);
    return () => window.clearTimeout(t);
  }, [state.bunnyAlert]);
  return <PixelBunny size={size} mood={alert ? "alert" : "idle"} className={className} />;
}
