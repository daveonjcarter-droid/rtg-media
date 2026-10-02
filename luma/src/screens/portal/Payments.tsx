import { StatusBadge } from "../../components/StatusBadge";
import { money, useScene } from "../../state/scene";

export default function Payments() {
  const { state } = useScene();
  const total = state.payments.reduce((a, p) => a + p.amount, 0);
  return (
    <div className="page">
      <div className="page__head">
        <div className="eyebrow mono">PRIVATE LEDGER // CROSS</div>
        <h1 className="display page__title">PAYMENTS</h1>
      </div>
      <div className="pay__summary">
        <div><span className="mono dim">CLEARED, TRAILING 12 MO.</span><b className="display accent">{money(total)}</b></div>
        <div><span className="mono dim">LAST RELEASE</span><b className="display">{money(state.payments[0].amount)}</b></div>
        <div><span className="mono dim">HELD</span><b className="display">$0</b></div>
      </div>
      <div className="ledger">
        <div className="ledger__row ledger__row--head mono"><span>DATE</span><span>REF</span><span>MEMO</span><span>STATUS</span><span>AMOUNT</span></div>
        {state.payments.map((p, i) => (
          <div key={p.id + i} className={`ledger__row ${p.date === "TODAY" ? "is-new" : ""}`}>
            <span className="mono">{p.date}</span>
            <span className="mono">{p.ref}</span>
            <span>{p.memo}</span>
            <span><StatusBadge status={p.status} /></span>
            <span className="display ledger__amt">{money(p.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
