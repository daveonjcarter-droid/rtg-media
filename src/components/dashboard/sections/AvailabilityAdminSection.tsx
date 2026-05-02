// Admin overview of all staff availability. Route: /dashboard/availability
// Filters: by role, available today, accepting bookings.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCheck2, Clock, Search, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AvailabilityCalendar } from "@/components/dashboard/AvailabilityCalendar";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // JS getDay
const DAY_LABELS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; // weekday column 0..6 in our schema (assumed Mon=0)

type StaffRow = {
  id: string;
  user_id: string | null;
  display_name: string;
  role_title: string | null;
  status: string;
  accepting_bookings: boolean;
  availability_notes: string | null;
  availability_updated_at: string | null;
};

type Block = { id: string; staff_id: string; weekday: number; start_time: string; end_time: string; notes: string | null };
type Blackout = { id: string; staff_id: string; blackout_date: string; reason: string | null };

const trimSec = (t: string) => (t?.length >= 5 ? t.slice(0, 5) : t);

export const AvailabilityAdminSection = () => {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [availFilter, setAvailFilter] = useState<"all" | "today" | "accepting">("all");
  const [editStaff, setEditStaff] = useState<StaffRow | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: a }, { data: b }] = await Promise.all([
      supabase
        .from("staff_profiles")
        .select("id, user_id, display_name, role_title, status, accepting_bookings, availability_notes, availability_updated_at")
        .order("display_name"),
      supabase.from("staff_availability" as any).select("*"),
      supabase.from("staff_blackouts" as any).select("*"),
    ]);
    setStaff((s as any) || []);
    setBlocks(((a as any) || []).map((r: any) => ({ ...r, start_time: trimSec(r.start_time), end_time: trimSec(r.end_time) })));
    setBlackouts((b as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const blocksByStaff = useMemo(() => {
    const m: Record<string, Block[]> = {};
    blocks.forEach((b) => (m[b.staff_id] = [...(m[b.staff_id] ?? []), b]));
    return m;
  }, [blocks]);

  const blackoutsByStaff = useMemo(() => {
    const m: Record<string, Blackout[]> = {};
    blackouts.forEach((b) => (m[b.staff_id] = [...(m[b.staff_id] ?? []), b]));
    return m;
  }, [blackouts]);

  const allRoles = useMemo(() => {
    const set = new Set<string>();
    staff.forEach((s) => s.role_title && set.add(s.role_title));
    return Array.from(set).sort();
  }, [staff]);

  const todayWeekday = useMemo(() => {
    // Assume schema weekday: 0=Mon..6=Sun
    const js = new Date().getDay(); // 0=Sun..6=Sat
    return (js + 6) % 7;
  }, []);
  const todayISO = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      if (search && !s.display_name.toLowerCase().includes(search.toLowerCase()) && !(s.role_title ?? "").toLowerCase().includes(search.toLowerCase()))
        return false;
      if (roleFilter !== "all" && s.role_title !== roleFilter) return false;
      if (availFilter === "accepting" && !s.accepting_bookings) return false;
      if (availFilter === "today") {
        const blk = blackoutsByStaff[s.id]?.some((bl) => bl.blackout_date === todayISO);
        const dayBlocks = blocksByStaff[s.id]?.filter((b) => b.weekday === todayWeekday) ?? [];
        if (blk || dayBlocks.length === 0 || !s.accepting_bookings) return false;
      }
      return true;
    });
  }, [staff, search, roleFilter, availFilter, blocksByStaff, blackoutsByStaff, todayISO, todayWeekday]);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-[0.25em] text-primary mb-1">Operations</div>
        <h1 className="text-2xl md:text-3xl font-display uppercase tracking-tight text-cream">Staff Availability</h1>
        <p className="text-sm text-muted-foreground mt-1">
          See when crew are free, who's accepting bookings, and assign jobs accordingly.
        </p>
      </div>

      {/* Filters */}
      <Card className="border-border/60 bg-[#080808]">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff or role…"
              className="pl-8 h-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="All roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {allRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={availFilter} onValueChange={(v) => setAvailFilter(v as any)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="today">Available today</SelectItem>
              <SelectItem value="accepting">Accepting bookings</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Users} label="Total Staff" value={staff.length} />
        <StatTile icon={CalendarCheck2} label="Accepting Bookings" value={staff.filter((s) => s.accepting_bookings).length} accent="text-emerald-400" />
        <StatTile icon={Clock} label="Available Today" value={
          staff.filter((s) => {
            const blk = blackoutsByStaff[s.id]?.some((bl) => bl.blackout_date === todayISO);
            const dayBlocks = blocksByStaff[s.id]?.filter((b) => b.weekday === todayWeekday) ?? [];
            return !blk && dayBlocks.length > 0 && s.accepting_bookings;
          }).length
        } accent="text-primary" />
        <StatTile icon={CalendarCheck2} label="With Schedule" value={Object.keys(blocksByStaff).length} />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-sm text-muted-foreground p-6">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground border border-dashed border-border rounded-sm py-12 text-center">
          No staff match these filters.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const dayMap: Record<number, Block[]> = {};
            (blocksByStaff[s.id] ?? []).forEach((b) => (dayMap[b.weekday] = [...(dayMap[b.weekday] ?? []), b]));
            const upcomingBlackouts = (blackoutsByStaff[s.id] ?? []).filter((b) => b.blackout_date >= todayISO).slice(0, 3);
            return (
              <Card key={s.id} className="border-border/60 bg-[#080808]">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-display text-base text-cream uppercase tracking-tight">{s.display_name}</div>
                        {s.role_title && <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{s.role_title}</Badge>}
                        <Badge className={s.accepting_bookings
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-muted/40 text-muted-foreground border border-border"}>
                          {s.accepting_bookings ? "Accepting" : "Paused"}
                        </Badge>
                      </div>
                      {s.availability_notes && (
                        <div className="text-xs text-muted-foreground mt-1.5 italic">"{s.availability_notes}"</div>
                      )}
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">
                        Updated {s.availability_updated_at ? formatDistanceToNow(new Date(s.availability_updated_at), { addSuffix: true }) : "never"}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setEditStaff(s)} className="rounded-sm uppercase tracking-widest text-[10px] h-8">
                      Edit Schedule
                    </Button>
                  </div>

                  {/* Weekly mini-grid */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {DAY_LABELS_MON.map((day, idx) => {
                      const dayBlocks = dayMap[idx] ?? [];
                      const isToday = idx === todayWeekday;
                      return (
                        <div
                          key={day}
                          className={`border rounded-sm p-1.5 min-h-[60px] ${isToday ? "border-primary/60 bg-primary/5" : "border-border/40"}`}
                        >
                          <div className={`text-[9px] uppercase tracking-widest mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</div>
                          {dayBlocks.length === 0 ? (
                            <div className="text-[10px] text-muted-foreground/60">—</div>
                          ) : (
                            dayBlocks.slice(0, 3).map((b) => (
                              <div key={b.id} className="text-[10px] font-mono tabular-nums text-cream truncate">
                                {b.start_time}–{b.end_time}
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {upcomingBlackouts.length > 0 && (
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Upcoming blackouts:{" "}
                      {upcomingBlackouts.map((b) => (
                        <span key={b.id} className="text-cream font-mono normal-case mr-2">
                          {b.blackout_date}{b.reason ? ` (${b.reason})` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editStaff && (
        <AvailabilityCalendar
          staffId={editStaff.id}
          staffName={editStaff.display_name}
          open={!!editStaff}
          onClose={() => { setEditStaff(null); load(); }}
        />
      )}
    </div>
  );
};

const StatTile = ({ icon: Icon, label, value, accent = "text-cream" }: { icon: any; label: string; value: number; accent?: string }) => (
  <div className="border border-border/60 bg-[#080808] p-3 rounded-sm">
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
    <div className={`text-2xl font-display ${accent}`}>{value}</div>
  </div>
);

export default AvailabilityAdminSection;
