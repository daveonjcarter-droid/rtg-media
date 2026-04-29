// Shared primitives for all dashboard sections — built with forwardRef
// so they can be safely composed inside Reveal/animation wrappers.
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const PageHead = forwardRef<
  HTMLDivElement,
  { title: string; sub?: string; actions?: ReactNode; className?: string }
>(({ title, sub, actions, className }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-end justify-between gap-4 mb-5 pb-3 border-b border-border", className)}
  >
    <div>
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-1">{sub ?? "Section"}</div>
      <h2 className="font-display text-xl md:text-2xl uppercase leading-none">{title}</h2>
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap justify-end">{actions}</div>}
  </div>
));
PageHead.displayName = "PageHead";

export const StatCard = forwardRef<
  HTMLDivElement,
  {
    label: string;
    value: string | number;
    sub?: string;
    delta?: number; // percent change vs previous period
    accent?: string;
    onClick?: () => void;
  }
>(({ label, value, sub, delta, accent, onClick }, ref) => {
  const showDelta = typeof delta === "number" && Number.isFinite(delta);
  const positive = (delta ?? 0) >= 0;
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        "border border-border rounded-sm bg-surface/40 p-4 hover:bg-surface/60 transition-colors",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
        {accent && <span className={`h-1.5 w-1.5 rounded-full ${accent}`} />}
      </div>
      <div className="font-display text-3xl mt-1.5 leading-none">{value}</div>
      <div className="flex items-center gap-2 mt-1.5">
        {sub && <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{sub}</div>}
        {showDelta && (
          <span
            className={cn(
              "text-[10px] uppercase tracking-wider",
              positive ? "text-emerald-400" : "text-primary"
            )}
          >
            {positive ? "+" : ""}
            {delta!.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
});
StatCard.displayName = "StatCard";

export const EmptyState = forwardRef<
  HTMLDivElement,
  { icon: React.ComponentType<{ className?: string }>; title: string; body?: string; action?: ReactNode }
>(({ icon: Icon, title, body, action }, ref) => (
  <div ref={ref} className="border border-dashed border-border rounded-sm py-14 px-6 text-center">
    <Icon className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
    <div className="font-display uppercase text-base">{title}</div>
    {body && <div className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">{body}</div>}
    {action && <div className="mt-5">{action}</div>}
  </div>
));
EmptyState.displayName = "EmptyState";

export const SectionShell = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn("space-y-6", className)}>
      {children}
    </div>
  )
);
SectionShell.displayName = "SectionShell";
