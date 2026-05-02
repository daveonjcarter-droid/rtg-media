// Self-serve availability editor for staff/crew. Lives at /dashboard/my-availability
// and is also embedded inside the user's profile (Availability tab).
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarOff, Clock, Plus, Save, Trash2 } from "lucide-react";

type DayBlock = { id?: string; weekday: number; start_time: string; end_time: string; notes?: string | null };
type Blackout = { id?: string; blackout_date: string; reason: string | null };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const trimSec = (t: string) => t.length >= 5 ? t.slice(0, 5) : t;

export const MyAvailabilitySection = ({ embedded = false }: { embedded?: boolean }) => {
  const { user } = useAuth();
  const [staffId, setStaffId] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(true);
  const [availabilityNotes, setAvailabilityNotes] = useState("");
  const [blocks, setBlocks] = useState<DayBlock[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [newBlackout, setNewBlackout] = useState({ date: "", reason: "" });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    // Find or auto-create the staff profile for this user
    let { data: sp } = await supabase
      .from("staff_profiles")
      .select("id, accepting_bookings, availability_notes")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sp) {
      const { data: created, error } = await supabase
        .from("staff_profiles")
        .insert({
          user_id: user.id,
          display_name: user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Crew",
        })
        .select("id, accepting_bookings, availability_notes")
        .single();
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      sp = created;
    }

    setStaffId(sp.id);
    setAccepting((sp as any).accepting_bookings ?? true);
    setAvailabilityNotes((sp as any).availability_notes ?? "");

    const [{ data: a }, { data: b }] = await Promise.all([
      supabase.from("staff_availability" as any).select("*").eq("staff_id", sp.id).order("weekday"),
      supabase.from("staff_blackouts" as any).select("*").eq("staff_id", sp.id).order("blackout_date"),
    ]);
    setBlocks(((a as any) || []).map((r: any) => ({ ...r, start_time: trimSec(r.start_time), end_time: trimSec(r.end_time) })));
    setBlackouts((b as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const blocksByDay = useMemo(() => {
    const map: Record<number, DayBlock[]> = {};
    DAYS.forEach((_, i) => (map[i] = []));
    blocks.forEach((b) => map[b.weekday].push(b));
    return map;
  }, [blocks]);

  const toggleDay = async (weekday: number) => {
    if (!staffId) return;
    if (blocksByDay[weekday].length > 0) {
      const ids = blocksByDay[weekday].map((b) => b.id).filter(Boolean) as string[];
      const { error } = await supabase.from("staff_availability" as any).delete().in("id", ids);
      if (error) return toast.error(error.message);
      setBlocks((prev) => prev.filter((b) => b.weekday !== weekday));
    } else {
      const { data, error } = await supabase
        .from("staff_availability" as any)
        .insert({ staff_id: staffId, weekday, start_time: "09:00", end_time: "17:00", is_recurring: true })
        .select()
        .single();
      if (error) return toast.error(error.message);
      setBlocks((prev) => [...prev, { ...(data as any), start_time: "09:00", end_time: "17:00" }]);
    }
  };

  const addRangeForDay = async (weekday: number) => {
    if (!staffId) return;
    const { data, error } = await supabase
      .from("staff_availability" as any)
      .insert({ staff_id: staffId, weekday, start_time: "09:00", end_time: "12:00", is_recurring: true })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setBlocks((prev) => [...prev, { ...(data as any), start_time: "09:00", end_time: "12:00" }]);
  };

  const updateBlock = async (id: string, patch: Partial<DayBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const persistBlock = async (block: DayBlock) => {
    if (!block.id) return;
    const { error } = await supabase
      .from("staff_availability" as any)
      .update({ start_time: block.start_time, end_time: block.end_time, notes: block.notes ?? null })
      .eq("id", block.id);
    if (error) toast.error(error.message);
  };

  const removeBlock = async (id?: string) => {
    if (!id) return;
    const { error } = await supabase.from("staff_availability" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const addBlackout = async () => {
    if (!staffId || !newBlackout.date) return toast.error("Pick a date");
    const { data, error } = await supabase
      .from("staff_blackouts" as any)
      .insert({ staff_id: staffId, blackout_date: newBlackout.date, reason: newBlackout.reason || null })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setBlackouts((prev) => [...prev, data as any].sort((a, b) => a.blackout_date.localeCompare(b.blackout_date)));
    setNewBlackout({ date: "", reason: "" });
    toast.success("Blackout added");
  };

  const removeBlackout = async (id?: string) => {
    if (!id) return;
    const { error } = await supabase.from("staff_blackouts" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    setBlackouts((prev) => prev.filter((b) => b.id !== id));
  };

  const saveProfileSettings = async () => {
    if (!staffId) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("staff_profiles")
      .update({ accepting_bookings: accepting, availability_notes: availabilityNotes || null })
      .eq("id", staffId);
    setSavingProfile(false);
    if (error) return toast.error(error.message);
    toast.success("Availability settings saved");
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground p-6">Loading availability…</div>;
  }

  return (
    <div className={embedded ? "space-y-6" : "space-y-6 max-w-5xl"}>
      {!embedded && (
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-primary mb-1">My Schedule</div>
          <h1 className="text-2xl md:text-3xl font-display uppercase tracking-tight text-cream">Availability</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set when you're available for shoots, interviews, and production assignments.
          </p>
        </div>
      )}

      {/* Accepting bookings + global notes */}
      <Card className="border-border/60 bg-[#080808]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-widest font-display flex items-center justify-between">
            <span>Booking Status</span>
            <Badge variant={accepting ? "default" : "outline"} className={accepting ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : ""}>
              {accepting ? "Accepting bookings" : "Not accepting"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-3 border border-border/40 rounded-sm">
            <div>
              <div className="text-sm font-medium">Accepting new bookings</div>
              <div className="text-xs text-muted-foreground">Turn off to pause assignments without erasing your schedule.</div>
            </div>
            <Switch checked={accepting} onCheckedChange={setAccepting} />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">
              Availability Notes
            </Label>
            <Textarea
              value={availabilityNotes}
              onChange={(e) => setAvailabilityNotes(e.target.value)}
              placeholder="e.g. Only available after class. Weekends preferred. Travel up to 30 miles."
              maxLength={500}
              rows={2}
            />
          </div>
          <Button onClick={saveProfileSettings} disabled={savingProfile} className="rounded-sm uppercase tracking-widest text-[10px] h-9">
            <Save className="h-3 w-3 mr-1" /> {savingProfile ? "Saving…" : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Weekly recurring schedule */}
      <Card className="border-border/60 bg-[#080808]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-widest font-display flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Weekly Recurring Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {DAYS.map((day, idx) => {
            const dayBlocks = blocksByDay[idx];
            const enabled = dayBlocks.length > 0;
            return (
              <div key={day} className="border border-border/40 rounded-sm p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Switch checked={enabled} onCheckedChange={() => toggleDay(idx)} />
                    <div className="font-display uppercase tracking-widest text-sm w-10">{day}</div>
                    {!enabled && <span className="text-xs text-muted-foreground">Unavailable</span>}
                  </div>
                  {enabled && (
                    <Button size="sm" variant="ghost" onClick={() => addRangeForDay(idx)} className="h-7 text-xs uppercase tracking-widest">
                      <Plus className="h-3 w-3 mr-1" /> Range
                    </Button>
                  )}
                </div>
                {enabled && (
                  <div className="space-y-2 pl-13">
                    {dayBlocks.map((b) => (
                      <div key={b.id} className="grid grid-cols-1 md:grid-cols-[110px_110px_1fr_auto] gap-2 items-center">
                        <Input
                          type="time"
                          value={b.start_time}
                          onChange={(e) => updateBlock(b.id!, { start_time: e.target.value })}
                          onBlur={() => persistBlock({ ...b })}
                          className="h-9"
                        />
                        <Input
                          type="time"
                          value={b.end_time}
                          onChange={(e) => updateBlock(b.id!, { end_time: e.target.value })}
                          onBlur={() => persistBlock({ ...b })}
                          className="h-9"
                        />
                        <Input
                          value={b.notes ?? ""}
                          placeholder="Notes (optional)"
                          maxLength={120}
                          onChange={(e) => updateBlock(b.id!, { notes: e.target.value })}
                          onBlur={() => persistBlock({ ...b, notes: b.notes })}
                          className="h-9"
                        />
                        <Button size="sm" variant="ghost" onClick={() => removeBlock(b.id)} className="h-9 text-muted-foreground hover:text-primary">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Blackout dates */}
      <Card className="border-border/60 bg-[#080808]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-widest font-display flex items-center gap-2">
            <CalendarOff className="h-4 w-4 text-primary" /> Unavailable Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_auto] gap-2">
            <Input type="date" value={newBlackout.date} onChange={(e) => setNewBlackout((p) => ({ ...p, date: e.target.value }))} />
            <Input
              value={newBlackout.reason}
              onChange={(e) => setNewBlackout((p) => ({ ...p, reason: e.target.value }))}
              placeholder="Reason (e.g. travel, class)"
              maxLength={120}
            />
            <Button onClick={addBlackout} className="rounded-sm uppercase tracking-widest text-[10px] h-9">
              <Plus className="h-3 w-3 mr-1" /> Add Date
            </Button>
          </div>
          {blackouts.length === 0 ? (
            <div className="text-xs text-muted-foreground border border-dashed border-border rounded-sm py-6 text-center">
              No blackout dates. Add specific days you can't work.
            </div>
          ) : (
            <div className="border border-border/40 rounded-sm divide-y divide-border/40">
              {blackouts.map((b) => (
                <div key={b.id} className="flex items-center gap-2 p-2.5 text-sm">
                  <div className="font-mono tabular-nums text-cream w-28">{b.blackout_date}</div>
                  <div className="flex-1 text-muted-foreground truncate">{b.reason || "—"}</div>
                  <Button size="sm" variant="ghost" onClick={() => removeBlackout(b.id)} className="h-7 text-muted-foreground hover:text-primary">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyAvailabilitySection;
