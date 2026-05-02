// RTG Operations Calendar — native, no Google sync.
// Month / Week / Day / List views with full event CRUD.
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Calendar as CalIcon, Plus, ChevronLeft, ChevronRight, MapPin, Users, Clock,
  Check, X as XIcon, Copy as CopyIcon, Trash2, Pencil, Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { PageHead, EmptyState, SectionShell } from "../shared/Primitives";
import { cn } from "@/lib/utils";

// ============================================================
// TYPES + CONSTANTS
// ============================================================

export type CalendarEventType =
  | "shoot" | "interview" | "article_deadline" | "edit_deadline"
  | "client_booking" | "team_meeting" | "release_date" | "content_drop" | "personal_block";

export type CalendarEventStatus = "scheduled" | "completed" | "canceled";
export type CalendarRelatedType = "article" | "booking" | "project" | "none";

export type CalendarEvent = {
  id: string;
  title: string;
  type: CalendarEventType;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string | null;
  description: string | null;
  assigned_user_ids: string[];
  related_type: CalendarRelatedType;
  related_id: string | null;
  status: CalendarEventStatus;
  color: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export const EVENT_TYPE_META: Record<CalendarEventType, { label: string; color: string; ring: string; dot: string }> = {
  shoot:            { label: "Shoot",            color: "bg-primary/15 text-primary border-primary/40",      ring: "border-l-primary",         dot: "bg-primary" },
  interview:        { label: "Interview",        color: "bg-gold/15 text-gold border-gold/40",                ring: "border-l-gold",            dot: "bg-gold" },
  article_deadline: { label: "Article Deadline", color: "bg-amber-500/15 text-amber-400 border-amber-500/40", ring: "border-l-amber-500",       dot: "bg-amber-500" },
  edit_deadline:    { label: "Edit Deadline",    color: "bg-orange-500/15 text-orange-400 border-orange-500/40", ring: "border-l-orange-500",  dot: "bg-orange-500" },
  client_booking:   { label: "Client Booking",   color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40", ring: "border-l-emerald-500", dot: "bg-emerald-500" },
  team_meeting:     { label: "Team Meeting",     color: "bg-sky-500/15 text-sky-400 border-sky-500/40",        ring: "border-l-sky-500",         dot: "bg-sky-500" },
  release_date:     { label: "Release Date",     color: "bg-purple-500/15 text-purple-400 border-purple-500/40", ring: "border-l-purple-500",   dot: "bg-purple-500" },
  content_drop:     { label: "Content Drop",     color: "bg-pink-500/15 text-pink-400 border-pink-500/40",     ring: "border-l-pink-500",        dot: "bg-pink-500" },
  personal_block:   { label: "Personal Block",   color: "bg-muted text-muted-foreground border-border",        ring: "border-l-muted-foreground", dot: "bg-muted-foreground" },
};

const STATUS_META: Record<CalendarEventStatus, { label: string; cls: string }> = {
  scheduled: { label: "Scheduled", cls: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  completed: { label: "Completed", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  canceled:  { label: "Canceled",  cls: "bg-muted/40 text-muted-foreground border-border line-through" },
};

type ViewMode = "month" | "week" | "day" | "list";

// ============================================================
// DATE HELPERS (avoid extra deps; use vanilla Date)
// ============================================================

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay   = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const addDays    = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonths  = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
const sameDay    = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const startOfWeek = (d: Date) => { // Sunday
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
};
const monthGridStart = (d: Date) => startOfWeek(new Date(d.getFullYear(), d.getMonth(), 1));
const monthGridEnd   = (d: Date) => {
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return endOfDay(addDays(startOfWeek(last), 6));
};
const fmtMonth = (d: Date) => d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
const fmtDate  = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
const fmtTime  = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (s: string) => new Date(s).toISOString();

// ============================================================
// MAIN
// ============================================================

type Props = { compact?: boolean }; // compact = mini upcoming list (for Overview)

const CalendarSection = ({ compact = false }: Props) => {
  const { user, roles } = useAuth();
  const isOps = useMemo(
    () => roles.some((r) => ["head_admin", "admin", "owner", "co_ceo", "editor", "booking_manager"].includes(r)),
    [roles],
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>(compact ? "list" : "month");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [typeFilter, setTypeFilter] = useState<CalendarEventType | "all">("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [defaultStart, setDefaultStart] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    // Pull a generous window: 6 months back, 12 months forward
    const lo = addMonths(new Date(), -6).toISOString();
    const hi = addMonths(new Date(), 12).toISOString();
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .gte("start_time", lo)
      .lte("start_time", hi)
      .order("start_time", { ascending: true });
    if (error) { toast.error(error.message); setEvents([]); }
    else setEvents((data ?? []) as CalendarEvent[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => (typeFilter === "all" ? events : events.filter((e) => e.type === typeFilter)),
    [events, typeFilter],
  );

  const openCreate = (start?: Date) => {
    setEditing(null);
    setDefaultStart(start ?? new Date());
    setEditorOpen(true);
  };
  const openEdit = (ev: CalendarEvent) => {
    setEditing(ev);
    setDefaultStart(null);
    setEditorOpen(true);
  };

  const handleSaved = () => { setEditorOpen(false); load(); };

  // ---------- COMPACT (Overview embed) ----------
  if (compact) {
    const now = new Date();
    const upcoming = filtered
      .filter((e) => new Date(e.start_time) >= startOfDay(now) && e.status !== "canceled")
      .slice(0, 6);
    return (
      <div className="border border-border rounded-sm bg-surface/30 divide-y divide-border">
        {upcoming.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No upcoming events. <button onClick={() => openCreate()} className="text-primary underline-offset-4 hover:underline">Add one</button>
          </div>
        ) : (
          upcoming.map((e) => (
            <button
              key={e.id}
              onClick={() => openEdit(e)}
              className="w-full text-left px-3 py-2.5 hover:bg-surface/60 transition-colors flex gap-3 items-start"
            >
              <span className={cn("h-1.5 w-1.5 rounded-full mt-2 shrink-0", EVENT_TYPE_META[e.type].dot)} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{e.title}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 flex items-center gap-2">
                  <Clock className="h-2.5 w-2.5" /> {fmtDate(new Date(e.start_time))} · {fmtTime(e.start_time)}
                </div>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground/70 mt-1">
                {EVENT_TYPE_META[e.type].label}
              </span>
            </button>
          ))
        )}
        {editorOpen && (
          <EventEditor
            event={editing}
            defaultStart={defaultStart}
            currentUserId={user?.id}
            isOps={isOps}
            onClose={() => setEditorOpen(false)}
            onSaved={handleSaved}
          />
        )}
      </div>
    );
  }

  // ---------- FULL CALENDAR ----------
  return (
    <SectionShell>
      <PageHead
        title="RTG Operations Calendar"
        sub="Internal scheduling"
        actions={
          <>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CalendarEventType | "all")}>
              <SelectTrigger className="h-8 rounded-sm text-[11px] uppercase tracking-widest bg-background border-border w-[170px]">
                <Filter className="h-3 w-3 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(Object.keys(EVENT_TYPE_META) as CalendarEventType[]).map((t) => (
                  <SelectItem key={t} value={t}>{EVENT_TYPE_META[t].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => openCreate()}
              className="h-8 rounded-sm uppercase tracking-widest text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3 w-3 mr-1.5" /> New Event
            </Button>
          </>
        }
      />

      <Toolbar
        cursor={cursor}
        view={view}
        setView={setView}
        onPrev={() => setCursor(view === "month" ? addMonths(cursor, -1) : view === "week" ? addDays(cursor, -7) : addDays(cursor, -1))}
        onNext={() => setCursor(view === "month" ? addMonths(cursor, 1) : view === "week" ? addDays(cursor, 7) : addDays(cursor, 1))}
        onToday={() => setCursor(new Date())}
      />

      {loading ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Loading calendar…</div>
      ) : (
        <>
          {view === "month" && <MonthView cursor={cursor} events={filtered} onDayClick={openCreate} onEventClick={openEdit} />}
          {view === "week"  && <WeekView  cursor={cursor} events={filtered} onSlotClick={openCreate} onEventClick={openEdit} />}
          {view === "day"   && <DayView   cursor={cursor} events={filtered} onSlotClick={openCreate} onEventClick={openEdit} />}
          {view === "list"  && <ListView  cursor={cursor} events={filtered} onEventClick={openEdit} />}
        </>
      )}

      {events.length === 0 && !loading && view !== "month" && (
        <EmptyState icon={CalIcon} title="No events yet" body="Create your first event to start scheduling." />
      )}

      {editorOpen && (
        <EventEditor
          event={editing}
          defaultStart={defaultStart}
          currentUserId={user?.id}
          isOps={isOps}
          onClose={() => setEditorOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </SectionShell>
  );
};

// ============================================================
// TOOLBAR
// ============================================================
const Toolbar = ({
  cursor, view, setView, onPrev, onNext, onToday,
}: {
  cursor: Date; view: ViewMode; setView: (v: ViewMode) => void;
  onPrev: () => void; onNext: () => void; onToday: () => void;
}) => {
  const label =
    view === "month" ? fmtMonth(cursor) :
    view === "week"  ? `Week of ${startOfWeek(cursor).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` :
    view === "day"   ? fmtDate(cursor) :
                       "All Upcoming";
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={onPrev} className="h-8 w-8 p-0 rounded-sm border-border" aria-label="Previous"><ChevronLeft className="h-3.5 w-3.5" /></Button>
        <Button variant="outline" size="sm" onClick={onToday} className="h-8 rounded-sm text-[10px] uppercase tracking-widest border-border">Today</Button>
        <Button variant="outline" size="sm" onClick={onNext} className="h-8 w-8 p-0 rounded-sm border-border" aria-label="Next"><ChevronRight className="h-3.5 w-3.5" /></Button>
        <div className="ml-3 font-display uppercase text-base tracking-wide">{label}</div>
      </div>
      <div className="flex items-center gap-px border border-border rounded-sm overflow-hidden">
        {(["month", "week", "day", "list"] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors",
              view === v ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-surface",
            )}
          >{v}</button>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// MONTH VIEW
// ============================================================
const MonthView = ({
  cursor, events, onDayClick, onEventClick,
}: {
  cursor: Date; events: CalendarEvent[];
  onDayClick: (d: Date) => void; onEventClick: (e: CalendarEvent) => void;
}) => {
  const start = monthGridStart(cursor);
  const end = monthGridEnd(cursor);
  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) days.push(new Date(d));
  const today = new Date();

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const key = startOfDay(new Date(e.start_time)).toDateString();
      (m.get(key) ?? m.set(key, []).get(key)!).push(e);
    });
    return m;
  }, [events]);

  return (
    <div>
      <div className="grid grid-cols-7 gap-px text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-1.5 text-center font-semibold">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-sm overflow-hidden">
        {days.map((d) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = sameDay(d, today);
          const dayEvents = byDay.get(d.toDateString()) ?? [];
          return (
            <button
              key={d.toISOString()}
              onClick={() => onDayClick(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0))}
              className={cn(
                "bg-background min-h-[110px] p-1.5 text-left transition-colors hover:bg-surface/40 group",
                !inMonth && "opacity-40",
                isToday && "ring-1 ring-primary/60 ring-inset",
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-[10px] font-semibold", isToday && "text-primary")}>
                  {d.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[8px] uppercase tracking-widest text-muted-foreground">{dayEvents.length}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => {
                  const meta = EVENT_TYPE_META[e.type];
                  return (
                    <div
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                      className={cn(
                        "border-l-2 pl-1.5 pr-1 py-0.5 rounded-r-sm bg-surface/60 hover:bg-surface text-[10px] truncate cursor-pointer",
                        meta.ring,
                        e.status === "canceled" && "line-through opacity-50",
                      )}
                      title={e.title}
                    >
                      <span className="opacity-70 mr-1">{fmtTime(e.start_time)}</span>
                      {e.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// WEEK VIEW
// ============================================================
const WeekView = ({
  cursor, events, onSlotClick, onEventClick,
}: {
  cursor: Date; events: CalendarEvent[];
  onSlotClick: (d: Date) => void; onEventClick: (e: CalendarEvent) => void;
}) => {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();
  return (
    <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-sm overflow-hidden">
      {days.map((d) => {
        const isToday = sameDay(d, today);
        const list = events
          .filter((e) => sameDay(new Date(e.start_time), d))
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        return (
          <div key={d.toISOString()} className="bg-background min-h-[420px] flex flex-col">
            <button
              onClick={() => onSlotClick(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0))}
              className={cn(
                "px-2 py-2 border-b border-border text-left hover:bg-surface/40 transition-colors",
                isToday && "bg-primary/5",
              )}
            >
              <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
              <div className={cn("font-display text-lg leading-none mt-0.5", isToday && "text-primary")}>{d.getDate()}</div>
            </button>
            <div className="p-1.5 space-y-1 flex-1">
              {list.length === 0 ? (
                <div className="text-[10px] text-muted-foreground/50 text-center pt-4">—</div>
              ) : (
                list.map((e) => <EventChip key={e.id} ev={e} onClick={() => onEventClick(e)} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// DAY VIEW
// ============================================================
const DayView = ({
  cursor, events, onSlotClick, onEventClick,
}: {
  cursor: Date; events: CalendarEvent[];
  onSlotClick: (d: Date) => void; onEventClick: (e: CalendarEvent) => void;
}) => {
  const list = events
    .filter((e) => sameDay(new Date(e.start_time), cursor))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm
  return (
    <div className="border border-border rounded-sm overflow-hidden">
      {hours.map((h) => {
        const slotStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), h, 0);
        const slotEnd = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), h + 1, 0);
        const inSlot = list.filter((e) => {
          const s = new Date(e.start_time);
          return s >= slotStart && s < slotEnd;
        });
        return (
          <div key={h} className="grid grid-cols-[60px_1fr] border-b border-border last:border-b-0">
            <div className="px-2 py-3 text-[10px] uppercase tracking-widest text-muted-foreground border-r border-border">
              {h % 12 === 0 ? 12 : h % 12}{h < 12 ? "am" : "pm"}
            </div>
            <button
              onClick={() => onSlotClick(slotStart)}
              className="text-left px-2 py-2 min-h-[60px] hover:bg-surface/40 transition-colors space-y-1"
            >
              {inSlot.length === 0 ? (
                <span className="text-[10px] text-muted-foreground/40">Click to add</span>
              ) : (
                inSlot.map((e) => <EventChip key={e.id} ev={e} onClick={() => onEventClick(e)} large />)
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// LIST VIEW
// ============================================================
const ListView = ({
  cursor, events, onEventClick,
}: {
  cursor: Date; events: CalendarEvent[]; onEventClick: (e: CalendarEvent) => void;
}) => {
  const upcoming = events
    .filter((e) => new Date(e.start_time) >= startOfDay(cursor))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  if (upcoming.length === 0) {
    return <EmptyState icon={CalIcon} title="No upcoming events" body="Schedule your next shoot, deadline, or meeting." />;
  }
  // Group by date
  const groups = new Map<string, CalendarEvent[]>();
  upcoming.forEach((e) => {
    const k = startOfDay(new Date(e.start_time)).toDateString();
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(e);
  });
  return (
    <div className="border border-border rounded-sm bg-surface/20 divide-y divide-border">
      {[...groups.entries()].map(([k, list]) => (
        <div key={k}>
          <div className="px-4 py-2 bg-background/50 text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold sticky top-0">
            {fmtDate(new Date(k))}
          </div>
          <div className="divide-y divide-border">
            {list.map((e) => {
              const meta = EVENT_TYPE_META[e.type];
              return (
                <button
                  key={e.id}
                  onClick={() => onEventClick(e)}
                  className="w-full text-left px-4 py-3 hover:bg-surface/50 transition-colors flex gap-3 items-start"
                >
                  <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", meta.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={cn("text-sm font-medium", e.status === "canceled" && "line-through opacity-60")}>{e.title}</div>
                      <span className={cn("text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border", meta.color)}>{meta.label}</span>
                      <span className={cn("text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border", STATUS_META[e.status].cls)}>{STATUS_META[e.status].label}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {fmtTime(e.start_time)} – {fmtTime(e.end_time)}</span>
                      {e.location && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {e.location}</span>}
                      {e.assigned_user_ids.length > 0 && <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" /> {e.assigned_user_ids.length}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// EVENT CHIP
// ============================================================
const EventChip = ({ ev, onClick, large = false }: { ev: CalendarEvent; onClick: () => void; large?: boolean }) => {
  const meta = EVENT_TYPE_META[ev.type];
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "border-l-2 bg-surface/70 hover:bg-surface rounded-r-sm cursor-pointer transition-colors",
        meta.ring,
        large ? "px-2 py-1.5" : "px-1.5 py-0.5",
        ev.status === "canceled" && "line-through opacity-50",
      )}
    >
      <div className={cn("font-medium leading-tight truncate", large ? "text-xs" : "text-[10px]")}>{ev.title}</div>
      <div className={cn("text-muted-foreground uppercase tracking-widest mt-0.5", large ? "text-[9px]" : "text-[8px]")}>
        {fmtTime(ev.start_time)}
      </div>
    </div>
  );
};

// ============================================================
// EVENT EDITOR DIALOG
// ============================================================
type ProfileLite = { user_id: string; display_name: string | null };

const EventEditor = ({
  event, defaultStart, currentUserId, isOps, onClose, onSaved,
}: {
  event: CalendarEvent | null;
  defaultStart: Date | null;
  currentUserId: string | undefined;
  isOps: boolean;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isEdit = !!event;
  const seedStart = event ? toLocalInput(event.start_time)
                          : toLocalInput((defaultStart ?? new Date()).toISOString());
  const seedEnd = event ? toLocalInput(event.end_time)
                        : toLocalInput(new Date((defaultStart ?? new Date()).getTime() + 60 * 60 * 1000).toISOString());

  const [title, setTitle] = useState(event?.title ?? "");
  const [type, setType] = useState<CalendarEventType>(event?.type ?? "team_meeting");
  const [startLocal, setStartLocal] = useState(seedStart);
  const [endLocal, setEndLocal] = useState(seedEnd);
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [location, setLocation] = useState(event?.location ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [status, setStatus] = useState<CalendarEventStatus>(event?.status ?? "scheduled");
  const [assigned, setAssigned] = useState<string[]>(event?.assigned_user_ids ?? []);
  const [saving, setSaving] = useState(false);
  const [people, setPeople] = useState<ProfileLite[]>([]);

  const canEditAll = isOps || (isEdit && event!.created_by === currentUserId);
  const canDelete = canEditAll;

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profile_meta")
        .select("user_id, display_name")
        .eq("status", "active")
        .order("display_name");
      setPeople((data ?? []) as ProfileLite[]);
    })();
  }, []);

  const toggleAssignee = (uid: string) => {
    setAssigned((prev) => prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]);
  };

  const save = async () => {
    if (!title.trim()) return toast.error("Title is required");
    if (!currentUserId) return toast.error("You must be signed in");
    if (new Date(endLocal) < new Date(startLocal)) return toast.error("End time must be after start time");
    setSaving(true);
    const payload = {
      title: title.trim(),
      type,
      start_time: fromLocalInput(startLocal),
      end_time: fromLocalInput(endLocal),
      all_day: allDay,
      location: location.trim() || null,
      description: description.trim() || null,
      assigned_user_ids: assigned,
      status,
    };
    if (isEdit) {
      const { error } = await supabase.from("calendar_events").update(payload).eq("id", event!.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Event updated");
    } else {
      const { error } = await supabase.from("calendar_events").insert({ ...payload, created_by: currentUserId });
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Event created");
    }
    setSaving(false);
    onSaved();
  };

  const duplicate = async () => {
    if (!event || !currentUserId) return;
    const { error } = await supabase.from("calendar_events").insert({
      title: `${event.title} (copy)`,
      type: event.type,
      start_time: event.start_time,
      end_time: event.end_time,
      all_day: event.all_day,
      location: event.location,
      description: event.description,
      assigned_user_ids: event.assigned_user_ids,
      status: "scheduled",
      created_by: currentUserId,
    });
    if (error) return toast.error(error.message);
    toast.success("Event duplicated");
    onSaved();
  };

  const markComplete = async () => {
    if (!event) return;
    const { error } = await supabase.from("calendar_events").update({ status: "completed" }).eq("id", event.id);
    if (error) return toast.error(error.message);
    toast.success("Marked complete");
    onSaved();
  };

  const cancelEvent = async () => {
    if (!event) return;
    const { error } = await supabase.from("calendar_events").update({ status: "canceled" }).eq("id", event.id);
    if (error) return toast.error(error.message);
    toast.success("Event canceled");
    onSaved();
  };

  const remove = async () => {
    if (!event) return;
    if (!confirm("Delete this event? This cannot be undone.")) return;
    const { error } = await supabase.from("calendar_events").delete().eq("id", event.id);
    if (error) return toast.error(error.message);
    toast.success("Event deleted");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">
            {isEdit ? "Edit Event" : "New Event"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit ? "Update or manage this event." : "Create a new calendar event."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canEditAll} placeholder="Event title" className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CalendarEventType)} disabled={!canEditAll}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(EVENT_TYPE_META) as CalendarEventType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", EVENT_TYPE_META[t].dot)} />
                        {EVENT_TYPE_META[t].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as CalendarEventStatus)} disabled={!canEditAll}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_META) as CalendarEventStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Starts</Label>
              <Input type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} disabled={!canEditAll} className="mt-1" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Ends</Label>
              <Input type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} disabled={!canEditAll} className="mt-1" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} disabled={!canEditAll} />
            All-day event
          </label>

          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} disabled={!canEditAll} placeholder="Studio, address, or video link" className="mt-1" />
          </div>

          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Notes</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canEditAll} placeholder="Details, agenda, prep list…" rows={3} className="mt-1" />
          </div>

          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Assigned Team Members</Label>
            <div className="mt-1.5 max-h-40 overflow-y-auto border border-border rounded-sm divide-y divide-border bg-surface/30">
              {people.length === 0 ? (
                <div className="px-3 py-3 text-xs text-muted-foreground">No active team members yet.</div>
              ) : (
                people.map((p) => {
                  const checked = assigned.includes(p.user_id);
                  return (
                    <label key={p.user_id} className={cn("flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-surface/60", !canEditAll && "cursor-not-allowed opacity-70")}>
                      <input type="checkbox" checked={checked} onChange={() => toggleAssignee(p.user_id)} disabled={!canEditAll} />
                      <span className="truncate">{p.display_name || p.user_id.slice(0, 8)}</span>
                    </label>
                  );
                })
              )}
            </div>
            {assigned.length > 0 && (
              <div className="text-[10px] text-muted-foreground mt-1.5">{assigned.length} assigned</div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
          <div className="flex gap-2 flex-wrap">
            {isEdit && canEditAll && status !== "completed" && (
              <Button type="button" variant="outline" size="sm" onClick={markComplete} className="rounded-sm h-8 text-[10px] uppercase tracking-widest">
                <Check className="h-3 w-3 mr-1.5" /> Complete
              </Button>
            )}
            {isEdit && canEditAll && status !== "canceled" && (
              <Button type="button" variant="outline" size="sm" onClick={cancelEvent} className="rounded-sm h-8 text-[10px] uppercase tracking-widest">
                <XIcon className="h-3 w-3 mr-1.5" /> Cancel
              </Button>
            )}
            {isEdit && canEditAll && (
              <Button type="button" variant="outline" size="sm" onClick={duplicate} className="rounded-sm h-8 text-[10px] uppercase tracking-widest">
                <CopyIcon className="h-3 w-3 mr-1.5" /> Duplicate
              </Button>
            )}
            {isEdit && canDelete && (
              <Button type="button" variant="outline" size="sm" onClick={remove} className="rounded-sm h-8 text-[10px] uppercase tracking-widest text-primary border-primary/40 hover:bg-primary/10">
                <Trash2 className="h-3 w-3 mr-1.5" /> Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-sm h-8 text-[10px] uppercase tracking-widest">Close</Button>
            {canEditAll && (
              <Button type="button" size="sm" onClick={save} disabled={saving} className="rounded-sm h-8 text-[10px] uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? "Saving…" : isEdit ? <><Pencil className="h-3 w-3 mr-1.5" /> Save</> : <><Plus className="h-3 w-3 mr-1.5" /> Create</>}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarSection;
