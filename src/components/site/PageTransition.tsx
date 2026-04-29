import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

/**
 * Route-keyed cinematic fade. Re-mounts on path change so the CSS
 * keyframe replays. Pure CSS — no framer-motion dependency.
 */
const PageTransition = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
};

export default PageTransition;
