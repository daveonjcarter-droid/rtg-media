// Phase 2 business helpers — clients, quotes, invoices, threads.
export type ClientStatus = "lead" | "active" | "past" | "vip";
export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "expired";
export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "overdue" | "void" | "refunded";
export type PaymentStatus = "unpaid" | "partial" | "paid" | "failed" | "refunded";
export type ThreadKind = "project" | "booking" | "client" | "direct" | "team";

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  lead: "Lead",
  active: "Active",
  past: "Past",
  vip: "VIP",
};

export const CLIENT_STATUS_TONE: Record<ClientStatus, string> = {
  lead: "border-amber-500/40 text-amber-300/90",
  active: "border-emerald-500/40 text-emerald-300/90",
  past: "border-muted-foreground/30 text-muted-foreground",
  vip: "border-primary/60 text-primary",
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
};

export const QUOTE_TONE: Record<QuoteStatus, string> = {
  draft: "border-muted-foreground/30 text-muted-foreground",
  sent: "border-blue-500/40 text-blue-300/90",
  approved: "border-emerald-500/40 text-emerald-300/90",
  rejected: "border-red-500/40 text-red-300/90",
  expired: "border-amber-500/40 text-amber-300/90",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  partial: "Partial",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
  refunded: "Refunded",
};

export const INVOICE_TONE: Record<InvoiceStatus, string> = {
  draft: "border-muted-foreground/30 text-muted-foreground",
  sent: "border-blue-500/40 text-blue-300/90",
  partial: "border-amber-500/40 text-amber-300/90",
  paid: "border-emerald-500/40 text-emerald-300/90",
  overdue: "border-red-500/40 text-red-300/90",
  void: "border-muted-foreground/30 text-muted-foreground line-through",
  refunded: "border-amber-500/40 text-amber-300/90",
};

export const formatMoney = (n: number | null | undefined, currency = "USD") => {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(v);
};

export const computeQuoteTotal = (base: number, addons: number, discount: number, tax: number) =>
  Math.max(0, (Number(base) || 0) + (Number(addons) || 0) - (Number(discount) || 0) + (Number(tax) || 0));
