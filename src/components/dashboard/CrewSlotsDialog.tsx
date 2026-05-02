import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Check, Circle } from "lucide-react";
import { CREW_PACKAGES, CREW_STATUS_LABELS, CREW_STATUS_STYLES, type CrewPackageId } from "@/lib/crewPackages";
import { getServiceSpec } from "@/lib/serviceTypes";
import { logActivity } from "@/lib/activity";

type Slot = {
  id: string;
  booking_id: string;
  staff_id: string | null;
  role_label: string;
  call_time: string | null;
  pay_rate: number | null;
  status: string;
  is_backup: boolean;
  notes: string | null;
  sort_order: number;
};

type Staff = {
  id: string; display_name: string; role_title: string | null;
  is_crew: boolean; hourly_rate: number | null; day_rate: number | null;
  accepting_bookings: boolean;
};

type Props = {
  bookingId: string;
  bookingName: string;
  crewRequestType: string | null;
  serviceType?: string | null;
  internalAssignmentLocked: boolean;
  onClose: () => void;
};

type Avail = { staff_id: string; weekday: number; start_time: string; end_time: string };

export const CrewSlotsDialog = ({ bookingId, bookingName, crewRequestType, serviceType, internalAssignmentLocked, onClose }: Props) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [availability, setAvailability] = useState<Avail[]>([]);
  const [bookingDate, setBookingDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(internalAssignmentLocked);

  // Returns 0-6 weekday for booking_date, or null if unknown
  const bookingWeekday = useMemo(() => {
    if (!bookingDate) return null;
    const d = new Date(`${bookingDate}T12:00:00`);
    return d.getDay();
  }, [bookingDate]);

  // staff_id -> "available" | "off" | "unknown"
  const availabilityMap = useMemo(() => {
    const m = new Map<string, "available" | "off" | "unknown">();
    if (bookingWeekday == null) {
      staff.forEach((s) => m.set(s.id, "unknown"));
      return m;
    }
    staff.forEach((s) => {
      const has = availability.some((a) => a.staff_id === s.id && a.weekday === bookingWeekday);
      m.set(s.id, has ? "available" : "off");
    });
    return m;
  }, [staff, availability, bookingWeekday]);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: st }, { data: bk }] = await Promise.all([
      supabase.from("crew_assignments").select("*").eq("booking_id", bookingId).order("sort_order"),
      supabase.from("staff_profiles").select("id,display_name,role_title,is_crew,hourly_rate,day_rate,accepting_bookings").order("display_name"),
      supabase.from("bookings").select("project_date").eq("id", bookingId).maybeSingle(),
    ]);
    setSlots((s as any) ?? []);
    setStaff((st as any) ?? []);
    setBookingDate((bk as any)?.project_date ?? null);
    // Load availability for the crew we have
    const ids = ((st as any) ?? []).map((x: any) => x.id);
    if (ids.length > 0) {
      const { data: av } = await supabase
        .from("staff_availability" as any)
        .select("staff_id,weekday,start_time,end_time")
        .in("staff_id", ids);
      setAvailability(((av as unknown) as Avail[]) ?? []);
    } else {
      setAvailability([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [bookingId]);

  const serviceSpec = getServiceSpec(serviceType);

  // Smart defaults: union of service-specific roles + package roles, deduped, service first.
  const suggestedSlotLabels = useMemo(() => {
    const fromService = serviceSpec?.defaultCrewSlots ?? [];
    const fromPkg = CREW_PACKAGES[crewRequestType as CrewPackageId]?.defaultSlots ?? [];
    const seen = new Set<string>();
    return [...fromService, ...fromPkg].filter((l) => {
      const k = l.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
  }, [serviceSpec, crewRequestType]);

  const populateFromPackage = async () => {
    if (suggestedSlotLabels.length === 0) return toast.error("No suggestions available");
    if (slots.length > 0) {
      if (!confirm("Replace existing slots with the suggested defaults?")) return;
      await supabase.from("crew_assignments").delete().eq("booking_id", bookingId);
    }
    const rows = suggestedSlotLabels.map((label, i) => ({
      booking_id: bookingId, role_label: label, sort_order: i, status: "pending",
    }));
    const { error } = await supabase.from("crew_assignments").insert(rows as any);
    if (error) return toast.error(error.message);
    toast.success(`Created ${rows.length} crew slots`);
    load();
  };

  const addSlot = async () => {
    const { error } = await supabase.from("crew_assignments").insert({
      booking_id: bookingId, role_label: "Crew", sort_order: slots.length, status: "pending",
    } as any);
    if (error) return toast.error(error.message);
    load();
  };

  const updateSlot = async (id: string, patch: Partial<Slot>) => {
    const { error } = await supabase.from("crew_assignments").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    setSlots((rows) => rows.map((r) => r.id === id ? { ...r, ...patch } : r));

    // Activity log on meaningful changes
    if (patch.staff_id !== undefined && patch.staff_id) {
      const member = staff.find((s) => s.id === patch.staff_id);
      const slot = slots.find((s) => s.id === id);
      logActivity({
        kind: "booking_received",
        title: `Assigned ${member?.display_name ?? "crew"} → ${bookingName}`,
        detail: `Role: ${slot?.role_label ?? "Crew"}${bookingDate ? ` · ${bookingDate}` : ""}`,
        meta: { booking_id: bookingId, staff_id: patch.staff_id, slot_id: id },
      });
    }
    if (patch.status) {
      logActivity({
        kind: "booking_received",
        title: `Crew status → ${patch.status} · ${bookingName}`,
        meta: { booking_id: bookingId, slot_id: id, status: patch.status },
      });
    }
  };

  const removeSlot = async (id: string) => {
    if (!confirm("Remove this crew slot?")) return;
    const { error } = await supabase.from("crew_assignments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Slot removed");
    load();
  };

  const toggleLock = async (val: boolean) => {
    const { error } = await supabase.from("bookings").update({ internal_assignment_locked: val }).eq("id", bookingId);
    if (error) return toast.error(error.message);
    setLocked(val);
    toast.success(val ? "Locked from client edits" : "Unlocked");
  };

  const pkg = crewRequestType ? CREW_PACKAGES[crewRequestType as CrewPackageId] : null;

  // Crew sorted: available first, then off, then non-accepting at end
  const sortedCrew = useMemo(() => {
    const crew = staff.filter((s) => s.is_crew);
    return [...crew].sort((a, b) => {
      const sa = availabilityMap.get(a.id) ?? "unknown";
      const sb = availabilityMap.get(b.id) ?? "unknown";
      const score = (s: Staff, st: string) =>
        (s.accepting_bookings ? 0 : 10) + (st === "available" ? 0 : st === "unknown" ? 1 : 2);
      return score(a, sa) - score(b, sb);
    });
  }, [staff, availabilityMap]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crew Assignment — {bookingName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header info */}
          <div className="border border-border/60 rounded-lg p-3 bg-surface/30 space-y-2">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                {serviceSpec && (
                  <>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Service type</div>
                    <div className="font-display text-lg flex items-center gap-2">
                      <serviceSpec.icon className="h-4 w-4 text-primary" />
                      {serviceSpec.label}
                    </div>
                  </>
                )}
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Client requested package</div>
                <div className="font-display text-base">{pkg?.label ?? "—"}</div>
                {pkg && <div className="text-xs text-muted-foreground">{pkg.scale} · {pkg.qualityLabel} · +${pkg.priceModifier} crew fee</div>}
                {bookingDate && (
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Project date: <span className="text-cream">{bookingDate}</span>
                    <span className="ml-2 text-muted-foreground/70">
                      · Crew availability filtered by this date
                    </span>
                  </div>
                )}
                {!bookingDate && (
                  <div className="text-[11px] text-gold mt-1">
                    No project date set — availability filter unavailable.
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 text-xs">
                <span>Locked from client edits</span>
                <Switch checked={locked} onCheckedChange={toggleLock} />
              </label>
            </div>
            {suggestedSlotLabels.length > 0 && (
              <Button size="sm" variant="outline" onClick={populateFromPackage}>
                {slots.length === 0
                  ? `Create ${suggestedSlotLabels.length} suggested slots${serviceSpec ? ` for ${serviceSpec.label}` : ""}`
                  : "Reset slots from suggestions"}
              </Button>
            )}
          </div>

          {/* Slots */}
          {loading ? <p className="text-sm text-muted-foreground">Loading slots…</p> : (
            <div className="space-y-2">
              {slots.length === 0 ? (
                <div className="text-sm text-muted-foreground border border-dashed border-border/60 rounded p-6 text-center">
                  No crew slots yet. Create from package or add manually.
                </div>
              ) : slots.map((slot) => {
                const assigned = staff.find((s) => s.id === slot.staff_id);
                const assignedAvail = assigned ? availabilityMap.get(assigned.id) : null;
                return (
                  <div key={slot.id} className="border border-border/60 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2 flex-wrap">
                      <GripVertical className="size-4 text-muted-foreground mt-2" />
                      <div className="flex-1 grid md:grid-cols-2 gap-2 min-w-[240px]">
                        <div>
                          <Label className="text-[10px]">Role</Label>
                          <Input value={slot.role_label} onChange={(e) => setSlots((r) => r.map((x) => x.id === slot.id ? { ...x, role_label: e.target.value } : x))} onBlur={(e) => updateSlot(slot.id, { role_label: e.target.value })} className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px] flex items-center gap-1.5">
                            Crew Member
                            {assigned && assignedAvail === "off" && (
                              <span className="text-[9px] uppercase tracking-widest text-primary">⚠ Off this day</span>
                            )}
                            {assigned && assignedAvail === "available" && (
                              <span className="text-[9px] uppercase tracking-widest text-emerald-400">✓ Available</span>
                            )}
                            {assigned && !assigned.accepting_bookings && (
                              <span className="text-[9px] uppercase tracking-widest text-gold">Not accepting</span>
                            )}
                          </Label>
                          <Select value={slot.staff_id ?? "none"} onValueChange={(v) => updateSlot(slot.id, { staff_id: v === "none" ? null : v })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">— Unassigned —</SelectItem>
                              {sortedCrew.map((s) => {
                                const st = availabilityMap.get(s.id) ?? "unknown";
                                const dot =
                                  !s.accepting_bookings ? "bg-muted-foreground" :
                                  st === "available" ? "bg-emerald-400" :
                                  st === "off" ? "bg-primary/70" :
                                  "bg-muted-foreground";
                                const tag =
                                  !s.accepting_bookings ? "(not accepting)" :
                                  st === "available" ? "(available)" :
                                  st === "off" ? "(off this day)" : "";
                                return (
                                  <SelectItem key={s.id} value={s.id}>
                                    <span className="inline-flex items-center gap-2">
                                      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                                      <span>{s.display_name}{s.role_title ? ` · ${s.role_title}` : ""}</span>
                                      <span className="text-muted-foreground text-[10px]">{tag}</span>
                                    </span>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[10px]">Call Time</Label>
                          <Input type="time" value={slot.call_time ?? ""} onChange={(e) => updateSlot(slot.id, { call_time: e.target.value || null })} className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px]">Pay Rate ($)</Label>
                          <Input type="number" value={slot.pay_rate ?? ""} placeholder={assigned?.day_rate ? `Default $${assigned.day_rate}` : ""} onChange={(e) => updateSlot(slot.id, { pay_rate: e.target.value ? Number(e.target.value) : null })} className="h-8 text-xs" />
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeSlot(slot.id)}><Trash2 className="size-3.5 text-destructive" /></Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <Select value={slot.status} onValueChange={(v) => updateSlot(slot.id, { status: v })}>
                        <SelectTrigger className="h-7 text-[11px] w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(CREW_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Badge variant="outline" className={`text-[10px] ${CREW_STATUS_STYLES[slot.status as keyof typeof CREW_STATUS_STYLES] ?? ""}`}>
                        {CREW_STATUS_LABELS[slot.status as keyof typeof CREW_STATUS_LABELS] ?? slot.status}
                      </Badge>
                      <label className="flex items-center gap-1.5 text-[11px] ml-auto">
                        <Switch checked={slot.is_backup} onCheckedChange={(v) => updateSlot(slot.id, { is_backup: v })} />
                        Backup
                      </label>
                    </div>
                    <Input placeholder="Notes for this slot…" value={slot.notes ?? ""} onChange={(e) => setSlots((r) => r.map((x) => x.id === slot.id ? { ...x, notes: e.target.value } : x))} onBlur={(e) => updateSlot(slot.id, { notes: e.target.value })} className="h-8 text-xs" />
                  </div>
                );
              })}
            </div>
          )}

          <Button onClick={addSlot} variant="outline" className="w-full gap-1"><Plus className="size-4" /> Add Crew Slot</Button>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground border-t border-border/40 pt-3">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Available</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary/70" /> Off this day</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> Not accepting</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
