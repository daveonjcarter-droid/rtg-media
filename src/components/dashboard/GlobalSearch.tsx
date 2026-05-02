// Global search palette — debounced multi-table query (profiles, articles, bookings, portfolio).
// Trigger: header search box (click or ⌘K). Result click navigates to a relevant dashboard section.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Briefcase, User, Camera, Loader2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

type Result =
  | { kind: "profile"; id: string; title: string; sub: string; section: string }
  | { kind: "article"; id: string; title: string; sub: string; section: string }
  | { kind: "booking"; id: string; title: string; sub: string; section: string }
  | { kind: "portfolio"; id: string; title: string; sub: string; section: string };

const ICONS: Record<Result["kind"], any> = {
  profile: User,
  article: FileText,
  booking: Briefcase,
  portfolio: Camera,
};

const KIND_LABEL: Record<Result["kind"], string> = {
  profile: "Person",
  article: "Article",
  booking: "Booking",
  portfolio: "Portfolio",
};

export const GlobalSearch = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ("");
      setResults([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const term = q.trim();
    const handle = setTimeout(async () => {
      const like = `%${term}%`;
      const [{ data: profiles }, { data: articles }, { data: bookings }, { data: portfolios }] = await Promise.all([
        supabase
          .from("profile_meta")
          .select("user_id, display_name, email, role_type")
          .or(`display_name.ilike.${like},email.ilike.${like},full_name.ilike.${like}`)
          .limit(5),
        supabase
          .from("articles")
          .select("id, title, status, category, slug")
          .or(`title.ilike.${like},category.ilike.${like},slug.ilike.${like}`)
          .limit(6),
        supabase
          .from("bookings")
          .select("id, name, email, project_type, status, project_date")
          .or(`name.ilike.${like},email.ilike.${like},project_type.ilike.${like}`)
          .limit(5),
        supabase
          .from("portfolio_items")
          .select("id, title, category, client")
          .or(`title.ilike.${like},category.ilike.${like},client.ilike.${like}`)
          .limit(4),
      ]);

      const merged: Result[] = [
        ...(profiles ?? []).map((p: any) => ({
          kind: "profile" as const,
          id: p.user_id,
          title: p.display_name || p.email,
          sub: [p.role_type, p.email].filter(Boolean).join(" · "),
          section: "users",
        })),
        ...(articles ?? []).map((a: any) => ({
          kind: "article" as const,
          id: a.id,
          title: a.title,
          sub: [a.status, a.category].filter(Boolean).join(" · "),
          section:
            a.status === "draft" ? "drafts" :
            a.status === "submitted" ? "submitted" :
            a.status === "scheduled" ? "scheduled" :
            a.status === "published" ? "published" : "drafts",
        })),
        ...(bookings ?? []).map((b: any) => ({
          kind: "booking" as const,
          id: b.id,
          title: b.name + (b.project_type ? ` — ${b.project_type}` : ""),
          sub: [b.status, b.project_date].filter(Boolean).join(" · "),
          section: "bookings",
        })),
        ...(portfolios ?? []).map((p: any) => ({
          kind: "portfolio" as const,
          id: p.id,
          title: p.title,
          sub: [p.category, p.client].filter(Boolean).join(" · "),
          section: "portfolio",
        })),
      ];
      setResults(merged);
      setActiveIdx(0);
      setLoading(false);
    }, 220);

    return () => clearTimeout(handle);
  }, [q]);

  const grouped = useMemo(() => {
    const g: Record<Result["kind"], Result[]> = { profile: [], article: [], booking: [], portfolio: [] };
    results.forEach((r) => g[r.kind].push(r));
    return g;
  }, [results]);

  const flatList = useMemo(
    () => [...grouped.profile, ...grouped.article, ...grouped.booking, ...grouped.portfolio],
    [grouped]
  );

  const select = (r: Result) => {
    onOpenChange(false);
    navigate(`/dashboard/${r.section}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(0, flatList.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = flatList[activeIdx];
      if (r) select(r);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden border-border bg-[#080808]">
        <div className="flex items-center gap-2 px-4 h-12 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search users, articles, bookings, media…"
            className="flex-1 h-full bg-transparent outline-none text-sm placeholder:text-muted-foreground text-cream"
          />
          {loading && <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />}
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {!q.trim() && (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              <Search className="h-6 w-6 mx-auto mb-2 opacity-40" />
              Start typing to search across the platform.
              <div className="mt-2 text-[10px] uppercase tracking-widest opacity-60">
                Profiles · Articles · Bookings · Portfolio
              </div>
            </div>
          )}

          {q.trim().length >= 2 && !loading && results.length === 0 && (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              No matches for "{q}".
            </div>
          )}

          {(["profile", "article", "booking", "portfolio"] as Result["kind"][]).map((kind) => {
            const list = grouped[kind];
            if (list.length === 0) return null;
            const Icon = ICONS[kind];
            return (
              <div key={kind} className="border-b border-border/40 last:border-0">
                <div className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                  {KIND_LABEL[kind]}
                </div>
                {list.map((r) => {
                  const idx = flatList.indexOf(r);
                  const active = idx === activeIdx;
                  return (
                    <button
                      key={`${r.kind}-${r.id}`}
                      onClick={() => select(r)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        active ? "bg-primary/10 border-l-2 border-l-primary" : "border-l-2 border-l-transparent hover:bg-surface/40"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-cream truncate">{r.title}</div>
                        {r.sub && <div className="text-[10px] text-muted-foreground truncate uppercase tracking-wider mt-0.5">{r.sub}</div>}
                      </div>
                      <ArrowRight className={`h-3 w-3 shrink-0 ${active ? "text-primary" : "text-muted-foreground/40"}`} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[9px] uppercase tracking-widest text-muted-foreground">
          <div>↑↓ navigate · ↵ open</div>
          <div>Live results</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
