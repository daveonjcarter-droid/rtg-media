// Compact analytics insets that get inserted ABOVE the existing Bookings/Leads tables.
import { useEffect, useState } from "react";
import { Briefcase, Mail, TrendingUp, Globe2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "../shared/Primitives";
import { daysAgo, pctChange } from "@/lib/dateUtils";

export const BookingAnalytics = () => {
  const [stats, setStats] = useState({ total: 0, last30: 0, prev30: 0, topService: "—", inProgress: 0, won: 0 });
  useEffect(() => {
    (async () => {
      const since30 = daysAgo(30).toISOString();
      const since60 = daysAgo(60).toISOString();
      const { data } = await supabase.from("bookings").select("service,status,created_at,project_type");
      const all = data ?? [];
      const last30 = all.filter((b) => b.created_at >= since30);
      const prev30 = all.filter((b) => b.created_at >= since60 && b.created_at < since30);
      const services = new Map<string, number>();
      all.forEach((b) => {
        const s = (b.service ?? b.project_type ?? "Unspecified") as string;
        services.set(s, (services.get(s) ?? 0) + 1);
      });
      const top = [...services.entries()].sort((a, b) => b[1] - a[1])[0];
      const inProgress = all.filter((b) => ["new", "contacted", "scheduled"].includes(b.status as string)).length;
      const won = all.filter((b) => (b.status as string) === "won" || (b.status as string) === "closed").length;
      setStats({
        total: all.length, last30: last30.length, prev30: prev30.length,
        topService: top?.[0] ?? "—", inProgress, won,
      });
    })();
  }, []);

  const conversion = stats.total ? Math.round((stats.won / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
      <StatCard label="Total Inquiries" value={stats.total} accent="bg-primary" />
      <StatCard label="Last 30 days" value={stats.last30} delta={pctChange(stats.last30, stats.prev30)} accent="bg-emerald-500" />
      <StatCard label="In Progress" value={stats.inProgress} accent="bg-gold" />
      <StatCard label="Conversion" value={`${conversion}%`} sub={`${stats.won} won`} accent="bg-cream" />
      <StatCard label="Most Requested" value={stats.topService} accent="bg-sky-500" />
    </div>
  );
};

export const LeadAnalytics = () => {
  const [stats, setStats] = useState({ total: 0, last30: 0, prev30: 0, sources: [] as { name: string; count: number }[] });
  useEffect(() => {
    (async () => {
      const since30 = daysAgo(30).toISOString();
      const since60 = daysAgo(60).toISOString();
      const { data } = await supabase.from("leads").select("source,created_at");
      const all = data ?? [];
      const last30 = all.filter((l) => l.created_at >= since30);
      const prev30 = all.filter((l) => l.created_at >= since60 && l.created_at < since30);
      const sourceMap = new Map<string, number>();
      all.forEach((l) => {
        const s = (l.source ?? "other") as string;
        sourceMap.set(s, (sourceMap.get(s) ?? 0) + 1);
      });
      setStats({
        total: all.length, last30: last30.length, prev30: prev30.length,
        sources: [...sourceMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      });
    })();
  }, []);

  return (
    <div className="space-y-3 mb-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Leads" value={stats.total} accent="bg-primary" />
        <StatCard label="Last 30 days" value={stats.last30} delta={pctChange(stats.last30, stats.prev30)} accent="bg-emerald-500" />
        <StatCard label="Sources" value={stats.sources.length} accent="bg-cream" />
        <StatCard label="Top Source" value={stats.sources[0]?.name ?? "—"} sub={stats.sources[0] ? `${stats.sources[0].count} leads` : ""} accent="bg-gold" />
      </div>
      {stats.sources.length > 0 && (
        <div className="border border-border rounded-sm bg-surface/30 p-3 flex flex-wrap gap-2">
          {stats.sources.map((s) => (
            <span key={s.name} className="text-[10px] uppercase tracking-widest border border-border px-2 py-1 rounded-sm">
              {s.name} <span className="text-muted-foreground ml-1">{s.count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
