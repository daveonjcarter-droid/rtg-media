// StatusBadge — unified status color system across the dashboard.
// Red = urgent · Yellow = review · Blue = scheduled · Green = complete · Gray = inactive
import { cn } from "@/lib/utils";

export type StatusTone = "red" | "yellow" | "blue" | "green" | "gray";

const TONE_CLASS: Record<StatusTone, string> = {
  red: "bg-primary/15 text-primary border-primary/30",
  yellow: "bg-gold/15 text-gold border-gold/30",
  blue: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  gray: "bg-muted/40 text-muted-foreground border-border",
};

const TONE_DOT: Record<StatusTone, string> = {
  red: "bg-primary",
  yellow: "bg-gold",
  blue: "bg-sky-400",
  green: "bg-emerald-400",
  gray: "bg-muted-foreground",
};

// Map any string status across the app to a tone.
export const toneFor = (status: string | null | undefined): StatusTone => {
  if (!status) return "gray";
  const s = status.toLowerCase();
  if (["new", "urgent", "rejected", "failed", "error", "overdue", "submitted_review"].includes(s)) return "red";
  if (["submitted", "review", "revisions", "pending", "in_review", "needs_review", "in-progress", "in_progress"].includes(s)) return "yellow";
  if (["scheduled", "approved", "assigned", "confirmed", "booked"].includes(s)) return "blue";
  if (["published", "live", "completed", "complete", "active", "done", "delivered", "paid"].includes(s)) return "green";
  if (["draft", "archived", "inactive", "cancelled", "canceled", "deleted"].includes(s)) return "gray";
  return "gray";
};

export const StatusBadge = ({
  status, tone, label, className, dot = true,
}: {
  status?: string;
  tone?: StatusTone;
  label?: string;
  className?: string;
  dot?: boolean;
}) => {
  const t = tone ?? toneFor(status);
  const text = label ?? (status ? status.replace(/_/g, " ") : "—");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-[10px] uppercase tracking-widest font-medium",
        TONE_CLASS[t],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[t])} />}
      {text}
    </span>
  );
};

export default StatusBadge;
