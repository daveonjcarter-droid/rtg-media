import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileEdit, Inbox, RotateCcw, CheckCircle2, Calendar, Image as ImageIcon,
  Users, Plus, Copy, Instagram, Twitter, LogOut, Send, ArrowRight, Briefcase, Mail, Archive,
  Youtube, Search, Bell, ChevronsLeft, ChevronsRight, MoreHorizontal, Eye, Pencil, Trash2,
  Replace, Link as LinkIcon, Upload, Filter, ArrowUpDown, X, Tag, FolderInput, CheckSquare,
  Wand2, Film, BarChart3, Settings as SettingsIcon, Globe, Camera, Lock, FileText, ShoppingBag,
} from "lucide-react";
import { SECTION_ACCESS, ROLE_LABELS, ROLE_DESCRIPTIONS, can, primaryRole, canManageUsers, canManageBilling, type SectionId, type Group } from "@/lib/permissions";
import { AnalyticsView, SettingsView, ProductionServicesView, PortfolioManager, RtgFilmsManager, RtgFestManager, ArticleImportView } from "@/components/dashboard/AdminSections";
import QuickSiteUpdates from "@/components/dashboard/QuickSiteUpdates";
import ContentManagers from "@/components/dashboard/ContentManagers";
import ImportArticleDialog from "@/components/dashboard/ImportArticleDialog";
import UniversalEditor from "@/components/dashboard/UniversalEditor";
import logoLight from "@/assets/rtg-logo-light.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import portfolio1 from "@/assets/portfolio-1.jpg";
import portfolio2 from "@/assets/portfolio-2.jpg";
import portfolio3 from "@/assets/portfolio-3.jpg";
import portfolio4 from "@/assets/portfolio-4.jpg";
import storyMusic from "@/assets/story-music.jpg";
import storyFilm from "@/assets/story-film.jpg";
import storyFashion from "@/assets/story-fashion.jpg";
import storyBreakdown from "@/assets/story-breakdown.jpg";

type Status = "draft" | "submitted" | "revisions" | "approved" | "scheduled" | "published" | "archived";

type ArticleType = "standard" | "film_review" | "album_review" | "single_review" | "game_review" | "interview" | "opinion" | "breakdown" | "news";

type Article = {
  id: string;
  title: string;
  category: string | null;
  tags: string[] | null;
  author_id: string;
  status: Status;
  cover_image_url: string | null;
  excerpt: string | null;
  body: string | null;
  seo_title: string | null;
  seo_description: string | null;
  slug: string | null;
  updated_at: string;
  article_type?: ArticleType | null;
  // film review extras (carried through; only set when type = film_review)
  body_blocks?: any;
  film_title?: string | null;
  film_release_date?: string | null;
  film_runtime?: string | null;
  film_director?: string | null;
  film_studio?: string | null;
  film_genre?: string | null;
  film_mpaa_rating?: string | null;
  film_reviewer?: string | null;
  film_review_date?: string | null;
  rtg_rating?: number | null;
  audience_score?: number | null;
  rotten_tomatoes_score?: number | null;
  metacritic_score?: number | null;
  imdb_score?: number | null;
  is_official_rtg_review?: boolean | null;
  verdict_headline?: string | null;
  verdict_paragraph?: string | null;
  verdict_recommendation?: "recommended" | "mixed" | "not_recommended" | null;
  scheduled_for?: string | null;
  scheduled_timezone?: string | null;
  featured_until?: string | null;
  game_title?: string | null;
  game_developer?: string | null;
  game_publisher?: string | null;
  game_release_date?: string | null;
  game_platforms?: string | null;
  game_genre?: string | null;
  game_esrb_rating?: string | null;
  game_reviewer?: string | null;
  steam_score?: number | null;
  game_trailer_url?: string | null;
  game_screenshots?: any;
};

// SectionId imported from @/lib/permissions

const ALL_NAV: { id: SectionId; label: string; icon: any; group: Group }[] = [
  { id: "overview",          label: "Overview",         icon: LayoutDashboard, group: "Content" },
  { id: "drafts",            label: "Drafts",           icon: FileEdit,        group: "Pipeline" },
  { id: "submitted",         label: "Submitted",        icon: Inbox,           group: "Pipeline" },
  { id: "revisions",         label: "Revisions",        icon: RotateCcw,       group: "Pipeline" },
  { id: "scheduled",         label: "Scheduled",        icon: Calendar,        group: "Pipeline" },
  { id: "published",         label: "Published",        icon: CheckCircle2,    group: "Pipeline" },
  { id: "archived",          label: "Archived",         icon: Inbox,           group: "Pipeline" },
  { id: "calendar",          label: "Editorial Calendar", icon: Calendar,      group: "Content" },
  { id: "media",             label: "Media Library",    icon: ImageIcon,       group: "Studio" },
  { id: "import",            label: "Article Import",   icon: Upload,          group: "Studio" },
  { id: "social",            label: "Social Studio",    icon: Instagram,       group: "Studio" },
  { id: "content-managers",  label: "Pillars",          icon: Film,            group: "Ecosystem" },
  { id: "films",             label: "RTG Films",        icon: Film,            group: "Ecosystem" },
  { id: "fest",              label: "RTG Fest",         icon: ShoppingBag,     group: "Ecosystem" },
  { id: "portfolio",         label: "Portfolio",        icon: Camera,          group: "Ecosystem" },
  { id: "bookings",          label: "Bookings",         icon: Briefcase,       group: "Ops" },
  { id: "leads",             label: "Leads",            icon: Mail,            group: "Ops" },
  { id: "production",        label: "Production Services", icon: Camera,       group: "Ops" },
  { id: "analytics",         label: "Analytics",        icon: BarChart3,       group: "Ops" },
  { id: "users",             label: "Users & Roles",    icon: Users,           group: "Admin" },
  { id: "site-updates",      label: "Quick Site Updates", icon: Wand2,         group: "Admin" },
  { id: "settings",          label: "Settings",         icon: SettingsIcon,    group: "Admin" },
];

const STATUS_COLOR: Record<Status, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-gold/15 text-gold border-gold/30",
  revisions: "bg-primary/15 text-primary border-primary/30",
  approved: "bg-cream/15 text-cream border-cream/30",
  scheduled: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  archived: "bg-muted/40 text-muted-foreground border-border",
};

const STATUS_LABEL: Record<Status, string> = {
  draft: "Draft", submitted: "Submitted", revisions: "Revisions", approved: "Approved", scheduled: "Scheduled", published: "Published", archived: "Archived",
};

const Dashboard = () => {
  const { user, roles, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const navItems = useMemo(() => ALL_NAV.filter((n) => can(roles, n.id)), [roles]);
  const [section, setSection] = useState<SectionId>("overview");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [newType, setNewType] = useState<ArticleType>("standard");
  const [importOpen, setImportOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const primary: AppRole = primaryRole(roles);

  const loadArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles").select("*").order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setArticles((data ?? []) as Article[]);
    setLoading(false);
  };

  useEffect(() => { loadArticles(); }, []);

  useEffect(() => {
    if (!navItems.find((n) => n.id === section)) setSection("overview");
  }, [navItems, section]);

  const openEditor = (a: Article | null = null, type: ArticleType = "standard") => {
    setEditing(a);
    setNewType((a?.article_type as ArticleType) ?? type);
    setEditorOpen(true);
  };

  const updateStatus = async (id: string, status: Status) => {
    const patch: any = { status };
    if (status === "published") patch.published_at = new Date().toISOString();
    const { error } = await supabase.from("articles").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Moved to ${STATUS_LABEL[status]}`);
    loadArticles();
  };

  const deleteArticle = async (id: string) => {
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    loadArticles();
  };

  const handleSignOut = async () => { await signOut(); navigate("/login"); };
  const filtered = (s: Status[]) => articles.filter((a) => s.includes(a.status));

  // Group nav items
  const grouped = useMemo(() => {
    const g: Record<string, typeof navItems> = {};
    navItems.forEach((n) => { (g[n.group] ||= []).push(n); });
    return g;
  }, [navItems]);

  const canCreate = hasRole("writer") || hasRole("editor") || hasRole("admin");
  const currentNav = navItems.find((n) => n.id === section);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* ============ SIDEBAR ============ */}
      <aside
        className={`${collapsed ? "w-[64px]" : "w-[220px]"} shrink-0 border-r border-border bg-sidebar hidden lg:flex flex-col transition-[width] duration-200`}
      >
        <Link to="/" className={`h-14 border-b border-border flex items-center gap-2 ${collapsed ? "justify-center px-0" : "px-4"}`}>
          <img src={logoLight} alt="RTG" className="h-6 " />
          {!collapsed && <span className="font-display text-xs uppercase tracking-[0.25em]">Studio</span>}
        </Link>

        <nav className="flex-1 py-3 overflow-y-auto scrollbar-hide">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-3">
              {!collapsed && (
                <div className="px-4 mb-1.5 text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 font-semibold">
                  {group}
                </div>
              )}
              <div className="px-2 space-y-px">
                {items.map((n) => {
                  const active = section === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setSection(n.id)}
                      title={collapsed ? n.label : undefined}
                      className={`w-full flex items-center gap-2.5 ${collapsed ? "justify-center px-0 py-2" : "px-2.5 py-1.5"} rounded-sm text-[13px] transition-colors group relative ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }`}
                    >
                      <n.icon className="h-3.5 w-3.5 shrink-0" />
                      {!collapsed && <span className="truncate">{n.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-2 border-t border-border space-y-1">
          {!collapsed && (
            <div className="px-2 py-1.5 rounded-sm bg-sidebar-accent/50">
              <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 mb-0.5">Signed in</div>
              <div className="text-[11px] truncate">{user?.email}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {roles.length ? roles.map((r) => (
                  <span key={r} className="text-[8px] uppercase tracking-widest bg-background/60 text-foreground/80 px-1.5 py-0.5 rounded-sm">
                    {r.replace("_", " ")}
                  </span>
                )) : <span className="text-[8px] uppercase tracking-widest text-muted-foreground">No role</span>}
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-2 ${collapsed ? "justify-center" : "px-2"} py-1.5 rounded-sm text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-sidebar-accent`}
          >
            <LogOut className="h-3 w-3" /> {!collapsed && "Sign Out"}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`w-full flex items-center gap-2 ${collapsed ? "justify-center" : "px-2"} py-1.5 rounded-sm text-[11px] text-muted-foreground hover:text-foreground hover:bg-sidebar-accent`}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronsRight className="h-3 w-3" /> : <ChevronsLeft className="h-3 w-3" />}
            {!collapsed && <span className="uppercase tracking-widest">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-border bg-background/85 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-5 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground leading-none">
                {ROLE_LABELS[primary]}
              </div>
              <div className="font-display text-base uppercase leading-tight truncate">
                {currentNav?.label}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center h-8 rounded-sm border border-border bg-surface/50 px-2 w-56 focus-within:border-foreground/40 transition-colors">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder="Search…"
                className="bg-transparent outline-none px-2 h-full text-xs flex-1 placeholder:text-muted-foreground"
              />
              <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">⌘K</kbd>
            </div>
            <button className="h-8 w-8 rounded-sm border border-border hover:border-foreground/40 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground">
              <Bell className="h-3.5 w-3.5" />
            </button>
            {canCreate && (
              <>
                <Button
                  onClick={() => setImportOpen(true)}
                  size="sm"
                  variant="outline"
                  className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3 hidden sm:inline-flex"
                >
                  <Upload className="h-3 w-3 mr-1" /> Import
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm uppercase tracking-widest text-[10px] h-8 px-3"
                    >
                      <Plus className="h-3 w-3 mr-1" /> New
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Article Type</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openEditor(null, "standard")} className="text-xs">Standard Article</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditor(null, "film_review")} className="text-xs">
                      <Film className="h-3 w-3 mr-2" /> Film Review
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditor(null, "album_review")} className="text-xs">Album Review</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditor(null, "single_review")} className="text-xs">Single Review</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditor(null, "game_review")} className="text-xs">Game Review</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditor(null, "interview")} className="text-xs">Interview</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditor(null, "opinion")} className="text-xs">Opinion</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditor(null, "breakdown")} className="text-xs">Breakdown</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditor(null, "news")} className="text-xs">News</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-ink flex items-center justify-center text-[10px] font-semibold border border-border">
              {user?.email?.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 px-5 py-5 md:px-7 md:py-6 overflow-auto">
          {loading ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : (
            <>
              {section === "overview" && <Overview articles={articles} onCreate={() => openEditor(null)} canCreate={canCreate} />}
              {section === "drafts" && <ArticleList articles={filtered(["draft"])} onEdit={openEditor} onUpdateStatus={updateStatus} onDelete={deleteArticle} roles={roles} currentUserId={user?.id} />}
              {section === "submitted" && <ArticleList articles={filtered(["submitted"])} onEdit={openEditor} onUpdateStatus={updateStatus} onDelete={deleteArticle} roles={roles} currentUserId={user?.id} />}
              {section === "revisions" && <ArticleList articles={filtered(["revisions"])} onEdit={openEditor} onUpdateStatus={updateStatus} onDelete={deleteArticle} roles={roles} currentUserId={user?.id} />}
              {section === "scheduled" && <ArticleList articles={filtered(["scheduled"])} onEdit={openEditor} onUpdateStatus={updateStatus} onDelete={deleteArticle} roles={roles} currentUserId={user?.id} />}
              {section === "published" && <ArticleList articles={filtered(["approved", "published"])} onEdit={openEditor} onUpdateStatus={updateStatus} onDelete={deleteArticle} roles={roles} currentUserId={user?.id} />}
              {section === "archived" && <ArticleList articles={filtered(["archived"])} onEdit={openEditor} onUpdateStatus={updateStatus} onDelete={deleteArticle} roles={roles} currentUserId={user?.id} />}
              {section === "calendar" && <CalendarView articles={filtered(["approved", "scheduled", "published"])} />}
              {section === "media" && <MediaLibrary />}
              {section === "social" && <SocialKit articles={filtered(["published"])} />}
              {section === "bookings" && <BookingsView />}
              {section === "leads" && <LeadsView />}
             {section === "users" && <UsersView />}
             {section === "site-updates" && <QuickSiteUpdates />}
             {section === "content-managers" && <ContentManagers />}
            </>
          )}
        </div>
      </div>

      {editorOpen && (
        <UniversalEditor
          article={editing}
          userId={user!.id}
          initialType={(editing?.article_type as any) ?? newType}
          onClose={() => setEditorOpen(false)}
          onSaved={() => { setEditorOpen(false); loadArticles(); }}
        />
      )}

      <ImportArticleDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        userId={user?.id ?? ""}
        onImported={async (newId) => {
          await loadArticles();
          setSection("drafts");
          // Open the editor on the freshly imported draft
          const { data } = await supabase.from("articles").select("*").eq("id", newId).maybeSingle();
          if (data) openEditor(data as Article);
        }}
      />
    </div>
  );
};

/* ============================================================
   SHARED PRIMITIVES
   ============================================================ */

const PageHead = ({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) => (
  <div className="flex items-end justify-between gap-4 mb-5 pb-3 border-b border-border">
    <div>
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-1">{sub ?? "Section"}</div>
      <h2 className="font-display text-xl md:text-2xl uppercase leading-none">{title}</h2>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

const StatCard = ({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) => (
  <div className="border border-border rounded-sm bg-surface/40 p-4 hover:bg-surface/60 transition-colors">
    <div className="flex items-center justify-between">
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      {accent && <span className={`h-1.5 w-1.5 rounded-full ${accent}`} />}
    </div>
    <div className="font-display text-3xl mt-1.5 leading-none">{value}</div>
    {sub && <div className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">{sub}</div>}
  </div>
);

const EmptyState = ({ icon: Icon, title, body, action }: { icon: any; title: string; body?: string; action?: React.ReactNode }) => (
  <div className="border border-dashed border-border rounded-sm py-14 px-6 text-center">
    <Icon className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
    <div className="font-display uppercase text-base">{title}</div>
    {body && <div className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">{body}</div>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* ============================================================
   OVERVIEW
   ============================================================ */

const Overview = ({ articles, onCreate, canCreate }: { articles: Article[]; onCreate: () => void; canCreate: boolean }) => {
  const count = (s: Status) => articles.filter((a) => a.status === s).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Drafts" value={String(count("draft"))} accent="bg-muted-foreground" />
        <StatCard label="In Review" value={String(count("submitted") + count("revisions"))} accent="bg-gold" />
        <StatCard label="Approved" value={String(count("approved"))} accent="bg-cream" />
        <StatCard label="Scheduled" value={String(count("scheduled"))} sub="Auto-publish" accent="bg-sky-500" />
        <StatCard label="Published" value={String(count("published"))} sub="Live on site" accent="bg-emerald-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <PageHead title="Recent Activity" sub="Last 6" />
          <div className="border border-border rounded-sm divide-y divide-border overflow-hidden">
            {articles.slice(0, 6).map((a) => <ArticleRow key={a.id} a={a} />)}
            {articles.length === 0 && (
              <EmptyState icon={FileEdit} title="No articles yet" body="Create your first story to start the pipeline." action={
                canCreate ? <Button size="sm" onClick={onCreate} className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-4 bg-primary text-primary-foreground">New Article</Button> : null
              } />
            )}
          </div>
        </div>
        <div>
          <PageHead title="Workflow" sub="Pipeline" />
          <ol className="space-y-2">
            {(["draft", "submitted", "approved", "scheduled", "published"] as Status[]).map((s, i) => (
              <li key={s} className="flex items-center gap-3 border border-border rounded-sm p-3 bg-surface/30">
                <div className="font-display text-lg text-primary w-6">0{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display uppercase text-sm leading-none">{STATUS_LABEL[s]}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {{ draft: "Writer creates and saves", submitted: "Editor reviews", approved: "Ready to schedule", scheduled: "Queued for auto-publish", published: "Live on the site" }[s as "draft"|"submitted"|"approved"|"scheduled"|"published"]}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {canCreate && (
            <Button onClick={onCreate} size="sm" className="w-full mt-4 rounded-sm uppercase tracking-widest text-[10px] h-9 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3 w-3 mr-1.5" /> New Article
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const ArticleRow = ({ a }: { a: Article }) => (
  <div className="flex items-center gap-3 p-3 hover:bg-surface/40 transition-colors">
    <div className="h-10 w-14 bg-surface flex items-center justify-center overflow-hidden rounded-sm shrink-0">
      {a.cover_image_url ? <img src={a.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm truncate">{a.title}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
        {a.category ?? "Uncategorized"} · {new Date(a.updated_at).toLocaleDateString()}
      </div>
    </div>
    <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${STATUS_COLOR[a.status]}`}>{STATUS_LABEL[a.status]}</span>
  </div>
);

/* ============================================================
   ARTICLE LIST
   ============================================================ */

const NEXT_STATUS: Partial<Record<Status, { to: Status; label: string; roles: AppRole[] }[]>> = {
  draft: [{ to: "submitted", label: "Submit", roles: ["writer", "editor", "admin"] }],
  submitted: [
    { to: "approved", label: "Approve", roles: ["editor", "admin"] },
    { to: "revisions", label: "Request Revisions", roles: ["editor", "admin"] },
  ],
  revisions: [{ to: "submitted", label: "Resubmit", roles: ["writer", "editor", "admin"] }],
  approved: [{ to: "published", label: "Publish", roles: ["editor", "admin"] }],
  scheduled: [{ to: "published", label: "Publish Now", roles: ["editor", "admin"] }, { to: "draft", label: "Cancel Schedule", roles: ["editor", "admin"] }],
  published: [{ to: "archived", label: "Archive", roles: ["editor", "admin"] }],
  archived: [{ to: "draft", label: "Restore", roles: ["editor", "admin"] }],
};

const ArticleList = ({ articles, onEdit, onUpdateStatus, onDelete, roles, currentUserId }: {
  articles: Article[]; onEdit: (a: Article) => void; onUpdateStatus: (id: string, s: Status) => void;
  onDelete: (id: string) => void; roles: AppRole[]; currentUserId?: string;
}) => {
  const [confirmDelete, setConfirmDelete] = useState<Article | null>(null);

  if (articles.length === 0) return <EmptyState icon={FileEdit} title="Nothing here yet" body="Articles will show up once they reach this stage." />;

  return (
    <>
      <div className="border border-border rounded-sm divide-y divide-border overflow-hidden">
        {articles.map((a) => {
          const transitions = (NEXT_STATUS[a.status] ?? []).filter((t) => t.roles.some((r) => roles.includes(r)));
          const canEditThis = a.author_id === currentUserId || roles.includes("editor") || roles.includes("admin");
          const canDeleteThis = roles.includes("editor") || roles.includes("admin");
          return (
            <div key={a.id} className="flex items-center gap-3 p-3 hover:bg-surface/40 transition-colors group">
              <div className="h-12 w-16 bg-surface flex items-center justify-center overflow-hidden rounded-sm shrink-0">
                {a.cover_image_url ? <img src={a.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{a.title}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                  {a.category ?? "Uncategorized"} · {new Date(a.updated_at).toLocaleDateString()}
                </div>
              </div>
              <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm shrink-0 border ${STATUS_COLOR[a.status]}`}>{STATUS_LABEL[a.status]}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {canEditThis && (
                  <Button size="sm" variant="outline" onClick={() => onEdit(a)} className="rounded-sm text-[10px] uppercase tracking-widest h-7 px-2.5">
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                )}
                {transitions.map((t) => (
                  <Button key={t.to} size="sm" onClick={() => onUpdateStatus(a.id, t.to)}
                    className="rounded-sm text-[10px] uppercase tracking-widest h-7 px-2.5 bg-primary text-primary-foreground hover:bg-primary/90">
                    {t.label} <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                ))}
                {canDeleteThis && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-7 w-7 rounded-sm border border-border hover:border-foreground/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                      <DropdownMenuItem onClick={() => onEdit(a)}><Pencil className="h-3 w-3 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`/articles/${a.id}`); toast.success("URL copied"); }}>
                        <LinkIcon className="h-3 w-3 mr-2" /> Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmDelete(a)}>
                        <Trash2 className="h-3 w-3 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete article?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.title}" will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (confirmDelete) onDelete(confirmDelete.id); setConfirmDelete(null); }}
              className="rounded-sm uppercase tracking-widest text-[10px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/* ============================================================
   CALENDAR
   ============================================================ */

const CalendarView = ({ articles }: { articles: Article[] }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const buckets: Record<string, Article[]> = {};
  articles.forEach((a) => {
    const dateStr = (a as any).scheduled_for ?? (a as any).published_at ?? a.updated_at;
    const d = new Date(dateStr);
    const key = days[(d.getDay() + 6) % 7];
    (buckets[key] ||= []).push(a);
  });
  return (
    <div>
      <PageHead title="Content Calendar" sub="This Week" />
      <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-sm overflow-hidden">
        {days.map((d) => (
          <div key={d} className="bg-background min-h-[220px] p-2.5">
            <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-2 font-semibold">{d}</div>
            <div className="space-y-1.5">
              {(buckets[d] || []).map((a) => {
                const when = a.scheduled_for ?? (a as any).published_at;
                const accent = a.status === "scheduled" ? "border-sky-500" : a.status === "published" ? "border-emerald-500" : "border-primary";
                return (
                  <div key={a.id} className={`bg-surface border-l-2 ${accent} p-2 rounded-sm hover:bg-surface/70 transition-colors cursor-pointer`}>
                    <div className="text-[11px] font-medium leading-tight">{a.title}</div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1 flex items-center justify-between gap-2">
                      <span className="text-primary truncate">{a.category}</span>
                      {when && <span>{new Date(when).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================
   MEDIA LIBRARY  (front-end state, ready for Supabase Storage)
   ============================================================ */

type MediaType = "image" | "video" | "audio";
type MediaUsage = "in_use" | "unused" | "archived";
type MediaItem = {
  id: string;
  title: string;
  url: string;
  type: MediaType;
  category: string;
  alt: string;
  tags: string[];
  credit?: string;
  attached_to?: string;
  uploaded_at: string; // ISO
  size_kb: number;
  usage: MediaUsage;
};

// Media library starts empty — assets are added via the upload dialog.
const SEED_MEDIA: MediaItem[] = [];

const MEDIA_CATEGORIES = ["All", "Portrait", "City", "Music Video", "Live", "Cover Art", "Film", "Fashion", "Thumbnail", "Other"];

const MediaLibrary = () => {
  const [items, setItems] = useState<MediaItem[]>(SEED_MEDIA);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState<"all" | MediaType>("all");
  const [sort, setSort] = useState<"new" | "old" | "name">("new");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [viewing, setViewing] = useState<MediaItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MediaItem | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false);

  const filtered = useMemo(() => {
    let r = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((i) => i.title.toLowerCase().includes(q) || i.tags.some((t) => t.includes(q)) || i.alt.toLowerCase().includes(q));
    }
    if (category !== "All") r = r.filter((i) => i.category === category);
    if (type !== "all") r = r.filter((i) => i.type === type);
    r = [...r].sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "old") return a.uploaded_at.localeCompare(b.uploaded_at);
      return b.uploaded_at.localeCompare(a.uploaded_at);
    });
    return r;
  }, [items, search, category, type, sort]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearSelect = () => setSelected(new Set());
  const selectAll = () => setSelected(new Set(filtered.map((i) => i.id)));

  const handleUpload = (newItems: MediaItem[]) => {
    setItems((prev) => [...newItems, ...prev]);
    setUploadOpen(false);
    toast.success(`${newItems.length} file${newItems.length > 1 ? "s" : ""} uploaded`);
  };

  const handleSaveEdit = (updated: MediaItem) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setEditing(null);
    toast.success("Media updated");
  };

  const handleDelete = (item: MediaItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setSelected((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
    setConfirmDelete(null);
    toast.success("Deleted");
  };

  const handleArchive = (item: MediaItem) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, usage: "archived" as MediaUsage } : i)));
    toast.success("Archived");
  };

  const bulkDelete = () => {
    setItems((prev) => prev.filter((i) => !selected.has(i.id)));
    toast.success(`${selected.size} item${selected.size > 1 ? "s" : ""} deleted`);
    clearSelect();
    setConfirmBulkDelete(false);
  };

  const bulkArchive = () => {
    setItems((prev) => prev.map((i) => (selected.has(i.id) ? { ...i, usage: "archived" as MediaUsage } : i)));
    toast.success(`${selected.size} archived`);
    clearSelect();
  };

  const bulkAddTag = (tag: string) => {
    if (!tag.trim()) return;
    setItems((prev) => prev.map((i) => selected.has(i.id) ? { ...i, tags: Array.from(new Set([...i.tags, tag.trim()])) } : i));
    toast.success(`Tag added to ${selected.size}`);
    setBulkTagOpen(false);
    clearSelect();
  };

  const bulkSetCategory = (cat: string) => {
    setItems((prev) => prev.map((i) => selected.has(i.id) ? { ...i, category: cat } : i));
    toast.success(`Category set on ${selected.size}`);
    setBulkCategoryOpen(false);
    clearSelect();
  };

  return (
    <div className="space-y-4">
      <PageHead
        title="Media Library"
        sub={`${items.length} assets`}
        actions={
          <Button
            onClick={() => setUploadOpen(true)}
            size="sm"
            className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="h-3 w-3 mr-1.5" /> Upload Media
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 border border-border rounded-sm bg-surface/30">
        <div className="flex items-center h-8 rounded-sm border border-border bg-background px-2 flex-1 min-w-[180px] max-w-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media…"
            className="bg-transparent outline-none px-2 h-full text-xs flex-1 placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 w-[140px] text-xs rounded-sm bg-background">
            <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEDIA_CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={(v) => setType(v as any)}>
          <SelectTrigger className="h-8 w-[120px] text-xs rounded-sm bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Types</SelectItem>
            <SelectItem value="image" className="text-xs">Image</SelectItem>
            <SelectItem value="video" className="text-xs">Video</SelectItem>
            <SelectItem value="audio" className="text-xs">Audio</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as any)}>
          <SelectTrigger className="h-8 w-[130px] text-xs rounded-sm bg-background">
            <ArrowUpDown className="h-3 w-3 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new" className="text-xs">Newest</SelectItem>
            <SelectItem value="old" className="text-xs">Oldest</SelectItem>
            <SelectItem value="name" className="text-xs">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
          {filtered.length} / {items.length}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-2.5 border border-primary/40 rounded-sm bg-primary/5 sticky top-14 z-20 backdrop-blur">
          <CheckSquare className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">{selected.size} selected</span>
          <button onClick={selectAll} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground ml-2">Select All Filtered</button>
          <button onClick={clearSelect} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">Clear</button>
          <div className="ml-auto flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setBulkTagOpen(true)} className="h-7 rounded-sm text-[10px] uppercase tracking-widest px-2.5">
              <Tag className="h-3 w-3 mr-1" /> Add Tag
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBulkCategoryOpen(true)} className="h-7 rounded-sm text-[10px] uppercase tracking-widest px-2.5">
              <FolderInput className="h-3 w-3 mr-1" /> Category
            </Button>
            <Button size="sm" variant="outline" onClick={bulkArchive} className="h-7 rounded-sm text-[10px] uppercase tracking-widest px-2.5">
              <Archive className="h-3 w-3 mr-1" /> Archive
            </Button>
            <Button size="sm" onClick={() => setConfirmBulkDelete(true)} className="h-7 rounded-sm text-[10px] uppercase tracking-widest px-2.5 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={items.length === 0 ? "No media uploaded yet" : "No media matches your filters."}
          body={items.length === 0 ? "Upload your first asset to begin." : "Try clearing search or changing the category."}
          action={items.length === 0 ? (
            <Button size="sm" onClick={() => setUploadOpen(true)} className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-4 bg-primary text-primary-foreground">
              <Upload className="h-3 w-3 mr-1.5" /> Upload Media
            </Button>
          ) : null}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((m) => (
            <MediaCard
              key={m.id}
              item={m}
              selected={selected.has(m.id)}
              onToggleSelect={() => toggleSelect(m.id)}
              onView={() => setViewing(m)}
              onEdit={() => setEditing(m)}
              onDelete={() => setConfirmDelete(m)}
              onArchive={() => handleArchive(m)}
              onReplace={() => toast.info("Replace flow opens upload dialog")}
              onCopyUrl={() => { navigator.clipboard.writeText(m.url); toast.success("URL copied"); }}
            />
          ))}
        </div>
      )}

      {uploadOpen && <MediaUploadDialog onClose={() => setUploadOpen(false)} onUpload={handleUpload} />}
      {editing && <MediaEditDialog item={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} />}
      {viewing && <MediaViewDialog item={viewing} onClose={() => setViewing(null)} />}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this media item?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.title}" will be permanently removed from your library. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              className="rounded-sm uppercase tracking-widest text-[10px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} selected items?</AlertDialogTitle>
            <AlertDialogDescription>
              These media items will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete} className="rounded-sm uppercase tracking-widest text-[10px] bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkTagDialog open={bulkTagOpen} onClose={() => setBulkTagOpen(false)} onApply={bulkAddTag} />
      <BulkCategoryDialog open={bulkCategoryOpen} onClose={() => setBulkCategoryOpen(false)} onApply={bulkSetCategory} />
    </div>
  );
};

const usageColor: Record<MediaUsage, string> = {
  in_use: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  unused: "bg-muted text-muted-foreground border-border",
  archived: "bg-gold/15 text-gold border-gold/30",
};
const usageLabel: Record<MediaUsage, string> = { in_use: "In Use", unused: "Unused", archived: "Archived" };

const MediaCard = ({
  item, selected, onToggleSelect, onView, onEdit, onDelete, onArchive, onReplace, onCopyUrl,
}: {
  item: MediaItem; selected: boolean;
  onToggleSelect: () => void; onView: () => void; onEdit: () => void;
  onDelete: () => void; onArchive: () => void; onReplace: () => void; onCopyUrl: () => void;
}) => {
  return (
    <div className={`group relative border rounded-sm overflow-hidden bg-surface/30 transition-all ${selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-foreground/30"}`}>
      <div className="relative aspect-square bg-surface overflow-hidden cursor-pointer" onClick={onView}>
        {item.type === "image" && (
          <img src={item.url} alt={item.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
        {item.type === "video" && (
          <>
            <img src={item.url} alt={item.alt} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-ink/80 backdrop-blur flex items-center justify-center">
                <span className="text-cream text-xs">▶</span>
              </div>
            </div>
          </>
        )}

        {/* Selection checkbox */}
        <div
          className={`absolute top-1.5 left-1.5 transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        >
          <div className={`h-5 w-5 rounded-sm border flex items-center justify-center ${selected ? "bg-primary border-primary" : "bg-ink/70 border-cream/40"}`}>
            {selected && <CheckSquare className="h-3 w-3 text-primary-foreground" />}
          </div>
        </div>

        {/* Type badge */}
        <span className="absolute top-1.5 right-1.5 text-[8px] uppercase tracking-widest bg-ink/80 backdrop-blur text-cream px-1.5 py-0.5 rounded-sm font-bold">
          {item.type}
        </span>

        {/* Hover actions */}
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <ActionIcon onClick={onView} title="View"><Eye className="h-3 w-3" /></ActionIcon>
          <ActionIcon onClick={onEdit} title="Edit"><Pencil className="h-3 w-3" /></ActionIcon>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-6 w-6 rounded-sm bg-ink/80 backdrop-blur text-cream hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center">
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">{item.title}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onView}><Eye className="h-3 w-3 mr-2" /> View</DropdownMenuItem>
              <DropdownMenuItem onClick={onReplace}><Replace className="h-3 w-3 mr-2" /> Replace Image</DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}><Pencil className="h-3 w-3 mr-2" /> Edit Details</DropdownMenuItem>
              <DropdownMenuItem onClick={onCopyUrl}><LinkIcon className="h-3 w-3 mr-2" /> Copy URL</DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}><Archive className="h-3 w-3 mr-2" /> Archive</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-3 w-3 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-2.5">
        <div className="text-xs font-medium leading-tight truncate">{item.title}</div>
        <div className="flex items-center justify-between mt-1.5 gap-1">
          <span className="text-[9px] uppercase tracking-widest text-primary truncate">{item.category}</span>
          <span className={`text-[8px] uppercase tracking-widest px-1 py-0.5 rounded-sm border shrink-0 ${usageColor[item.usage]}`}>
            {usageLabel[item.usage]}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1 text-[9px] text-muted-foreground tabular-nums">
          <span>{item.uploaded_at}</span>
          <span>{item.size_kb > 1024 ? `${(item.size_kb / 1024).toFixed(1)}MB` : `${item.size_kb}KB`}</span>
        </div>
      </div>
    </div>
  );
};

const ActionIcon = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
  <button onClick={onClick} title={title}
    className="h-6 w-6 rounded-sm bg-ink/80 backdrop-blur text-cream hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center">
    {children}
  </button>
);

/* ----- Upload dialog ----- */
const MediaUploadDialog = ({ onClose, onUpload }: { onClose: () => void; onUpload: (items: MediaItem[]) => void }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [alt, setAlt] = useState("");
  const [tags, setTags] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/") || f.type.startsWith("audio/"));
    setFiles((prev) => [...prev, ...list]);
    list.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => setPreviews((p) => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeFile = (idx: number) => {
    setFiles((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const submit = () => {
    if (files.length === 0) { toast.error("Add at least one file"); return; }
    const newItems: MediaItem[] = files.map((f, i) => {
      const t: MediaType = f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "audio" : "image";
      return {
        id: `m_${Date.now()}_${i}`,
        title: title.trim() || f.name.replace(/\.[^.]+$/, ""),
        url: previews[i] || "",
        type: t,
        category,
        alt: alt.trim(),
        tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
        uploaded_at: new Date().toISOString().slice(0, 10),
        size_kb: Math.round(f.size / 1024),
        usage: "unused",
      };
    });
    onUpload(newItems);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display uppercase text-lg">Upload Media</DialogTitle>
          <DialogDescription className="text-xs">
            Drop files or browse to add to the library. Images, video, and audio supported.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-sm p-6 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border bg-surface/30"}`}
        >
          <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
          <div className="text-sm font-medium">Drag & drop files here</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">or</div>
          <label className="inline-block mt-2">
            <input type="file" multiple accept="image/*,video/*,audio/*" className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)} />
            <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-sm border border-border bg-background hover:border-foreground/40 cursor-pointer text-[10px] uppercase tracking-widest">
              Choose Files
            </span>
          </label>
        </div>

        {previews.length > 0 && (
          <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
            {previews.map((p, i) => (
              <div key={i} className="relative aspect-square bg-surface rounded-sm overflow-hidden group">
                <img src={p} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeFile(i)} className="absolute top-1 right-1 h-5 w-5 rounded-sm bg-ink/80 text-cream opacity-0 group-hover:opacity-100 flex items-center justify-center">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-xs rounded-sm" placeholder="Optional — defaults to filename" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-xs rounded-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEDIA_CATEGORIES.filter((c) => c !== "All").map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Alt Text</Label>
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} className="h-9 text-xs rounded-sm" placeholder="Describe the image for accessibility" />
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Tags (comma separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} className="h-9 text-xs rounded-sm" placeholder="chicago, music, cover" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-sm uppercase tracking-widest text-[10px] h-8">Cancel</Button>
          <Button onClick={submit} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground hover:bg-primary/90">
            <Upload className="h-3 w-3 mr-1.5" /> Upload {files.length > 0 && `(${files.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ----- Edit dialog ----- */
const MediaEditDialog = ({ item, onClose, onSave }: { item: MediaItem; onClose: () => void; onSave: (i: MediaItem) => void }) => {
  const [draft, setDraft] = useState<MediaItem>(item);
  const [tagsStr, setTagsStr] = useState(item.tags.join(", "));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display uppercase text-lg">Edit Media</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[120px_1fr] gap-4">
          <div className="aspect-square bg-surface rounded-sm overflow-hidden">
            <img src={draft.url} alt={draft.alt} className="w-full h-full object-cover" />
          </div>
          <div className="space-y-2.5">
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-9 text-xs rounded-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Category</Label>
                <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                  <SelectTrigger className="h-9 text-xs rounded-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEDIA_CATEGORIES.filter((c) => c !== "All").map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Usage</Label>
                <Select value={draft.usage} onValueChange={(v) => setDraft({ ...draft, usage: v as MediaUsage })}>
                  <SelectTrigger className="h-9 text-xs rounded-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_use" className="text-xs">In Use</SelectItem>
                    <SelectItem value="unused" className="text-xs">Unused</SelectItem>
                    <SelectItem value="archived" className="text-xs">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Alt Text</Label>
            <Input value={draft.alt} onChange={(e) => setDraft({ ...draft, alt: e.target.value })} className="h-9 text-xs rounded-sm" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Tags (comma separated)</Label>
            <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} className="h-9 text-xs rounded-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Credit / Source</Label>
              <Input value={draft.credit ?? ""} onChange={(e) => setDraft({ ...draft, credit: e.target.value })} className="h-9 text-xs rounded-sm" placeholder="Photographer / Source" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Attached Article / Project</Label>
              <Input value={draft.attached_to ?? ""} onChange={(e) => setDraft({ ...draft, attached_to: e.target.value })} className="h-9 text-xs rounded-sm" placeholder="Article title or slug" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-sm uppercase tracking-widest text-[10px] h-8">Cancel</Button>
          <Button
            onClick={() => onSave({ ...draft, tags: tagsStr.split(",").map((s) => s.trim()).filter(Boolean) })}
            className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ----- View dialog ----- */
const MediaViewDialog = ({ item, onClose }: { item: MediaItem; onClose: () => void }) => (
  <Dialog open onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="font-display uppercase text-lg truncate">{item.title}</DialogTitle>
        <DialogDescription className="text-[10px] uppercase tracking-widest">
          {item.type} · {item.category} · {item.uploaded_at}
        </DialogDescription>
      </DialogHeader>
      <div className="bg-surface rounded-sm overflow-hidden">
        <img src={item.url} alt={item.alt} className="w-full max-h-[60vh] object-contain" />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground block">Alt</span>{item.alt || "—"}</div>
        <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground block">Credit</span>{item.credit || "—"}</div>
        <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground block">Attached</span>{item.attached_to || "—"}</div>
        <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground block">Size</span>{item.size_kb > 1024 ? `${(item.size_kb / 1024).toFixed(1)} MB` : `${item.size_kb} KB`}</div>
        <div className="col-span-2">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground block mb-1">Tags</span>
          <div className="flex flex-wrap gap-1">
            {item.tags.length === 0 ? "—" : item.tags.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-sm bg-secondary">#{t}</span>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => { navigator.clipboard.writeText(item.url); toast.success("URL copied"); }} className="rounded-sm uppercase tracking-widest text-[10px] h-8">
          <LinkIcon className="h-3 w-3 mr-1.5" /> Copy URL
        </Button>
        <Button onClick={onClose} className="rounded-sm uppercase tracking-widest text-[10px] h-8">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const BulkTagDialog = ({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: (tag: string) => void }) => {
  const [tag, setTag] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display uppercase text-lg">Add Tag</DialogTitle>
          <DialogDescription className="text-xs">Add a tag to all selected items.</DialogDescription>
        </DialogHeader>
        <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="tag name" className="h-9 text-xs rounded-sm" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-sm uppercase tracking-widest text-[10px] h-8">Cancel</Button>
          <Button onClick={() => { onApply(tag); setTag(""); }} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground">Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const BulkCategoryDialog = ({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: (cat: string) => void }) => {
  const [cat, setCat] = useState("Other");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display uppercase text-lg">Set Category</DialogTitle>
          <DialogDescription className="text-xs">Assign category to all selected items.</DialogDescription>
        </DialogHeader>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="h-9 text-xs rounded-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MEDIA_CATEGORIES.filter((c) => c !== "All").map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-sm uppercase tracking-widest text-[10px] h-8">Cancel</Button>
          <Button onClick={() => onApply(cat)} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground">Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================
   SOCIAL KIT
   ============================================================ */

type Platform = "instagram" | "tiktok" | "x" | "youtube";
type SocialPostStatus = "draft" | "ready" | "posted";
type SocialPost = { id: string; article_id: string; platform: Platform; caption: string | null; status: SocialPostStatus; posted_at: string | null };

const PLATFORMS: { id: Platform; label: string; icon: any }[] = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "tiktok", label: "TikTok", icon: Send },
  { id: "x", label: "X", icon: Twitter },
  { id: "youtube", label: "YouTube", icon: Youtube },
];

const SOCIAL_STATUS_COLOR: Record<SocialPostStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  ready: "bg-gold/15 text-gold",
  posted: "bg-emerald-500/15 text-emerald-400",
};

const defaultCaption = (a: Article, p: Platform) => {
  const base = a.excerpt ?? a.title;
  const tag = "#RTGMedia #Chicago";
  if (p === "x") return `${a.title}\n\nrtgmedia.com/articles/${a.id}\n${tag}`;
  if (p === "youtube") return `${a.title}\n\n${base}\n\nWatch & read more at rtgmedia.com.`;
  return `${base}\n\nFull story → rtgmedia.com/articles/${a.id}\n\n${tag}`;
};

const SocialKit = ({ articles }: { articles: Article[] }) => {
  const [selected, setSelected] = useState<Article | null>(articles[0] ?? null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<SocialPostStatus>("draft");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!selected && articles[0]) setSelected(articles[0]); }, [articles, selected]);

  const loadPosts = async (articleId: string) => {
    const { data } = await supabase.from("social_posts").select("*").eq("article_id", articleId);
    setPosts((data ?? []) as SocialPost[]);
  };

  useEffect(() => { if (selected) loadPosts(selected.id); }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const existing = posts.find((p) => p.platform === platform);
    setCaption(existing?.caption ?? defaultCaption(selected, platform));
    setStatus(existing?.status ?? "draft");
  }, [selected, platform, posts]);

  if (!selected) return <EmptyState icon={Instagram} title="No published articles" body="Publish an article to start the social pipeline." />;

  const save = async (newStatus?: SocialPostStatus) => {
    setBusy(true);
    const finalStatus = newStatus ?? status;
    const payload: any = {
      article_id: selected.id, platform, caption, status: finalStatus,
      posted_at: finalStatus === "posted" ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from("social_posts").upsert(payload, { onConflict: "article_id,platform" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(newStatus ? `Marked ${newStatus}` : "Saved");
    if (newStatus) setStatus(newStatus);
    loadPosts(selected.id);
  };

  const variations = [
    selected.title,
    `Inside: ${selected.title}`,
    `${selected.category ?? "Culture"} — ${selected.title}`,
  ];

  return (
    <div className="grid lg:grid-cols-[240px_1fr_260px] gap-4">
      <div>
        <PageHead title="Published" sub="Pipeline" />
        <div className="border border-border rounded-sm divide-y divide-border max-h-[70vh] overflow-y-auto">
          {articles.map((a) => (
            <button key={a.id} onClick={() => setSelected(a)}
              className={`w-full text-left p-2.5 transition-colors ${selected.id === a.id ? "bg-surface" : "hover:bg-surface/40"}`}>
              <div className="text-xs font-medium truncate">{a.title}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">{a.category}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <PageHead title={selected.title} sub="Editor" />
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {PLATFORMS.map((p) => {
            const post = posts.find((x) => x.platform === p.id);
            return (
              <button key={p.id} onClick={() => setPlatform(p.id)}
                className={`flex items-center gap-1.5 px-2.5 h-8 rounded-sm text-[10px] uppercase tracking-widest border transition-colors ${
                  platform === p.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
                }`}>
                <p.icon className="h-3 w-3" /> {p.label}
                {post && <span className={`text-[8px] px-1 py-0.5 rounded-sm ${SOCIAL_STATUS_COLOR[post.status]}`}>{post.status}</span>}
              </button>
            );
          })}
        </div>

        <div className="border border-border rounded-sm p-4 bg-surface/30 space-y-3">
          {selected.cover_image_url && <img src={selected.cover_image_url} alt="" className="aspect-video w-full object-cover rounded-sm" />}
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Caption ({platform})</Label>
            <Textarea rows={5} value={caption} onChange={(e) => setCaption(e.target.value)} className="bg-background border-border rounded-sm font-sans text-xs" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" onClick={() => save()} disabled={busy} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-secondary text-foreground hover:bg-secondary/80">Save Draft</Button>
            <Button size="sm" onClick={() => save("ready")} disabled={busy} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-gold text-ink hover:bg-gold/90">Mark Ready</Button>
            <Button size="sm" onClick={() => save("posted")} disabled={busy} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground hover:bg-primary/90">Mark Posted</Button>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(caption); toast.success("Copied"); }} className="rounded-sm uppercase tracking-widest text-[10px] h-8">
              <Copy className="h-3 w-3 mr-1.5" /> Copy
            </Button>
          </div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Pipeline: Draft → Ready → Posted</div>
        </div>
      </div>

      <div>
        <PageHead title="Headlines" sub="Variations" />
        <ul className="space-y-2 text-xs">
          {variations.map((h) => (
            <li key={h} className="border border-border rounded-sm p-2.5 bg-surface/30 flex items-center gap-2 hover:bg-surface/50 transition-colors">
              <span className="flex-1 leading-tight">{h}</span>
              <button onClick={() => { navigator.clipboard.writeText(h); toast.success("Copied"); }}
                className="text-muted-foreground hover:text-primary shrink-0">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* ============================================================
   BOOKINGS
   ============================================================ */

type BookingStatus = "new" | "contacted" | "negotiating" | "booked" | "completed" | "declined";
type Booking = {
  id: string; name: string; email: string; phone: string; service: string | null;
  shoot_type: "studio" | "location" | "hybrid" | null; budget: string | null;
  project_date: string | null; description: string | null; location_detail: string | null;
  studio_preference: string | null; reference_link: string | null; preferred_contact: string;
  status: BookingStatus; notes: string | null; archived: boolean;
  base_cost: number; studio_cost: number; travel_cost: number; equipment_cost: number;
  created_at: string;
};

const BOOKING_STATUS_COLOR: Record<BookingStatus, string> = {
  new: "bg-primary/15 text-primary border-primary/30",
  contacted: "bg-gold/15 text-gold border-gold/30",
  negotiating: "bg-cream/15 text-cream border-cream/30",
  booked: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  completed: "bg-emerald-500/25 text-emerald-300 border-emerald-500/40",
  declined: "bg-muted text-muted-foreground border-border",
};

const BookingsView = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [active, setActive] = useState<Booking | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setBookings((data ?? []) as Booking[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Partial<Booking>) => {
    const { error } = await supabase.from("bookings").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
    if (active?.id === id) setActive((a) => (a ? { ...a, ...patch } : a));
  };

  const visible = bookings.filter((b) => b.archived === showArchived);

  if (loading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div>
      <PageHead
        title={showArchived ? "Archived Bookings" : "Bookings"}
        sub="Inquiries & Pipeline"
        actions={
          <div className="flex gap-1.5">
            <Button onClick={() => setShowArchived(false)} variant={showArchived ? "outline" : "default"} size="sm"
              className={`rounded-sm text-[10px] uppercase tracking-widest h-8 ${!showArchived ? "bg-primary text-primary-foreground" : ""}`}>
              Active ({bookings.filter((b) => !b.archived).length})
            </Button>
            <Button onClick={() => setShowArchived(true)} variant={showArchived ? "default" : "outline"} size="sm"
              className={`rounded-sm text-[10px] uppercase tracking-widest h-8 ${showArchived ? "bg-primary text-primary-foreground" : ""}`}>
              Archived
            </Button>
          </div>
        }
      />

      {visible.length === 0 ? (
        <EmptyState icon={Briefcase} title="No bookings here" />
      ) : (
        <div className="border border-border rounded-sm divide-y divide-border overflow-hidden">
          {visible.map((b) => (
            <div key={b.id} className="p-3 flex items-center gap-3 flex-wrap hover:bg-surface/40 transition-colors">
              <div className="flex-1 min-w-[200px]">
                <div className="font-medium text-sm">{b.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{b.service ?? "—"} · {b.shoot_type ?? "—"} · {b.budget ?? "—"}</div>
                <div className="text-[10px] text-muted-foreground">{b.email} · {b.phone}</div>
              </div>
              <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${BOOKING_STATUS_COLOR[b.status]}`}>{b.status}</span>
              <div className="text-[10px] text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</div>
              <Button size="sm" variant="outline" onClick={() => setActive(b)} className="rounded-sm text-[10px] uppercase tracking-widest h-7 px-2.5">Open</Button>
            </div>
          ))}
        </div>
      )}

      {active && <BookingDrawer booking={active} onClose={() => setActive(null)} onUpdate={(patch) => update(active.id, patch)} />}
    </div>
  );
};

const BookingDrawer = ({ booking, onClose, onUpdate }: { booking: Booking; onClose: () => void; onUpdate: (patch: Partial<Booking>) => void }) => {
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [costs, setCosts] = useState({
    base_cost: booking.base_cost, studio_cost: booking.studio_cost,
    travel_cost: booking.travel_cost, equipment_cost: booking.equipment_cost,
  });
  const total = Object.values(costs).reduce((s, v) => s + Number(v || 0), 0);

  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur z-50 flex items-stretch justify-end">
      <div className="w-full max-w-xl bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-5 py-3 flex items-center justify-between z-10">
          <div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Booking</div>
            <div className="font-display text-lg uppercase">{booking.name}</div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-sm uppercase tracking-widest text-[10px] h-8">Close</Button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Status</Label>
            <div className="flex flex-wrap gap-1.5">
              {(["new", "contacted", "negotiating", "booked", "completed", "declined"] as BookingStatus[]).map((s) => (
                <button key={s} onClick={() => onUpdate({ status: s })}
                  className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-sm border transition-colors ${
                    booking.status === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="border border-border rounded-sm p-3 bg-surface/30 text-xs space-y-1">
            <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground mr-2">Email</span>{booking.email}</div>
            <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground mr-2">Phone</span>{booking.phone}</div>
            <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground mr-2">Prefers</span>{booking.preferred_contact}</div>
          </div>

          <div className="border border-border rounded-sm p-3 bg-surface/30 text-xs space-y-1">
            <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground mr-2">Service</span>{booking.service ?? "—"}</div>
            <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground mr-2">Shoot</span>{booking.shoot_type ?? "—"}</div>
            <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground mr-2">Date</span>{booking.project_date ?? "—"}</div>
            <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground mr-2">Budget</span>{booking.budget ?? "—"}</div>
            {booking.location_detail && <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground mr-2">Location</span>{booking.location_detail}</div>}
            {booking.studio_preference && <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground mr-2">Studio</span>{booking.studio_preference}</div>}
            {booking.reference_link && <div><span className="text-[9px] uppercase tracking-widest text-muted-foreground mr-2">Reference</span><a className="text-primary underline" href={booking.reference_link} target="_blank" rel="noreferrer">link</a></div>}
            <div className="pt-1.5"><span className="text-[9px] uppercase tracking-widest text-muted-foreground mr-2">Brief</span><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{booking.description}</p></div>
          </div>

          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Pricing Breakdown</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["base_cost", "studio_cost", "travel_cost", "equipment_cost"] as const).map((k) => (
                <div key={k}>
                  <Label className="text-[10px] text-muted-foreground capitalize">{k.replace("_", " ").replace(" cost", "")}</Label>
                  <Input type="number" min="0" value={costs[k]} onChange={(e) => setCosts((c) => ({ ...c, [k]: Number(e.target.value) }))} className="h-9 bg-background border-border rounded-sm text-xs" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
              <span className="font-display text-sm uppercase">Total</span>
              <span className="font-display text-xl text-primary">${total.toLocaleString()}</span>
            </div>
            <Button size="sm" onClick={() => onUpdate(costs)} className="mt-2 rounded-sm uppercase tracking-widest text-[10px] h-8 bg-secondary text-foreground hover:bg-secondary/80">Save Pricing</Button>
          </div>

          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Internal Notes</Label>
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-background border-border rounded-sm text-xs" />
            <Button size="sm" onClick={() => onUpdate({ notes })} className="mt-2 rounded-sm uppercase tracking-widest text-[10px] h-8 bg-secondary text-foreground hover:bg-secondary/80">Save Notes</Button>
          </div>

          <div className="border-t border-border pt-3 flex justify-end">
            <Button size="sm" onClick={() => { onUpdate({ archived: !booking.archived }); onClose(); }} variant="outline" className="rounded-sm uppercase tracking-widest text-[10px] h-8">
              <Archive className="h-3 w-3 mr-1.5" /> {booking.archived ? "Unarchive" : "Archive"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   LEADS
   ============================================================ */

type Lead = { id: string; name: string | null; email: string; phone: string | null; source: string; notes: string | null; archived: boolean; created_at: string };

const LeadsView = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSource, setFilterSource] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("leads").select("*").eq("archived", false).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setLeads((data ?? []) as Lead[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const archive = async (id: string) => {
    const { error } = await supabase.from("leads").update({ archived: true } as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Archived");
    load();
  };

  const sources = ["all", "booking", "newsletter", "advertise", "contact", "other"];
  const visible = filterSource === "all" ? leads : leads.filter((l) => l.source === filterSource);

  if (loading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div>
      <PageHead title="Leads & Contacts" sub="Inbound" />
      <div className="flex flex-wrap gap-1.5 mb-4">
        {sources.map((s) => (
          <button key={s} onClick={() => setFilterSource(s)}
            className={`px-2.5 py-1 text-[10px] uppercase tracking-widest border rounded-sm transition-colors ${
              filterSource === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
            }`}>{s} {s !== "all" && `(${leads.filter((l) => l.source === s).length})`}</button>
        ))}
      </div>
      {visible.length === 0 ? (
        <EmptyState icon={Mail} title="No leads yet" body="Leads from booking, newsletter, advertising, and contact forms will appear here." />
      ) : (
        <div className="border border-border rounded-sm divide-y divide-border overflow-hidden">
          {visible.map((l) => (
            <div key={l.id} className="flex items-center gap-3 p-3 flex-wrap hover:bg-surface/40 transition-colors">
              <div className="flex-1 min-w-[180px]">
                <div className="font-medium text-sm">{l.name ?? "—"}</div>
                <div className="text-[10px] text-muted-foreground">{l.email}{l.phone && ` · ${l.phone}`}</div>
              </div>
              <span className="text-[9px] uppercase tracking-widest bg-secondary px-1.5 py-0.5 rounded-sm">{l.source}</span>
              <div className="text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</div>
              <Button size="sm" variant="outline" onClick={() => archive(l.id)} className="rounded-sm text-[10px] uppercase tracking-widest h-7 px-2.5">
                <Archive className="h-3 w-3 mr-1" /> Archive
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================
   USERS
   ============================================================ */

const UsersView = () => {
  const [users, setUsers] = useState<{ id: string; display_name: string | null; roles: AppRole[] }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("id, display_name");
    const { data: roleRows } = await supabase.from("user_roles").select("user_id, role");
    const map: Record<string, AppRole[]> = {};
    (roleRows ?? []).forEach((r) => { (map[r.user_id] ||= []).push(r.role as AppRole); });
    setUsers((profiles ?? []).map((p) => ({ id: p.id, display_name: p.display_name, roles: map[p.id] ?? [] })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (userId: string, role: AppRole, has: boolean) => {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Role updated");
    load();
  };

  if (loading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div>
      <PageHead title="Team & Roles" sub="Admin" />
      {users.length === 0 ? (
        <EmptyState icon={Users} title="No team members yet" body="Invite teammates to start collaborating." />
      ) : (
        <div className="border border-border rounded-sm divide-y divide-border overflow-hidden">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 flex-wrap hover:bg-surface/40 transition-colors">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-ink flex items-center justify-center text-[10px] font-semibold border border-border">
                {(u.display_name ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-[180px]">
                <div className="font-medium text-sm">{u.display_name ?? "Unnamed"}</div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">{u.id}</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["admin", "editor", "writer", "social_manager"] as AppRole[]).map((r) => {
                  const has = u.roles.includes(r);
                  return (
                    <button key={r} onClick={() => toggleRole(u.id, r, has)}
                      className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm border transition-colors ${
                        has ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                      }`}>
                      {r.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================
   ARTICLE EDITOR (drawer)
   ============================================================ */

const Editor = ({ article, userId, onClose, onSaved, articleType = "standard" }: { article: Article | null; userId: string; onClose: () => void; onSaved: () => void; articleType?: ArticleType }) => {
  const [title, setTitle] = useState(article?.title ?? "");
  const [category, setCategory] = useState(article?.category ?? "Music");
  const [tags, setTags] = useState((article?.tags ?? []).join(", "));
  const [cover, setCover] = useState(article?.cover_image_url ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [seoTitle, setSeoTitle] = useState(article?.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(article?.seo_description ?? "");
  const [type, setType] = useState<ArticleType>((article?.article_type as ArticleType) ?? articleType);
  const [busy, setBusy] = useState(false);

  const save = async (status: Status) => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setBusy(true);
    const payload: any = {
      title: title.trim(),
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      cover_image_url: cover || null,
      excerpt: excerpt || null,
      body: body || null,
      seo_title: seoTitle || null,
      seo_description: seoDesc || null,
      status,
      author_id: userId,
      article_type: type,
    };
    const res = article
      ? await supabase.from("articles").update(payload).eq("id", article.id)
      : await supabase.from("articles").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(status === "draft" ? "Saved as draft" : "Submitted for review");
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur z-50 flex items-stretch justify-end">
      <div className="w-full max-w-2xl bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-5 py-3 flex items-center justify-between z-10">
          <div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{article ? "Edit Article" : "New Article"}</div>
            <div className="font-display text-lg uppercase">Article Editor</div>
          </div>
          <div className="flex gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-sm uppercase tracking-widest text-[10px] h-8">Close</Button>
            <Button type="button" size="sm" disabled={busy} onClick={() => save("draft")} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-secondary text-foreground hover:bg-secondary/80">Save Draft</Button>
            <Button type="button" size="sm" disabled={busy} onClick={() => save("submitted")} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="h-3 w-3 mr-1" /> Submit
            </Button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 text-xl font-display uppercase bg-background border-border rounded-sm" placeholder="Headline goes here" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Article Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ArticleType)}>
              <SelectTrigger className="h-9 text-xs rounded-sm bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard" className="text-xs">Standard Article</SelectItem>
                <SelectItem value="film_review" className="text-xs">Film Review</SelectItem>
                <SelectItem value="interview" className="text-xs">Interview</SelectItem>
                <SelectItem value="opinion" className="text-xs">Opinion</SelectItem>
                <SelectItem value="breakdown" className="text-xs">Breakdown</SelectItem>
                <SelectItem value="news" className="text-xs">News</SelectItem>
              </SelectContent>
            </Select>
            {type === "film_review" && (
              <div className="mt-2 text-[10px] text-muted-foreground border border-border rounded-sm p-2 bg-surface/30">
                Switching to Film Review unlocks the specialized review editor. Save & reopen to use it.
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-xs rounded-sm bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Music", "Film", "Fashion", "Chicago Culture", "Entertainment", "Sports", "RTG Breakdown", "Opinion"].map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Tags (comma separated)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} className="h-9 text-xs bg-background border-border rounded-sm" placeholder="chicago, music" />
            </div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Cover Image URL</Label>
            <Input value={cover} onChange={(e) => setCover(e.target.value)} className="h-9 text-xs bg-background border-border rounded-sm" placeholder="https://…" />
            {cover && <img src={cover} alt="" className="mt-2 aspect-[16/9] w-full object-cover border border-border rounded-sm" />}
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Excerpt</Label>
            <Textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="bg-background border-border rounded-sm text-xs" placeholder="One-line hook" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Body</Label>
            <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} className="bg-background border-border rounded-sm text-xs" placeholder="Tell the story…" />
          </div>
          <div className="border-t border-border pt-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2.5 font-semibold">SEO</div>
            <div className="space-y-2.5">
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={60} className="h-9 text-xs bg-background border-border rounded-sm" placeholder="SEO Title (≤60 chars)" />
              <Textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} maxLength={160} rows={2} className="bg-background border-border rounded-sm text-xs" placeholder="Meta description (≤160 chars)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
