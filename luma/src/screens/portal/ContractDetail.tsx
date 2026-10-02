import { Link, useNavigate, useParams } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { SubjectProfile } from "../../components/SubjectProfile";
import { useScene } from "../../state/scene";

export default function ContractDetail() {
  const { id } = useParams();
  const { state, dispatch, valueOf } = useScene();
  const navigate = useNavigate();
  const c = state.contracts.find((x) => x.id === id) ?? state.contracts.find((x) => x.id === state.scriptedContractId)!;
  const isActive = state.contractStatus === "ACTIVE" && state.activeContractId === c.id;
  const otherActive = state.contractStatus === "ACTIVE" && state.activeContractId !== c.id;
  const closed = state.contractStatus === "COMPLETE" && state.activeContractId === c.id;
  const offScript = state.performanceMode && c.id !== state.scriptedContractId;

  const accept = () => {
    if (offScript || otherActive || isActive || closed) return; // wrong taps do nothing
    dispatch({ type: "ACCEPT", id: c.id });
  };
  const pass = () => {
    if (!state.performanceMode) dispatch({ type: "PASS", id: c.id });
    navigate("/portal/contracts");
  };

  return (
    <div className="page detail">
      <Link to="/portal/contracts" className="back mono">← AVAILABLE CONTRACTS</Link>
      <SubjectProfile contract={c} value={valueOf(c)} label={`CONTRACT ${c.ref} // ${isActive ? "ACTIVE" : closed ? "CLOSED" : "AWAITING OPERATOR"}`}>
        <div className="detail__blocks">
          <div className="block">
            <div className="block__label mono">BRIEF</div>
            <p className="block__text">{c.brief}</p>
          </div>
          <div className="block">
            <div className="block__label mono">RESTRICTIONS</div>
            <ul className="restrict mono">
              {c.restrictions.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
          <div className="block block--row">
            <div className="block__label mono">CLIENT VERIFICATION</div>
            <StatusBadge status="VERIFIED" label={c.clientVerification} />
            <span className="mono dim">CLIENT: {c.client}</span>
          </div>
        </div>

        {isActive ? (
          <div className="detail__accepted">
            <div className="stamp display">CONTRACT ACTIVE</div>
            <Link to="/portal/active" className="btn btn--accent btn--xl">OPEN ACTIVE CONTRACT →</Link>
          </div>
        ) : closed ? (
          <div className="detail__accepted"><div className="stamp stamp--muted display">CONTRACT CLOSED</div></div>
        ) : (
          <div className="detail__actions">
            <button className="btn btn--accent btn--xl" onClick={accept} aria-disabled={offScript || otherActive}>ACCEPT CONTRACT</button>
            <button className="btn btn--ghost btn--xl" onClick={pass}>PASS</button>
            {otherActive && <span className="mono dim">ONE ACTIVE CONTRACT PERMITTED.</span>}
          </div>
        )}
      </SubjectProfile>
    </div>
  );
}
