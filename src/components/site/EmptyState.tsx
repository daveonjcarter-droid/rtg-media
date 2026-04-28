import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  tone?: "dark" | "light";
  children?: ReactNode;
  className?: string;
};

/**
 * RTG-branded empty state. Use anywhere fake/seed content used to live.
 * Keeps page structure intact while signalling pre-launch intentionality.
 */
const EmptyState = ({
  eyebrow = "RTG Media",
  title,
  description,
  icon: Icon,
  tone = "light",
  children,
  className = "",
}: EmptyStateProps) => {
  const isDark = tone === "dark";
  return (
    <div
      className={`relative w-full overflow-hidden ${
        isDark ? "bg-ink text-cream grain-heavy" : "bg-surface/40"
      } border border-border ${className}`}
    >
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
      </div>
    </div>
  );
};

export default EmptyState;
