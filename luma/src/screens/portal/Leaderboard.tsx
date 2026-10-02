import { LeaderboardHead, LeaderboardRow } from "../../components/LeaderboardRow";
import { useScene } from "../../state/scene";
import { buildRoster } from "../../state/roster";

export default function Leaderboard() {
  const { state } = useScene();
  const roster = buildRoster(state);
  return (
    <div className="page board">
      <div className="page__head">
        <div className="eyebrow mono">Q3 2026 // PUBLISHED QUARTERLY // CONFIDENTIAL</div>
        <h1 className="display page__title">OPERATOR RANKINGS</h1>
        <div className="mono dim">Standing reflects completion, discretion, client response, and total contract value.</div>
      </div>
      <div className="lboard">
        <LeaderboardHead />
        {roster.map((o, i) => (
          <LeaderboardRow key={o.id} op={o} index={i} self={o.id === "cross" && !state.naomiMode} />
        ))}
      </div>
      <p className="board__note mono dim">
        Operators whose discretion falls below 90 are reviewed. Suspended operators retain standing pending review. Clients may request operators by standing.
      </p>
    </div>
  );
}
