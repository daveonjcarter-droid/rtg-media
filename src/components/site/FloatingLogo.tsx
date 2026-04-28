import { Link } from "react-router-dom";
import logoLight from "@/assets/rtg-logo-light.png";

const FloatingLogo = () => {
  return (
    <Link
      to="/"
      aria-label="RTG Media — Home"
      className="group fixed top-3 left-3 md:top-5 md:left-5 z-[60] block cursor-pointer select-none"
    >
      {/* Soft cinematic vignette behind logo */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] md:w-[340px] md:h-[340px] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(closest-side, hsl(0 0% 0% / 0.55), hsl(0 0% 0% / 0.25) 45%, transparent 75%)",
        }}
      />
      <img
        src={logoLight}
        alt="RTG Media"
        draggable={false}
        className="relative w-[95px] md:w-[145px] h-auto transition-all duration-300 ease-out will-change-transform group-hover:scale-105 group-hover:brightness-110 drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)]"
      />
    </Link>
  );
};

export default FloatingLogo;
