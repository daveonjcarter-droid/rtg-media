import { Link } from "react-router-dom";
import type { Operator } from "../data/types";
import { OperatorAvatar } from "./OperatorAvatar";
import { StatusBadge } from "./StatusBadge";

const compact = (n: number) => `$${(n / 1_000_000).toFixed(2)}M`;

export function LeaderboardRow({ op, index, self }: { op: Operator; index: number; self?: boolean }) {
  return (
    <Link to={`/portal/operators/${op.id}`} className={`lrow ${self ? "lrow--self" : ""}`} style={{ animationDelay: `${index * 45}ms` }}>
      <span className="lrow__rank display">{String(op.standing).padStart(2, "0")}</span>
      <span className="lrow__who">
        <OperatorAvatar seed={op.avatarSeed} size={40} dim={op.status === "SUSPENDED"} />
        <span>
          <span className="lrow__name display">{op.codename}</span>
          <span className="lrow__sub mono">{op.tier} // {op.region}</span>
        </span>
      </span>
      <span className="lrow__num mono">{op.completion}%</span>
      <span className="lrow__num mono">{op.discretion}</span>
      <span className="lrow__num mono lrow__hide-sm">{compact(op.contractValue)}</span>
      <span className="lrow__num mono lrow__hide-sm">{op.responseRating.toFixed(1)}</span>
      <span className="lrow__status lrow__hide-sm"><StatusBadge status={op.status} /></span>
    </Link>
  );
}

export function LeaderboardHead() {
  return (
    <div className="lrow lrow--head mono">
      <span>STANDING</span>
      <span>OPERATOR</span>
      <span className="lrow__num">COMPLETION</span>
      <span className="lrow__num">DISCRETION</span>
      <span className="lrow__num lrow__hide-sm">CONTRACT VALUE</span>
      <span className="lrow__num lrow__hide-sm">RESPONSE</span>
      <span className="lrow__hide-sm">STATUS</span>
    </div>
  );
}
