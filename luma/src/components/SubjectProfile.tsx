import type { Contract } from "../data/types";
import { money } from "../state/scene";
import { Portrait } from "./Portrait";
import { RiskTag } from "./StatusBadge";

// Big editorial subject spread used by Contract Detail and Active Contract.
export function SubjectProfile({ contract, value, label, children }: { contract: Contract; value: number; label: string; children?: React.ReactNode }) {
  return (
    <section className="subject">
      <div className="subject__photo">
        <Portrait seed={contract.portraitSeed} photo={contract.photo} alt={contract.subject} />
        <span className="subject__crop subject__crop--tl" />
        <span className="subject__crop subject__crop--br" />
        <span className="subject__stamp mono">{contract.ref}</span>
      </div>
      <div className="subject__info">
        <div className="eyebrow mono">{label}</div>
        <h1 className="subject__name display">{contract.subject}</h1>
        <div className="subject__value display">{money(value)}</div>
        <dl className="subject__grid mono">
          <div><dt>LOCATION</dt><dd>{contract.city}</dd></div>
          <div><dt>WINDOW</dt><dd>{contract.windowHours} HR</dd></div>
          <div><dt>CLASSIFICATION</dt><dd>{contract.classification}</dd></div>
          <div><dt>RISK</dt><dd><RiskTag risk={contract.risk} /></dd></div>
        </dl>
        {children}
      </div>
    </section>
  );
}
