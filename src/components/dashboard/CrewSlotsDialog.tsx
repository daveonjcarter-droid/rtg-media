import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { CREW_PACKAGES, CREW_STATUS_LABELS, CREW_STATUS_STYLES, type CrewPackageId } from "@/lib/crewPackages";

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

type Staff = { id: string; display_name: string; role_title: string | null; is_crew: boolean; hourly_rate: number | null; day_rate: number | null };

type Props = {
  bookingId: string;
  bookingName: string;
  crewRequestType: string | null;
  internalAssignmentLocked: boolean;
  onClose: () => void;
};

export const CrewSlotsDialog = ({ bookingId, bookingName, crewRequestType, internalAssignmentLocked, onClose }: Props) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(internalAssignmentLocked);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: st }] = await Promise.all([
      supabase.from("crew_assignments").select("*").eq("booking_id", bookingId).order("sort_order"),
      supabase.from("staff_profiles").select("id,display_name,role_title,is_crew,hourly_rate,day_rate").order("display_name"),
    ]);
    setSlots((s as any) ?? []);
    setStaff((st as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [bookingId]);

  const populateFromPackage = async () => {
    const pkg = CREW_PACKAGES[crewRequestType as CrewPackageId];
    if (!pkg) return toast.error("No crew package on this booking");
    if (slots.length > 0) {
      if (!confirm("Replace existing slots with the package defaults?")) return;
      await supabase.from("crew_assignments").delete().eq("booking_id", bookingId);
    }
    const rows = pkg.defaultSlots.map((label, i) => ({
      booking_id: bookingId,
      role_label: label,
      sort_order: i,
      status: "pending",
    }));
    const { error } = await supabase.from("crew_assignments").insert(rows as any);
    if (error) return toast.error(error.message);
    toast.success(`Created ${rows.length} crew slots from ${pkg.label}`);
    load();
  };

  const addSlot = async () => {
    const { error } = await supabase.from("crew_assignments").insert({
      booking_id: bookingId,
      role_label: "Crew",
      sort_order: slots.length,
      status: "pending",
    } as any);
    if (error) return toast.error(error.message);
    load();
  };

  const updateSlot = async (id: string, patch: Partial<Slot>) => {
    const { error } = await supabase.from("crew_assignments").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    setSlots((rows) => rows.map((r) => r.id === id ? { ...r, ...patch } : r));
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
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Client requested package</div>
                <div className="font-display text-lg">{pkg?.label ?? "—"}</div>
                {pkg && <div className="text-xs text-muted-foreground">{pkg.scale} · {pkg.qualityLabel} · +${pkg.priceModifier} crew fee</div>}
              </div>
              <label className="flex items-center gap-2 text-xs">
                <span>Locked from client edits</span>
                <Switch checked={locked} onCheckedChange={toggleLock} />
              </label>
            </div>
            {pkg && (
              <Button size="sm" variant="outline" onClick={populateFromPackage}>
                {slots.length === 0 ? `Create ${pkg.defaultSlots.length} slots from ${pkg.label}` : "Reset slots from package"}
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
                          <Label className="text-[10px]">Crew Member</Label>
                          <Select value={slot.staff_id ?? "none"} onValueChange={(v) => updateSlot(slot.id, { staff_id: v === "none" ? null : v })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">— Unassigned —</SelectItem>
                              {staff.filter((s) => s.is_crew).map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.display_name}{s.role_title ? ` · ${s.role_title}` : ""}</SelectItem>
                              ))}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
