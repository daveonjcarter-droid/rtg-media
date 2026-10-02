// Shared shapes for all LUMA mock data. Everything here is fictional.

export type Risk = "LOW" | "MODERATE" | "HIGH" | "SEVERE";

export type OperatorStatus =
  | "ONLINE"
  | "OFFLINE"
  | "IN FIELD"
  | "AVAILABLE"
  | "CONTRACT ACTIVE"
  | "SUSPENDED";

export interface Contract {
  id: string;
  ref: string;
  subject: string;
  city: string;
  value: number;
  windowHours: number;
  classification: string;
  risk: Risk;
  /** Optional path to a B&W photo dropped into /public/photos. Falls back to a generated halftone portrait. */
  photo?: string;
  /** Seed for the generated portrait silhouette (any integer). */
  portraitSeed: number;
  brief: string;
  restrictions: string[];
  clientVerification: string;
  client: string;
  notes: string[];
}

export interface Operator {
  id: string;
  codename: string;
  status: OperatorStatus;
  specialty: string;
  region: string;
  tier: "BLACK" | "SLATE" | "WHITE" | "PROVISIONAL";
  standing: number;
  completion: number;
  discretion: number;
  contractValue: number;
  responseRating: number;
  /** Seed for the 8-bit avatar (any integer). */
  avatarSeed: number;
  joined: string;
}

export interface FeedItem {
  id: string;
  time: string;
  text: string;
  tone?: "neutral" | "accent" | "warn";
}

export interface Message {
  id: string;
  from: string;
  time: string;
  subject: string;
  body: string;
  unread?: boolean;
}

export interface Payment {
  id: string;
  ref: string;
  date: string;
  amount: number;
  status: "CLEARED" | "PENDING" | "HELD";
  memo: string;
}

/** A scripted response: dots, then lines that appear one by one. */
export interface SequenceStep {
  kind: "dots" | "line";
  text?: string;
  /** how long this step holds before the next one starts (ms) */
  ms: number;
  size?: "sm" | "md" | "lg" | "xl";
}
