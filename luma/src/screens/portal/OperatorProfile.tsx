import { Link, useParams } from "react-router-dom";
import { OperatorAvatar } from "../../components/OperatorAvatar";
import { StatusBadge } from "../../components/StatusBadge";
import { naomiDiscovery as N } from "../../data/naomi";
import { crossProfile as X } from "../../data/operator";
import { useScene } from "../../state/scene";
import { buildRoster } from "../../state/roster";

export default function OperatorProfile() {
  const { id } = useParams();
  const { state } = useScene();
  const roster = buildRoster(state);
  const op = roster.find((o) => o.id === id) ?? roster.find((o) => o.id === "cross")!;
  const isCross = op.id === "cross";

  return (
    <div className="page profile">
      <Link to="/portal/leaderboard" className="back mono">← OPERATOR RANKINGS</Link>

      <section className="profile__hero">
        <OperatorAvatar seed={op.avatarSeed} size={180} codename={op.codename} dim={op.status === "SUSPENDED"} />
        <div className="profile__id">
          <div className="eyebrow mono">OPERATOR PROFILE // STANDING #{String(op.standing).padStart(2, "0")}</div>
          <h1 className="display profile__name">{op.codename}</h1>
          <div className="profile__badges">
            {isCross ? (
              N.badges.map((b) => (
                <span key={b.label} className={`vbadge ${b.tone === "accent" ? "vbadge--accent" : ""} reveal`}>
                  {b.tone === "accent" && <i>✓</i>}{b.label}
                </span>
              ))
            ) : (
              <>
                <span className="vbadge vbadge--accent"><i>✓</i>VERIFIED OPERATOR</span>
                <span className="vbadge">TIER: {op.tier}</span>
              </>
            )}
          </div>
          <div className="profile__line mono">
            <StatusBadge status={op.status} />
            <span className="dim">{isCross ? N.identityLine : "LEGAL IDENTITY: SEALED BY LUMA"}</span>
          </div>
        </div>
      </section>

      <dl className="profile__stats mono">
        <div><dt>COMPLETION</dt><dd className="display">{op.completion}%</dd></div>
        <div><dt>DISCRETION</dt><dd className="display">{op.discretion}</dd></div>
        <div><dt>RESPONSE</dt><dd className="display">{op.responseRating.toFixed(1)}</dd></div>
        <div><dt>SPECIALTY</dt><dd className="display">{op.specialty}</dd></div>
        <div><dt>REGION</dt><dd className="display">{op.region}</dd></div>
        <div><dt>MEMBER SINCE</dt><dd className="display">{isCross ? X.memberSince : op.joined}</dd></div>
      </dl>

      <section className="archive">
        <div className="panel__head mono"><span>{N.archiveTitle}</span><span>{isCross ? `${X.contractsClosed} CLOSED · SHOWING RECENT` : "RESTRICTED"}</span></div>
        {isCross ? (
          <div className="archive__table">
            <div className="arow arow--head mono">
              <span>REF</span><span>DATE</span><span>CITY</span><span>SUBJECT</span><span>CLASS</span><span>STATUS</span>
            </div>
            {N.archive.map((a, i) => (
              <div key={a.ref} className={`arow ${a.highlight ? "arow--hl" : ""}`} style={{ animationDelay: `${i * 80}ms` }}>
                <span className="mono">{a.ref}</span>
                <span className="mono">{a.date}</span>
                <span className="display">{a.city}</span>
                <span className="display">{a.subject}</span>
                <span className="mono">{a.classification}</span>
                <span className="mono accent">{a.status}</span>
                <span className="arow__note mono dim">CLIENT: {a.client} — {a.note}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty"><span className="mono">ARCHIVE VISIBLE TO OPERATOR AND LUMA ONLY.</span></div>
        )}
      </section>
    </div>
  );
}
