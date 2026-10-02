import { useState } from "react";
import { ActivityFeed } from "../../components/ActivityFeed";
import { OperatorAvatar } from "../../components/OperatorAvatar";
import { OperatorCard } from "../../components/OperatorCard";
import { useScene } from "../../state/scene";
import { buildRoster } from "../../state/roster";

const FILTERS = ["ALL", "ONLINE", "AVAILABLE", "IN FIELD", "CONTRACT ACTIVE", "OFFLINE"] as const;

export default function Network() {
  const { state } = useScene();
  const roster = buildRoster(state);
  const [f, setF] = useState<(typeof FILTERS)[number]>("ALL");
  const list = f === "ALL" ? roster : roster.filter((o) => o.status === f);
  const online = roster.filter((o) => !["OFFLINE", "SUSPENDED"].includes(o.status));

  return (
    <div className="page network">
      <div className="page__head page__head--row">
        <div>
          <div className="eyebrow mono">PRIVATE OPERATOR NETWORK // VERIFIED MEMBERS ONLY</div>
          <h1 className="display page__title">NETWORK</h1>
        </div>
        <div className="net__stats mono">
          <div><b className="display">2,418</b><span>VERIFIED OPERATORS</span></div>
          <div><b className="display accent">312</b><span>ONLINE NOW</span></div>
          <div><b className="display">64</b><span>CITIES</span></div>
        </div>
      </div>

      <div className="lobby">
        <span className="lobby__label mono">IN THE LOBBY</span>
        <div className="lobby__row">
          {online.map((o) => (
            <span key={o.id} className="lobby__op">
              <OperatorAvatar seed={o.avatarSeed} size={34} />
              <span className="mono">{o.codename}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="filters mono">
        {FILTERS.map((x) => (
          <button key={x} className={`chip ${f === x ? "is-on" : ""}`} onClick={() => setF(x)}>{x}</button>
        ))}
      </div>

      <div className="network__body">
        <div className="opgrid">
          {list.map((o, i) => (
            <OperatorCard key={o.id} op={o} index={i} self={o.id === "cross" && !state.naomiMode} />
          ))}
        </div>
        <aside className="panel network__feed">
          <ActivityFeed items={state.feed} limit={8} />
        </aside>
      </div>
    </div>
  );
}
