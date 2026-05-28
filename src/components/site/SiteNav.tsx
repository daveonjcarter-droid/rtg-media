import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown, ChevronUp } from "lucide-react";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";

type NavRow = { label: string; to: string; desc?: string };
type NavMenu = { label: string; header?: string; items: NavRow[] };
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
      { label: "Production", to: "/services", desc: "Full-service production" },
      { label: "Portfolio", to: "/portfolio", desc: "Selected work" },
      { label: "Book the Studio", to: "/book", desc: "Reserve a session" },
    ],
  },
  { label: "RTG Fest", to: "/fest" },
  {
    label: "Ecosystem",
    header: "Coming Soon",
    items: [
      { label: "RTG Studios", to: "/services", desc: "Creative production house" },
      { label: "RTG Breakdown", to: "/breakdown", desc: "Movies, TV, anime, comics" },
      { label: "RTG Film", to: "/services", desc: "Original films & docs" },
      { label: "RTG Tech", to: "/about", desc: "Platform & tooling" },
      { label: "RTG Fest", to: "/fest", desc: "Live culture events" },
    ],
  },
  {
    label: "About",
    items: [
      { label: "The Company", to: "/about" },
      { label: "The Book", to: "/book" },
    ],
  },
];

const isMenu = (e: NavEntry): e is NavMenu => "items" in e;

const rowClass =
  "group/row relative block px-5 py-3 outline-none transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.03]";
const titleClass =
  "font-bold uppercase tracking-wider text-[14px] text-foreground transition-colors group-hover/row:text-primary group-focus-visible/row:text-primary";
const descClass = "mt-0.5 text-[12px] text-muted-foreground";
const glowClass =
  "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-primary opacity-0 shadow-[0_0_18px_4px_hsl(var(--primary)/0.35)] transition-opacity group-hover/row:opacity-70 group-focus-visible/row:opacity-70";

const DesktopMenu = ({ menu }: { menu: NavMenu }) => {
  const [open, setOpen] = useState(false);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clearTimers = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };
  const scheduleOpen = () => {
    clearTimers();
    openTimer.current = window.setTimeout(() => setOpen(true), 80);
  };
  const scheduleClose = () => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
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
      onMouseEnter={scheduleOpen}
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
        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
      {open && (
        <div
          className="absolute left-0 top-full w-72 pt-2 animate-in fade-in-0 slide-in-from-top-1 duration-150"
          role="menu"
        >
          <div
            className="overflow-hidden rounded-sm border border-white/5 shadow-2xl"
            style={{ backgroundColor: "#141316" }}
          >
            {menu.header && (
              <div className="px-5 pt-3 pb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
                {menu.header}
              </div>
            )}
            <div className="py-1">
              {menu.items.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  data-menu-item
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={rowClass}
                >
                  <span className={titleClass}>{item.label}</span>
                  {item.desc && <span className={descClass}>{item.desc}</span>}
                  <span className={glowClass} aria-hidden />
                </Link>
              ))}
            </div>
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
                    {openMobile === entry.label ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {openMobile === entry.label && (
                    <div className="pb-3 pl-3 flex flex-col">
                      {entry.header && (
                        <span className="py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
                          {entry.header}
                        </span>
                      )}
                      {entry.items.map((item) => (
                        <Link
                          key={item.label}
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className="py-2 hover:text-primary"
                        >
                          <span className="block text-sm font-bold uppercase tracking-wider text-foreground/90">
                            {item.label}
                          </span>
                          {item.desc && (
                            <span className="block text-[12px] text-muted-foreground">
                              {item.desc}
                            </span>
                          )}
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
