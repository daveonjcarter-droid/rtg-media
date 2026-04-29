import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/articles", label: "Articles" },
  { to: "/breakdown", label: "RTG Breakdown" },
  { to: "/services", label: "Production" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/book", label: "Book" },
  { to: "/about", label: "About" },
  { to: "/fest", label: "RTG Fest" },
];

const ECOSYSTEM = [
  { label: "RTG Studios", desc: "Creative production house", to: undefined as string | undefined },
  { label: "RTG Breakdown", desc: "Movies, TV, anime, comics", to: "/breakdown" },
  { label: "RTG Film", desc: "Original films & docs", to: undefined },
  { label: "RTG Tech", desc: "Platform & tooling", to: undefined },
  { label: "RTG Fest", desc: "Live culture events", to: "/fest" },
];

const SiteNav = () => {
  const [open, setOpen] = useState(false);
  const [eco, setEco] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container-rtg flex h-16 items-center justify-between gap-6">
        <Logo tone="auto" className="h-9" to="/" ariaLabel="RTG Media" />

        <nav className="hidden lg:flex items-center gap-7 text-sm">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                `uppercase tracking-wider font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
          <div
            className="relative"
            onMouseEnter={() => setEco(true)}
            onMouseLeave={() => setEco(false)}
          >
            <button className="flex items-center gap-1 uppercase tracking-wider text-sm font-medium text-muted-foreground hover:text-foreground">
              Ecosystem <ChevronDown className="h-3 w-3" />
            </button>
            {eco && (
              <div className="absolute right-0 top-full pt-3 w-72">
                <div className="rounded-sm border border-border bg-card shadow-2xl overflow-hidden">
                  <div className="px-4 py-2 eyebrow border-b border-border">Coming soon</div>
                  {ECOSYSTEM.map((e) => {
                    const inner = (
                      <div className="px-4 py-3 hover:bg-secondary cursor-pointer transition-colors">
                        <div className="font-display text-lg leading-none">{e.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{e.desc}</div>
                      </div>
                    );
                    return e.to ? (
                      <Link key={e.label} to={e.to}>{inner}</Link>
                    ) : (
                      <div key={e.label}>{inner}</div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden md:inline-flex text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Studio
          </Link>
          <Button asChild variant="default" size="sm" className="hidden md:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm uppercase tracking-wider">
            <Link to="/book">Book Now</Link>
          </Button>
          <button
            className="lg:hidden p-2 -mr-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="container-rtg py-4 flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-3 uppercase tracking-wider text-sm font-medium border-b border-border/50 ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <Link to="/book" onClick={() => setOpen(false)} className="mt-3 text-center bg-primary text-primary-foreground py-3 uppercase tracking-wider text-sm font-medium rounded-sm">
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteNav;
