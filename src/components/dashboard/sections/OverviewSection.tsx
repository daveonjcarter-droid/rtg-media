// Studio Overview — head-admin dashboard with real analytics.
import { useEffect, useMemo, useState } from "react";
import {
  FileText, Send, Inbox, Calendar as CalIcon, Briefcase, Mail, Eye,
  TrendingUp, Activity, Users, FileEdit, Clock, Trophy, Sparkles, ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHead, StatCard, EmptyState, SectionShell } from "../shared/Primitives";
import { Button } from "@/components/ui/button";
import { daysAgo, fmtDay, fmtRelative, pctChange } from "@/lib/dateUtils";

type ActivityRow = {
  id: string;
  created_at: string;
  kind: string;
  title: string;
  detail: string | null;
  actor_name: string | null;
  link_url: string | null;
};

type Series = { day: string; visits: number; visitors: number; reads: number }[];

type Props = {
  articleCount: number;
  draftsPending: number;
  scheduledArticles: number;
  publishedLast30: number;
  onCreate: () => void;
  canCreate: boolean;
  onJump?: (section: string) => void;
};

const KIND_LABEL: Record<string, string> = {
  article_published: "Article published",
  article_drafted: "Draft created",
  article_scheduled: "Article scheduled",
  social_scheduled: "Social post scheduled",
  social_posted: "Social post published",
  booking_received: "Booking inquiry",
  lead_captured: "Lead captured",
  inquiry_received: "Inquiry received",
  idea_saved: "Trend idea saved",
  media_uploaded: "Media uploaded",
};

const OverviewSection = ({
  articleCount, draftsPending, scheduledArticles, publishedLast30,
  onCreate, canCreate, onJump,
}: Props) => {
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [series, setSeries] = useState<Series>([]);
  const [siteVisits, setSiteVisits] = useState({ total: 0, unique: 0, prevTotal: 0 });
  const [topArticle, setTopArticle] = useState<{ id: string; title: string; views: number } | null>(null);
  const [topCategory, setTopCategory] = useState<{ name: string; count: number } | null>(null);
  const [topWriter, setTopWriter] = useState<{ name: string; count: number } | null>(null);
  const [bookingCount, setBookingCount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [scheduledSocial, setScheduledSocial] = useState(0);
  const [avgSessionSec, setAvgSessionSec] = useState(0);
  const [bounceRate, setBounceRate] = useState(0);
  const [snapshot, setSnapshot] = useState({ todayViews: 0, weekReads: 0, bookingClicks: 0, newLeads: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const since = daysAgo(30).toISOString();
      const sincePrev = daysAgo(60).toISOString();
      const sinceMid = daysAgo(30).toISOString();

      const [
        { data: act },
        { data: pv },
        { data: pvPrev },
        { data: ev },
        { data: bookings },
        { data: leads },
        { data: socials },
        { data: pubArticles },
        { count: leadsRecent },
      ] = await Promise.all([
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(8),
        supabase.from("page_views").select("created_at,visitor_id,session_id,path").gte("created_at", since),
        supabase.from("page_views").select("session_id").gte("created_at", sincePrev).lt("created_at", sinceMid),
        supabase.from("analytics_events" as never).select("created_at,event_type,article_id,page_path").gte("created_at", since),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("social_posts").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
        supabase.from("articles").select("id,title,category,author_id,profiles:profiles!articles_author_id_fkey(display_name)")
          .eq("status", "published"),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", daysAgo(7).toISOString()),
      ]);

      if (cancelled) return;

      const evRows = ((ev as unknown) as { created_at: string; event_type: string; article_id: string | null; page_path: string | null }[]) ?? [];

      // Build daily series from page_views + events
      const daily = new Map<string, { visits: number; visitors: Set<string>; reads: number }>();
      for (let i = 29; i >= 0; i--) {
        const d = daysAgo(i);
        daily.set(d.toISOString().slice(0, 10), { visits: 0, visitors: new Set(), reads: 0 });
      }
      const sessions = new Map<string, { count: number; firstPath: string }>();
      (pv ?? []).forEach((row) => {
        const key = (row.created_at as string).slice(0, 10);
        const bucket = daily.get(key);
        if (bucket) {
          bucket.visits += 1;
          if (row.visitor_id) bucket.visitors.add(row.visitor_id as string);
        }
        const sid = row.session_id as string | null;
        if (sid) {
          const s = sessions.get(sid);
          if (s) s.count += 1;
          else sessions.set(sid, { count: 1, firstPath: row.path as string });
        }
      });
      evRows.forEach((r) => {
        if (r.event_type !== "article_view" && r.event_type !== "article_read") return;
        const key = r.created_at.slice(0, 10);
        const b = daily.get(key);
        if (b) b.reads += 1;
      });
      const built: Series = Array.from(daily.entries()).map(([k, v]) => ({
        day: fmtDay(new Date(k)), visits: v.visits, visitors: v.visitors.size, reads: v.reads,
      }));
      setSeries(built);
      const totalVisits = built.reduce((s, r) => s + r.visits, 0);
      const totalUnique = new Set((pv ?? []).map((r) => r.visitor_id).filter(Boolean)).size;
      setSiteVisits({ total: totalVisits, unique: totalUnique, prevTotal: (pvPrev ?? []).length });

      // Bounce rate: sessions with exactly 1 page view
      const sessionList = Array.from(sessions.values());
      const bounced = sessionList.filter((s) => s.count === 1).length;
      setBounceRate(sessionList.length ? Math.round((bounced / sessionList.length) * 100) : 0);
      // Naive avg session = visits / sessions * ~30s sample (placeholder until scroll tracking lands)
      setAvgSessionSec(sessionList.length ? Math.round((totalVisits / sessionList.length) * 28) : 0);

      // Top article by article-path views
      const articleHits = new Map<string, number>();
      (pv ?? []).forEach((r) => {
        const m = (r.path as string).match(/^\/articles\/([^/]+)/);
        if (m) articleHits.set(m[1], (articleHits.get(m[1]) ?? 0) + 1);
      });
      let topId = "";
      let topVal = 0;
      articleHits.forEach((v, k) => { if (v > topVal) { topVal = v; topId = k; } });
      if (topId) {
        const match = (pubArticles ?? []).find((a) => a.id === topId);
        if (match) setTopArticle({ id: topId, title: match.title as string, views: topVal });
      }

      // Top category + writer from published articles
      const catCount = new Map<string, number>();
      const writerCount = new Map<string, number>();
      (pubArticles ?? []).forEach((a) => {
        const c = (a.category as string | null) ?? "Uncategorized";
        catCount.set(c, (catCount.get(c) ?? 0) + 1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const writerName = ((a as any).profiles?.display_name as string | undefined) ?? "Unknown";
        writerCount.set(writerName, (writerCount.get(writerName) ?? 0) + 1);
      });
      const topCat = [...catCount.entries()].sort((a, b) => b[1] - a[1])[0];
      const topW = [...writerCount.entries()].sort((a, b) => b[1] - a[1])[0];
      if (topCat) setTopCategory({ name: topCat[0], count: topCat[1] });
      if (topW) setTopWriter({ name: topW[0], count: topW[1] });

      // Snapshot: today / week
      const todayKey = new Date().toISOString().slice(0, 10);
      const weekStart = daysAgo(7).toISOString();
      const todayViews = (pv ?? []).filter((r) => (r.created_at as string).slice(0, 10) === todayKey).length;
      const weekReads = evRows.filter((r) => r.created_at >= weekStart && (r.event_type === "article_view" || r.event_type === "article_read")).length;
      const bookingClicks = evRows.filter((r) => r.event_type === "booking_click" || r.event_type === "booking_submit").length;
      setSnapshot({ todayViews, weekReads, bookingClicks, newLeads: leadsRecent ?? 0 });

      setActivity((act ?? []) as ActivityRow[]);
      setBookingCount((bookings as unknown as { count: number } | null)?.count ?? 0);
      setLeadCount((leads as unknown as { count: number } | null)?.count ?? 0);
      setScheduledSocial((socials as unknown as { count: number } | null)?.count ?? 0);
    })();
    return () => { cancelled = true; };
  }, []);

  const visitsDelta = useMemo(
    () => pctChange(siteVisits.total, siteVisits.prevTotal),
    [siteVisits]
  );

  return (
    <SectionShell>
      {/* TOP METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="Total Articles" value={articleCount} accent="bg-cream" onClick={() => onJump?.("published")} />
        <StatCard label="Published 30d" value={publishedLast30} accent="bg-emerald-500" sub="Last 30 days" />
        <StatCard label="Drafts Pending" value={draftsPending} accent="bg-muted-foreground" onClick={() => onJump?.("drafts")} />
        <StatCard label="Scheduled" value={scheduledArticles} accent="bg-sky-500" onClick={() => onJump?.("scheduled")} />
        <StatCard label="Social Scheduled" value={scheduledSocial} accent="bg-primary" onClick={() => onJump?.("social")} />
        <StatCard label="Booking Inquiries" value={bookingCount} accent="bg-gold" onClick={() => onJump?.("bookings")} />
        <StatCard label="Leads Captured" value={leadCount} accent="bg-emerald-500" onClick={() => onJump?.("leads")} />
      </div>

      {/* TRAFFIC SNAPSHOT */}
      <div>
        <PageHead
          title="Traffic Snapshot"
          sub="Last 30 days · live data"
          actions={
            <Button
              size="sm"
              variant="outline"
              onClick={() => onJump?.("analytics")}
              className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3"
            >
              View Full Analytics <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          }
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard label="Today's Views" value={snapshot.todayViews} accent="bg-primary" />
          <StatCard label="Article Reads · 7d" value={snapshot.weekReads} accent="bg-gold" />
          <StatCard label="Booking Clicks" value={snapshot.bookingClicks} sub="Last 30 days" accent="bg-sky-500" />
          <StatCard label="New Leads · 7d" value={snapshot.newLeads} accent="bg-emerald-500" />
        </div>
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <StatCard label="Total Site Visits" value={siteVisits.total} delta={visitsDelta} accent="bg-primary" />
          <StatCard label="Unique Visitors" value={siteVisits.unique} accent="bg-cream" />
          <StatCard label="Avg Time on Site" value={`${Math.floor(avgSessionSec / 60)}m ${avgSessionSec % 60}s`} sub="approx" />
          <StatCard label="Bounce Rate" value={`${bounceRate}%`} accent={bounceRate > 70 ? "bg-primary" : "bg-emerald-500"} />
        </div>
        <div className="border border-border rounded-sm bg-[#080808] p-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Page views · Visitors · Article reads</div>
          {siteVisits.total === 0 && snapshot.weekReads === 0 ? (
            <EmptyState icon={Eye} title="Analytics will appear here once visitors start interacting with the site." />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="day" stroke="rgba(244,241,234,0.55)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(244,241,234,0.55)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#080808", border: "1px solid rgba(244,241,234,0.18)", color: "#f4f1ea", fontSize: 11, borderRadius: 2 }} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                  <Line type="monotone" dataKey="visits" stroke="#ef3340" strokeWidth={2.5} dot={false} name="Page Views" />
                  <Line type="monotone" dataKey="visitors" stroke="#f4f1ea" strokeWidth={2} dot={false} name="Unique Visitors" />
                  <Line type="monotone" dataKey="reads" stroke="#e0b84c" strokeWidth={2} dot={false} name="Article Reads" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT PERFORMANCE + ACTIVITY */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <PageHead title="Content Performance" sub="Top movers" />
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <PerfTile icon={Trophy} label="Top Article" value={topArticle?.title ?? "—"} sub={topArticle ? `${topArticle.views} views` : "No views yet"} />
            <PerfTile icon={Sparkles} label="Top Category" value={topCategory?.name ?? "—"} sub={topCategory ? `${topCategory.count} stories` : "No data"} />
            <PerfTile icon={Users} label="Most Active Writer" value={topWriter?.name ?? "—"} sub={topWriter ? `${topWriter.count} published` : "No data"} />
          </div>
        </div>

        <div>
          <PageHead title="Recent Activity" sub="Live feed" />
          <div className="border border-border rounded-sm divide-y divide-border bg-surface/20">
            {activity.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                Nothing yet. Activity appears as your team works.
              </div>
            ) : (
              activity.map((a) => (
                <div key={a.id} className="px-4 py-3 flex gap-3 hover:bg-surface/40 transition-colors">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {a.kind === "article_published" ? <Send className="h-3 w-3" /> :
                      a.kind === "social_scheduled" || a.kind === "social_posted" ? <CalIcon className="h-3 w-3" /> :
                      a.kind === "booking_received" ? <Briefcase className="h-3 w-3" /> :
                      a.kind === "lead_captured" ? <Mail className="h-3 w-3" /> :
                      a.kind === "media_uploaded" ? <FileText className="h-3 w-3" /> :
                      <Activity className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{KIND_LABEL[a.kind] ?? a.kind}</div>
                    <div className="text-xs truncate">{a.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <Clock className="h-2.5 w-2.5" /> {fmtRelative(a.created_at)}
                      {a.actor_name && <span className="opacity-60">· {a.actor_name}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {canCreate && (
            <Button onClick={onCreate} size="sm" className="w-full mt-4 rounded-sm uppercase tracking-widest text-[10px] h-9 bg-primary text-primary-foreground hover:bg-primary/90">
              <FileEdit className="h-3 w-3 mr-1.5" /> New Article
            </Button>
          )}
        </div>
      </div>
    </SectionShell>
  );
};

const PerfTile = ({
  icon: Icon, label, value, sub,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string }) => (
  <div className="border border-border rounded-sm bg-surface/40 p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
    </div>
    <div className="font-display text-sm leading-tight uppercase truncate">{value}</div>
    <div className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">{sub}</div>
  </div>
);

export default OverviewSection;
