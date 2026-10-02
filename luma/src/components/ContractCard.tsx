import { Link } from "react-router-dom";
import type { Contract } from "../data/types";
import { money } from "../state/scene";
import { Portrait } from "./Portrait";
import { RiskTag } from "./StatusBadge";

export function ContractCard({ contract, value, to, active, index }: { contract: Contract; value: number; to: string; active?: boolean; index: number }) {
  return (
    <Link to={to} className={`ccard ${active ? "ccard--active" : ""}`} style={{ animationDelay: `${index * 70}ms` }}>
      <div className="ccard__img">
        <Portrait seed={contract.portraitSeed} photo={contract.photo} alt={contract.subject} />
        <span className="ccard__ref mono">{contract.ref}</span>
        {active && <span className="ccard__flag">CONTRACT ACTIVE</span>}
      </div>
      <div className="ccard__body">
        <h3 className="ccard__name display">{contract.subject}</h3>
        <div className="ccard__city mono">{contract.city}</div>
        <div className="ccard__value display">{money(value)}</div>
        <dl className="ccard__meta mono">
          <div><dt>WINDOW</dt><dd>{contract.windowHours} HR</dd></div>
          <div><dt>CLASS</dt><dd>{contract.classification}</dd></div>
        </dl>
        <RiskTag risk={contract.risk} />
      </div>
    </Link>
  );
}
