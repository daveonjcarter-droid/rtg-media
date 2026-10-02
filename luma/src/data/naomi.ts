// Naomi discovery route. The CROSS profile she lands on shows these archived records.
// Adrian's real name never appears anywhere in the app.

export const naomiDiscovery = {
  /** Credential pre-filled hint on her login (any input still works). */
  mockCredentialHint: "OBSERVER-7741",
  sessionLabel: "SESSION: OBSERVER // READ-ONLY",
  /** Badges revealed on CROSS's profile. */
  badges: [
    { label: "VERIFIED OPERATOR", tone: "accent" },
    { label: "MILITARY BACKGROUND: VERIFIED", tone: "accent" },
    { label: "TIER: BLACK", tone: "plain" },
  ],
  archiveTitle: "ARCHIVED CONTRACTS",
  /** `highlight: true` marks the record that ties LUMA to Naomi's investigation. */
  archive: [
    { ref: "LX-1873-D", date: "2025.11.08", city: "PORTLAND", subject: "D. ALMONTE", classification: "RESOLUTION", status: "CLOSED", client: "SEALED", note: "Closed without public attention. Client satisfied.", highlight: true },
    { ref: "LX-2050-M", date: "2026.06.21", city: "BALTIMORE", subject: "R. MERCER", classification: "RECOVERY", status: "CLOSED", client: "SEALED", note: "Materials returned to client.", highlight: false },
    { ref: "LX-2096-T", date: "2026.08.02", city: "DETROIT", subject: "[REDACTED]", classification: "RESOLUTION", status: "CLOSED", client: "SEALED", note: "Discretion premium applied.", highlight: false },
    { ref: "LX-2141-K", date: "2026.09.14", city: "CHICAGO", subject: "[REDACTED]", classification: "RESOLUTION", status: "CLOSED", client: "SEALED", note: "—", highlight: false },
  ],
  /** Line under the profile header; deliberately no legal name. */
  identityLine: "LEGAL IDENTITY: SEALED BY LUMA",
};
