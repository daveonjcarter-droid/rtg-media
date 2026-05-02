// Command Palette — fuses live multi-table search with quick navigation actions.
// Arrow keys + Enter to select. ⌘K to open. Includes "Go to" actions for every
// dashboard section the user has access to, plus create shortcuts.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, FileText, Briefcase, User, Camera, Loader2, ArrowRight,
  Plus, Calendar, Mail, Image as ImageIcon, Upload, BarChart3,
  Users as UsersIcon, FileEdit, Inbox, Send, Clock, Settings as SettingsIcon,
  Activity, Compass,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { can, type SectionId } from "@/lib/permissions";

type SearchResult =
  | { type: "result"; kind: "profile"; id: string; title: string; sub: string; section: string }
  | { type: "result"; kind: "article"; id: string; title: string; sub: string; section: string }
  | { type: "result"; kind: "booking"; id: string; title: string; sub: string; section: string }
  | { type: "result"; kind: "portfolio"; id: string; title: string; sub: string; section: string };

type ActionItem = {
  type: "action";
  id: string;
  group: "Create" | "Navigate";
  title: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  section: SectionId;
  keywords: string[];
};

type Item = SearchResult | ActionItem;

const RESULT_ICONS: Record<SearchResult["kind"], React.ComponentType<{ className?: string }>> = {
  profile: User, article: FileText, booking: Briefcase, portfolio: Camera,
};
const RESULT_LABEL: Record<SearchResult["kind"], string> = {
  profile: "Person", article: "Article", booking: "Booking", portfolio: "Portfolio",
};

const ALL_ACTIONS: Omit<ActionItem, "type">[] = [
  // Create
  { id: "act-new-article", group: "Create", title: "New Article", hint: "Start a draft", icon: FileEdit, section: "drafts", keywords: ["new", "create", "article", "draft", "write", "post"] },
  { id: "act-new-booking", group: "Create", title: "New Booking", hint: "Open bookings", icon: Briefcase, section: "bookings", keywords: ["new", "booking", "client", "shoot"] },
  { id: "act-new-event", group: "Create", title: "New Calendar Event", hint: "Schedule something", icon: Calendar, section: "calendar", keywords: ["event", "calendar", "schedule", "meeting"] },
  { id: "act-invite", group: "Create", title: "Invite User", hint: "Send invitation", icon: Mail, section: "invites", keywords: ["invite", "user", "invitation", "team"] },
  { id: "act-upload", group: "Create", title: "Upload Media", hint: "Add to library", icon: Upload, section: "media", keywords: ["upload", "media", "image", "video", "asset"] },
  // Navigate
  { id: "go-overview", group: "Navigate", title: "Command Center", icon: Compass, section: "overview", keywords: ["dashboard", "overview", "home", "command"] },
  { id: "go-drafts", group: "Navigate", title: "Drafts", icon: FileEdit, section: "drafts", keywords: ["drafts", "articles", "writing"] },
  { id: "go-submitted", group: "Navigate", title: "Submitted", icon: Inbox, section: "submitted", keywords: ["submitted", "review", "approve"] },
  { id: "go-scheduled", group: "Navigate", title: "Scheduled", icon: Clock, section: "scheduled", keywords: ["scheduled", "queue", "publish"] },
  { id: "go-published", group: "Navigate", title: "Published", icon: Send, section: "published", keywords: ["published", "live", "articles"] },
  { id: "go-bookings", group: "Navigate", title: "Bookings", icon: Briefcase, section: "bookings", keywords: ["bookings", "clients", "inquiries"] },
  { id: "go-leads", group: "Navigate", title: "Leads", icon: Mail, section: "leads", keywords: ["leads", "contacts", "newsletter"] },
  { id: "go-calendar", group: "Navigate", title: "Calendar", icon: Calendar, section: "calendar", keywords: ["calendar", "schedule", "events"] },
  { id: "go-staff", group: "Navigate", title: "Staff & Crew", icon: UsersIcon, section: "staff", keywords: ["staff", "crew", "team"] },
  { id: "go-availability", group: "Navigate", title: "Staff Availability", icon: Clock, section: "availability", keywords: ["availability", "schedule", "crew"] },
  { id: "go-media", group: "Navigate", title: "Media Library", icon: ImageIcon, section: "media", keywords: ["media", "images", "library"] },
  { id: "go-portfolio", group: "Navigate", title: "Portfolio", icon: Camera, section: "portfolio", keywords: ["portfolio", "work", "projects"] },
  { id: "go-analytics", group: "Navigate", title: "Analytics", icon: BarChart3, section: "analytics", keywords: ["analytics", "stats", "traffic", "data"] },
  { id: "go-applicants", group: "Navigate", title: "Applicants", icon: Inbox, section: "applicants", keywords: ["applicants", "applications", "hire"] },
  { id: "go-users", group: "Navigate", title: "Users & Roles", icon: UsersIcon, section: "users", keywords: ["users", "people", "roles"] },
  { id: "go-settings", group: "Navigate", title: "Settings", icon: SettingsIcon, section: "settings", keywords: ["settings", "config", "preferences"] },
];

export const GlobalSearch = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { roles } = useAuth();

  // Filter actions by user permissions
  const allowedActions: ActionItem[] = useMemo(
    () => ALL_ACTIONS
      .filter((a) => can(roles, a.section))
      .map((a) => ({ ...a, type: "action" as const })),
    [roles],
  );

  useEffect(() => {
    if (open) {
      setQ("");
      setResults([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Live search across tables
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
        supabase.from("profile_meta")
          .select("user_id, display_name, email, role_type")
          .or(`display_name.ilike.${like},email.ilike.${like},full_name.ilike.${like}`)
          .limit(5),
        supabase.from("articles")
          .select("id, title, status, category, slug")
          .or(`title.ilike.${like},category.ilike.${like},slug.ilike.${like}`)
          .limit(6),
        supabase.from("bookings")
          .select("id, name, email, project_type, status, project_date")
          .or(`name.ilike.${like},email.ilike.${like},project_type.ilike.${like}`)
          .limit(5),
        supabase.from("portfolio_items")
          .select("id, title, category, client")
          .or(`title.ilike.${like},category.ilike.${like},client.ilike.${like}`)
          .limit(4),
      ]);

      const merged: SearchResult[] = [
        ...(profiles ?? []).map((p: any) => ({
          type: "result" as const, kind: "profile" as const,
          id: p.user_id, title: p.display_name || p.email,
          sub: [p.role_type, p.email].filter(Boolean).join(" · "),
          section: "users",
        })),
        ...(articles ?? []).map((a: any) => ({
          type: "result" as const, kind: "article" as const,
          id: a.id, title: a.title,
          sub: [a.status, a.category].filter(Boolean).join(" · "),
          section:
            a.status === "draft" ? "drafts" :
            a.status === "submitted" ? "submitted" :
            a.status === "scheduled" ? "scheduled" :
            a.status === "published" ? "published" : "drafts",
        })),
        ...(bookings ?? []).map((b: any) => ({
          type: "result" as const, kind: "booking" as const,
          id: b.id, title: b.name + (b.project_type ? ` — ${b.project_type}` : ""),
          sub: [b.status, b.project_date].filter(Boolean).join(" · "),
          section: "bookings",
        })),
        ...(portfolios ?? []).map((p: any) => ({
          type: "result" as const, kind: "portfolio" as const,
          id: p.id, title: p.title,
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

  // Filter actions by query
  const matchedActions: ActionItem[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allowedActions;
    return allowedActions.filter(
      (a) => a.title.toLowerCase().includes(term) ||
             (a.hint?.toLowerCase().includes(term) ?? false) ||
             a.keywords.some((k) => k.includes(term)),
    );
  }, [allowedActions, q]);

  const groupedActions = useMemo(() => {
    const g: Record<"Create" | "Navigate", ActionItem[]> = { Create: [], Navigate: [] };
    matchedActions.forEach((a) => g[a.group].push(a));
    return g;
  }, [matchedActions]);

  const groupedResults = useMemo(() => {
    const g: Record<SearchResult["kind"], SearchResult[]> = { profile: [], article: [], booking: [], portfolio: [] };
    results.forEach((r) => g[r.kind].push(r));
    return g;
  }, [results]);

  // Flat list in display order — used for keyboard nav
  const flatList: Item[] = useMemo(
    () => [
      ...groupedActions.Create,
      ...groupedActions.Navigate,
      ...groupedResults.profile,
      ...groupedResults.article,
      ...groupedResults.booking,
      ...groupedResults.portfolio,
    ],
    [groupedActions, groupedResults],
  );

  const select = (item: Item) => {
    onOpenChange(false);
    const target = item.type === "action" ? item.section : item.section;
    navigate(target === "overview" ? "/dashboard" : `/dashboard/${target}`);
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

  const renderItem = (item: Item) => {
    const idx = flatList.indexOf(item);
    const active = idx === activeIdx;
    if (item.type === "action") {
      const Icon = item.icon;
      const tone = item.group === "Create" ? "text-primary" : "text-cream";
      return (
        <button
          key={item.id}
          onClick={() => select(item)}
          onMouseEnter={() => setActiveIdx(idx)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
            active ? "bg-primary/10 border-l-2 border-l-primary" : "border-l-2 border-l-transparent hover:bg-surface/40"
          }`}
        >
          <div className={`h-7 w-7 rounded-sm border flex items-center justify-center shrink-0 ${
            item.group === "Create" ? "bg-primary/10 border-primary/30 text-primary" : "bg-surface/60 border-border text-cream"
          }`}>
            {item.group === "Create" ? <Plus className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm truncate ${tone}`}>{item.title}</div>
            {item.hint && (
              <div className="text-[10px] text-muted-foreground truncate uppercase tracking-wider mt-0.5">{item.hint}</div>
            )}
          </div>
          <ArrowRight className={`h-3 w-3 shrink-0 ${active ? "text-primary" : "text-muted-foreground/40"}`} />
        </button>
      );
    }
    const Icon = RESULT_ICONS[item.kind];
    return (
      <button
        key={`${item.kind}-${item.id}`}
        onClick={() => select(item)}
        onMouseEnter={() => setActiveIdx(idx)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          active ? "bg-primary/10 border-l-2 border-l-primary" : "border-l-2 border-l-transparent hover:bg-surface/40"
        }`}
      >
        <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-cream truncate">{item.title}</div>
          {item.sub && <div className="text-[10px] text-muted-foreground truncate uppercase tracking-wider mt-0.5">{item.sub}</div>}
        </div>
        <ArrowRight className={`h-3 w-3 shrink-0 ${active ? "text-primary" : "text-muted-foreground/40"}`} />
      </button>
    );
  };

  const hasAnyResults = results.length > 0;
  const hasAnyActions = matchedActions.length > 0;
  const noMatches = q.trim().length >= 2 && !loading && !hasAnyResults && !hasAnyActions;

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
            placeholder="Search or run a command…"
            className="flex-1 h-full bg-transparent outline-none text-sm placeholder:text-muted-foreground text-cream"
          />
          {loading && <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />}
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Actions */}
          {(["Create", "Navigate"] as const).map((g) => {
            const list = groupedActions[g];
            if (list.length === 0) return null;
            return (
              <div key={g} className="border-b border-border/40 last:border-0">
                <div className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-[0.3em] text-muted-foreground flex items-center justify-between">
                  <span>{g}</span>
                  {g === "Create" && <span className="text-[8px] opacity-60">Quick actions</span>}
                </div>
                {list.map(renderItem)}
              </div>
            );
          })}

          {/* Search results */}
          {(["profile", "article", "booking", "portfolio"] as SearchResult["kind"][]).map((kind) => {
            const list = groupedResults[kind];
            if (list.length === 0) return null;
            return (
              <div key={kind} className="border-b border-border/40 last:border-0">
                <div className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                  {RESULT_LABEL[kind]}
                </div>
                {list.map(renderItem)}
              </div>
            );
          })}

          {/* Empty state */}
          {noMatches && (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              <Search className="h-6 w-6 mx-auto mb-2 opacity-40" />
              No matches for "{q}".
              <div className="mt-2 text-[10px] uppercase tracking-widest opacity-60">
                Try a section name, person, article title, or "new article".
              </div>
            </div>
          )}

          {!q.trim() && (
            <div className="px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground/60 text-center border-t border-border/40">
              <Activity className="h-3.5 w-3.5 mx-auto mb-1.5 opacity-40" />
              Type to search · ↑↓ to move · ↵ to select
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[9px] uppercase tracking-widest text-muted-foreground">
          <div>↑↓ navigate · ↵ open</div>
          <div>{loading ? "Searching…" : `${flatList.length} item${flatList.length === 1 ? "" : "s"}`}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
