import { Link } from "react-router-dom";
import logoLight from "@/assets/rtg-logo-light.png";

/**
 * Gothic street watermark — white RTG mark over a gritty, irregular black vignette.
 * Layers (bottom → top):
 *  1. Two offset, blurred radial blobs (irregular, ink-bleed shape)
 *  2. SVG turbulence noise masked by a radial fade (grain on the vignette only)
 *  3. The logo itself with a soft drop shadow
 */
const FloatingLogo = () => {
  return (
    <Link
      to="/"
      aria-label="RTG Media — Home"
      className="group fixed top-3 left-3 md:top-5 md:left-5 z-[60] block cursor-pointer select-none"
    >
      <div className="relative w-[95px] md:w-[145px]">
        {/* Vignette layer 1 — main ink bleed (off-center, blurred, irregular) */}
        <span
          aria-hidden
          className="pointer-events-none absolute -z-10 left-1/2 top-1/2 w-[280px] h-[230px] md:w-[380px] md:h-[320px] blur-[14px]"
          style={{
            transform: "translate(-52%, -48%) rotate(-6deg)",
            background:
              "radial-gradient(60% 55% at 48% 52%, hsl(0 0% 0% / 0.85) 0%, hsl(0 0% 0% / 0.65) 28%, hsl(0 0% 0% / 0.35) 55%, hsl(0 0% 0% / 0.12) 75%, transparent 92%)",
          }}
        />
        {/* Vignette layer 2 — secondary smear for irregularity */}
        <span
          aria-hidden
          className="pointer-events-none absolute -z-10 left-1/2 top-1/2 w-[220px] h-[180px] md:w-[300px] md:h-[240px] blur-[22px]"
          style={{
            transform: "translate(-42%, -58%) rotate(8deg)",
            background:
              "radial-gradient(55% 60% at 60% 40%, hsl(0 0% 0% / 0.55) 0%, hsl(0 0% 0% / 0.25) 50%, transparent 85%)",
          }}
        />
        {/* Grain / noise masked to vignette area */}
        <span
          aria-hidden
          className="pointer-events-none absolute -z-10 left-1/2 top-1/2 w-[280px] h-[230px] md:w-[380px] md:h-[320px] opacity-60 mix-blend-overlay"
          style={{
            transform: "translate(-52%, -48%)",
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            WebkitMaskImage:
              "radial-gradient(60% 55% at 50% 50%, black 20%, rgba(0,0,0,0.6) 50%, transparent 85%)",
            maskImage:
              "radial-gradient(60% 55% at 50% 50%, black 20%, rgba(0,0,0,0.6) 50%, transparent 85%)",
          }}
        />

        {/* Logo */}
        <img
          src={logoLight}
          alt="RTG Media"
          draggable={false}
          className="relative block w-full h-auto transition-all duration-300 ease-out will-change-transform group-hover:scale-105 group-hover:brightness-110 drop-shadow-[0_6px_14px_rgba(0,0,0,0.7)]"
        />
      </div>
    </Link>
  );
};

export default FloatingLogo;
