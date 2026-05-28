import { ReactNode } from "react";
import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";

const SiteLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <SiteNav />
    <main className="flex-1">{children}</main>
    <SiteFooter />
    {/* Site-wide editorial texture — never interactive */}
    <div aria-hidden className="rtg-site-vignette" />
    <div aria-hidden className="rtg-site-grain" />
  </div>
);

export default SiteLayout;
