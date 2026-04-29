import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/tracking";

/**
 * Mounted once at the app root. Records a page view on every route change
 * for public pages. Admin/auth routes are filtered out inside trackPageView.
 */
const PageViewTracker = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView({ path: pathname });
  }, [pathname]);
  return null;
};

export default PageViewTracker;
