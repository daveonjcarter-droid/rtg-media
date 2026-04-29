// Social Studio — YouTube-Studio-style 7-tab workspace.
// Real CRUD for social_posts, social_post_metrics, social_ideas.
import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalIcon, Plus, Edit, Copy as CopyIcon, Archive, Trash2, ExternalLink,
  Lightbulb, MessageCircle, Settings as Cog, BarChart3, Users, TrendingUp,
  Instagram, Twitter, Youtube, Music2, Linkedin, Facebook, Save, ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { PageHead, StatCard, EmptyState, SectionShell } from "../shared/Primitives";
import { logActivity } from "@/lib/activity";
import { fmtRelative, daysAgo, fmtDay } from "@/lib/dateUtils";

type Platform = "instagram" | "tiktok" | "youtube" | "x" | "linkedin" | "facebook";
type SocialStatus = "draft" | "ready" | "scheduled" | "posted" | "archived";

type SocialRow = {
  id: string;
  article_id: string | null;
  platform: Platform;
  status: SocialStatus;
  caption: string | null;
  posted_at: string | null;
  scheduled_for: string | null;
  thumbnail_url: string | null;
  hashtags: string | null;
  link_url: string | null;
  archived: boolean;
  created_at: string;
};

type Idea = {
  id: string;
  title: string;
  category: string;
  notes: string | null;
  status: string;
  created_at: string;
};

type Metric = {
  id: string;
  social_post_id: string;
  recorded_at: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  reach: number;
  engagement_rate: number;
};

const PLATFORM_ICON: Record<Platform, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram, tiktok: Music2, youtube: Youtube, x: Twitter, linkedin: Linkedin, facebook: Facebook,
};
const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", x: "X (Twitter)", linkedin: "LinkedIn", facebook: "Facebook",
};
const STATUS_COLOR: Record<SocialStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  ready: "bg-cream/15 text-cream border-cream/30",
  scheduled: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  posted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  archived: "bg-muted/40 text-muted-foreground border-border",
};

type Tab = "overview" | "content" | "analytics" | "audience" | "trends" | "community" | "settings";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "content", label: "Content", icon: CalIcon },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "audience", label: "Audience", icon: Users },
  { id: "trends", label: "Trends", icon: Lightbulb },
  { id: "community", label: "Community", icon: MessageCircle },
  { id: "settings", label: "Settings", icon: Cog },
];

const SocialStudioSection = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [posts, setPosts] = useState<SocialRow[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SocialRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState<SocialRow | null>(null);
  const [ideaOpen, setIdeaOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [{ data: p }, { data: i }, { data: m }] = await Promise.all([
      supabase.from("social_posts").select("*").order("created_at", { ascending: false }),
      supabase.from("social_ideas").select("*").order("created_at", { ascending: false }),
      supabase.from("social_post_metrics").select("*").order("recorded_at", { ascending: false }),
    ]);
    setPosts((p ?? []) as SocialRow[]);
    setIdeas((i ?? []) as Idea[]);
    setMetrics((m ?? []) as Metric[]);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  if (loading) return <div className="text-muted-foreground text-sm">Loading studio…</div>;

  return (
    <SectionShell>
      <PageHead
        title="Social Studio"
        sub="Plan · Schedule · Analyze"
        actions={
          tab === "content" || tab === "overview" ? (
            <Button
              size="sm"
              onClick={() => { setEditing(null); setEditorOpen(true); }}
              className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3 bg-primary text-primary-foreground"
            >
              <Plus className="h-3 w-3 mr-1" /> New Post
            </Button>
          ) : tab === "trends" ? (
            <Button
              size="sm"
              onClick={() => setIdeaOpen(true)}
              className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3 bg-primary text-primary-foreground"
            >
              <Plus className="h-3 w-3 mr-1" /> Save Idea
            </Button>
          ) : null
        }
      />

      {/* Tab strip */}
      <div className="flex gap-1 border-b border-border overflow-x-auto scrollbar-hide -mt-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3 w-3" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab posts={posts} metrics={metrics} />}
      {tab === "content" && (
        <ContentTab
          posts={posts}
          onEdit={(p) => { setEditing(p); setEditorOpen(true); }}
          onMetrics={(p) => setMetricsOpen(p)}
          onRefresh={refresh}
        />
      )}
      {tab === "analytics" && <AnalyticsTab posts={posts} metrics={metrics} />}
      {tab === "audience" && <AudienceTab posts={posts} metrics={metrics} />}
      {tab === "trends" && <TrendsTab ideas={ideas} onRefresh={refresh} userId={user?.id} />}
      {tab === "community" && <CommunityTab />}
      {tab === "settings" && <SettingsTab />}

      <PostEditor
        open={editorOpen}
        post={editing}
        userId={user?.id}
        onClose={() => setEditorOpen(false)}
        onSaved={() => { setEditorOpen(false); refresh(); }}
      />
      <MetricsDialog
        post={metricsOpen}
        onClose={() => setMetricsOpen(null)}
        onSaved={() => { setMetricsOpen(null); refresh(); }}
      />
      <IdeaDialog
        open={ideaOpen}
        userId={user?.id}
        onClose={() => setIdeaOpen(false)}
        onSaved={() => { setIdeaOpen(false); refresh(); }}
      />
    </SectionShell>
  );
};

/* ============== TAB: OVERVIEW ============== */
const OverviewTab = ({ posts, metrics }: { posts: SocialRow[]; metrics: Metric[] }) => {
  const scheduled = posts.filter((p) => p.status === "scheduled").length;
  const postedThisWeek = posts.filter(
    (p) => p.posted_at && new Date(p.posted_at) >= daysAgo(7)
  ).length;
  const totalEngagement = metrics.reduce((s, m) => s + m.likes + m.shares + m.comments, 0);
  const totalViews = metrics.reduce((s, m) => s + m.views, 0);
  const platformAgg = useMemo(() => {
    const map = new Map<Platform, number>();
    metrics.forEach((m) => {
      const post = posts.find((p) => p.id === m.social_post_id);
      if (!post) return;
      map.set(post.platform, (map.get(post.platform) ?? 0) + m.views);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [metrics, posts]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
      <StatCard label="Scheduled" value={scheduled} accent="bg-sky-500" />
      <StatCard label="Posted this week" value={postedThisWeek} accent="bg-emerald-500" />
      <StatCard label="Total Engagement" value={totalEngagement} accent="bg-primary" sub="Likes · Shares · Comments" />
      <StatCard label="Best Platform" value={platformAgg ? PLATFORM_LABEL[platformAgg[0]] : "—"} sub={platformAgg ? `${platformAgg[1]} views` : "Add metrics"} accent="bg-gold" />
      <div className="col-span-2 md:col-span-4 mt-3">
        {totalViews === 0 && (
          <EmptyState
            icon={BarChart3}
            title="No analytics recorded yet"
            body="Once you publish posts and record their metrics, performance shows here."
          />
        )}
      </div>
    </div>
  );
};

/* ============== TAB: CONTENT ============== */
const ContentTab = ({
  posts, onEdit, onMetrics, onRefresh,
}: {
  posts: SocialRow[];
  onEdit: (p: SocialRow) => void;
  onMetrics: (p: SocialRow) => void;
  onRefresh: () => Promise<void>;
}) => {
  const [filter, setFilter] = useState<"all" | SocialStatus>("all");
  const filtered = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const updateStatus = async (id: string, status: SocialStatus) => {
    const patch: Record<string, unknown> = { status };
    if (status === "posted") patch.posted_at = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("social_posts").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    if (status === "scheduled") logActivity({ kind: "social_scheduled", title: "Social post scheduled" });
    if (status === "posted") logActivity({ kind: "social_posted", title: "Social post published" });
    toast.success(`Marked as ${status}`);
    onRefresh();
  };

  const duplicate = async (p: SocialRow) => {
    const { error } = await supabase.from("social_posts").insert({
      article_id: p.article_id ?? "",
      platform: p.platform,
      caption: p.caption,
      status: "draft" as SocialStatus,
      thumbnail_url: p.thumbnail_url,
      hashtags: p.hashtags,
      link_url: p.link_url,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (error) return toast.error(error.message);
    toast.success("Duplicated");
    onRefresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await supabase.from("social_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    onRefresh();
  };

  const copyCaption = (p: SocialRow) => {
    const text = `${p.caption ?? ""}${p.hashtags ? `\n\n${p.hashtags}` : ""}${p.link_url ? `\n${p.link_url}` : ""}`;
    navigator.clipboard.writeText(text);
    toast.success(`Copied — paste into ${PLATFORM_LABEL[p.platform]}`);
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="flex flex-wrap gap-1">
        {(["all", "draft", "ready", "scheduled", "posted", "archived"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
            className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3"
          >
            {s}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalIcon} title="No posts here" body="Create one to start planning." />
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-surface/40 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 w-10"></th>
                <th className="text-left px-3 py-2">Caption</th>
                <th className="text-left px-3 py-2">Platform</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">When</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const Icon = PLATFORM_ICON[p.platform];
                return (
                  <tr key={p.id} className="hover:bg-surface/30">
                    <td className="px-3 py-2">
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt="" className="h-8 w-8 object-cover rounded-sm" />
                      ) : (
                        <div className="h-8 w-8 bg-surface/60 rounded-sm" />
                      )}
                    </td>
                    <td className="px-3 py-2 max-w-xs truncate">{p.caption ?? <span className="text-muted-foreground">(no caption)</span>}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px]">
                        <Icon className="h-3 w-3" /> {PLATFORM_LABEL[p.platform]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-block text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${STATUS_COLOR[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-[11px]">
                      {p.posted_at ? `Posted ${fmtRelative(p.posted_at)}` :
                       p.scheduled_for ? `Scheduled ${new Date(p.scheduled_for).toLocaleString()}` :
                       fmtRelative(p.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => copyCaption(p)} title="Copy caption" className="h-7 w-7 p-0">
                          <CopyIcon className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onEdit(p)} title="Edit" className="h-7 w-7 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onMetrics(p)} title="Add metrics" className="h-7 w-7 p-0">
                          <BarChart3 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => duplicate(p)} title="Duplicate" className="h-7 w-7 p-0">
                          <CopyIcon className="h-3 w-3 opacity-60" />
                        </Button>
                        {p.status !== "scheduled" && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(p.id, "scheduled")} title="Schedule" className="h-7 w-7 p-0">
                            <CalIcon className="h-3 w-3" />
                          </Button>
                        )}
                        {p.status !== "posted" && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(p.id, "posted")} title="Mark posted" className="h-7 w-7 p-0">
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        )}
                        {p.status !== "archived" && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(p.id, "archived")} title="Archive" className="h-7 w-7 p-0">
                            <Archive className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => remove(p.id)} title="Delete" className="h-7 w-7 p-0 hover:text-primary">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ============== TAB: ANALYTICS ============== */
const AnalyticsTab = ({ posts, metrics }: { posts: SocialRow[]; metrics: Metric[] }) => {
  const totals = useMemo(() => {
    const v = metrics.reduce((s, m) => s + m.views, 0);
    const l = metrics.reduce((s, m) => s + m.likes, 0);
    const sh = metrics.reduce((s, m) => s + m.shares, 0);
    const c = metrics.reduce((s, m) => s + m.comments, 0);
    const eng = v ? +(((l + sh + c) / v) * 100).toFixed(2) : 0;
    return { v, l, sh, c, eng };
  }, [metrics]);

  const series = useMemo(() => {
    const map = new Map<string, { day: string; views: number; engagement: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i);
      map.set(d.toISOString().slice(0, 10), { day: fmtDay(d), views: 0, engagement: 0 });
    }
    metrics.forEach((m) => {
      const k = m.recorded_at.slice(0, 10);
      const b = map.get(k);
      if (b) {
        b.views += m.views;
        b.engagement += m.likes + m.shares + m.comments;
      }
    });
    return Array.from(map.values());
  }, [metrics]);

  if (metrics.length === 0) {
    return <div className="mt-4"><EmptyState icon={BarChart3} title="No metrics recorded yet" body="Open a post in the Content tab and click the chart icon to log its performance." /></div>;
  }

  return (
    <div className="space-y-4 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Views" value={totals.v} accent="bg-primary" />
        <StatCard label="Likes" value={totals.l} accent="bg-cream" />
        <StatCard label="Shares" value={totals.sh} accent="bg-gold" />
        <StatCard label="Comments" value={totals.c} accent="bg-emerald-500" />
        <StatCard label="Engagement Rate" value={`${totals.eng}%`} />
      </div>
      <div className="border border-border rounded-sm bg-surface/30 p-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="socViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
            <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#socViews)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ============== TAB: AUDIENCE ============== */
const AudienceTab = ({ posts, metrics }: { posts: SocialRow[]; metrics: Metric[] }) => {
  const platformData = useMemo(() => {
    const map = new Map<Platform, { posts: number; engagement: number; views: number }>();
    posts.forEach((p) => {
      const ex = map.get(p.platform) ?? { posts: 0, engagement: 0, views: 0 };
      ex.posts += 1;
      map.set(p.platform, ex);
    });
    metrics.forEach((m) => {
      const post = posts.find((p) => p.id === m.social_post_id);
      if (!post) return;
      const ex = map.get(post.platform) ?? { posts: 0, engagement: 0, views: 0 };
      ex.engagement += m.likes + m.shares + m.comments;
      ex.views += m.views;
      map.set(post.platform, ex);
    });
    return [...map.entries()].map(([k, v]) => ({ platform: PLATFORM_LABEL[k], ...v }));
  }, [posts, metrics]);

  if (platformData.length === 0) {
    return <div className="mt-4"><EmptyState icon={Users} title="No audience data" body="Add posts and metrics to see platform-level patterns." /></div>;
  }

  return (
    <div className="space-y-4 mt-2">
      <div className="border border-border rounded-sm bg-surface/30 p-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={platformData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="platform" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
            <Bar dataKey="views" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            <Bar dataKey="engagement" fill="hsl(var(--gold))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {platformData.map((p) => (
          <div key={p.platform} className="border border-border rounded-sm bg-surface/30 p-4">
            <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{p.platform}</div>
            <div className="font-display text-2xl mt-1">{p.posts} posts</div>
            <div className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">
              {p.views.toLocaleString()} views · {p.engagement.toLocaleString()} engagements
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============== TAB: TRENDS ============== */
const TrendsTab = ({
  ideas, onRefresh, userId,
}: { ideas: Idea[]; onRefresh: () => Promise<void>; userId: string | undefined }) => {
  const seedIdeas: { title: string; category: string }[] = [
    { title: "Side-by-side breakdown of a Chicago film locale today vs the movie", category: "film_breakdown" },
    { title: "5 underrated Chicago music venues for visiting artists", category: "chicago_culture" },
    { title: "Drop reaction: rapid-fire takes on this week's biggest album", category: "music_drop" },
    { title: "Behind the camera with a Chicago director — short-form interview", category: "chicago_culture" },
    { title: "Frame-by-frame: iconic shot from a recent release", category: "film_breakdown" },
    { title: "Genre crossover: hip-hop production meets film score", category: "music_drop" },
  ];

  const saveSeed = async (s: { title: string; category: string }) => {
    if (!userId) return toast.error("Sign in required");
    const { error } = await supabase.from("social_ideas").insert({
      title: s.title, category: s.category, status: "saved", created_by: userId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (error) return toast.error(error.message);
    logActivity({ kind: "idea_saved", title: s.title });
    toast.success("Idea saved");
    onRefresh();
  };

  const promoteToDraft = async (idea: Idea) => {
    if (!userId) return toast.error("Sign in required");
    const { error: e1 } = await supabase.from("social_ideas").update({ status: "drafted" }).eq("id", idea.id);
    if (e1) return toast.error(e1.message);
    const { error: e2 } = await supabase.from("social_posts").insert({
      article_id: "", platform: "instagram" as Platform, status: "draft" as SocialStatus,
      caption: idea.title,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (e2) return toast.error(e2.message);
    toast.success("Draft created in Content tab");
    onRefresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("social_ideas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    onRefresh();
  };

  return (
    <div className="space-y-5 mt-2">
      <div>
        <PageHead title="Idea Generator" sub="Spark · save · draft" />
        <div className="grid md:grid-cols-2 gap-3">
          {seedIdeas.map((s, i) => (
            <div key={i} className="border border-border rounded-sm bg-surface/30 p-4 flex flex-col gap-3">
              <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{s.category.replace(/_/g, " ")}</div>
              <div className="text-sm">{s.title}</div>
              <div className="flex gap-2 mt-auto">
                <Button size="sm" variant="outline" onClick={() => saveSeed(s)} className="rounded-sm uppercase tracking-widest text-[10px] h-7 px-2">
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <PageHead title="Saved Ideas" sub={`${ideas.length} captured`} />
        {ideas.length === 0 ? (
          <EmptyState icon={Lightbulb} title="No ideas saved yet" body="Save one above or click 'New idea' in the header." />
        ) : (
          <div className="border border-border rounded-sm divide-y divide-border bg-surface/20">
            {ideas.map((i) => (
              <div key={i.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{i.category.replace(/_/g, " ")} · {i.status}</div>
                  <div className="text-sm">{i.title}</div>
                  {i.notes && <div className="text-[11px] text-muted-foreground mt-0.5">{i.notes}</div>}
                </div>
                <Button size="sm" variant="outline" onClick={() => promoteToDraft(i)} className="rounded-sm uppercase tracking-widest text-[10px] h-7 px-2">
                  Create Draft
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(i.id)} className="h-7 w-7 p-0 hover:text-primary">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============== TAB: COMMUNITY ============== */
const CommunityTab = () => (
  <div className="space-y-4 mt-2">
    <EmptyState
      icon={MessageCircle}
      title="Community module coming online"
      body="Comments, mentions, and replies will surface here once a platform connection is wired. The schema is in place — engagement metrics from posted content already feed analytics."
    />
  </div>
);

/* ============== TAB: SETTINGS ============== */
const SettingsTab = () => {
  const [hashtags, setHashtags] = useState(() => localStorage.getItem("rtg_default_hashtags") ?? "#RTG #Chicago #RunnersToGreatness");
  const [tone, setTone] = useState(() => localStorage.getItem("rtg_caption_tone") ?? "editorial");

  const save = () => {
    localStorage.setItem("rtg_default_hashtags", hashtags);
    localStorage.setItem("rtg_caption_tone", tone);
    toast.success("Defaults saved");
  };

  const platforms: { id: Platform; status: "available" | "pending" }[] = [
    { id: "instagram", status: "pending" },
    { id: "tiktok", status: "pending" },
    { id: "youtube", status: "pending" },
    { id: "x", status: "pending" },
    { id: "linkedin", status: "pending" },
    { id: "facebook", status: "pending" },
  ];

  return (
    <div className="space-y-5 mt-2">
      <div>
        <PageHead title="Connected Platforms" sub="Direct posting" />
        <div className="grid md:grid-cols-3 gap-3">
          {platforms.map((p) => {
            const Icon = PLATFORM_ICON[p.id];
            return (
              <div key={p.id} className="border border-border rounded-sm bg-surface/30 p-4 flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <div className="flex-1">
                  <div className="text-sm">{PLATFORM_LABEL[p.id]}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    {p.status === "pending" ? "Awaiting developer approval" : "Connected"}
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled className="rounded-sm uppercase tracking-widest text-[9px] h-7 px-2">
                  Connect
                </Button>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
          Real platform posting requires approved developer apps (Meta App Review, TikTok Content Posting API, X paid tier, YouTube OAuth verification, LinkedIn Marketing Platform).
          Captions can be copied to the clipboard from the Content tab in the meantime.
        </div>
      </div>

      <div>
        <PageHead title="Defaults" sub="Caption · hashtags" />
        <div className="grid md:grid-cols-2 gap-3 max-w-3xl">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest">Default Hashtags</Label>
            <Input value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="rounded-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest">Caption Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="rounded-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="editorial">Editorial</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="punchy">Punchy</SelectItem>
                <SelectItem value="cinematic">Cinematic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={save} className="mt-4 rounded-sm uppercase tracking-widest text-[10px] h-9 bg-primary text-primary-foreground">Save Defaults</Button>
      </div>
    </div>
  );
};

/* ============== EDITOR DIALOG ============== */
const PostEditor = ({
  open, post, userId, onClose, onSaved,
}: {
  open: boolean;
  post: SocialRow | null;
  userId: string | undefined;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [status, setStatus] = useState<SocialStatus>("draft");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  useEffect(() => {
    if (post) {
      setPlatform(post.platform);
      setStatus(post.status);
      setCaption(post.caption ?? "");
      setHashtags(post.hashtags ?? localStorage.getItem("rtg_default_hashtags") ?? "");
      setLinkUrl(post.link_url ?? "");
      setThumbnail(post.thumbnail_url ?? "");
      setScheduledFor(post.scheduled_for ? post.scheduled_for.slice(0, 16) : "");
    } else if (open) {
      setPlatform("instagram");
      setStatus("draft");
      setCaption("");
      setHashtags(localStorage.getItem("rtg_default_hashtags") ?? "");
      setLinkUrl("");
      setThumbnail("");
      setScheduledFor("");
    }
  }, [post, open]);

  const save = async () => {
    if (!userId) return toast.error("Sign in required");
    const payload: Record<string, unknown> = {
      platform, status, caption,
      hashtags, link_url: linkUrl, thumbnail_url: thumbnail,
      scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
    };
    if (status === "scheduled" && !scheduledFor) {
      return toast.error("Pick a schedule date");
    }
    const { error } = post
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? await supabase.from("social_posts").update(payload as any).eq("id", post.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : await supabase.from("social_posts").insert({ ...payload, article_id: "" } as any);
    if (error) return toast.error(error.message);
    if (status === "scheduled") logActivity({ kind: "social_scheduled", title: caption.slice(0, 80) || "Social post scheduled" });
    toast.success(post ? "Updated" : "Created");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-widest">{post ? "Edit Post" : "New Post"}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest">Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
              <SelectTrigger className="rounded-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => (
                  <SelectItem key={p} value={p}>{PLATFORM_LABEL[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as SocialStatus)}>
              <SelectTrigger className="rounded-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest">Caption</Label>
            <Textarea rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} className="rounded-sm" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest">Hashtags</Label>
            <Input value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="rounded-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest">Link</Label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="rounded-sm" placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest">Thumbnail URL</Label>
            <Input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} className="rounded-sm" />
          </div>
          {status === "scheduled" && (
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest">Schedule for</Label>
              <Input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="rounded-sm" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3">Cancel</Button>
          <Button onClick={save} className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3 bg-primary text-primary-foreground">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ============== METRICS DIALOG ============== */
const MetricsDialog = ({
  post, onClose, onSaved,
}: { post: SocialRow | null; onClose: () => void; onSaved: () => void }) => {
  const [m, setM] = useState({ views: 0, likes: 0, shares: 0, comments: 0, reach: 0 });
  useEffect(() => { if (post) setM({ views: 0, likes: 0, shares: 0, comments: 0, reach: 0 }); }, [post]);
  if (!post) return null;
  const save = async () => {
    const eng = m.views ? +(((m.likes + m.shares + m.comments) / m.views) * 100).toFixed(2) : 0;
    const { error } = await supabase.from("social_post_metrics").insert({
      social_post_id: post.id,
      ...m,
      engagement_rate: eng,
    });
    if (error) return toast.error(error.message);
    toast.success("Metrics recorded");
    onSaved();
  };
  return (
    <Dialog open={!!post} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-widest">Record Metrics</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {(["views", "likes", "shares", "comments", "reach"] as const).map((k) => (
            <div key={k} className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest">{k}</Label>
              <Input
                type="number"
                value={m[k]}
                onChange={(e) => setM((s) => ({ ...s, [k]: parseInt(e.target.value || "0", 10) }))}
                className="rounded-sm"
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3">Cancel</Button>
          <Button onClick={save} className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3 bg-primary text-primary-foreground">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ============== IDEA DIALOG ============== */
const IdeaDialog = ({
  open, userId, onClose, onSaved,
}: { open: boolean; userId: string | undefined; onClose: () => void; onSaved: () => void }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [notes, setNotes] = useState("");
  useEffect(() => { if (open) { setTitle(""); setCategory("general"); setNotes(""); } }, [open]);
  const save = async () => {
    if (!userId) return toast.error("Sign in required");
    if (!title.trim()) return toast.error("Title required");
    const { error } = await supabase.from("social_ideas").insert({
      title, category, notes, status: "saved", created_by: userId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (error) return toast.error(error.message);
    logActivity({ kind: "idea_saved", title });
    toast.success("Idea saved");
    onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-widest">New Idea</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="film_breakdown">Film Breakdown</SelectItem>
                <SelectItem value="chicago_culture">Chicago Culture</SelectItem>
                <SelectItem value="music_drop">Music Drop</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest">Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3">Cancel</Button>
          <Button onClick={save} className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3 bg-primary text-primary-foreground">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SocialStudioSection;
