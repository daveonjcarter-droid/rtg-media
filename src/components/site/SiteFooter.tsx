import { Link } from "react-router-dom";
import { Instagram, Youtube, Twitter as X } from "lucide-react";

const SiteFooter = () => (
  <footer className="relative border-t border-border bg-ink mt-24 overflow-hidden">
    {/* Subtle grain + radial light */}
    <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60 grain" />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(355 78% 56% / 0.08), transparent 60%)",
      }}
    />

    {/* ============ BRAND MOMENT ============ */}
    <div className="relative container-rtg pt-20 md:pt-28 pb-10 md:pb-14 text-center">
      <h2
        className="footer-wordmark font-gothic text-cream"
        style={{ wordSpacing: "0.04em" }}
      >
        Runners&nbsp;To&nbsp;Greatness
      </h2>

      <div className="mt-6 md:mt-8 flex items-center justify-center gap-5 md:gap-10">
        <span className="h-px w-12 sm:w-20 md:w-28 bg-cream/35" />
        <span
          className="font-gothic text-cream leading-none tracking-[0.02em] text-3xl md:text-4xl"
          aria-label="RTG"
        >
          RTG
        </span>
        <span className="h-px w-12 sm:w-20 md:w-28 bg-cream/35" />
      </div>

      <p className="mt-6 max-w-xl mx-auto text-sm md:text-base text-cream/65 leading-relaxed uppercase tracking-[0.05em]">
        A MEDIA & PRODUCTION COMPANY. FOUNDED BY DAVEON J. CARTER & BRENDYN SHIELDS.
      </p>

      {/* Socials */}
      <div className="mt-8 flex items-center justify-center gap-7 text-cream/70">
        <a
          href="#"
          aria-label="Instagram"
          className="hover:text-primary transition-colors"
        >
          <Instagram className="h-6 w-6" />
        </a>
        <a
          href="#"
          aria-label="YouTube"
          className="hover:text-primary transition-colors"
        >
          <Youtube className="h-6 w-6" />
        </a>
        <a
          href="#"
          aria-label="X"
          className="hover:text-primary transition-colors"
        >
          <X className="h-6 w-6" />
        </a>
      </div>
    </div>

    {/* ============ NAV COLUMNS ============ */}
    <div className="relative border-t border-border/70">
      <div className="container-rtg py-12 md:py-14 grid grid-cols-2 md:grid-cols-3 gap-10">
        <FooterCol
          title="Company"
          links={[
            { to: "/about", label: "About" },
            { to: "/team", label: "Team" },
            { to: "/advertise", label: "Advertise" },
            { to: "/book", label: "Contact" },
            { to: "/apply", label: "Apply to Join" },
          ]}
        />

        <FooterCol
          title="Content"
          links={[
            { to: "/articles", label: "Articles" },
            { to: "/breakdown", label: "RTG Breakdown" },
            { to: "/portfolio", label: "Portfolio" },
            { to: "/services", label: "Services" },
          ]}
        />

        <FooterCol
          title="Internal"
          links={[
            { to: "/dashboard", label: "Team Dashboard" },
            { to: "/dashboard", label: "Editor Login" },
            { to: "/advertise", label: "Media Kit" },
          ]}
        />
      </div>
    </div>

    {/* ============ COLOPHON ============ */}
    <div className="relative border-t border-border/70">
      <div className="container-rtg py-7 flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <span className="text-[11px] uppercase tracking-[0.3em] text-cream/45">
          © {new Date().getFullYear()} RTG Media LLC · All rights reserved
        </span>
        <span
          className="font-gothic text-cream/80 text-xl md:text-2xl leading-none tracking-[0.04em]"
          aria-label="Issue 001 · Chicago · 2026"
        >
          Issue 001 · Chicago · MMXXVI
        </span>
        <a
          href="https://runnerstogreatness.com"
          className="text-[11px] uppercase tracking-[0.3em] text-cream/45 hover:text-primary transition-colors"
        >
          runnerstogreatness.com
        </a>
      </div>
    </div>
  </footer>
);

const FooterCol = ({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) => (
  <div>
    <div className="text-[10px] uppercase tracking-[0.35em] text-cream/40 font-bold mb-4">
      {title}
    </div>
    <ul className="space-y-2.5 text-sm">
      {links.map((l) => (
        <li key={l.label}>
          <Link
            to={l.to}
            className="text-cream/75 hover:text-primary transition-colors"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default SiteFooter;
