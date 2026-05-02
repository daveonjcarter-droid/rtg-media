// Full website analytics — multi-line traffic chart, content, sources, devices, booking funnel.
import { useEffect, useMemo, useState } from "react";
import { Eye, TrendingUp, Globe, Smartphone, Briefcase } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHead, StatCard, EmptyState, SectionShell } from "../shared/Primitives";
import { Button } from "@/components/ui/button";
import { daysAgo, fmtDay, pctChange } from "@/lib/dateUtils";

type Range = 7 | 30 | 90 | 365;
const RANGE_LABELS: Record<Range, string> = { 7: "7D", 30: "30D", 90: "90D", 365: "12M" };

const PIE_COLORS = ["#ef3340", "#f4f1ea", "#e0b84c", "#29a8ff", "#18c58f", "#a78bfa", "#fb923c"];

const SAMPLE_TRAFFIC = [
  { date: "Mon", pageViews: 120, uniqueVisitors: 80, articleReads: 45, bookingClicks: 8, newsletterSignups: 3 },
  { date: "Tue", pageViews: 145, uniqueVisitors: 92, articleReads: 55, bookingClicks: 12, newsletterSignups: 4 },
  { date: "Wed", pageViews: 132, uniqueVisitors: 88, articleReads: 61, bookingClicks: 10, newsletterSignups: 5 },
  { date: "Thu", pageViews: 180, uniqueVisitors: 110, articleReads: 75, bookingClicks: 18, newsletterSignups: 7 },
  { date: "Fri", pageViews: 210, uniqueVisitors: 130, articleReads: 92, bookingClicks: 24, newsletterSignups: 10 },
  { date: "Sat", pageViews: 260, uniqueVisitors: 160, articleReads: 120, bookingClicks: 31, newsletterSignups: 14 },
  { date: "Sun", pageViews: 240, uniqueVisitors: 150, articleReads: 112, bookingClicks: 28, newsletterSignups: 12 },
];

type PV = {
  created_at: string;
  visitor_id: string | null;
  session_id: string | null;
  path: string;
  source: string;
  device: string;
};

type Evt = {
  created_at: string;
  event_type: string;
  page_path: string | null;
  article_id: string | null;
  source: string | null;
  device_type: string | null;
};

type Booking = { created_at: string; status: string };

const fmtBucket = (d: Date, range: Range) => (range === 365 ? `${d.getMonth() + 1}/${d.getFullYear() % 100}` : fmtDay(d));
const bucketKey = (iso: string, range: Range) =>
  range === 365 ? iso.slice(0, 7) : iso.slice(0, 10);
const bucketDate = (key: string, range: Range) =>
  range === 365 ? new Date(`${key}-01T00:00:00Z`) : new Date(`${key}T00:00:00Z`);

const AnalyticsSection = () => {
  const [range, setRange] = useState<Range>(30);
  const [pv, setPv] = useState<PV[]>([]);
  const [pvPrev, setPvPrev] = useState<PV[]>([]);
  const [events, setEvents] = useState<Evt[]>([]);
  const [eventsPrev, setEventsPrev] = useState<Evt[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [engagement, setEngagement] = useState<Record<string, { views: number; shares: number; avg: number }>>({});
  const [leads, setLeads] = useState(0);
  const [newsletterTotal, setNewsletterTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = daysAgo(range).toISOString();
      const sincePrev = daysAgo(range * 2).toISOString();
      const [
        { data: cur }, { data: prv }, { data: ev }, { data: evPrev },
        { data: arts }, { data: eng }, { data: bk }, { count: leadCount }, { count: nlCount },
      ] = await Promise.all([
        supabase.from("page_views").select("created_at,visitor_id,session_id,path,source,device")
          .gte("created_at", since).order("created_at", { ascending: true }),
        supabase.from("page_views").select("created_at,visitor_id,session_id,path,source,device")
          .gte("created_at", sincePrev).lt("created_at", since),
        supabase.from("analytics_events" as never).select("created_at,event_type,page_path,article_id,source,device_type")
          .gte("created_at", since).order("created_at", { ascending: true }),
        supabase.from("analytics_events" as never).select("created_at,event_type,page_path,article_id,source,device_type")
          .gte("created_at", sincePrev).lt("created_at", since),
        supabase.from("articles").select("id,title,status").eq("status", "published"),
        supabase.from("article_engagement").select("article_id,views,shares,avg_read_seconds"),
        supabase.from("bookings").select("created_at,status").gte("created_at", since),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).gte("created_at", since),
      ]);
      if (cancelled) return;
      setPv((cur ?? []) as PV[]);
      setPvPrev((prv ?? []) as PV[]);
      setEvents(((ev as unknown) as Evt[]) ?? []);
      setEventsPrev(((evPrev as unknown) as Evt[]) ?? []);
      setBookings((bk ?? []) as Booking[]);
      const t: Record<string, string> = {};
      const s: Record<string, string> = {};
      (arts ?? []).forEach((a) => { t[a.id as string] = a.title as string; s[a.id as string] = a.status as string; });
      setTitles(t); setStatuses(s);
      const e: Record<string, { views: number; shares: number; avg: number }> = {};
      (eng ?? []).forEach((row) => {
        e[row.article_id as string] = {
          views: (row.views as number) ?? 0,
          shares: (row.shares as number) ?? 0,
          avg: (row.avg_read_seconds as number) ?? 0,
        };
      });
      setEngagement(e);
      setLeads(leadCount ?? 0);
      setNewsletterTotal(nlCount ?? 0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [range]);

  /* ============ Multi-line traffic series ============ */
  const trafficData = useMemo(() => {
    const buckets = new Map<string, {
      date: string; pageViews: number; uniqueVisitors: Set<string>;
      articleReads: number; bookingClicks: number; newsletterSignups: number;
    }>();
    const steps = range === 365 ? 12 : range;
    for (let i = steps - 1; i >= 0; i--) {
      const d = range === 365
        ? new Date(new Date().getFullYear(), new Date().getMonth() - i, 1)
        : daysAgo(i);
      const key = range === 365 ? d.toISOString().slice(0, 7) : d.toISOString().slice(0, 10);
      buckets.set(key, {
        date: fmtBucket(d, range), pageViews: 0, uniqueVisitors: new Set(),
        articleReads: 0, bookingClicks: 0, newsletterSignups: 0,
      });
    }
    pv.forEach((r) => {
      const b = buckets.get(bucketKey(r.created_at, range));
      if (b) {
        b.pageViews += 1;
        if (r.visitor_id) b.uniqueVisitors.add(r.visitor_id);
      }
    });
    events.forEach((r) => {
      const b = buckets.get(bucketKey(r.created_at, range));
      if (!b) return;
      if (r.event_type === "article_view" || r.event_type === "article_read") b.articleReads += 1;
      else if (r.event_type === "booking_click" || r.event_type === "booking_submit") b.bookingClicks += 1;
      else if (r.event_type === "newsletter_signup") b.newsletterSignups += 1;
    });
    return Array.from(buckets.values()).map((b) => ({
      date: b.date, pageViews: b.pageViews, uniqueVisitors: b.uniqueVisitors.size,
      articleReads: b.articleReads, bookingClicks: b.bookingClicks, newsletterSignups: b.newsletterSignups,
    }));
  }, [pv, events, range]);

  /* ============ Sessions / totals ============ */
  const sessionMap = useMemo(() => {
    const m = new Map<string, number>();
    pv.forEach((r) => { if (r.session_id) m.set(r.session_id, (m.get(r.session_id) ?? 0) + 1); });
    return m;
  }, [pv]);

  const totals = useMemo(() => {
    const visits = pv.length;
    const unique = new Set(pv.map((r) => r.visitor_id).filter(Boolean)).size;
    const sessions = sessionMap.size;
    const bounced = [...sessionMap.values()].filter((c) => c === 1).length;
    const bounce = sessions ? Math.round((bounced / sessions) * 100) : 0;
    const avgSec = sessions ? Math.round((visits / sessions) * 28) : 0;
    const articleReads = events.filter((e) => e.event_type === "article_view" || e.event_type === "article_read").length;
    const bookingClicks = events.filter((e) => e.event_type === "booking_click" || e.event_type === "booking_submit").length;
    const contactLeads = leads;
    const nlSignups = events.filter((e) => e.event_type === "newsletter_signup").length || newsletterTotal;
    return { visits, unique, sessions, bounce, avgSec, articleReads, bookingClicks, contactLeads, nlSignups };
  }, [pv, sessionMap, events, leads, newsletterTotal]);

  const prevTotals = useMemo(() => {
    const articleReads = eventsPrev.filter((e) => e.event_type === "article_view" || e.event_type === "article_read").length;
    const bookingClicks = eventsPrev.filter((e) => e.event_type === "booking_click" || e.event_type === "booking_submit").length;
    const nlSignups = eventsPrev.filter((e) => e.event_type === "newsletter_signup").length;
    return { visits: pvPrev.length, articleReads, bookingClicks, nlSignups };
  }, [pvPrev, eventsPrev]);

  /* ============ Top pages ============ */
  const topPages = useMemo(() => {
    const map = new Map<string, { views: number; visitors: Set<string>; sessions: Set<string> }>();
    pv.forEach((r) => {
      const e = map.get(r.path) ?? { views: 0, visitors: new Set(), sessions: new Set() };
      e.views += 1;
      if (r.visitor_id) e.visitors.add(r.visitor_id);
      if (r.session_id) e.sessions.add(r.session_id);
      map.set(r.path, e);
    });
    return [...map.entries()]
      .map(([path, v]) => {
        const sessionViews = [...v.sessions].map((s) => sessionMap.get(s) ?? 1);
        const bounceCount = sessionViews.filter((c) => c === 1).length;
        return {
          path, views: v.views, visitors: v.visitors.size,
          avgTime: v.sessions.size ? Math.round((v.views / v.sessions.size) * 28) : 0,
          bounce: v.sessions.size ? Math.round((bounceCount / v.sessions.size) * 100) : 0,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
  }, [pv, sessionMap]);

  /* ============ Top articles ============ */
  const topArticles = useMemo(() => {
    const map = new Map<string, { reads: number; views: number }>();
    events.forEach((e) => {
      if (!e.article_id) return;
      if (e.event_type === "article_view" || e.event_type === "article_read") {
        const cur = map.get(e.article_id) ?? { reads: 0, views: 0 };
        if (e.event_type === "article_read") cur.reads += 1;
        else cur.views += 1;
        map.set(e.article_id, cur);
      }
    });
    pv.forEach((r) => {
      const m = r.path.match(/^\/articles\/([^/]+)/);
      if (!m) return;
      const id = m[1];
      const matchedId = Object.keys(titles).find((k) => k === id) ?? id;
      const cur = map.get(matchedId) ?? { reads: 0, views: 0 };
      cur.views += 1;
      map.set(matchedId, cur);
    });
    return [...map.entries()]
      .map(([id, v]) => {
        const eng = engagement[id];
        return {
          id,
          title: titles[id] ?? id,
          status: statuses[id] ?? "—",
          reads: v.reads,
          views: v.views + (eng?.views ?? 0),
          avgTime: eng?.avg ?? 0,
          shares: eng?.shares ?? 0,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
  }, [events, pv, titles, statuses, engagement]);

  const topArticle = topArticles[0];

  /* ============ Sources / devices / funnel ============ */
  const sourceData = useMemo(() => {
    const buckets = { Direct: 0, Instagram: 0, TikTok: 0, YouTube: 0, Google: 0, Referral: 0, Other: 0 } as Record<string, number>;
    pv.forEach((r) => {
      const ref = (r.source || "direct").toLowerCase();
      if (ref === "direct") buckets.Direct += 1;
      else if (ref === "search") buckets.Google += 1;
      else if (ref === "social") buckets.Instagram += 1;
      else if (ref === "referral") buckets.Referral += 1;
      else buckets.Other += 1;
    });
    return Object.entries(buckets)
      .map(([name, value]) => ({ name, value }))
      .filter((s) => s.value > 0);
  }, [pv]);

  const deviceData = useMemo(() => {
    const buckets = { Mobile: 0, Desktop: 0, Tablet: 0 } as Record<string, number>;
    pv.forEach((r) => {
      const d = (r.device || "desktop").toLowerCase();
      if (d === "mobile") buckets.Mobile += 1;
      else if (d === "tablet") buckets.Tablet += 1;
      else buckets.Desktop += 1;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [pv]);

  const funnel = useMemo(() => {
    const servicePageViews = pv.filter((r) => /^\/(services|book)/.test(r.path)).length;
    const bookingClicks = events.filter((e) => e.event_type === "booking_click").length;
    const inquiryStarted = bookingClicks; // proxy until step tracking lands
    const inquirySubmitted = events.filter((e) => e.event_type === "booking_submit").length || bookings.length;
    const approved = bookings.filter((b) => (b.status || "").toLowerCase() === "approved").length;
    return [
      { name: "Service Page Views", value: servicePageViews },
      { name: "Booking Button Clicks", value: bookingClicks },
      { name: "Inquiry Started", value: inquiryStarted },
      { name: "Inquiry Submitted", value: inquirySubmitted },
      { name: "Approved Bookings", value: approved },
    ];
  }, [pv, events, bookings]);

  if (loading) return <div className="text-muted-foreground text-sm">Loading analytics…</div>;

  const hasAnyData = pv.length > 0 || events.length > 0;

  return (
    <SectionShell>
      <PageHead
        title="Site Traffic"
        sub={`Last ${RANGE_LABELS[range]}`}
        actions={
          <div className="flex gap-1">
            {([7, 30, 90, 365] as Range[]).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? "default" : "outline"}
                onClick={() => setRange(r)}
                className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3"
              >
                {RANGE_LABELS[r]}
              </Button>
            ))}
          </div>
        }
      />

      {/* MAIN MULTI-LINE CHART — SITE TRAFFIC TRENDS */}
      <div className="w-full border border-border/40 bg-[#080808] p-6 md:p-10 mt-2">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-7">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-primary mb-2">Traffic</div>
            <h2 className="text-cream text-2xl md:text-4xl uppercase tracking-tight font-semibold">Site Traffic Trends</h2>
            {!hasAnyData && (
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">
                Sample preview · live data appears as visitors interact
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {([7, 30, 90, 365] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`bg-transparent border px-3.5 py-2 text-[11px] uppercase tracking-widest transition-colors ${
                  range === r
                    ? "border-primary text-primary"
                    : "border-cream/20 text-cream hover:border-primary hover:text-primary"
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 420 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hasAnyData ? trafficData : SAMPLE_TRAFFIC} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(244,241,234,0.08)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(244,241,234,0.55)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(244,241,234,0.55)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#080808", border: "1px solid rgba(244,241,234,0.18)", color: "#f4f1ea", fontSize: 11, borderRadius: 2 }}
                labelStyle={{ color: "#f4f1ea" }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              <Line type="monotone" dataKey="pageViews" stroke="#ef3340" strokeWidth={2.5} dot={false} name="Page Views" />
              <Line type="monotone" dataKey="uniqueVisitors" stroke="#7ec1ff" strokeWidth={2} dot={false} name="Unique Visitors" />
              <Line type="monotone" dataKey="articleReads" stroke="#0e2a47" strokeWidth={2} dot={false} name="Article Reads" />
              <Line type="monotone" dataKey="bookingClicks" stroke="#e87722" strokeWidth={2} dot={false} name="Booking Clicks" />
              <Line type="monotone" dataKey="newsletterSignups" stroke="#18c58f" strokeWidth={2} dot={false} name="Newsletter Signups" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Page Views" value={totals.visits} delta={pctChange(totals.visits, prevTotals.visits)} sub={RANGE_LABELS[range]} accent="bg-primary" />
        <StatCard label="Unique Visitors" value={totals.unique} sub={RANGE_LABELS[range]} accent="bg-cream" />
        <StatCard label="Article Reads" value={totals.articleReads} delta={pctChange(totals.articleReads, prevTotals.articleReads)} sub={RANGE_LABELS[range]} accent="bg-gold" />
        <StatCard label="Avg. Read Time" value={`${Math.floor(totals.avgSec / 60)}m ${totals.avgSec % 60}s`} sub="approx" />
        <StatCard label="Bounce Rate" value={`${totals.bounce}%`} accent={totals.bounce > 70 ? "bg-primary" : "bg-emerald-500"} />
        <StatCard label="Newsletter Signups" value={totals.nlSignups} delta={pctChange(totals.nlSignups, prevTotals.nlSignups)} sub={RANGE_LABELS[range]} accent="bg-emerald-500" />
        <StatCard label="Booking Clicks" value={totals.bookingClicks} delta={pctChange(totals.bookingClicks, prevTotals.bookingClicks)} sub={RANGE_LABELS[range]} accent="bg-sky-500" />
        <StatCard label="Contact Form Leads" value={totals.contactLeads} sub={RANGE_LABELS[range]} accent="bg-cream" />
        <StatCard label="Top Article" value={topArticle?.title ? (topArticle.title.length > 22 ? topArticle.title.slice(0, 20) + "…" : topArticle.title) : "—"} sub={topArticle ? `${topArticle.views} views` : "no data"} accent="bg-gold" />
        <StatCard label="Top Traffic Source" value={sourceData[0]?.name ?? "—"} sub={sourceData[0] ? `${sourceData[0].value} visits` : "no data"} accent="bg-primary" />
      </div>

      {/* TOP PAGES + TOP ARTICLES */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <PageHead title="Top Pages" sub="Most visited" />
          {topPages.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No page data yet" />
          ) : (
            <div className="border border-border rounded-sm bg-surface/20 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2.5">Page</th>
                    <th className="text-right px-3 py-2.5">Views</th>
                    <th className="text-right px-3 py-2.5">Visitors</th>
                    <th className="text-right px-3 py-2.5">Avg Time</th>
                    <th className="text-right px-3 py-2.5">Bounce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topPages.map((p) => (
                    <tr key={p.path}>
                      <td className="px-3 py-2 font-mono text-[11px] truncate max-w-[180px]">{p.path}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.views}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.visitors}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{Math.floor(p.avgTime / 60)}m {p.avgTime % 60}s</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{p.bounce}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <PageHead title="Top Articles" sub="By views" />
          {topArticles.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No article views yet" />
          ) : (
            <div className="border border-border rounded-sm bg-surface/20 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2.5">Article</th>
                    <th className="text-right px-3 py-2.5">Reads</th>
                    <th className="text-right px-3 py-2.5">Views</th>
                    <th className="text-right px-3 py-2.5">Avg</th>
                    <th className="text-right px-3 py-2.5">Shares</th>
                    <th className="text-right px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topArticles.map((a) => (
                    <tr key={a.id}>
                      <td className="px-3 py-2 truncate max-w-[180px]">{a.title}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{a.reads}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{a.views}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{Math.floor(a.avgTime / 60)}m {a.avgTime % 60}s</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{a.shares}</td>
                      <td className="px-3 py-2 text-right uppercase tracking-wider text-[10px] text-muted-foreground">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* SOURCES + DEVICES */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <PageHead title="Traffic Sources" sub="Direct · Social · Search · Referral" actions={<Globe className="h-4 w-4 text-muted-foreground" />} />
          {sourceData.length === 0 ? (
            <EmptyState icon={Globe} title="No source data yet" />
          ) : (
            <div className="border border-border rounded-sm bg-[#080808] p-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={40}>
                    {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#080808", border: "1px solid rgba(244,241,234,0.18)", color: "#f4f1ea", fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div>
          <PageHead title="Audience Device Breakdown" sub="Mobile · Desktop · Tablet" actions={<Smartphone className="h-4 w-4 text-muted-foreground" />} />
          {pv.length === 0 ? (
            <EmptyState icon={Smartphone} title="No device data yet" />
          ) : (
            <div className="border border-border rounded-sm bg-[#080808] p-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(244,241,234,0.55)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(244,241,234,0.55)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#080808", border: "1px solid rgba(244,241,234,0.18)", color: "#f4f1ea", fontSize: 11 }} />
                  <Bar dataKey="value" fill="#ef3340" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* BOOKING FUNNEL */}
      <div>
        <PageHead title="Booking Funnel" sub="From service page to approval" actions={<Briefcase className="h-4 w-4 text-muted-foreground" />} />
        <div className="border border-border rounded-sm bg-surface/20 divide-y divide-border">
          {funnel.map((step, i) => {
            const max = funnel[0]?.value || 1;
            const pct = Math.round((step.value / max) * 100);
            return (
              <div key={step.name} className="px-4 py-3 flex items-center gap-4">
                <div className="font-display text-sm text-primary w-6">0{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-wider mb-1.5">{step.name}</div>
                  <div className="h-1.5 bg-surface rounded-sm overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="font-display text-lg tabular-nums w-16 text-right">{step.value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
};

export default AnalyticsSection;
