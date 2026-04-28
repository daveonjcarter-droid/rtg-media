import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, FileEdit, Inbox, RotateCcw, CheckCircle2, Calendar, Image as ImageIcon, Users, Plus, Copy, Instagram, Twitter } from "lucide-react";
import logo from "@/assets/rtg-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import portfolio1 from "@/assets/portfolio-1.jpg";
import portfolio2 from "@/assets/portfolio-2.jpg";
import portfolio3 from "@/assets/portfolio-3.jpg";
import portfolio4 from "@/assets/portfolio-4.jpg";
import storyMusic from "@/assets/story-music.jpg";
import storyFilm from "@/assets/story-film.jpg";

type Status = "Draft" | "Submitted" | "Revisions" | "Approved" | "Published";

const ROLES = ["Admin", "Editor", "Writer", "Social Manager"] as const;
type Role = typeof ROLES[number];

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "drafts", label: "Drafts", icon: FileEdit },
  { id: "submitted", label: "Submitted", icon: Inbox },
  { id: "revisions", label: "Revisions", icon: RotateCcw },
  { id: "published", label: "Published", icon: CheckCircle2 },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "media", label: "Media Library", icon: ImageIcon },
  { id: "social", label: "Social", icon: Instagram },
  { id: "users", label: "Users", icon: Users },
];

type Article = { id: number; title: string; category: string; author: string; status: Status; updated: string; image: string };

const ARTICLES: Article[] = [
  { id: 1, title: "Chicago's New Wave Is Taking Over", category: "Music", author: "Daveon J. Carter", status: "Published", updated: "2h ago", image: storyMusic },
  { id: 2, title: "The Future of Black Cinema", category: "Film", author: "Brendan Shields", status: "Approved", updated: "1d ago", image: storyFilm },
  { id: 3, title: "South Side Style Diary", category: "Fashion", author: "Writer One", status: "Submitted", updated: "3h ago", image: portfolio2 },
  { id: 4, title: "Late Night Drives, Loud Speakers", category: "Chicago Culture", author: "Writer Two", status: "Draft", updated: "30m ago", image: portfolio3 },
  { id: 5, title: "The Hometown Show", category: "Entertainment", author: "Daveon J. Carter", status: "Revisions", updated: "Yesterday", image: portfolio4 },
  { id: 6, title: "Studio Portraits Vol. 4", category: "Music", author: "Writer Three", status: "Draft", updated: "Just now", image: portfolio1 },
];

const STATUS_COLOR: Record<Status, string> = {
  Draft: "bg-muted text-muted-foreground",
  Submitted: "bg-gold/20 text-gold",
  Revisions: "bg-primary/20 text-primary",
  Approved: "bg-cream/20 text-cream",
  Published: "bg-emerald-500/20 text-emerald-400",
};

const Dashboard = () => {
  const [section, setSection] = useState("overview");
  const [role, setRole] = useState<Role>("Admin");
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-sidebar hidden lg:flex flex-col">
        <Link to="/" className="px-6 py-5 border-b border-border flex items-center gap-2">
          <img src={logo} alt="RTG" className="h-8 invert" />
          <span className="font-display text-sm uppercase tracking-widest">Studio</span>
        </Link>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors ${
                section === n.id ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Label className="eyebrow block mb-2">View As Role</Label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full h-10 bg-background border border-border rounded-sm px-2 text-sm"
          >
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-6">
          <div>
            <div className="eyebrow">{role}</div>
            <div className="font-display text-xl uppercase leading-none">{NAV.find((n) => n.id === section)?.label}</div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setEditorOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm uppercase tracking-widest text-xs h-10">
              <Plus className="h-4 w-4 mr-1.5" /> Create Article
            </Button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-ink flex items-center justify-center text-xs font-semibold">DC</div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {section === "overview" && <Overview onCreate={() => setEditorOpen(true)} />}
          {section === "drafts" && <ArticleList articles={ARTICLES.filter((a) => a.status === "Draft")} onCreate={() => setEditorOpen(true)} />}
          {section === "submitted" && <ArticleList articles={ARTICLES.filter((a) => a.status === "Submitted")} />}
          {section === "revisions" && <ArticleList articles={ARTICLES.filter((a) => a.status === "Revisions")} />}
          {section === "published" && <ArticleList articles={ARTICLES.filter((a) => ["Approved", "Published"].includes(a.status))} />}
          {section === "calendar" && <CalendarView />}
          {section === "media" && <MediaLibrary />}
          {section === "social" && <SocialKit />}
          {section === "users" && <UsersView />}
        </div>
      </div>

      {editorOpen && <Editor onClose={() => setEditorOpen(false)} />}
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

const Overview = ({ onCreate }: { onCreate: () => void }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
      <StatCard label="Drafts" value="6" sub="2 yours" />
      <StatCard label="In Review" value="3" sub="1 needs revision" />
      <StatCard label="Published" value="42" sub="This month" />
      <StatCard label="Avg. Reads" value="12.4K" sub="Per article" />
    </div>

    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SectionTitle title="Recent Activity" />
        <div className="border border-border divide-y divide-border">
          {ARTICLES.slice(0, 5).map((a) => (
            <ArticleRow key={a.id} a={a} />
          ))}
        </div>
      </div>
      <div>
        <SectionTitle title="Workflow" />
        <ol className="space-y-4">
          {(["Draft", "Submitted", "Approved", "Published"] as Status[]).map((s, i) => (
            <li key={s} className="flex items-center gap-3 border border-border p-4">
              <div className="font-display text-2xl text-primary w-8">0{i + 1}</div>
              <div className="flex-1">
                <div className="font-display uppercase">{s}</div>
                <div className="text-xs text-muted-foreground">
                  {{
                    Draft: "Writer creates and saves",
                    Submitted: "Editor reviews",
                    Approved: "Ready to schedule",
                    Published: "Live on the site",
                  }[s]}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <Button onClick={onCreate} className="w-full mt-6 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1.5" /> New Article
        </Button>
      </div>
    </div>
  </div>
);

const SectionTitle = ({ title }: { title: string }) => (
  <h2 className="font-display text-2xl uppercase mb-4 border-b border-border pb-3">{title}</h2>
);

const ArticleRow = ({ a }: { a: Article }) => (
  <div className="flex items-center gap-4 p-4 hover:bg-surface/40 transition-colors">
    <img src={a.image} alt="" className="h-14 w-20 object-cover" />
    <div className="flex-1 min-w-0">
      <div className="font-display text-base uppercase truncate">{a.title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{a.category} · {a.author} · {a.updated}</div>
    </div>
    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm ${STATUS_COLOR[a.status]}`}>{a.status}</span>
  </div>
);

const ArticleList = ({ articles, onCreate }: { articles: Article[]; onCreate?: () => void }) => (
  <div>
    {articles.length === 0 ? (
      <div className="border border-dashed border-border p-16 text-center">
        <div className="text-muted-foreground mb-4">Nothing here yet.</div>
        {onCreate && <Button onClick={onCreate} className="rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1.5" /> Create Article</Button>}
      </div>
    ) : (
      <div className="border border-border divide-y divide-border">
        {articles.map((a) => <ArticleRow key={a.id} a={a} />)}
      </div>
    )}
  </div>
);

const CalendarView = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const items: Record<string, { time: string; title: string; cat: string }[]> = {
    Mon: [{ time: "09:00", title: "Chicago New Wave", cat: "Music" }],
    Wed: [{ time: "12:00", title: "Cinema Feature", cat: "Film" }],
    Thu: [{ time: "16:00", title: "Style Diary", cat: "Fashion" }],
    Fri: [{ time: "10:00", title: "Breakdown Drop", cat: "RTG Breakdown" }, { time: "18:00", title: "Hometown Show Recap", cat: "Entertainment" }],
  };
  return (
    <div>
      <SectionTitle title="Content Calendar — This Week" />
      <div className="grid grid-cols-7 gap-px bg-border border border-border">
        {days.map((d) => (
          <div key={d} className="bg-background min-h-[260px] p-3">
            <div className="eyebrow mb-3">{d}</div>
            <div className="space-y-2">
              {(items[d] || []).map((it, i) => (
                <div key={i} className="bg-surface border-l-2 border-primary p-2.5 rounded-sm">
                  <div className="text-[10px] text-muted-foreground">{it.time}</div>
                  <div className="text-sm font-medium leading-tight mt-1">{it.title}</div>
                  <div className="text-[10px] text-primary uppercase tracking-widest mt-1">{it.cat}</div>
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

const SocialKit = () => {
  const a = ARTICLES[0];
  const caption = `Chicago's new wave isn't coming — it's already here. We sat down with the artists rewriting the city's sound.\n\nFull story at rtgmedia.com/articles/${a.id}\n\n#RTGMedia #Chicago #NewWave`;
  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div>
        <SectionTitle title="Social Content — Auto Generated" />
        <div className="border border-border p-6 bg-surface/40">
          <img src={a.image} alt="" className="aspect-square w-full object-cover mb-4" />
          <div className="font-display text-xl uppercase">{a.title}</div>
          <div className="eyebrow mt-4 mb-2">Caption</div>
          <pre className="bg-background border border-border p-4 text-sm whitespace-pre-wrap font-sans rounded-sm">{caption}</pre>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={() => { navigator.clipboard.writeText(caption); toast.success("Caption copied"); }} variant="outline" className="rounded-sm uppercase tracking-widest text-xs">
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Caption
            </Button>
            <Button onClick={() => toast.success("Marked as posted on Instagram")} variant="outline" className="rounded-sm uppercase tracking-widest text-xs">
              <Instagram className="h-3.5 w-3.5 mr-1.5" /> Mark Posted IG
            </Button>
            <Button onClick={() => toast.success("Marked as posted on TikTok")} variant="outline" className="rounded-sm uppercase tracking-widest text-xs">
              TikTok
            </Button>
            <Button onClick={() => toast.success("Marked as posted on X")} variant="outline" className="rounded-sm uppercase tracking-widest text-xs">
              <Twitter className="h-3.5 w-3.5 mr-1.5" /> X
            </Button>
          </div>
        </div>
      </div>
      <div>
        <SectionTitle title="Headline Variations" />
        <ul className="space-y-3 text-sm">
          {[
            "Chicago's new wave is taking over",
            "The artists rewriting Chicago's sound",
            "Inside the new era of Chicago music",
          ].map((h) => (
            <li key={h} className="border border-border p-4 flex items-center gap-3">
              <span className="flex-1">{h}</span>
              <button onClick={() => { navigator.clipboard.writeText(h); toast.success("Copied"); }} className="text-muted-foreground hover:text-primary">
                <Copy className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <SectionTitle title="Engagement" />
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="IG Likes" value="—" />
          <StatCard label="TT Views" value="—" />
          <StatCard label="X Reposts" value="—" />
        </div>
      </div>
    </div>
  );
};

const USERS = [
  { name: "Daveon J. Carter", role: "Admin", email: "daveon@rtgmedia.com" },
  { name: "Brendan Shields", role: "Admin", email: "brendan@rtgmedia.com" },
  { name: "Jordan Lee", role: "Editor", email: "jordan@rtgmedia.com" },
  { name: "Maya Davis", role: "Writer", email: "maya@rtgmedia.com" },
  { name: "Trey Adams", role: "Social Manager", email: "trey@rtgmedia.com" },
];

const UsersView = () => (
  <div>
    <SectionTitle title="Team & Roles" />
    <div className="border border-border divide-y divide-border">
      {USERS.map((u) => (
        <div key={u.email} className="flex items-center gap-4 p-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-ink flex items-center justify-center text-xs font-semibold">
            {u.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1">
            <div className="font-medium">{u.name}</div>
            <div className="text-xs text-muted-foreground">{u.email}</div>
          </div>
          <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm bg-secondary">{u.role}</span>
        </div>
      ))}
    </div>
  </div>
);

const Editor = ({ onClose }: { onClose: () => void }) => {
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Saved as draft");
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur z-50 flex items-stretch justify-end">
      <form onSubmit={submit} className="w-full max-w-3xl bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border p-5 flex items-center justify-between z-10">
          <div>
            <div className="eyebrow">New Article</div>
            <div className="font-display text-2xl uppercase">Article Editor</div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-sm uppercase tracking-widest text-xs">Close</Button>
            <Button type="submit" className="rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground">Save Draft</Button>
            <Button type="button" onClick={() => { toast.success("Submitted for review"); onClose(); }} className="rounded-sm uppercase tracking-widest text-xs bg-cream text-ink hover:bg-cream/90">Submit</Button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <Label className="eyebrow mb-2 block">Title</Label>
            <Input className="h-14 text-2xl font-display uppercase bg-background border-border rounded-sm" placeholder="Headline goes here" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="eyebrow mb-2 block">Category</Label>
              <select className="h-11 w-full bg-background border border-border rounded-sm px-3 text-sm">
                {["Music", "Film", "Fashion", "Chicago Culture", "Entertainment", "Sports", "RTG Breakdown", "Opinion"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="eyebrow mb-2 block">Tags</Label>
              <Input className="h-11 bg-background border-border rounded-sm" placeholder="chicago, music, new wave" />
            </div>
          </div>
          <div>
            <Label className="eyebrow mb-2 block">Cover Image</Label>
            <div className="aspect-[16/9] border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
              Drop image or click to upload
            </div>
          </div>
          <div>
            <Label className="eyebrow mb-2 block">Body</Label>
            <Textarea rows={12} className="bg-background border-border rounded-sm" placeholder="Tell the story…" />
          </div>
          <div className="border-t border-border pt-5">
            <div className="eyebrow mb-3">SEO</div>
            <div className="space-y-3">
              <Input className="h-11 bg-background border-border rounded-sm" placeholder="SEO Title (≤60 chars)" />
              <Textarea rows={2} className="bg-background border-border rounded-sm" placeholder="Meta description (≤160 chars)" />
              <Input className="h-11 bg-background border-border rounded-sm" placeholder="Slug" />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Dashboard;
