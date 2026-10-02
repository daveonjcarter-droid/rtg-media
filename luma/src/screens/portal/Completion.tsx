import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSequence } from "../../components/MessageSequence";
import { PixelBunny } from "../../components/PixelBunny";
import { completionSequence } from "../../data/messages";
import { money, useScene } from "../../state/scene";

export default function Completion() {
  const { state, dispatch, current } = useScene();
  const [paid, setPaid] = useState(false);
  const [showExit, setShowExit] = useState(false);

  useEffect(() => {
    dispatch({ type: "COMPLETE" }); // idempotent
  }, [dispatch]);

  useEffect(() => {
    if (!paid) return;
    const t = window.setTimeout(() => setShowExit(true), 4000);
    return () => window.clearTimeout(t);
  }, [paid]);

  return (
    <div className="complete">
      <div className="complete__ref mono dim">{current.ref} // {current.subject}</div>
      <MessageSequence steps={completionSequence} onDone={() => setPaid(true)} />
      <div className={`complete__amount display ${paid ? "is-shown" : ""}`}>{money(state.payout)}</div>
      <div className={`complete__bunny ${paid ? "is-shown" : ""}`}>
        <PixelBunny size={72} mood={paid ? "celebrate" : "idle"} />
      </div>
      <div className={`complete__exit ${showExit ? "is-shown" : ""}`}>
        <span className="mono dim">CLEARED TO LEDGER · STANDING UPDATED</span>
        <Link to="/portal" className="mono">RETURN TO DASHBOARD →</Link>
      </div>
    </div>
  );
}
