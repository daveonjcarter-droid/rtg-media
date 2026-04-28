import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/rtg-logo-light.png";
import logoDark from "@/assets/rtg-logo-dark.png";

interface LogoProps {
  /** "light" => use white logo (for dark backgrounds). "dark" => black logo (for light bgs). "auto" uses both & swaps via .light-section parent */
  tone?: "light" | "dark" | "auto";
  /** Tailwind sizing classes for height */
  className?: string;
  to?: string | null;
  ariaLabel?: string;
}

const Logo = ({ tone = "light", className, to = "/", ariaLabel = "RTG Media — Home" }: LogoProps) => {
  const img = (
    <span
      className={cn(
        "inline-block transition-transform duration-300 ease-out will-change-transform",
        to && "hover:scale-[1.04] hover:drop-shadow-[0_0_18px_hsl(var(--primary)/0.45)]",
        className
      )}
    >
      {tone === "auto" ? (
        <>
          <img
            src={logoLight}
            alt=""
            aria-hidden
            className="h-full w-auto select-none pointer-events-none block dark-only"
            draggable={false}
          />
          <img
            src={logoDark}
            alt=""
            aria-hidden
            className="h-full w-auto select-none pointer-events-none hidden light-only"
            draggable={false}
          />
        </>
      ) : (
        <img
          src={tone === "light" ? logoLight : logoDark}
          alt="RTG Media"
          className="h-full w-auto select-none block"
          draggable={false}
        />
      )}
    </span>
  );

  if (!to) return img;

  return (
    <Link to={to} aria-label={ariaLabel} className="inline-flex items-center shrink-0">
      {img}
    </Link>
  );
};

export default Logo;
