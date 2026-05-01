import { ReactNode, forwardRef } from "react";
import { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  icon?: LucideIcon;
  tone?: "dark" | "light";
  /** Pre-launch ribbon text. Defaults to "First drops coming soon". */
  ribbon?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * RTG-branded pre-launch state. Reads as intentional, not unfinished:
 * crosshair frame, faint editorial number, and a "first drops coming soon" ribbon.
 */
const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(({
  eyebrow = "RTG Media",
  title,
  description,
  icon: Icon,
  tone = "light",
  ribbon = "First drops coming soon",
  children,
  className = "",
}, ref) => {
  const isDark = tone === "dark";
  return (
    <div
      ref={ref}
      className={`relative w-full overflow-hidden ${
        isDark ? "bg-ink text-cream grain-heavy" : "bg-surface/40"
      } border border-border ${className}`}
    >
      {/* Faint editorial number */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-2 -top-6 type-mega text-[10rem] md:text-[16rem] leading-none select-none ${
          isDark ? "text-cream/[0.04]" : "text-foreground/[0.05]"
        }`}
      >
        001
      </div>

      {/* Corner crosshairs */}
      {[
        "top-3 left-3 border-l border-t",
        "top-3 right-3 border-r border-t",
        "bottom-3 left-3 border-l border-b",
        "bottom-3 right-3 border-r border-b",
      ].map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={`absolute h-4 w-4 ${pos} ${
            isDark ? "border-cream/40" : "border-foreground/30"
          }`}
        />
      ))}

      {/* Bow-style editorial ribbon — fully contained, never clipped */}
      <div aria-hidden className="bow-ribbon">
        <span>{ribbon}</span>
      </div>

      <div className="relative px-6 py-16 md:px-12 md:py-24 flex flex-col items-center text-center">
        {Icon && (
          <div
            className={`mb-6 h-14 w-14 flex items-center justify-center border ${
              isDark ? "border-cream/30 text-cream/80" : "border-border text-muted-foreground"
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div
          className={`text-[10px] uppercase tracking-[0.4em] mb-4 ${
            isDark ? "text-primary" : "text-primary"
          }`}
        >
          {eyebrow}
        </div>
        <h3
          className={`type-mega text-3xl md:text-5xl leading-[0.95] max-w-2xl ${
            isDark ? "text-cream" : ""
          }`}
        >
          {title}
        </h3>
        {description && (
          <p
            className={`mt-5 max-w-md text-sm md:text-base ${
              isDark ? "text-cream/70" : "text-muted-foreground"
            }`}
          >
            {description}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}

        {/* Issue stamp */}
        <div
          className={`mt-10 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] ${
            isDark ? "text-cream/50" : "text-muted-foreground"
          }`}
        >
          <span className="h-px w-8 bg-current" />
          Issue 001 · Spring 2026
          <span className="h-px w-8 bg-current" />
        </div>
      </div>
    </div>
  );
});

EmptyState.displayName = "EmptyState";

export default EmptyState;
