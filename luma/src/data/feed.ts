import type { FeedItem } from "./types";

// Operator activity feed. Newest first.
export const feed: FeedItem[] = [
  { id: "f1", time: "21:42", text: "CROSS returned to ACTIVE status.", tone: "accent" },
  { id: "f2", time: "21:18", text: "MOTH completed a Class II contract." },
  { id: "f3", time: "20:57", text: "VANTA entered the Top 10." },
  { id: "f4", time: "20:31", text: "JACKAL access suspended.", tone: "warn" },
  { id: "f5", time: "19:46", text: "New verified client added in D.C." },
  { id: "f6", time: "19:02", text: "SAINT accepted a Tier Black contract." },
  { id: "f7", time: "18:15", text: "NINE completed provisional review." },
  { id: "f8", time: "17:40", text: "Quarterly standings published." },
];

/** Feed lines pushed by Director triggers. */
export const triggeredFeed = {
  newContract: "New Tier Black contract routed to CROSS.",
  payment: "Payment released to CROSS.",
  message: "Client message delivered to CROSS.",
  completion: "CROSS completed a Class I contract.",
  accepted: "CROSS accepted a contract.",
};
