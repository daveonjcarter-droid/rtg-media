import type { Message, Payment, SequenceStep } from "./types";

export const messages: Message[] = [
  { id: "m1", from: "LUMA // CLIENT RELATIONS", time: "21:40", subject: "Client request routed to you", body: "A verified client has requested an operator at your standing. Review at your discretion.", unread: true },
  { id: "m2", from: "LUMA // STANDINGS", time: "YESTERDAY", subject: "Quarterly standing confirmed: #04", body: "Your standing has been confirmed for the current quarter. Thank you for your continued professionalism." },
  { id: "m3", from: "LUMA // COMPLIANCE", time: "MON", subject: "Annual verification complete", body: "Your verification is current. No action required." },
];

/** Message delivered when the Director triggers "MESSAGE". */
export const triggeredMessage: Message = {
  id: "m-trig",
  from: "LUMA // HANDLER",
  time: "NOW",
  subject: "Client has confirmed the window",
  body: "Client confirms the window remains open. Proceed at your discretion.",
  unread: true,
};

export const payments: Payment[] = [
  { id: "p1", ref: "LX-2141-K", date: "SEP 14", amount: 240000, status: "CLEARED", memo: "Contract compensation" },
  { id: "p2", ref: "LX-2096-T", date: "AUG 02", amount: 185000, status: "CLEARED", memo: "Contract compensation" },
  { id: "p3", ref: "LX-2050-M", date: "JUN 21", amount: 320000, status: "CLEARED", memo: "Contract compensation + discretion premium" },
  { id: "p4", ref: "LX-1988-C", date: "MAY 03", amount: 150000, status: "CLEARED", memo: "Contract compensation" },
];

// ------------------------------------------------------------------
// SCRIPTED SEQUENCES. Timings in ms. Change text/timing here only.
// ------------------------------------------------------------------

/** REPORT ISSUE → UNEXPECTED VISITOR → MEDIA → SUBMIT */
export const mediaResponse: SequenceStep[] = [
  { kind: "dots", ms: 2600 },
  { kind: "line", text: "GOT IT.", ms: 1800, size: "xl" },
  { kind: "line", text: "USE YOUR JUDGMENT.", ms: 0, size: "xl" },
];

/** Generic reply for any other issue path (only reachable with Performance Mode OFF). */
export const genericResponse: SequenceStep[] = [
  { kind: "dots", ms: 2200 },
  { kind: "line", text: "NOTED.", ms: 1400, size: "xl" },
  { kind: "line", text: "STAND BY.", ms: 0, size: "lg" },
];

/** COMPLETE CONTRACT → CONFIRM */
export const completionSequence: SequenceStep[] = [
  { kind: "line", text: "MISSION COMPLETE", ms: 1600, size: "xl" },
  { kind: "dots", ms: 2400 },
  { kind: "line", text: "ACKNOWLEDGED", ms: 1800, size: "lg" },
  { kind: "line", text: "PAYMENT SENT", ms: 0, size: "md" },
];

/** Issue menus for REPORT ISSUE. */
export const issueOptions = [
  "UNEXPECTED VISITOR",
  "CLIENT CHANGE",
  "SCHEDULE CHANGE",
  "MEDIA",
  "LAW ENFORCEMENT",
  "OTHER",
] as const;

export const visitorOptions = ["DELIVERY", "MAINTENANCE", "NEIGHBOR", "MEDIA", "OTHER"] as const;

/** The path that Performance Mode locks the actor onto. */
export const scriptedIssuePath = { issue: "UNEXPECTED VISITOR", visitor: "MEDIA" } as const;
