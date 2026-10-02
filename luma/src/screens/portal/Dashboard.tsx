import { Link } from "react-router-dom";
import { ActivityFeed } from "../../components/ActivityFeed";
import { OperatorAvatar } from "../../components/OperatorAvatar";
import { ReactiveBunny } from "../../components/PixelBunny";
import { Portrait } from "../../components/Portrait";
import { StatusBadge } from "../../components/StatusBadge";
import { crossProfile as X } from "../../data/operator";
import { sceneDefaults } from "../../data/scenes";
import { money, useScene } from "../../state/scene";
import { buildRoster } from "../../state/roster";

export default function Dashboard() {
  const { state, current, valueOf } = useScene();
  const roster = buildRoster(state);
  const available = state.contracts.filter((c) => !state.passed.includes(c.id) && c.id !== state.activeContractId);
  const unread = state.messages.filter((m) => m.unread);
  const ytd = state.payments.reduce((a, p) => a + p.amount, 0);
  const online = roster.filter((o) => o.status !== "OFFLINE" && o.status !== "SUSPENDED");
  const crossIdx = roster.findIndex((o) => o.id === "cross");
  const near = roster.slice(Math.max(0, crossIdx - 2), crossIdx + 3);
  const crossStatus = state.statusOverrides.cross ?? "ONLINE";

  return (
    <div className="page dash">
      <div className="dash__hello">
        <div>
          <div className="eyebrow mono">{new Date(2026, 9, 2).toDateString().toUpperCase()} // 21:44 LOCAL</div>
          <h1 className="display dash__greet type-in">{X.greeting}</h1>
          <div className="mono dim">{state.contractStatus === "ACTIVE" ? "1 CONTRACT ACTIVE // WINDOW OPEN" : X.subline}</div>
        </div>
        <ReactiveBunny size={84} className="dash__bunny" />
      </div>

      <div className="dash__grid">
        {/* OPERATOR STAT BLOCK */}
        <section className="panel stat">
          <div className="panel__head mono"><span>OPERATOR</span><StatusBadge status={crossStatus} /></div>
          <div className="stat__id">
            <OperatorAvatar seed={13} size={72} />
            <div>
              <div className="display stat__name">{X.codename}</div>
              <div className="mono accent">{X.title}</div>
            </div>
          </div>
          <dl className="stat__list mono">
            <div><dt>TIER</dt><dd className="accent">{X.tier}</dd></div>
            <div><dt>CURRENT STANDING</dt><dd>#{String(state.crossStanding).padStart(2, "0")}</dd></div>
            <div><dt>COMPLETION</dt><dd>{X.completion}%</dd></div>
            <div><dt>DISCRETION</dt><dd>{X.discretion}</dd></div>
            <div><dt>ACTIVE FLAGS</dt><dd>{X.activeFlags}</dd></div>
          </dl>
        </section>

        {/* ACTIVE CONTRACT */}
        <section className={`panel active-mini ${state.contractStatus === "ACTIVE" ? "is-live" : ""}`}>
          <div className="panel__head mono"><span>ACTIVE CONTRACT</span>{state.contractStatus === "ACTIVE" && <StatusBadge status="CONTRACT ACTIVE" />}</div>
          {state.contractStatus === "ACTIVE" ? (
            <Link to="/portal/active" className="active-mini__body">
              <div className="active-mini__img"><Portrait seed={current.portraitSeed} photo={current.photo} alt={current.subject} /></div>
              <div>
                <div className="display active-mini__name">{current.subject}</div>
                <div className="mono dim">{current.city}</div>
                <div className="display accent active-mini__val">{money(valueOf(current))}</div>
                <div className="mono">WINDOW REMAINING {sceneDefaults.activeWindowRemaining}</div>
              </div>
            </Link>
          ) : (
            <Link to={state.contractStatus === "COMPLETE" ? "/portal/payments" : "/portal/contracts"} className="standby">
              <span className="display standby__big">{state.contractStatus === "COMPLETE" ? "CLOSED" : "STANDING BY"}</span>
              <span className="mono dim">{state.contractStatus === "COMPLETE" ? "CONTRACT CLOSED // PAYMENT CLEARED" : "NO ACTIVE CONTRACT // REVIEW AVAILABLE CONTRACTS →"}</span>
            </Link>
          )}
        </section>

        {/* AVAILABLE CONTRACTS */}
        <section className="panel avail">
          <div className="panel__head mono"><span>AVAILABLE CONTRACTS</span><Link to="/portal/contracts" className="accent">VIEW ALL →</Link></div>
          <div className="avail__count display">{String(available.length).padStart(2, "0")}</div>
          <ul className="mini-list">
            {available.slice(0, 3).map((c) => (
              <li key={c.id}>
                <Link to={`/portal/contracts/${c.id}`}>
                  <span className="display">{c.subject}</span>
                  <span className="mono dim">{c.city}</span>
                  <span className="mono accent">{money(valueOf(c))}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* STANDING */}
        <section className="panel standing">
          <div className="panel__head mono"><span>OPERATOR STANDING</span><Link to="/portal/leaderboard" className="accent">RANKINGS →</Link></div>
          <div className="standing__big display">#{String(state.crossStanding).padStart(2, "0")}</div>
          <ol className="standing__near mono">
            {near.map((o) => (
              <li key={o.id} className={o.id === "cross" ? "is-self" : ""}>
                <span>{String(o.standing).padStart(2, "0")}</span><span>{o.codename}</span><span>{o.discretion}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* MESSAGES */}
        <section className="panel msgs">
          <div className="panel__head mono"><span>MESSAGES</span><Link to="/portal/messages" className="accent">{unread.length} UNREAD →</Link></div>
          <ul className="mini-msgs">
            {state.messages.slice(0, 3).map((m) => (
              <li key={m.id} className={m.unread ? "is-unread" : ""}>
                <span className="mono dim">{m.from}</span>
                <span>{m.subject}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* PAYMENTS */}
        <section className="panel pays">
          <div className="panel__head mono"><span>PAYMENTS</span><Link to="/portal/payments" className="accent">LEDGER →</Link></div>
          <div className="mono dim">CLEARED, TRAILING 12 MO.</div>
          <div className="display pays__total">{money(ytd)}</div>
          <div className="mono">LAST: {money(state.payments[0].amount)} · {state.payments[0].date} · <span className="accent">{state.payments[0].status}</span></div>
        </section>

        {/* NETWORK */}
        <section className="panel net">
          <div className="panel__head mono"><span>NETWORK</span><Link to="/portal/network" className="accent">ENTER →</Link></div>
          <div className="net__row">
            {online.slice(0, 8).map((o) => (
              <OperatorAvatar key={o.id} seed={o.avatarSeed} size={36} codename={o.codename} />
            ))}
          </div>
          <div className="mono dim">{online.length} OF {roster.length} TIER OPERATORS ONLINE IN YOUR REGION</div>
        </section>

        <section className="panel feedp">
          <ActivityFeed items={state.feed} limit={6} />
        </section>
      </div>
    </div>
  );
}
