import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileEdit, Inbox, RotateCcw, CheckCircle2, Calendar, Image as ImageIcon, Users, Plus, Copy, Instagram, Twitter, LogOut, Send, ArrowRight, Briefcase, Mail, Archive, Youtube } from "lucide-react";
import logo from "@/assets/rtg-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import portfolio1 from "@/assets/portfolio-1.jpg";
import portfolio2 from "@/assets/portfolio-2.jpg";
import portfolio3 from "@/assets/portfolio-3.jpg";
import portfolio4 from "@/assets/portfolio-4.jpg";
import storyMusic from "@/assets/story-music.jpg";
import storyFilm from "@/assets/story-film.jpg";

type Status = "draft" | "submitted" | "revisions" | "approved" | "published";

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
};

type SectionId = "overview" | "drafts" | "submitted" | "revisions" | "published" | "calendar" | "media" | "social" | "bookings" | "leads" | "users";

const ALL_NAV: { id: SectionId; label: string; icon: any; roles: AppRole[] }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, roles: ["admin", "editor", "writer", "social_manager"] },
  { id: "drafts", label: "Drafts", icon: FileEdit, roles: ["admin", "editor", "writer"] },
  { id: "submitted", label: "Submitted", icon: Inbox, roles: ["admin", "editor", "writer"] },
  { id: "revisions", label: "Revisions", icon: RotateCcw, roles: ["admin", "editor", "writer"] },
  { id: "published", label: "Published", icon: CheckCircle2, roles: ["admin", "editor", "writer", "social_manager"] },
  { id: "calendar", label: "Calendar", icon: Calendar, roles: ["admin", "editor", "social_manager"] },
  { id: "media", label: "Media Library", icon: ImageIcon, roles: ["admin", "editor", "writer"] },
  { id: "social", label: "Social", icon: Instagram, roles: ["admin", "editor", "social_manager"] },
  { id: "bookings", label: "Bookings", icon: Briefcase, roles: ["admin", "editor"] },
  { id: "leads", label: "Leads", icon: Mail, roles: ["admin", "editor"] },
  { id: "users", label: "Users", icon: Users, roles: ["admin"] },
];

const STATUS_COLOR: Record<Status, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-gold/20 text-gold",
  revisions: "bg-primary/20 text-primary",
  approved: "bg-cream/20 text-cream",
  published: "bg-emerald-500/20 text-emerald-400",
};

const STATUS_LABEL: Record<Status, string> = {
  draft: "Draft", submitted: "Submitted", revisions: "Revisions", approved: "Approved", published: "Published",
};

const Dashboard = () => {
  const { user, roles, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const navItems = useMemo(() => ALL_NAV.filter((n) => n.roles.some((r) => roles.includes(r))), [roles]);
  const [section, setSection] = useState<SectionId>("overview");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const primaryRole: AppRole = roles[0] ?? "writer";

  const loadArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setArticles((data ?? []) as Article[]);
    setLoading(false);
  };

  useEffect(() => { loadArticles(); }, []);

  // If current section is not allowed, jump to overview
  useEffect(() => {
    if (!navItems.find((n) => n.id === section)) setSection("overview");
  }, [navItems, section]);

  const openEditor = (a: Article | null = null) => { setEditing(a); setEditorOpen(true); };

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

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 shrink-0 border-r border-border bg-sidebar hidden lg:flex flex-col">
        <Link to="/" className="px-6 py-5 border-b border-border flex items-center gap-2">
          <img src={logo} alt="RTG" className="h-8 invert" />
          <span className="font-display text-sm uppercase tracking-widest">Studio</span>
        </Link>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((n) => (
            <button key={n.id} onClick={() => setSection(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors ${
                section === n.id ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}>
              <n.icon className="h-4 w-4" /> {n.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border space-y-3">
          <div>
            <Label className="eyebrow block mb-1">Signed in as</Label>
            <div className="text-sm truncate">{user?.email}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {roles.length ? roles.map((r) => (
                <span key={r} className="text-[10px] uppercase tracking-widest bg-secondary px-2 py-0.5 rounded-sm">{r.replace("_", " ")}</span>
              )) : <span className="text-[10px] uppercase tracking-widest text-muted-foreground">No role</span>}
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="w-full rounded-sm uppercase tracking-widest text-xs">
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-6">
          <div>
            <div className="eyebrow">{primaryRole.replace("_", " ")}</div>
            <div className="font-display text-xl uppercase leading-none">{navItems.find((n) => n.id === section)?.label}</div>
          </div>
          <div className="flex items-center gap-3">
            {(hasRole("writer") || hasRole("editor") || hasRole("admin")) && (
              <Button onClick={() => openEditor(null)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm uppercase tracking-widest text-xs h-10">
                <Plus className="h-4 w-4 mr-1.5" /> Create Article
              </Button>
            )}
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-ink flex items-center justify-center text-xs font-semibold">
              {user?.email?.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {loading ? <div className="text-muted-foreground">Loading…</div> : (
            <>
              {section === "overview" && <Overview articles={articles} onCreate={() => openEditor(null)} canCreate={hasRole("writer") || hasRole("editor") || hasRole("admin")} />}
              {section === "drafts" && <ArticleList articles={filtered(["draft"])} onEdit={openEditor} onUpdateStatus={updateStatus} onDelete={deleteArticle} canEdit roles={roles} currentUserId={user?.id} />}
              {section === "submitted" && <ArticleList articles={filtered(["submitted"])} onEdit={openEditor} onUpdateStatus={updateStatus} onDelete={deleteArticle} canEdit roles={roles} currentUserId={user?.id} />}
              {section === "revisions" && <ArticleList articles={filtered(["revisions"])} onEdit={openEditor} onUpdateStatus={updateStatus} onDelete={deleteArticle} canEdit roles={roles} currentUserId={user?.id} />}
              {section === "published" && <ArticleList articles={filtered(["approved", "published"])} onEdit={openEditor} onUpdateStatus={updateStatus} onDelete={deleteArticle} canEdit roles={roles} currentUserId={user?.id} />}
              {section === "calendar" && <CalendarView articles={filtered(["approved", "published"])} />}
              {section === "media" && <MediaLibrary />}
              {section === "social" && <SocialKit articles={filtered(["published"])} />}
              {section === "bookings" && <BookingsView />}
              {section === "leads" && <LeadsView />}
              {section === "users" && <UsersView />}
            </>
          )}
        </div>
      </div>

      {editorOpen && <Editor article={editing} userId={user!.id} onClose={() => setEditorOpen(false)} onSaved={() => { setEditorOpen(false); loadArticles(); }} />}
    </div>
  );
};

const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="border border-border p-6 bg-surface/40">
    <div className="eyebrow">{label}</div>
    <div className="font-display text-4xl mt-2">{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </div>
);

const SectionTitle = ({ title }: { title: string }) => (
  <h2 className="font-display text-2xl uppercase mb-4 border-b border-border pb-3">{title}</h2>
);

const Overview = ({ articles, onCreate, canCreate }: { articles: Article[]; onCreate: () => void; canCreate: boolean }) => {
  const count = (s: Status) => articles.filter((a) => a.status === s).length;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatCard label="Drafts" value={String(count("draft"))} />
        <StatCard label="In Review" value={String(count("submitted") + count("revisions"))} />
        <StatCard label="Approved" value={String(count("approved"))} />
        <StatCard label="Published" value={String(count("published"))} />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionTitle title="Recent Activity" />
          <div className="border border-border divide-y divide-border">
            {articles.slice(0, 6).map((a) => <ArticleRow key={a.id} a={a} />)}
            {articles.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No articles yet.</div>}
          </div>
        </div>
        <div>
          <SectionTitle title="Workflow" />
          <ol className="space-y-3">
            {(["draft", "submitted", "approved", "published"] as Status[]).map((s, i) => (
              <li key={s} className="flex items-center gap-3 border border-border p-4">
                <div className="font-display text-2xl text-primary w-8">0{i + 1}</div>
                <div className="flex-1">
                  <div className="font-display uppercase">{STATUS_LABEL[s]}</div>
                  <div className="text-xs text-muted-foreground">
                    {{ draft: "Writer creates and saves", submitted: "Editor reviews", approved: "Ready to schedule", published: "Live on the site" }[s]}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {canCreate && (
            <Button onClick={onCreate} className="w-full mt-6 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-1.5" /> New Article
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const ArticleRow = ({ a }: { a: Article }) => (
  <div className="flex items-center gap-4 p-4 hover:bg-surface/40 transition-colors">
    <div className="h-14 w-20 bg-surface flex items-center justify-center overflow-hidden">
      {a.cover_image_url ? <img src={a.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-display text-base uppercase truncate">{a.title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{a.category ?? "Uncategorized"} · {new Date(a.updated_at).toLocaleDateString()}</div>
    </div>
    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm ${STATUS_COLOR[a.status]}`}>{STATUS_LABEL[a.status]}</span>
  </div>
);

const NEXT_STATUS: Partial<Record<Status, { to: Status; label: string; roles: AppRole[] }[]>> = {
  draft: [{ to: "submitted", label: "Submit", roles: ["writer", "editor", "admin"] }],
  submitted: [
    { to: "approved", label: "Approve", roles: ["editor", "admin"] },
    { to: "revisions", label: "Request Revisions", roles: ["editor", "admin"] },
  ],
  revisions: [{ to: "submitted", label: "Resubmit", roles: ["writer", "editor", "admin"] }],
  approved: [{ to: "published", label: "Publish", roles: ["editor", "admin"] }],
  published: [],
};

const ArticleList = ({ articles, onEdit, onUpdateStatus, onDelete, roles, currentUserId }: {
  articles: Article[]; onEdit: (a: Article) => void; onUpdateStatus: (id: string, s: Status) => void;
  onDelete: (id: string) => void; canEdit: boolean; roles: AppRole[]; currentUserId?: string;
}) => {
  if (articles.length === 0) return <div className="border border-dashed border-border p-16 text-center text-muted-foreground">Nothing here yet.</div>;
  return (
    <div className="border border-border divide-y divide-border">
      {articles.map((a) => {
        const transitions = (NEXT_STATUS[a.status] ?? []).filter((t) => t.roles.some((r) => roles.includes(r)));
        const canEditThis = a.author_id === currentUserId || roles.includes("editor") || roles.includes("admin");
        const canDeleteThis = roles.includes("editor") || roles.includes("admin");
        return (
          <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-surface/40 transition-colors">
            <div className="h-14 w-20 bg-surface flex items-center justify-center overflow-hidden shrink-0">
              {a.cover_image_url ? <img src={a.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-base uppercase truncate">{a.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{a.category ?? "Uncategorized"} · {new Date(a.updated_at).toLocaleDateString()}</div>
            </div>
            <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm shrink-0 ${STATUS_COLOR[a.status]}`}>{STATUS_LABEL[a.status]}</span>
            <div className="flex gap-2 shrink-0">
              {canEditThis && <Button size="sm" variant="outline" onClick={() => onEdit(a)} className="rounded-sm text-xs uppercase tracking-widest">Edit</Button>}
              {transitions.map((t) => (
                <Button key={t.to} size="sm" onClick={() => onUpdateStatus(a.id, t.to)} className="rounded-sm text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
                  {t.label} <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              ))}
              {canDeleteThis && <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete article?")) onDelete(a.id); }} className="rounded-sm text-xs uppercase tracking-widest">Del</Button>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CalendarView = ({ articles }: { articles: Article[] }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const buckets: Record<string, Article[]> = {};
  articles.forEach((a) => {
    const d = new Date(a.updated_at);
    const key = days[(d.getDay() + 6) % 7];
    (buckets[key] ||= []).push(a);
  });
  return (
    <div>
      <SectionTitle title="Content Calendar — This Week" />
      <div className="grid grid-cols-7 gap-px bg-border border border-border">
        {days.map((d) => (
          <div key={d} className="bg-background min-h-[260px] p-3">
            <div className="eyebrow mb-3">{d}</div>
            <div className="space-y-2">
              {(buckets[d] || []).map((a) => (
                <div key={a.id} className="bg-surface border-l-2 border-primary p-2.5 rounded-sm">
                  <div className="text-sm font-medium leading-tight">{a.title}</div>
                  <div className="text-[10px] text-primary uppercase tracking-widest mt-1">{a.category}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MEDIA = [portfolio1, portfolio2, portfolio3, portfolio4, storyMusic, storyFilm, portfolio1, portfolio2];
const MediaLibrary = () => (
  <div>
    <SectionTitle title="Media Library" />
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {MEDIA.map((src, i) => (
        <div key={i} className="aspect-square overflow-hidden bg-surface border border-border group cursor-pointer">
          <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        </div>
      ))}
    </div>
  </div>
);

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
  ready: "bg-gold/20 text-gold",
  posted: "bg-emerald-500/20 text-emerald-400",
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

  // Hydrate the editor with the post for the active article+platform (or default caption)
  useEffect(() => {
    if (!selected) return;
    const existing = posts.find((p) => p.platform === platform);
    setCaption(existing?.caption ?? defaultCaption(selected, platform));
    setStatus(existing?.status ?? "draft");
  }, [selected, platform, posts]);

  if (!selected) return <div className="border border-dashed border-border p-16 text-center text-muted-foreground">Publish an article to start the social pipeline.</div>;

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
    <div className="grid lg:grid-cols-[260px_1fr_300px] gap-6">
      {/* Article picker */}
      <div>
        <SectionTitle title="Published" />
        <div className="border border-border divide-y divide-border max-h-[70vh] overflow-y-auto">
          {articles.map((a) => (
            <button key={a.id} onClick={() => setSelected(a)} className={`w-full text-left p-3 ${selected.id === a.id ? "bg-surface" : "hover:bg-surface/40"}`}>
              <div className="text-sm font-medium truncate">{a.title}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{a.category}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div>
        <SectionTitle title={selected.title} />
        {/* Platform tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {PLATFORMS.map((p) => {
            const post = posts.find((x) => x.platform === p.id);
            return (
              <button key={p.id} onClick={() => setPlatform(p.id)}
                className={`flex items-center gap-2 px-4 h-10 rounded-sm text-xs uppercase tracking-widest border transition-colors ${
                  platform === p.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
                }`}>
                <p.icon className="h-3.5 w-3.5" /> {p.label}
                {post && <span className={`text-[9px] px-1.5 py-0.5 rounded-sm ${SOCIAL_STATUS_COLOR[post.status]}`}>{post.status}</span>}
              </button>
            );
          })}
        </div>

        <div className="border border-border p-6 bg-surface/40 space-y-4">
          {selected.cover_image_url && <img src={selected.cover_image_url} alt="" className="aspect-video w-full object-cover" />}
          <div>
            <Label className="eyebrow mb-2 block">Caption ({platform})</Label>
            <Textarea rows={6} value={caption} onChange={(e) => setCaption(e.target.value)} className="bg-background border-border rounded-sm font-sans text-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => save()} disabled={busy} className="rounded-sm uppercase tracking-widest text-xs bg-secondary text-foreground hover:bg-secondary/80">Save Draft</Button>
            <Button onClick={() => save("ready")} disabled={busy} className="rounded-sm uppercase tracking-widest text-xs bg-gold text-ink hover:bg-gold/90">Mark Ready</Button>
            <Button onClick={() => save("posted")} disabled={busy} className="rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90">Mark Posted</Button>
            <Button onClick={() => { navigator.clipboard.writeText(caption); toast.success("Copied"); }} variant="outline" className="rounded-sm uppercase tracking-widest text-xs">
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
            </Button>
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Pipeline: Draft → Ready → Posted</div>
        </div>
      </div>

      {/* Headline variations */}
      <div>
        <SectionTitle title="Headlines" />
        <ul className="space-y-3 text-sm">
          {variations.map((h) => (
            <li key={h} className="border border-border p-4 flex items-center gap-3">
              <span className="flex-1">{h}</span>
              <button onClick={() => { navigator.clipboard.writeText(h); toast.success("Copied"); }} className="text-muted-foreground hover:text-primary">
                <Copy className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ---------- Bookings ----------
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
  new: "bg-primary/20 text-primary",
  contacted: "bg-gold/20 text-gold",
  negotiating: "bg-cream/20 text-cream",
  booked: "bg-emerald-500/20 text-emerald-400",
  completed: "bg-emerald-500/30 text-emerald-300",
  declined: "bg-muted text-muted-foreground",
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

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle title={showArchived ? "Archived Bookings" : "Bookings"} />
        <div className="flex gap-2">
          <Button onClick={() => setShowArchived(false)} variant={showArchived ? "outline" : "default"} size="sm" className="rounded-sm text-xs uppercase tracking-widest">Active ({bookings.filter((b) => !b.archived).length})</Button>
          <Button onClick={() => setShowArchived(true)} variant={showArchived ? "default" : "outline"} size="sm" className="rounded-sm text-xs uppercase tracking-widest">Archived</Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center text-muted-foreground">No bookings here.</div>
      ) : (
        <div className="border border-border divide-y divide-border">
          {visible.map((b) => (
            <div key={b.id} className="p-4 flex items-center gap-4 flex-wrap hover:bg-surface/40 transition-colors">
              <div className="flex-1 min-w-[220px]">
                <div className="font-display text-base uppercase">{b.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{b.service ?? "—"} · {b.shoot_type ?? "—"} · {b.budget ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{b.email} · {b.phone}</div>
              </div>
              <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm ${BOOKING_STATUS_COLOR[b.status]}`}>{b.status}</span>
              <div className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</div>
              <Button size="sm" variant="outline" onClick={() => setActive(b)} className="rounded-sm text-xs uppercase tracking-widest">Open</Button>
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
      <div className="w-full max-w-2xl bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border p-5 flex items-center justify-between z-10">
          <div>
            <div className="eyebrow">Booking</div>
            <div className="font-display text-2xl uppercase">{booking.name}</div>
          </div>
          <Button variant="outline" onClick={onClose} className="rounded-sm uppercase tracking-widest text-xs">Close</Button>
        </div>
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <Label className="eyebrow mb-2 block">Status</Label>
            <div className="flex flex-wrap gap-2">
              {(["new", "contacted", "negotiating", "booked", "completed", "declined"] as BookingStatus[]).map((s) => (
                <button key={s} onClick={() => onUpdate({ status: s })}
                  className={`text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm border ${
                    booking.status === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          {/* Client */}
          <div className="border border-border p-4 bg-surface/40 text-sm space-y-1">
            <div><span className="eyebrow mr-2">Email</span>{booking.email}</div>
            <div><span className="eyebrow mr-2">Phone</span>{booking.phone}</div>
            <div><span className="eyebrow mr-2">Prefers</span>{booking.preferred_contact}</div>
          </div>

          {/* Project */}
          <div className="border border-border p-4 bg-surface/40 text-sm space-y-1">
            <div><span className="eyebrow mr-2">Service</span>{booking.service ?? "—"}</div>
            <div><span className="eyebrow mr-2">Shoot</span>{booking.shoot_type ?? "—"}</div>
            <div><span className="eyebrow mr-2">Date</span>{booking.project_date ?? "—"}</div>
            <div><span className="eyebrow mr-2">Budget</span>{booking.budget ?? "—"}</div>
            {booking.location_detail && <div><span className="eyebrow mr-2">Location</span>{booking.location_detail}</div>}
            {booking.studio_preference && <div><span className="eyebrow mr-2">Studio</span>{booking.studio_preference}</div>}
            {booking.reference_link && <div><span className="eyebrow mr-2">Reference</span><a className="text-primary underline" href={booking.reference_link} target="_blank" rel="noreferrer">link</a></div>}
            <div className="pt-2"><span className="eyebrow mr-2">Brief</span><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{booking.description}</p></div>
          </div>

          {/* Pricing */}
          <div>
            <Label className="eyebrow mb-2 block">Pricing Breakdown</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["base_cost", "studio_cost", "travel_cost", "equipment_cost"] as const).map((k) => (
                <div key={k}>
                  <Label className="text-xs text-muted-foreground capitalize">{k.replace("_", " ").replace(" cost", "")}</Label>
                  <Input type="number" min="0" value={costs[k]} onChange={(e) => setCosts((c) => ({ ...c, [k]: Number(e.target.value) }))} className="h-10 bg-background border-border rounded-sm" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="font-display text-lg uppercase">Total</span>
              <span className="font-display text-2xl text-primary">${total.toLocaleString()}</span>
            </div>
            <Button onClick={() => onUpdate(costs)} className="mt-3 rounded-sm uppercase tracking-widest text-xs bg-secondary text-foreground hover:bg-secondary/80">Save Pricing</Button>
          </div>

          {/* Notes */}
          <div>
            <Label className="eyebrow mb-2 block">Internal Notes</Label>
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-background border-border rounded-sm" />
            <Button onClick={() => onUpdate({ notes })} className="mt-2 rounded-sm uppercase tracking-widest text-xs bg-secondary text-foreground hover:bg-secondary/80">Save Notes</Button>
          </div>

          {/* Archive */}
          <div className="border-t border-border pt-4 flex justify-end">
            <Button onClick={() => { onUpdate({ archived: !booking.archived }); onClose(); }} variant="outline" className="rounded-sm uppercase tracking-widest text-xs">
              <Archive className="h-3.5 w-3.5 mr-1.5" /> {booking.archived ? "Unarchive" : "Archive"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Leads ----------
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

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div>
      <SectionTitle title="Leads & Contacts" />
      <div className="flex flex-wrap gap-2 mb-4">
        {sources.map((s) => (
          <button key={s} onClick={() => setFilterSource(s)}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-widest border rounded-sm ${
              filterSource === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
            }`}>{s} {s !== "all" && `(${leads.filter((l) => l.source === s).length})`}</button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center text-muted-foreground">No leads yet.</div>
      ) : (
        <div className="border border-border divide-y divide-border">
          {visible.map((l) => (
            <div key={l.id} className="flex items-center gap-4 p-4 flex-wrap hover:bg-surface/40 transition-colors">
              <div className="flex-1 min-w-[200px]">
                <div className="font-medium">{l.name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{l.email}{l.phone && ` · ${l.phone}`}</div>
              </div>
              <span className="text-[10px] uppercase tracking-widest bg-secondary px-2 py-1 rounded-sm">{l.source}</span>
              <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</div>
              <Button size="sm" variant="outline" onClick={() => archive(l.id)} className="rounded-sm text-xs uppercase tracking-widest">
                <Archive className="h-3 w-3 mr-1" /> Archive
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div>
      <SectionTitle title="Team & Roles" />
      <div className="border border-border divide-y divide-border">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-4 p-4 flex-wrap">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-ink flex items-center justify-center text-xs font-semibold">
              {(u.display_name ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="font-medium">{u.display_name ?? "Unnamed"}</div>
              <div className="text-xs text-muted-foreground font-mono truncate">{u.id}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["admin", "editor", "writer", "social_manager"] as AppRole[]).map((r) => {
                const has = u.roles.includes(r);
                return (
                  <button key={r} onClick={() => toggleRole(u.id, r, has)}
                    className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border transition-colors ${
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
    </div>
  );
};

const Editor = ({ article, userId, onClose, onSaved }: { article: Article | null; userId: string; onClose: () => void; onSaved: () => void }) => {
  const [title, setTitle] = useState(article?.title ?? "");
  const [category, setCategory] = useState(article?.category ?? "Music");
  const [tags, setTags] = useState((article?.tags ?? []).join(", "));
  const [cover, setCover] = useState(article?.cover_image_url ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [seoTitle, setSeoTitle] = useState(article?.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(article?.seo_description ?? "");
  const [busy, setBusy] = useState(false);

  const save = async (status: Status) => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setBusy(true);
    const payload = {
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
      <div className="w-full max-w-3xl bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border p-5 flex items-center justify-between z-10">
          <div>
            <div className="eyebrow">{article ? "Edit Article" : "New Article"}</div>
            <div className="font-display text-2xl uppercase">Article Editor</div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-sm uppercase tracking-widest text-xs">Close</Button>
            <Button type="button" disabled={busy} onClick={() => save("draft")} className="rounded-sm uppercase tracking-widest text-xs bg-secondary text-foreground hover:bg-secondary/80">Save Draft</Button>
            <Button type="button" disabled={busy} onClick={() => save("submitted")} className="rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="h-3.5 w-3.5 mr-1.5" /> Submit
            </Button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <Label className="eyebrow mb-2 block">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-14 text-2xl font-display uppercase bg-background border-border rounded-sm" placeholder="Headline goes here" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="eyebrow mb-2 block">Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 w-full bg-background border border-border rounded-sm px-3 text-sm">
                {["Music", "Film", "Fashion", "Chicago Culture", "Entertainment", "Sports", "RTG Breakdown", "Opinion"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="eyebrow mb-2 block">Tags (comma separated)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} className="h-11 bg-background border-border rounded-sm" placeholder="chicago, music" />
            </div>
          </div>
          <div>
            <Label className="eyebrow mb-2 block">Cover Image URL</Label>
            <Input value={cover} onChange={(e) => setCover(e.target.value)} className="h-11 bg-background border-border rounded-sm" placeholder="https://…" />
            {cover && <img src={cover} alt="" className="mt-3 aspect-[16/9] w-full object-cover border border-border" />}
          </div>
          <div>
            <Label className="eyebrow mb-2 block">Excerpt</Label>
            <Textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="bg-background border-border rounded-sm" placeholder="One-line hook" />
          </div>
          <div>
            <Label className="eyebrow mb-2 block">Body</Label>
            <Textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} className="bg-background border-border rounded-sm" placeholder="Tell the story…" />
          </div>
          <div className="border-t border-border pt-5">
            <div className="eyebrow mb-3">SEO</div>
            <div className="space-y-3">
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={60} className="h-11 bg-background border-border rounded-sm" placeholder="SEO Title (≤60 chars)" />
              <Textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} maxLength={160} rows={2} className="bg-background border-border rounded-sm" placeholder="Meta description (≤160 chars)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
