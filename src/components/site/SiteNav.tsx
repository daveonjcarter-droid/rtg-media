import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";

type NavItem = { label: string; to: string };
type NavMenu = { label: string; items: NavItem[] };
type NavEntry = NavMenu | { label: string; to: string };

const MENUS: NavEntry[] = [
  {
    label: "The Magazine",
    items: [
      { label: "Articles", to: "/articles" },
      { label: "RTG Breakdown", to: "/breakdown" },
      { label: "RTG Picks", to: "/articles" },
    ],
  },
  {
    label: "Studio",
    items: [
      { label: "Production", to: "/services" },
      { label: "Portfolio", to: "/portfolio" },
      { label: "Book the Studio", to: "/book" },
    ],
  },
  { label: "RTG Fest", to: "/fest" },
  {
    label: "About",
    items: [
      { label: "About / The Company", to: "/about" },
      { label: "Ecosystem", to: "/about" },
      { label: "The Book", to: "/book" },
    ],
  },
];

const isMenu = (e: NavEntry): e is NavMenu => "items" in e;

const DesktopMenu = ({ menu }: { menu: NavMenu }) => {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const links = Array.from(
          containerRef.current?.querySelectorAll<HTMLAnchorElement>("[data-menu-item]") ?? []
        );
        if (!links.length) return;
        const idx = links.findIndex((l) => l === document.activeElement);
        const next =
          e.key === "ArrowDown"
            ? links[(idx + 1) % links.length]
            : links[(idx - 1 + links.length) % links.length];
        next?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`nav-underline flex items-center gap-1 uppercase tracking-wider text-sm font-medium transition-colors ${
          open ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {menu.label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-3 w-64 menu-in" role="menu">
          <div className="rounded-sm border border-border bg-card shadow-2xl overflow-hidden">
            {menu.items.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                data-menu-item
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm uppercase tracking-wider text-foreground/90 hover:bg-secondary hover:text-primary focus:bg-secondary focus:text-primary outline-none transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SiteNav = () => {
  const [open, setOpen] = useState(false);
  const [openMobile, setOpenMobile] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    setOpenMobile(null);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container-rtg flex h-16 items-center justify-between gap-6">
        <Logo tone="auto" className="h-9 logo-hover" to="/" ariaLabel="RTG Media — Home" />

        <nav className="hidden lg:flex items-center gap-7 text-sm" aria-label="Primary">
          {MENUS.map((entry) =>
            isMenu(entry) ? (
              <DesktopMenu key={entry.label} menu={entry} />
            ) : (
              <NavLink
                key={entry.label}
                to={entry.to}
                className={({ isActive }) =>
                  `nav-underline uppercase tracking-wider font-medium transition-colors ${
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {entry.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="default"
            size="sm"
            className="btn-cinematic hidden md:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm uppercase tracking-wider"
          >
            <Link to="/book">Book Now</Link>
          </Button>
          <button
            className="lg:hidden p-2 -mr-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background mobile-menu-in">
          <div className="container-rtg py-4 flex flex-col gap-1">
            {MENUS.map((entry) =>
              isMenu(entry) ? (
                <div key={entry.label} className="border-b border-border/50">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMobile((m) => (m === entry.label ? null : entry.label))
                    }
                    aria-expanded={openMobile === entry.label}
                    className="w-full flex items-center justify-between py-3 uppercase tracking-wider text-sm font-medium text-muted-foreground"
                  >
                    {entry.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        openMobile === entry.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openMobile === entry.label && (
                    <div className="pb-2 pl-3 flex flex-col">
                      {entry.items.map((item) => (
                        <Link
                          key={item.label}
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className="py-2 text-sm uppercase tracking-wider text-foreground/80 hover:text-primary"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  key={entry.label}
                  to={entry.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `py-3 uppercase tracking-wider text-sm font-medium border-b border-border/50 ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`
                  }
                >
                  {entry.label}
                </NavLink>
              )
            )}
            <Link
              to="/book"
              onClick={() => setOpen(false)}
              className="mt-3 text-center bg-primary text-primary-foreground py-3 uppercase tracking-wider text-sm font-medium rounded-sm"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteNav;
