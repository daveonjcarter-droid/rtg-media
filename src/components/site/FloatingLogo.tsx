import { Link } from "react-router-dom";

/**
 * Gothic street watermark — text-only RTG wordmark over an irregular CSS mist.
 * No image asset is used here so the mark remains fully transparent.
 */
const FloatingLogo = () => {
  return (
    <Link
      to="/"
      aria-label="RTG Media — Home"
      className="floating-rtg-logo group fixed top-3 left-3 md:top-5 md:left-5 z-[60] block cursor-pointer select-none bg-transparent border-0 shadow-none"
    >
      <span className="relative z-10 flex w-[108px] flex-col items-start leading-none md:w-[150px] transition-all duration-300 ease-out will-change-transform group-hover:scale-105 group-hover:brightness-110">
        <span className="font-gothic text-[2.85rem] md:text-[4rem] leading-[0.78] tracking-normal">RTG</span>
        <span className="font-display text-[1.45rem] md:text-[2.05rem] leading-[0.82] tracking-[0.08em]">MEDIA</span>
        <span className="mt-1 font-gothic text-[0.82rem] md:text-[1.04rem] leading-[0.9] tracking-normal whitespace-nowrap">Runners To Greatness</span>
        <span className="mt-1 flex w-full items-center justify-between font-display text-[0.62rem] md:text-[0.78rem] leading-none tracking-[0.12em] uppercase">
          <span> </span>
          <span>Chicago</span>
        </span>
      </span>
    </Link>
  );
};

export default FloatingLogo;
