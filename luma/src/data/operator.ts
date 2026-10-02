// CROSS — the operator profile shown on Adrian's dashboard.
// Edit freely: every UI surface reads from here.

export const crossProfile = {
  id: "cross",
  codename: "CROSS",
  title: "VERIFIED OPERATOR",
  tier: "BLACK",
  standing: 4,
  completion: 97,
  discretion: 98,
  activeFlags: "NONE",
  memberSince: "2019",
  contractsClosed: 41,
  responseRating: 4.9,
  region: "NORTH AMERICA / CENTRAL",
  specialty: "RESOLUTION",
  militaryBackground: "VERIFIED",
  /** Greeting on the dashboard. */
  greeting: "GOOD EVENING, CROSS",
  /** Shown under the greeting. */
  subline: "ALL SYSTEMS NOMINAL // 1 CONTRACT AWAITING REVIEW",
};

export type CrossProfile = typeof crossProfile;
