import { Link, useLocation } from "react-router-dom";

/**
 * RTG floating watermark.
 * - Public site: bold top-left ink/spray mark.
 * - Dashboard / admin routes: subtle bottom-right watermark, no box.
 */
const FloatingLogo = () => {
  const { pathname } = useLocation();
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) {
    return (
      <Link
        to="/"
        aria-label="RTG Media — Back to public site"
        title="Back to public site"
        className="fixed bottom-3 right-3 md:bottom-5 md:right-5 z-[60] block select-none bg-transparent border-0 shadow-none opacity-25 hover:opacity-60 transition-opacity duration-300"
      >
        <span className="flex w-[60px] md:w-[90px] flex-col items-end leading-none text-foreground">
          <span className="font-gothic text-[1.9rem] md:text-[2.6rem] leading-[0.78] tracking-normal">RTG</span>
          <span className="mt-1 font-sans text-[0.45rem] md:text-[0.55rem] leading-tight tracking-[0.22em] uppercase whitespace-nowrap font-medium">
            Studio
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      to="/"
      aria-label="RTG Media — Home"
      className="floating-rtg-logo group fixed top-3 left-3 md:top-5 md:left-5 z-[60] block cursor-pointer select-none bg-transparent border-0 shadow-none"
    >
      <span className="relative z-10 flex w-[100px] md:w-[150px] flex-col items-start leading-none transition-all duration-300 ease-out will-change-transform group-hover:scale-105 group-hover:brightness-110">
        <span className="font-gothic text-[2.9rem] md:text-[4.1rem] leading-[0.78] tracking-normal">RTG</span>
        <span className="font-gothic text-[1.45rem] md:text-[2.05rem] leading-[0.82] tracking-normal -mt-1">{"\n"}</span>
        <span className="mt-1.5 font-sans text-[0.55rem] md:text-[0.66rem] leading-tight tracking-[0.22em] uppercase whitespace-nowrap font-medium opacity-85 my-px py-[25px]">
          Runners To Greatness · Chicago
        </span>
      </span>
    </Link>
  );
};

export default FloatingLogo;
