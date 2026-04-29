// Full website analytics — traffic, content, behavior, sources, devices, geo.
import { useEffect, useMemo, useState } from "react";
import { Eye, MousePointer, Smartphone, Globe, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHead, StatCard, EmptyState, SectionShell } from "../shared/Primitives";
import { Button } from "@/components/ui/button";
import { daysAgo, fmtDay, pctChange } from "@/lib/dateUtils";

type Range = 7 | 30 | 90;

const COLORS = ["hsl(var(--primary))", "hsl(var(--gold))", "hsl(var(--cream))", "hsl(var(--muted-foreground))", "hsl(var(--accent))"];

type Row = {
  created_at: string;
  visitor_id: string | null;
  session_id: string | null;
  path: string;
  source: string;
  device: string;
  country: string | null;
  city: string | null;
};

const AnalyticsSection = () => {
  const [range, setRange] = useState<Range>(30);
  const [rows, setRows] = useState<Row[]>([]);
  const [prev, setPrev] = useState<Row[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = daysAgo(range).toISOString();
      const sincePrev = daysAgo(range * 2).toISOString();
      const [{ data: cur }, { data: prv }, { data: arts }] = await Promise.all([
        supabase.from("page_views").select("created_at,visitor_id,session_id,path,source,device,country,city")
          .gte("created_at", since).order("created_at", { ascending: true }),
        supabase.from("page_views").select("created_at,visitor_id,session_id,path,source,device,country,city")
          .gte("created_at", sincePrev).lt("created_at", since),
        supabase.from("articles").select("id,title").eq("status", "published"),
      ]);
      if (cancelled) return;
      setRows((cur ?? []) as Row[]);
      setPrev((prv ?? []) as Row[]);
      const t: Record<string, string> = {};
      (arts ?? []).forEach((a) => { t[a.id as string] = a.title as string; });
      setTitles(t);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [range]);

  const series = useMemo(() => {
    const map = new Map<string, { day: string; visits: number; unique: Set<string> }>();
    for (let i = range - 1; i >= 0; i--) {
      const d = daysAgo(i);
      const k = d.toISOString().slice(0, 10);
      map.set(k, { day: fmtDay(d), visits: 0, unique: new Set() });
    }
    rows.forEach((r) => {
      const k = r.created_at.slice(0, 10);
      const b = map.get(k);
      if (b) {
        b.visits += 1;
        if (r.visitor_id) b.unique.add(r.visitor_id);
      }
    });
    return Array.from(map.values()).map((b) => ({ day: b.day, visits: b.visits, unique: b.unique.size }));
  }, [rows, range]);

  // Sessions
  const sessions = useMemo(() => {
    const map = new Map<string, { count: number }>();
    rows.forEach((r) => {
      if (!r.session_id) return;
      const s = map.get(r.session_id);
      if (s) s.count += 1;
      else map.set(r.session_id, { count: 1 });
    });
    return Array.from(map.values());
  }, [rows]);

  const totals = useMemo(() => {
    const visits = rows.length;
    const unique = new Set(rows.map((r) => r.visitor_id).filter(Boolean)).size;
    const sessionCount = sessions.length;
    const pagesPerVisit = sessionCount ? +(visits / sessionCount).toFixed(2) : 0;
    const bounced = sessions.filter((s) => s.count === 1).length;
    const bounce = sessionCount ? Math.round((bounced / sessionCount) * 100) : 0;
    const prevVisits = prev.length;
    return { visits, unique, sessionCount, pagesPerVisit, bounce, prevVisits };
  }, [rows, sessions, prev]);

  const topArticles = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const m = r.path.match(/^\/articles\/([^/]+)/);
      if (m) map.set(m[1], (map.get(m[1]) ?? 0) + 1);
    });
    return [...map.entries()]
      .map(([id, views]) => ({ id, views, title: titles[id] ?? id }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [rows, titles]);

  const topPaths = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.path, (map.get(r.path) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [rows]);

  const sourceData = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.source, (map.get(r.source) ?? 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [rows]);

  const deviceData = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.device, (map.get(r.device) ?? 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [rows]);

  const cities = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      if (!r.city) return;
      const key = r.country ? `${r.city}, ${r.country}` : r.city;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [rows]);

  const countries = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => { if (r.country) map.set(r.country, (map.get(r.country) ?? 0) + 1); });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [rows]);

  if (loading) return <div className="text-muted-foreground text-sm">Loading analytics…</div>;

  if (rows.length === 0) {
    return (
      <SectionShell>
        <PageHead title="Analytics" sub="Website traffic" />
        <EmptyState icon={Eye} title="Data will populate as traffic grows"
          body="Real visits are recorded automatically. Share your site to start collecting data." />
      </SectionShell>
    );
  }

  return (
    <SectionShell>
      <PageHead
        title="Analytics"
        sub={`Last ${range} days`}
        actions={
          <div className="flex gap-1">
            {([7, 30, 90] as Range[]).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? "default" : "outline"}
                onClick={() => setRange(r)}
                className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3"
              >
                {r}d
              </Button>
            ))}
          </div>
        }
      />

      {/* TRAFFIC OVERVIEW */}
      <div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <StatCard label="Total Visits" value={totals.visits} delta={pctChange(totals.visits, totals.prevVisits)} accent="bg-primary" />
          <StatCard label="Unique Visitors" value={totals.unique} accent="bg-cream" />
          <StatCard label="Sessions" value={totals.sessionCount} accent="bg-gold" />
          <StatCard label="Pages / Visit" value={totals.pagesPerVisit} accent="bg-emerald-500" />
          <StatCard label="Bounce Rate" value={`${totals.bounce}%`} accent={totals.bounce > 70 ? "bg-primary" : "bg-emerald-500"} />
        </div>
        <div className="border border-border rounded-sm bg-surface/30 p-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Visits & unique visitors</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                <Line type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="unique" stroke="hsl(var(--gold))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CONTENT PERFORMANCE */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <PageHead title="Top Articles" sub="By views" />
          {topArticles.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No article views yet" />
          ) : (
            <div className="border border-border rounded-sm divide-y divide-border bg-surface/20">
              {topArticles.map((a, i) => (
                <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="font-display text-lg text-primary w-6">0{i + 1}</div>
                  <div className="flex-1 min-w-0 text-sm truncate">{a.title}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{a.views} views</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <PageHead title="Top Pages" sub="Most visited" />
          <div className="border border-border rounded-sm divide-y divide-border bg-surface/20">
            {topPaths.map(([p, n], i) => (
              <div key={p} className="px-4 py-3 flex items-center gap-3">
                <div className="font-display text-lg text-primary w-6">0{i + 1}</div>
                <div className="flex-1 min-w-0 text-sm truncate font-mono text-xs">{p}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{n}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SOURCES + DEVICES */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <PageHead title="Traffic Sources" sub="Where visitors come from" />
          <div className="border border-border rounded-sm bg-surface/20 p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={40}>
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {sourceData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="capitalize">{s.name}</span>
                <span className="ml-auto text-muted-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <PageHead title="Device Breakdown" sub="Mobile · Desktop · Tablet" />
          <div className="border border-border rounded-sm bg-surface/20 p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GEO */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <PageHead title="Top Cities" sub="Chicago first" actions={<Globe className="h-4 w-4 text-muted-foreground" />} />
          {cities.length === 0 ? (
            <EmptyState icon={Globe} title="Geo data unavailable" body="City info populates from edge headers when available." />
          ) : (
            <div className="border border-border rounded-sm divide-y divide-border bg-surface/20">
              {cities.map(([c, n]) => (
                <div key={c} className="px-4 py-2.5 flex items-center text-xs">
                  <span className="flex-1 truncate">{c}</span>
                  <span className="text-muted-foreground tabular-nums">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <PageHead title="Top Countries" sub="Worldwide" />
          {countries.length === 0 ? (
            <EmptyState icon={Globe} title="No country data yet" />
          ) : (
            <div className="border border-border rounded-sm divide-y divide-border bg-surface/20">
              {countries.map(([c, n]) => (
                <div key={c} className="px-4 py-2.5 flex items-center text-xs">
                  <span className="flex-1 truncate uppercase tracking-wider">{c}</span>
                  <span className="text-muted-foreground tabular-nums">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
};

export default AnalyticsSection;
