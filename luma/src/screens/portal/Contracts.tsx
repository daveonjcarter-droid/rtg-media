import { ContractCard } from "../../components/ContractCard";
import { useScene } from "../../state/scene";

export default function Contracts() {
  const { state, valueOf } = useScene();
  const list = state.contracts.filter((c) => !state.passed.includes(c.id));
  return (
    <div className="page">
      <div className="page__head">
        <div className="eyebrow mono">ROUTED TO CROSS BY STANDING // TIER BLACK</div>
        <h1 className="display page__title">AVAILABLE CONTRACTS</h1>
        <div className="mono dim">{list.length} OPEN · ALL CLIENTS VERIFIED · COMPENSATION RELEASED ON COMPLETION</div>
      </div>
      <div className="cgrid">
        {list.map((c, i) => (
          <ContractCard key={c.id} contract={c} value={valueOf(c)} to={`/portal/contracts/${c.id}`} active={state.activeContractId === c.id && state.contractStatus === "ACTIVE"} index={i} />
        ))}
      </div>
    </div>
  );
}
