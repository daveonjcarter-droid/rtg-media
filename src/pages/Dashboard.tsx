import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileEdit, Inbox, RotateCcw, CheckCircle2, Calendar, Image as ImageIcon, Users, Plus, Copy, Instagram, Twitter, LogOut, Send, ArrowRight } from "lucide-react";
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

type SectionId = "overview" | "drafts" | "submitted" | "revisions" | "published" | "calendar" | "media" | "social" | "users";

const ALL_NAV: { id: SectionId; label: string; icon: any; roles: AppRole[] }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, roles: ["admin", "editor", "writer", "social_manager"] },
  { id: "drafts", label: "Drafts", icon: FileEdit, roles: ["admin", "editor", "writer"] },
  { id: "submitted", label: "Submitted", icon: Inbox, roles: ["admin", "editor", "writer"] },
  { id: "revisions", label: "Revisions", icon: RotateCcw, roles: ["admin", "editor", "writer"] },
  { id: "published", label: "Published", icon: CheckCircle2, roles: ["admin", "editor", "writer", "social_manager"] },
  { id: "calendar", label: "Calendar", icon: Calendar, roles: ["admin", "editor", "social_manager"] },
  { id: "media", label: "Media Library", icon: ImageIcon, roles: ["admin", "editor", "writer"] },
  { id: "social", label: "Social", icon: Instagram, roles: ["admin", "editor", "social_manager"] },
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

const SocialKit = ({ articles }: { articles: Article[] }) => {
  const [selected, setSelected] = useState<Article | null>(articles[0] ?? null);
  useEffect(() => { if (!selected && articles[0]) setSelected(articles[0]); }, [articles, selected]);
  if (!selected) return <div className="border border-dashed border-border p-16 text-center text-muted-foreground">Publish an article to generate social content.</div>;

  const caption = `${selected.excerpt ?? selected.title}\n\nFull story at rtgmedia.com/articles/${selected.id}\n\n#RTGMedia #Chicago`;
  const variations = [
    selected.title,
    `Inside: ${selected.title}`,
    `${selected.category ?? "Culture"} — ${selected.title}`,
  ];

  return (
    <div className="grid lg:grid-cols-[260px_1fr_320px] gap-6">
      <div>
        <SectionTitle title="Published" />
        <div className="border border-border divide-y divide-border">
          {articles.map((a) => (
            <button key={a.id} onClick={() => setSelected(a)} className={`w-full text-left p-3 ${selected.id === a.id ? "bg-surface" : "hover:bg-surface/40"}`}>
              <div className="text-sm font-medium truncate">{a.title}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{a.category}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <SectionTitle title="Auto-Generated Caption" />
        <div className="border border-border p-6 bg-surface/40">
          {selected.cover_image_url && <img src={selected.cover_image_url} alt="" className="aspect-square w-full object-cover mb-4" />}
          <div className="font-display text-xl uppercase">{selected.title}</div>
          <div className="eyebrow mt-4 mb-2">Caption</div>
          <pre className="bg-background border border-border p-4 text-sm whitespace-pre-wrap font-sans rounded-sm">{caption}</pre>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={() => { navigator.clipboard.writeText(caption); toast.success("Copied"); }} variant="outline" className="rounded-sm uppercase tracking-widest text-xs">
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
            </Button>
            <Button onClick={() => toast.success("Marked posted on IG")} variant="outline" className="rounded-sm uppercase tracking-widest text-xs"><Instagram className="h-3.5 w-3.5 mr-1.5" /> IG</Button>
            <Button onClick={() => toast.success("Marked posted on TikTok")} variant="outline" className="rounded-sm uppercase tracking-widest text-xs">TikTok</Button>
            <Button onClick={() => toast.success("Marked posted on X")} variant="outline" className="rounded-sm uppercase tracking-widest text-xs"><Twitter className="h-3.5 w-3.5 mr-1.5" /> X</Button>
          </div>
        </div>
      </div>
      <div>
        <SectionTitle title="Headline Variations" />
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
