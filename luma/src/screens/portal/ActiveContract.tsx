import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LumaModal } from "../../components/LumaModal";
import { MessageSequence } from "../../components/MessageSequence";
import { PixelBunny } from "../../components/PixelBunny";
import { StatusBadge } from "../../components/StatusBadge";
import { SubjectProfile } from "../../components/SubjectProfile";
import { genericResponse, issueOptions, mediaResponse, scriptedIssuePath, visitorOptions } from "../../data/messages";
import { sceneDefaults } from "../../data/scenes";
import { money, useScene } from "../../state/scene";

function useCountdown(start: string) {
  const toSec = (s: string) => s.split(":").map(Number).reduce((a, n) => a * 60 + n, 0);
  const [left, setLeft] = useState(() => toSec(start));
  useEffect(() => {
    const id = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => window.clearInterval(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(left / 3600))}:${p(Math.floor((left % 3600) / 60))}:${p(left % 60)}`;
}

export default function ActiveContract() {
  const { state, current, valueOf } = useScene();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(params.get("report") === "1");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const clock = useCountdown(sceneDefaults.activeWindowRemaining);

  const closeReport = () => {
    setReportOpen(false);
    if (params.get("report")) setParams({}, { replace: true });
  };

  if (state.contractStatus !== "ACTIVE") {
    return (
      <div className="page center-empty">
        <PixelBunny size={96} />
        <h1 className="display page__title">{state.contractStatus === "COMPLETE" ? "CONTRACT CLOSED" : "NO ACTIVE CONTRACT"}</h1>
        <Link to={state.contractStatus === "COMPLETE" ? "/portal/payments" : "/portal/contracts"} className="btn btn--ghost">
          {state.contractStatus === "COMPLETE" ? "VIEW PAYMENT →" : "AVAILABLE CONTRACTS →"}
        </Link>
      </div>
    );
  }

  return (
    <div className="page active">
      <SubjectProfile contract={current} value={valueOf(current)} label={`ACTIVE CONTRACT // ${current.ref}`}>
        <div className="active__status">
          <StatusBadge status="CONTRACT ACTIVE" big />
          <div className="active__clock">
            <span className="mono dim">REMAINING WINDOW</span>
            <span className="display">{clock}</span>
          </div>
          <div className="active__clock">
            <span className="mono dim">COMPENSATION</span>
            <span className="display accent">{money(valueOf(current))}</span>
          </div>
        </div>
        <div className="block">
          <div className="block__label mono">NOTES</div>
          <ul className="notes">
            {current.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
        <div className="detail__actions">
          <button className="btn btn--ghost btn--xl" onClick={() => setReportOpen(true)}>REPORT ISSUE</button>
          <button className="btn btn--accent btn--xl" onClick={() => setConfirmOpen(true)}>COMPLETE CONTRACT</button>
        </div>
      </SubjectProfile>

      {reportOpen && <ReportIssue onClose={closeReport} />}

      <LumaModal open={confirmOpen} onClose={() => setConfirmOpen(false)} locked={state.performanceMode}>
        <div className="confirm">
          <div className="eyebrow mono">{current.ref} // CONFIRMATION</div>
          <h2 className="display confirm__title">COMPLETE CONTRACT?</h2>
          <p className="mono dim">Confirming closes this contract and notifies the client. Compensation is released on acknowledgment.</p>
          <div className="detail__actions">
            <button className="btn btn--accent btn--xl" onClick={() => navigate("/portal/complete")}>CONFIRM</button>
            <button className="btn btn--ghost btn--xl" onClick={() => setConfirmOpen(false)}>CANCEL</button>
          </div>
        </div>
      </LumaModal>
    </div>
  );
}

type Step = "issue" | "visitor" | "sent";

function ReportIssue({ onClose }: { onClose: () => void }) {
  const { state } = useScene();
  const perf = state.performanceMode;
  const [step, setStep] = useState<Step>("issue");
  const [issue, setIssue] = useState<string | null>(null);
  const [visitor, setVisitor] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const pickIssue = (o: string) => {
    if (perf && o !== scriptedIssuePath.issue) return; // off-script taps do nothing
    setIssue(o);
    if (o === "UNEXPECTED VISITOR") setStep("visitor");
  };
  const pickVisitor = (o: string) => {
    if (perf && o !== scriptedIssuePath.visitor) return;
    setVisitor(o);
  };
  const canSubmit = step === "visitor" ? !!visitor : !!issue && issue !== "UNEXPECTED VISITOR";
  const isMedia = visitor === "MEDIA" || issue === "MEDIA";

  return (
    <LumaModal open onClose={onClose} locked={perf} wide>
      <div className="report">
        <div className="report__head">
          <div className="eyebrow mono">REPORT ISSUE // PRIVATE CHANNEL TO LUMA</div>
          {step !== "sent" && <button className="mono report__x" onClick={onClose}>CANCEL ✕</button>}
        </div>

        {step === "issue" && (
          <>
            <h2 className="display report__title">WHAT HAPPENED?</h2>
            <div className="opts">
              {issueOptions.map((o) => (
                <button key={o} className={`opt ${issue === o ? "is-on" : ""}`} onClick={() => pickIssue(o)}>
                  <span className="opt__box" />{o}
                </button>
              ))}
            </div>
          </>
        )}

        {step === "visitor" && (
          <>
            <button className="mono report__crumb" onClick={() => { setStep("issue"); setVisitor(null); }}>← UNEXPECTED VISITOR</button>
            <h2 className="display report__title">WHO IS IT?</h2>
            <div className="opts">
              {visitorOptions.map((o) => (
                <button key={o} className={`opt ${visitor === o ? "is-on" : ""}`} onClick={() => pickVisitor(o)}>
                  <span className="opt__box" />{o}
                </button>
              ))}
            </div>
          </>
        )}

        {step !== "sent" && (
          <div className="report__foot">
            <button className="btn btn--accent btn--xl" disabled={!canSubmit} onClick={() => canSubmit && setStep("sent")}>SUBMIT</button>
          </div>
        )}

        {step === "sent" && (
          <div className="report__reply">
            <div className="report__from mono"><PixelBunny size={22} mood="alert" /> LUMA</div>
            <MessageSequence steps={isMedia ? mediaResponse : genericResponse} onDone={() => setDone(true)} />
            <div className={`report__return ${done ? "is-shown" : ""}`}>
              <button className="btn btn--ghost" onClick={onClose} disabled={!done}>RETURN TO CONTRACT</button>
            </div>
          </div>
        )}
      </div>
    </LumaModal>
  );
}
