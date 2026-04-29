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
      className="floating-rtg-logo group fixed top-4 left-4 md:top-6 md:left-6 z-[60] block cursor-pointer select-none bg-transparent border-0 shadow-none"
    >
      <span className="relative z-10 flex w-[150px] md:w-[210px] flex-col items-start leading-none transition-all duration-300 ease-out will-change-transform group-hover:scale-105 group-hover:brightness-110">
        <span className="font-gothic text-[4.25rem] md:text-[5.75rem] leading-[0.78] tracking-normal">RTG</span>
        <span className="font-gothic text-[2.1rem] md:text-[2.85rem] leading-[0.82] tracking-normal -mt-1">MEDIA</span>
        <span className="mt-2 font-sans text-[0.7rem] md:text-[0.78rem] leading-tight tracking-[0.22em] uppercase whitespace-nowrap font-medium opacity-90">
          Runners To Greatness · Chicago
        </span>
      </span>
    </Link>
  );
};

export default FloatingLogo;
