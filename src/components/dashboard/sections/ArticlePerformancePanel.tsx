// Article performance panel — shows views/engagement/sources/ranking for a single article.
// Designed to slot inside UniversalEditor or as a side panel.
import { useEffect, useMemo, useState } from "react";
import { Eye, Share2, Heart, Activity, TrendingUp, Trophy } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, EmptyState } from "../shared/Primitives";
import { daysAgo, fmtDay, pctChange } from "@/lib/dateUtils";

type Engagement = {
  views: number; unique_views: number; shares: number; reactions: number;
  avg_read_seconds: number; avg_scroll_pct: number;
};

type Props = { articleId: string; category?: string | null };

const ArticlePerformancePanel = ({ articleId, category }: Props) => {
  const [eng, setEng] = useState<Engagement | null>(null);
  const [series, setSeries] = useState<{ day: string; views: number }[]>([]);
  const [sources, setSources] = useState<{ name: string; value: number }[]>([]);
  const [rank, setRank] = useState<{ position: number; total: number } | null>(null);
  const [delta24, setDelta24] = useState<{ today: number; yesterday: number; week: number; weekPrev: number; month: number; monthPrev: number }>({
    today: 0, yesterday: 0, week: 0, weekPrev: 0, month: 0, monthPrev: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const since60 = daysAgo(60).toISOString();
      const path = `/articles/${articleId}`;
      const [engRes, viewsRes, allArtsRes] = await Promise.all([
        supabase.from("article_engagement").select("*").eq("article_id", articleId).maybeSingle(),
        supabase.from("page_views").select("created_at,source").gte("created_at", since60).like("path", `${path}%`),
        category
          ? supabase.from("articles").select("id").eq("category", category).eq("status", "published")
          : Promise.resolve({ data: [] }),
      ]);
      if (cancelled) return;

      setEng((engRes.data ?? null) as Engagement | null);

      const views = viewsRes.data ?? [];
      const map = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = daysAgo(i);
        map.set(d.toISOString().slice(0, 10), 0);
      }
      const srcMap = new Map<string, number>();
      const today = new Date(); today.setHours(0,0,0,0);
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      const weekAgo = daysAgo(7); const weekAgoPrev = daysAgo(14);
      const monthAgo = daysAgo(30); const monthAgoPrev = daysAgo(60);
      let cToday = 0, cYday = 0, cWeek = 0, cWeekPrev = 0, cMonth = 0, cMonthPrev = 0;
      views.forEach((v) => {
        const k = (v.created_at as string).slice(0, 10);
        if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
        const t = new Date(v.created_at as string);
        if (t >= today) cToday++;
        else if (t >= yesterday) cYday++;
        if (t >= weekAgo) cWeek++;
        else if (t >= weekAgoPrev) cWeekPrev++;
        if (t >= monthAgo) cMonth++;
        else if (t >= monthAgoPrev) cMonthPrev++;
        const s = (v.source as string) ?? "direct";
        srcMap.set(s, (srcMap.get(s) ?? 0) + 1);
      });
      setSeries([...map.entries()].map(([k, v]) => ({ day: fmtDay(new Date(k)), views: v })));
      setSources([...srcMap.entries()].map(([name, value]) => ({ name, value })));
      setDelta24({
        today: cToday, yesterday: cYday,
        week: cWeek, weekPrev: cWeekPrev,
        month: cMonth, monthPrev: cMonthPrev,
      });

      // Category ranking
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const catIds = ((allArtsRes as any).data ?? []).map((a: { id: string }) => a.id);
      if (catIds.length) {
        const { data: catEng } = await supabase
          .from("article_engagement")
          .select("article_id,views")
          .in("article_id", catIds);
        const sorted = [...(catEng ?? [])].sort((a, b) => (b.views as number) - (a.views as number));
        const idx = sorted.findIndex((x) => x.article_id === articleId);
        setRank({ position: idx >= 0 ? idx + 1 : sorted.length + 1, total: catIds.length });
      }
    })();
    return () => { cancelled = true; };
  }, [articleId, category]);

  if (!eng && delta24.month === 0) {
    return (
      <EmptyState
        icon={Eye}
        title="No analytics yet"
        body="Performance data appears after this article is published and visitors arrive."
      />
    );
  }

  const totalViews = eng?.views ?? delta24.month;
  const spike = delta24.today >= delta24.yesterday * 2 && delta24.today >= 5;

  return (
    <div className="space-y-5">
      {/* PERFORMANCE */}
      <div>
        <SectionLabel icon={TrendingUp} title="Performance" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Views" value={totalViews} accent="bg-primary" />
          <StatCard label="24h" value={delta24.today} delta={pctChange(delta24.today, delta24.yesterday)} />
          <StatCard label="7d" value={delta24.week} delta={pctChange(delta24.week, delta24.weekPrev)} />
          <StatCard label="30d" value={delta24.month} delta={pctChange(delta24.month, delta24.monthPrev)} />
        </div>
        {spike && (
          <div className="mt-2 text-[10px] uppercase tracking-widest text-emerald-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Traffic spike detected
          </div>
        )}
        <div className="mt-3 border border-border rounded-sm bg-surface/30 p-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="apView" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
              <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#apView)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ENGAGEMENT */}
      <div>
        <SectionLabel icon={Activity} title="Engagement" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Avg Read Time" value={`${Math.floor((eng?.avg_read_seconds ?? 0) / 60)}m ${(eng?.avg_read_seconds ?? 0) % 60}s`} />
          <StatCard label="Scroll Completion" value={`${eng?.avg_scroll_pct ?? 0}%`} accent="bg-gold" />
          <StatCard label="Shares" value={eng?.shares ?? 0} accent="bg-emerald-500" />
          <StatCard label="Reactions" value={eng?.reactions ?? 0} accent="bg-primary" />
        </div>
      </div>

      {/* SOURCES */}
      <div>
        <SectionLabel icon={Share2} title="Sources" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["direct", "social", "search", "referral"] as const).map((s) => {
            const v = sources.find((x) => x.name === s)?.value ?? 0;
            return <StatCard key={s} label={s} value={v} />;
          })}
        </div>
      </div>

      {/* RANKING */}
      {rank && category && (
        <div>
          <SectionLabel icon={Trophy} title="Ranking" />
          <div className="border border-border rounded-sm bg-surface/30 p-4 flex items-center gap-4">
            <div className="font-display text-3xl text-primary">#{rank.position}</div>
            <div>
              <div className="text-sm">in {category}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                of {rank.total} published articles
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionLabel = ({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) => (
  <div className="flex items-center gap-2 mb-2">
    <Icon className="h-3.5 w-3.5 text-primary" />
    <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">{title}</div>
  </div>
);

export default ArticlePerformancePanel;
