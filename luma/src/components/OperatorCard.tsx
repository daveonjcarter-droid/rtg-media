import { Link } from "react-router-dom";
import type { Operator } from "../data/types";
import { OperatorAvatar } from "./OperatorAvatar";
import { StatusBadge } from "./StatusBadge";

export function OperatorCard({ op, index, self }: { op: Operator; index: number; self?: boolean }) {
  const off = op.status === "OFFLINE" || op.status === "SUSPENDED";
  return (
    <Link to={`/portal/operators/${op.id}`} className={`opcard ${self ? "opcard--self" : ""}`} style={{ animationDelay: `${index * 50}ms` }}>
      <div className="opcard__top">
        <OperatorAvatar seed={op.avatarSeed} size={64} dim={off} codename={op.codename} />
        <div className="opcard__rank mono">#{String(op.standing).padStart(2, "0")}</div>
      </div>
      <div className="opcard__name display">{op.codename}</div>
      <StatusBadge status={op.status} />
      <dl className="opcard__meta mono">
        <div><dt>SPECIALTY</dt><dd>{op.specialty}</dd></div>
        <div><dt>REGION</dt><dd>{op.region}</dd></div>
        <div><dt>TIER</dt><dd>{op.tier}</dd></div>
      </dl>
    </Link>
  );
}
