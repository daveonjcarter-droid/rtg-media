import type { Contract } from "./types";

// Available contracts. The first id in SCRIPTED_CONTRACT_ID is the one the scene uses.
// Portraits: drop B&W cutouts into /public/photos and set `photo: "photos/vale.png"`.

export const SCRIPTED_CONTRACT_ID = "vale";

export const contracts: Contract[] = [
  {
    id: "vale",
    ref: "LX-2207-V",
    subject: "MARCUS VALE",
    city: "CHICAGO",
    value: 300000,
    windowHours: 36,
    classification: "RESOLUTION",
    risk: "HIGH",
    portraitSeed: 7,
    brief:
      "Client requests permanent resolution of an ongoing private matter. Subject is a logistics executive with a public profile. Discretion is the client's primary concern.",
    restrictions: [
      "NO PUBLIC ATTENTION",
      "NO THIRD PARTIES",
      "CLIENT IDENTITY SEALED",
      "WINDOW IS FIRM",
    ],
    clientVerification: "VERIFIED // TIER ONE CLIENT",
    client: "SEALED",
    notes: [
      "Client has used LUMA four times. No disputes on record.",
      "Subject keeps an irregular schedule.",
      "Compensation released on confirmation.",
    ],
  },
  {
    id: "halloran",
    ref: "LX-2211-H",
    subject: "ELISE HALLORAN",
    city: "TORONTO",
    value: 180000,
    windowHours: 72,
    classification: "RECOVERY",
    risk: "MODERATE",
    portraitSeed: 3,
    brief:
      "Client requests the quiet return of private materials currently held by the subject. Materials are of personal and financial value to the client.",
    restrictions: ["NO PUBLIC ATTENTION", "MATERIALS ONLY", "CLIENT IDENTITY SEALED"],
    clientVerification: "VERIFIED",
    client: "SEALED",
    notes: ["Client is new to LUMA.", "Window may be extended on request."],
  },
  {
    id: "okafor",
    ref: "LX-2214-O",
    subject: "DANIEL OKAFOR",
    city: "MIAMI",
    value: 95000,
    windowHours: 120,
    classification: "OBSERVATION",
    risk: "LOW",
    portraitSeed: 11,
    brief:
      "Client requests a discreet record of the subject's associations over a five-day period. No contact authorized.",
    restrictions: ["NO CONTACT", "NO PUBLIC ATTENTION"],
    clientVerification: "VERIFIED",
    client: "SEALED",
    notes: ["Low-profile engagement.", "Report delivered through LUMA only."],
  },
  {
    id: "renner",
    ref: "LX-2219-R",
    subject: "SOPHIA RENNER",
    city: "WASHINGTON, D.C.",
    value: 410000,
    windowHours: 48,
    classification: "RESOLUTION",
    risk: "SEVERE",
    portraitSeed: 19,
    brief:
      "Client requests resolution of a sensitive matter involving the subject. Subject is publicly visible. Matter is time-sensitive.",
    restrictions: ["NO PUBLIC ATTENTION", "TIER BLACK ONLY", "CLIENT IDENTITY SEALED"],
    clientVerification: "VERIFIED // TIER ONE CLIENT",
    client: "SEALED",
    notes: ["Restricted to Tier Black operators.", "Client has requested CROSS by standing."],
  },
];

/** Contract that appears when the Director triggers "NEW CONTRACT". */
export const incomingContract: Contract = {
  id: "aster",
  ref: "LX-2230-A",
  subject: "JONAH ASTER",
  city: "LOS ANGELES",
  value: 260000,
  windowHours: 24,
  classification: "RESOLUTION",
  risk: "HIGH",
  portraitSeed: 23,
  brief: "Client requests urgent resolution of a private matter. Window opened moments ago.",
  restrictions: ["NO PUBLIC ATTENTION", "WINDOW IS FIRM"],
  clientVerification: "VERIFIED",
  client: "SEALED",
  notes: ["Priority routing to top-10 operators."],
};
