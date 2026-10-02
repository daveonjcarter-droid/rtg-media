import { operators } from "../data/operators";
import type { Operator } from "../data/types";
import type { SceneState } from "./scene";

/** Operators with CROSS placed at the Director-set standing and runtime status overrides applied. */
export function buildRoster(s: SceneState): Operator[] {
  const others = operators.filter((o) => o.id !== "cross").sort((a, b) => a.standing - b.standing);
  const cross = operators.find((o) => o.id === "cross")!;
  const pos = Math.max(1, Math.min(s.crossStanding, others.length + 1)) - 1;
  const ordered = [...others.slice(0, pos), cross, ...others.slice(pos)];
  return ordered.map((o, i) => ({ ...o, standing: i + 1, status: s.statusOverrides[o.id] ?? o.status }));
}
