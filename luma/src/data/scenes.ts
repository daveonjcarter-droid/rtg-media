// Director Mode "jump to" presets. Each one resets state, applies a patch, then routes.
// path = route to open; patch = changes applied on top of the clean initial state.

export interface ScenePreset {
  id: string;
  label: string;
  path: string;
  patch?: Partial<{
    loggedIn: boolean;
    naomiMode: boolean;
    activeContractId: string | null;
    contractStatus: "AVAILABLE" | "ACTIVE" | "COMPLETE";
  }>;
}

export const scenePresets: ScenePreset[] = [
  { id: "public", label: "PUBLIC HOMEPAGE", path: "/" },
  { id: "video", label: "ONBOARDING VIDEO", path: "/welcome" },
  { id: "login", label: "OPERATOR LOGIN", path: "/access" },
  { id: "dashboard", label: "ADRIAN: DASHBOARD", path: "/portal", patch: { loggedIn: true } },
  { id: "contracts", label: "ADRIAN: AVAILABLE CONTRACTS", path: "/portal/contracts", patch: { loggedIn: true } },
  { id: "detail", label: "ADRIAN: CONTRACT DETAIL", path: "/portal/contracts/:scripted", patch: { loggedIn: true } },
  { id: "active", label: "ADRIAN: ACTIVE CONTRACT", path: "/portal/active", patch: { loggedIn: true, contractStatus: "ACTIVE" } },
  { id: "report", label: "ADRIAN: REPORT ISSUE OPEN", path: "/portal/active?report=1", patch: { loggedIn: true, contractStatus: "ACTIVE" } },
  { id: "complete", label: "ADRIAN: MISSION COMPLETE", path: "/portal/complete", patch: { loggedIn: true, contractStatus: "ACTIVE" } },
  { id: "network", label: "NETWORK", path: "/portal/network", patch: { loggedIn: true } },
  { id: "leaderboard", label: "LEADERBOARD", path: "/portal/leaderboard", patch: { loggedIn: true } },
  { id: "naomi", label: "NAOMI: START (PUBLIC SITE)", path: "/", patch: { naomiMode: true } },
  { id: "naomi-network", label: "NAOMI: INSIDE NETWORK", path: "/portal/network", patch: { naomiMode: true, loggedIn: true } },
  { id: "naomi-profile", label: "NAOMI: CROSS PROFILE", path: "/portal/operators/cross", patch: { naomiMode: true, loggedIn: true } },
];

/** Defaults the whole prop resets to. */
export const sceneDefaults = {
  payout: 300000,
  crossStanding: 4,
  performanceMode: true,
  /** Simulated login verification time (ms). */
  loginDelay: 1600,
  /** Hours:minutes shown as "remaining window" on the active contract at reset. Countdown is frozen in Performance Mode so takes match. */
  activeWindowRemaining: "31:14:07",
};
