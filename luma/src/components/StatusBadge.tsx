import type { OperatorStatus } from "../data/types";

const toneFor = (s: string) => {
  if (["ONLINE", "AVAILABLE", "VERIFIED", "CLEARED", "CONTRACT ACTIVE", "ACTIVE"].includes(s)) return "on";
  if (["IN FIELD", "PENDING"].includes(s)) return "field";
  if (["SUSPENDED", "SEVERE", "HELD"].includes(s)) return "warn";
  return "off";
};

export function StatusBadge({ status, label, big }: { status: OperatorStatus | string; label?: string; big?: boolean }) {
  return (
    <span className={`badge badge--${toneFor(status)} ${big ? "badge--big" : ""}`}>
      <i className="badge__dot" />
      {label ?? status}
    </span>
  );
}

export function RiskTag({ risk }: { risk: string }) {
  return <span className={`risk risk--${risk.toLowerCase()}`}>RISK: {risk}</span>;
}
