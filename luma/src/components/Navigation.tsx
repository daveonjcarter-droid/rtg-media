import { NavLink, useNavigate } from "react-router-dom";
import { naomiDiscovery } from "../data/naomi";
import { useScene } from "../state/scene";
import { BunnyLogo } from "./BunnyLogo";

const adrianLinks: { to: string; label: string; end?: boolean }[] = [
  { to: "/portal", label: "DASHBOARD", end: true },
  { to: "/portal/contracts", label: "CONTRACTS" },
  { to: "/portal/active", label: "ACTIVE" },
  { to: "/portal/messages", label: "MESSAGES" },
  { to: "/portal/payments", label: "PAYMENTS" },
  { to: "/portal/network", label: "NETWORK" },
  { to: "/portal/leaderboard", label: "RANKINGS" },
];

const naomiLinks: { to: string; label: string; end?: boolean }[] = [
  { to: "/portal/network", label: "NETWORK" },
  { to: "/portal/leaderboard", label: "RANKINGS" },
];

export function Navigation() {
  const { state } = useScene();
  const navigate = useNavigate();
  const links = state.naomiMode ? naomiLinks : adrianLinks;
  const unread = state.messages.filter((m) => m.unread).length;
  return (
    <header className="pnav">
      <button className="pnav__logo" onClick={() => navigate(state.naomiMode ? "/portal/network" : "/portal")}>
        <BunnyLogo size="sm" mood={state.contractStatus === "ACTIVE" ? "alert" : "idle"} tag="OPERATOR" />
      </button>
      <nav className="pnav__links mono">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `pnav__link ${isActive ? "is-active" : ""}`}>
            {l.label}
            {l.label === "MESSAGES" && unread > 0 && <span className="pnav__count">{unread}</span>}
            {l.label === "ACTIVE" && state.contractStatus === "ACTIVE" && <span className="pnav__live" />}
          </NavLink>
        ))}
      </nav>
      <div className="pnav__session mono">
        {state.naomiMode ? naomiDiscovery.sessionLabel : <>CROSS <span className="dim">// TIER BLACK</span></>}
      </div>
    </header>
  );
}
