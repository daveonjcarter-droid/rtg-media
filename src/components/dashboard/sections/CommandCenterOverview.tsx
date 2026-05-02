// Command Center — the new dashboard home.
// Sections: System Health Strip, Traffic Snapshot (mini chart), Today Panel, Quick Actions, Recent Activity.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Activity, Briefcase, Inbox, Eye, ArrowRight, ArrowUpRight,
  FileEdit, Calendar, Upload, UserPlus, Plus, Send, Mail,
  Image as ImageIcon, Clock, AlertCircle, TrendingUp, Sparkles, ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { daysAgo, fmtDay, fmtRelative } from "@/lib/dateUtils";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { SkeletonRow, SkeletonTile, SkeletonChart } from "@/components/dashboard/shared/SkeletonRow";

type ActivityRow = {
  id: string; kind: string; title: string; detail: string | null;
  actor_name: string | null; created_at: string; link_url: string | null;
};

type Series = { day: string; visits: number; visitors: number; reads: number; bookingClicks: number }[];

type TodayItem = {
  id: string; kind: "booking" | "deadline" | "shoot" | "event";
  title: string; sub: string; time?: string; section: string;
};

type Props = {
  onCreate: (type?: string) => void;
  onImport: () => void;
  onJump: (section: string) => void;
  canCreate: boolean;
};

const KIND_ICON: Record<string, any> = {
  article_published: Send, article_drafted: FileEdit, article_scheduled: Calendar,
  social_scheduled: Calendar, social_posted: Send, booking_received: Briefcase,
  lead_captured: Mail, inquiry_received: Mail, media_uploaded: ImageIcon,
};

const KIND_LABEL: Record<string, string> = {
  article_published: "Article published", article_drafted: "Draft created",
  article_scheduled: "Article scheduled", social_scheduled: "Social post scheduled",
  social_posted: "Social post published", booking_received: "Booking inquiry",
  lead_captured: "Lead captured", inquiry_received: "Inquiry received",
  media_uploaded: "Media uploaded",
};

export const CommandCenterOverview = ({ onCreate, onImport, onJump, canCreate }: Props) => {
  const [health, setHealth] = useState({
    totalUsers: 0, activeStaff: 0, weekBookings: 0, pendingApprovals: 0, todayTraffic: 0,
  });
  const [series, setSeries] = useState<Series>([]);
  const [hasTrafficData, setHasTrafficData] = useState(false);
  const [today, setToday] = useState<TodayItem[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since30 = daysAgo(30).toISOString();
      const sinceWeek = daysAgo(7).toISOString();
      const todayKey = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      const inAWeek = tomorrow.toISOString().slice(0, 10);

      const [
        { count: totalUsers },
        { count: activeStaff },
        { count: weekBookings },
        { count: pendingApps },
        { count: submittedArticles },
        { data: pv30 },
        { data: ev30 },
        { data: act },
        { data: bookingsToday },
        { data: events },
        { data: dueArticles },
      ] = await Promise.all([
        supabase.from("profile_meta").select("user_id", { count: "exact", head: true }),
        supabase.from("staff_profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", sinceWeek),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("page_views").select("created_at,visitor_id,path").gte("created_at", since30),
        supabase.from("analytics_events" as never).select("created_at,event_type").gte("created_at", since30),
        supabase.from("activity_log").select("id, kind, title, detail, actor_name, created_at, link_url").order("created_at", { ascending: false }).limit(8),
        supabase.from("bookings").select("id, name, project_type, project_date, project_time, status").gte("project_date", todayKey).lte("project_date", inAWeek).order("project_date").limit(10),
        supabase.from("calendar_events").select("id, title, type, start_time, location").gte("start_time", new Date().toISOString()).lte("start_time", tomorrow.toISOString()).order("start_time").limit(10),
        supabase.from("articles").select("id, title, scheduled_for, status").not("scheduled_for", "is", null).gte("scheduled_for", new Date().toISOString()).lte("scheduled_for", tomorrow.toISOString()).order("scheduled_for").limit(10),
      ]);

      if (cancelled) return;

      // ---- Build daily series for last 14 days (mini chart)
      const evRows = ((ev30 as unknown) as { created_at: string; event_type: string }[]) ?? [];
      const daily = new Map<string, { visits: number; visitors: Set<string>; reads: number; bookingClicks: number }>();
      for (let i = 13; i >= 0; i--) {
        const d = daysAgo(i);
        daily.set(d.toISOString().slice(0, 10), { visits: 0, visitors: new Set(), reads: 0, bookingClicks: 0 });
      }
      (pv30 ?? []).forEach((row: any) => {
        const key = (row.created_at as string).slice(0, 10);
        const b = daily.get(key);
        if (b) {
          b.visits += 1;
          if (row.visitor_id) b.visitors.add(row.visitor_id);
        }
      });
      evRows.forEach((r) => {
        const key = r.created_at.slice(0, 10);
        const b = daily.get(key);
        if (!b) return;
        if (r.event_type === "article_view" || r.event_type === "article_read") b.reads += 1;
        if (r.event_type === "booking_click" || r.event_type === "booking_submit") b.bookingClicks += 1;
      });
      const built: Series = Array.from(daily.entries()).map(([k, v]) => ({
        day: fmtDay(new Date(k)), visits: v.visits, visitors: v.visitors.size, reads: v.reads, bookingClicks: v.bookingClicks,
      }));
      setSeries(built);
      const totalVisits = built.reduce((s, r) => s + r.visits, 0);
      const totalReads = built.reduce((s, r) => s + r.reads, 0);
      setHasTrafficData(totalVisits > 0 || totalReads > 0);

      // Today's traffic
      const todayViews = (pv30 ?? []).filter((r: any) => (r.created_at as string).slice(0, 10) === todayKey).length;

      setHealth({
        totalUsers: totalUsers ?? 0,
        activeStaff: activeStaff ?? 0,
        weekBookings: weekBookings ?? 0,
        pendingApprovals: (pendingApps ?? 0) + (submittedArticles ?? 0),
        todayTraffic: todayViews,
      });

      // Today panel — combine bookings, events, deadlines
      const todayItems: TodayItem[] = [];
      (bookingsToday ?? []).forEach((b: any) => {
        todayItems.push({
          id: `b-${b.id}`, kind: "booking",
          title: b.name + (b.project_type ? ` — ${b.project_type}` : ""),
          sub: `Status: ${b.status}`,
          time: b.project_time ? `${b.project_date} ${b.project_time.slice(0, 5)}` : b.project_date,
          section: "bookings",
        });
      });
      (events ?? []).forEach((e: any) => {
        todayItems.push({
          id: `e-${e.id}`, kind: e.type === "shoot" ? "shoot" : "event",
          title: e.title,
          sub: e.location || e.type,
          time: new Date(e.start_time).toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
          section: "calendar",
        });
      });
      (dueArticles ?? []).forEach((a: any) => {
        todayItems.push({
          id: `d-${a.id}`, kind: "deadline",
          title: a.title,
          sub: `Scheduled · ${a.status}`,
          time: new Date(a.scheduled_for).toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
          section: "scheduled",
        });
      });
      todayItems.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      setToday(todayItems.slice(0, 8));

      setActivity((act as ActivityRow[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const sampleData: Series = useMemo(() => ([
    { day: "Mon", visits: 120, visitors: 80, reads: 45, bookingClicks: 8 },
    { day: "Tue", visits: 145, visitors: 92, reads: 55, bookingClicks: 12 },
    { day: "Wed", visits: 132, visitors: 88, reads: 61, bookingClicks: 10 },
    { day: "Thu", visits: 180, visitors: 110, reads: 75, bookingClicks: 18 },
    { day: "Fri", visits: 210, visitors: 130, reads: 92, bookingClicks: 24 },
    { day: "Sat", visits: 260, visitors: 160, reads: 120, bookingClicks: 31 },
    { day: "Sun", visits: 240, visitors: 150, reads: 112, bookingClicks: 28 },
  ]), []);

  return (
    <div className="space-y-6">
      {/* HERO STRIP — premium feel */}
      <div className="border border-border/60 bg-gradient-to-br from-[#0c0c0c] via-[#080808] to-[#0c0c0c] p-5 md:p-6 rounded-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-primary mb-1.5 flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> RTG Operating System
            </div>
            <h1 className="font-display text-2xl md:text-3xl uppercase tracking-tight text-cream leading-none">
              Command Center
            </h1>
            <p className="text-xs text-muted-foreground mt-2 max-w-md">
              Live snapshot of your media company. Run content, manage people, track growth — all from here.
            </p>
          </div>
          {canCreate && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => onCreate("standard")} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm uppercase tracking-widest text-[10px] h-9 px-4">
                <Plus className="h-3 w-3 mr-1.5" /> New Article
              </Button>
              <Button size="sm" variant="outline" onClick={() => onJump("calendar")} className="rounded-sm uppercase tracking-widest text-[10px] h-9 px-3">
                <Calendar className="h-3 w-3 mr-1.5" /> Schedule
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* SYSTEM HEALTH STRIP */}
      <div>
        <SectionHeader title="System Health" sub="Live snapshot" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <HealthTile icon={Users} label="Total Users" value={health.totalUsers} accent="text-cream" onClick={() => onJump("users")} />
          <HealthTile icon={Activity} label="Active Staff" value={health.activeStaff} accent="text-emerald-400" onClick={() => onJump("staff")} />
          <HealthTile icon={Briefcase} label="Bookings · 7d" value={health.weekBookings} accent="text-sky-400" onClick={() => onJump("bookings")} />
          <HealthTile
            icon={AlertCircle}
            label="Pending Approvals"
            value={health.pendingApprovals}
            accent={health.pendingApprovals > 0 ? "text-primary" : "text-muted-foreground"}
            urgent={health.pendingApprovals > 0}
            onClick={() => onJump(health.pendingApprovals > 0 ? "applicants" : "submitted")}
          />
          <HealthTile icon={Eye} label="Traffic Today" value={health.todayTraffic} accent="text-gold" onClick={() => onJump("analytics")} />
        </div>
      </div>

      {/* TRAFFIC SNAPSHOT */}
      <div>
        <SectionHeader
          title="Traffic Snapshot"
          sub="Last 14 days · live data"
          actions={
            <Button size="sm" variant="outline" onClick={() => onJump("analytics")} className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3">
              View Full Analytics <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          }
        />
        <div className="border border-border/60 bg-[#080808] p-4 md:p-5 rounded-sm">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <Legend4 color="#ef3340" label="Page Views" />
              <Legend4 color="#7ec1ff" label="Visitors" />
              <Legend4 color="#c9a961" label="Article Reads" />
              <Legend4 color="#e87722" label="Booking Clicks" />
            </div>
            {!hasTrafficData && (
              <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Sample preview</div>
            )}
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hasTrafficData ? series : sampleData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(244,241,234,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(244,241,234,0.45)" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(244,241,234,0.45)" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                <Tooltip contentStyle={{ background: "#080808", border: "1px solid rgba(244,241,234,0.2)", color: "#f4f1ea", fontSize: 11, borderRadius: 2 }} cursor={{ stroke: "rgba(239,51,64,0.3)", strokeWidth: 1 }} />
                <Line type="monotone" dataKey="visits" stroke="#ef3340" strokeWidth={2.5} dot={false} name="Page Views" />
                <Line type="monotone" dataKey="visitors" stroke="#7ec1ff" strokeWidth={2} dot={false} name="Visitors" />
                <Line type="monotone" dataKey="reads" stroke="#c9a961" strokeWidth={2} dot={false} name="Article Reads" />
                <Line type="monotone" dataKey="bookingClicks" stroke="#e87722" strokeWidth={2} dot={false} name="Booking Clicks" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TODAY + QUICK ACTIONS */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* TODAY PANEL */}
        <div className="lg:col-span-2">
          <SectionHeader title="Today & This Week" sub="Bookings · Shoots · Deadlines · Meetings" />
          <div className="border border-border/60 bg-[#080808] rounded-sm divide-y divide-border/40">
            {loading ? (
              <div className="px-4 py-10 text-center text-xs text-muted-foreground">Loading…</div>
            ) : today.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-muted-foreground">
                <Calendar className="h-5 w-5 mx-auto mb-2 opacity-40" />
                Nothing scheduled in the next 7 days.
              </div>
            ) : (
              today.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onJump(item.section)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface/40 text-left transition-colors group"
                >
                  <TodayIcon kind={item.kind} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-cream truncate">{item.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                      {item.kind} · {item.sub}
                    </div>
                  </div>
                  {item.time && (
                    <div className="text-[10px] font-mono tabular-nums text-muted-foreground shrink-0">
                      {item.time}
                    </div>
                  )}
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div>
          <SectionHeader title="Quick Actions" sub="One-click ops" />
          <div className="space-y-2">
            <QuickAction icon={FileEdit} label="New Article" sub="Start a draft" onClick={() => onCreate("standard")} disabled={!canCreate} />
            <QuickAction icon={Briefcase} label="New Booking" sub="Add client booking" onClick={() => onJump("bookings")} />
            <QuickAction icon={Calendar} label="Add Event" sub="Calendar entry" onClick={() => onJump("calendar")} />
            <QuickAction icon={Upload} label="Upload Media" sub="Add to library" onClick={() => onJump("media")} />
            <QuickAction icon={UserPlus} label="Invite User" sub="Bring on a teammate" onClick={() => onJump("invites")} />
            <QuickAction icon={Upload} label="Import Article" sub="From URL" onClick={onImport} disabled={!canCreate} />
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div>
        <SectionHeader
          title="Recent Activity"
          sub="Live feed across the platform"
          actions={
            <Button size="sm" variant="outline" onClick={() => onJump("analytics")} className="rounded-sm uppercase tracking-widest text-[10px] h-8 px-3">
              All activity <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          }
        />
        <div className="border border-border/60 bg-[#080808] rounded-sm divide-y divide-border/40">
          {activity.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              <Activity className="h-5 w-5 mx-auto mb-2 opacity-40" />
              No activity yet. Things will show up here as your team works.
            </div>
          ) : (
            activity.map((a) => {
              const Icon = KIND_ICON[a.kind] ?? Activity;
              return (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface/40 transition-colors">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{KIND_LABEL[a.kind] ?? a.kind}</div>
                    <div className="text-sm text-cream truncate">{a.title}</div>
                    <div className="text-[10px] text-muted-foreground/80 mt-0.5 flex items-center gap-2">
                      <Clock className="h-2.5 w-2.5" /> {fmtRelative(a.created_at)}
                      {a.actor_name && <span className="opacity-60">· {a.actor_name}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

/* ================== sub-components ================== */

const SectionHeader = ({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) => (
  <div className="flex items-end justify-between gap-4 mb-3 pb-2 border-b border-border/40">
    <div>
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-1">{sub}</div>
      <h2 className="font-display text-base md:text-lg uppercase tracking-tight text-cream leading-none">{title}</h2>
    </div>
    {actions}
  </div>
);

const HealthTile = ({
  icon: Icon, label, value, accent = "text-cream", urgent, onClick,
}: { icon: any; label: string; value: number; accent?: string; urgent?: boolean; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`text-left border bg-[#080808] p-3 rounded-sm transition-all hover:-translate-y-0.5 group relative ${
      urgent ? "border-primary/40 hover:border-primary" : "border-border/60 hover:border-foreground/40"
    }`}
  >
    <div className="flex items-center justify-between mb-1.5">
      <Icon className={`h-3.5 w-3.5 ${accent}`} />
      <ArrowUpRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
    </div>
    <div className={`text-2xl md:text-3xl font-display leading-none ${accent}`}>{value}</div>
    <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground mt-1.5">{label}</div>
    {urgent && (
      <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
    )}
  </button>
);

const QuickAction = ({
  icon: Icon, label, sub, onClick, disabled,
}: { icon: any; label: string; sub: string; onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full flex items-center gap-3 px-3 py-2.5 border border-border/60 bg-[#080808] rounded-sm hover:border-primary/60 hover:bg-primary/5 transition-all text-left group disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <div className="h-8 w-8 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
      <Icon className="h-3.5 w-3.5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-cream uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
    <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
  </button>
);

const TodayIcon = ({ kind }: { kind: TodayItem["kind"] }) => {
  const Icon = kind === "booking" ? Briefcase : kind === "deadline" ? Clock : kind === "shoot" ? ImageIcon : Calendar;
  const color =
    kind === "booking" ? "bg-sky-500/10 text-sky-400 border-sky-500/30" :
    kind === "deadline" ? "bg-primary/10 text-primary border-primary/30" :
    kind === "shoot" ? "bg-gold/10 text-gold border-gold/30" :
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  return (
    <div className={`h-7 w-7 rounded-sm border flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="h-3 w-3" />
    </div>
  );
};

const Legend4 = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
  </div>
);

export default CommandCenterOverview;
