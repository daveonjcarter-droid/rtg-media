import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** retained for API compatibility — no longer applies motion */
  delay?: number;
  y?: number;
  once?: boolean;
};

/**
 * Editorial restraint: most content should just be present.
 * Reveal is now a pass-through wrapper that preserves layout but removes
 * the universal fade-up-on-scroll. The asterisk ticker remains the only
 * signature animated moment on the site.
 */
const Reveal = ({ children, className }: RevealProps) => (
  <div className={cn(className)}>{children}</div>
);

export default Reveal;
