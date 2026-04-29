import { Link } from "react-router-dom";
import { Instagram, Youtube, Twitter } from "lucide-react";
import Logo from "./Logo";

const SiteFooter = () => (
  <footer className="border-t border-border bg-ink mt-24">
    <div className="container-rtg py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
      <div className="col-span-2">
        <Logo tone="light" className="h-14" />
        <p className="mt-5 max-w-sm text-sm text-muted-foreground leading-relaxed">
          Runners To Greatness. A Black-owned Chicago media & production company documenting culture and creating visual stories that last.
        </p>
        <div className="flex items-center gap-4 mt-6 text-muted-foreground">
          <a href="#" aria-label="Instagram" className="hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
          <a href="#" aria-label="YouTube" className="hover:text-primary transition-colors"><Youtube className="h-5 w-5" /></a>
          <a href="#" aria-label="Twitter" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
        </div>
      </div>

      <FooterCol title="Company" links={[
        { to: "/about", label: "About" },
        { to: "/team", label: "Team" },
        { to: "/advertise", label: "Advertise" },
        { to: "/book", label: "Contact" },
      ]} />

      <FooterCol title="Content" links={[
        { to: "/articles", label: "Articles" },
        { to: "/breakdown", label: "RTG Breakdown" },
        { to: "/portfolio", label: "Portfolio" },
        { to: "/services", label: "Services" },
      ]} />

      <FooterCol title="Internal" links={[
        { to: "/dashboard", label: "Team Dashboard" },
        { to: "/dashboard", label: "Editor Login" },
        { to: "/advertise", label: "Media Kit" },
      ]} />
    </div>

    <div className="border-t border-border">
      <div className="container-rtg py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} RTG Media. All rights reserved.</span>
        <span className="font-gothic text-base text-foreground/70">Runners To Greatness&nbsp; ·&nbsp; &nbsp;Chicago</span>
      </div>
    </div>
  </footer>
);

const FooterCol = ({ title, links }: { title: string; links: { to: string; label: string }[] }) => (
  <div>
    <div className="eyebrow mb-4">{title}</div>
    <ul className="space-y-2.5 text-sm">
      {links.map((l) => (
        <li key={l.label}>
          <Link to={l.to} className="text-foreground/80 hover:text-primary transition-colors">{l.label}</Link>
        </li>
      ))}
    </ul>
  </div>
);

export default SiteFooter;
