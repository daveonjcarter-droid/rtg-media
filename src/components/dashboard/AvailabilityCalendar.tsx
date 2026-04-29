// Drag-to-edit weekly availability + blackout dates per staff member.
// - Click & drag on the weekly grid to create a time block (15-min slots).
// - Click an existing block to remove it.
// - Manage blackout dates as a list.
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CalendarOff, Plus, Trash2, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Block = { id?: string; weekday: number; start_time: string; end_time: string };
type Blackout = { id?: string; blackout_date: string; reason: string | null };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// 15-min slots from 06:00 to 23:00 → (23-6)*4 = 68
const SLOT_MIN = 15;
const HOUR_START = 6;
const HOUR_END = 23;
const TOTAL_SLOTS = (HOUR_END - HOUR_START) * (60 / SLOT_MIN);

const slotToTime = (slot: number) => {
  const totalMin = HOUR_START * 60 + slot * SLOT_MIN;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
};
const timeToSlot = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return Math.round((h * 60 + m - HOUR_START * 60) / SLOT_MIN);
};

export const AvailabilityCalendar = ({
  staffId,
  staffName,
  open,
  onClose,
}: {
  staffId: string;
  staffName: string;
  open: boolean;
  onClose: () => void;
}) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [newBlackoutDate, setNewBlackoutDate] = useState("");
  const [newBlackoutReason, setNewBlackoutReason] = useState("");
  const [loading, setLoading] = useState(true);
  const dragRef = useRef<{ day: number; startSlot: number; mode: "add" | "remove" } | null>(null);
  const [dragHover, setDragHover] = useState<{ day: number; slot: number } | null>(null);

  const load = async () => {
    if (!staffId) return;
    setLoading(true);
    const [{ data: a }, { data: b }] = await Promise.all([
      supabase.from("staff_availability" as any).select("*").eq("staff_id", staffId),
      supabase.from("staff_blackouts" as any).select("*").eq("staff_id", staffId).order("blackout_date"),
    ]);
    setBlocks((a as any) || []);
    setBlackouts((b as any) || []);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); /* eslint-disable-next-line */ }, [staffId, open]);

  // Build a per-day slot occupancy map for quick rendering.
  const occupancy = useMemo(() => {
    const grid: boolean[][] = Array.from({ length: 7 }, () => Array(TOTAL_SLOTS).fill(false));
    blocks.forEach((b) => {
      const startSlot = Math.max(0, timeToSlot(b.start_time));
      const endSlot = Math.min(TOTAL_SLOTS, timeToSlot(b.end_time));
      for (let s = startSlot; s < endSlot; s++) grid[b.weekday][s] = true;
    });
    return grid;
  }, [blocks]);

  // Persist a new range or remove overlapping ranges
  const commitRange = async (day: number, startSlot: number, endSlot: number, mode: "add" | "remove") => {
    if (startSlot === endSlot) return;
    const a = Math.min(startSlot, endSlot);
    const b = Math.max(startSlot, endSlot) + 1;
    if (mode === "add") {
      const payload = {
        staff_id: staffId,
        weekday: day,
        start_time: slotToTime(a),
        end_time: slotToTime(b),
      };
      const { data, error } = await supabase.from("staff_availability" as any).insert(payload).select().single();
      if (error) return toast.error(error.message);
      setBlocks((prev) => [...prev, data as any]);
      toast.success(`Availability added · ${DAYS[day]}`);
    } else {
      // Remove blocks that overlap the selected range on this day.
      const overlapping = blocks.filter((bl) => {
        if (bl.weekday !== day) return false;
        const bs = timeToSlot(bl.start_time);
        const be = timeToSlot(bl.end_time);
        return bs < b && be > a;
      });
      if (overlapping.length === 0) return;
      const ids = overlapping.map((o) => o.id).filter(Boolean) as string[];
      const { error } = await supabase.from("staff_availability" as any).delete().in("id", ids);
      if (error) return toast.error(error.message);
      setBlocks((prev) => prev.filter((bl) => !ids.includes(bl.id as string)));
      toast.success(`Removed · ${DAYS[day]}`);
    }
  };

  const onPointerDown = (day: number, slot: number) => {
    const mode: "add" | "remove" = occupancy[day][slot] ? "remove" : "add";
    dragRef.current = { day, startSlot: slot, mode };
    setDragHover({ day, slot });
  };
  const onPointerEnter = (day: number, slot: number) => {
    if (!dragRef.current) return;
    if (dragRef.current.day !== day) return;
    setDragHover({ day, slot });
  };
  const onPointerUp = async () => {
    if (!dragRef.current || !dragHover) {
      dragRef.current = null;
      setDragHover(null);
      return;
    }
    const { day, startSlot, mode } = dragRef.current;
    await commitRange(day, startSlot, dragHover.slot, mode);
    dragRef.current = null;
    setDragHover(null);
  };

  const addBlackout = async () => {
    if (!newBlackoutDate) return toast.error("Pick a date");
    const payload = { staff_id: staffId, blackout_date: newBlackoutDate, reason: newBlackoutReason || null };
    const { data, error } = await supabase.from("staff_blackouts" as any).insert(payload).select().single();
    if (error) return toast.error(error.message);
    setBlackouts((prev) => [...prev, data as any].sort((a, b) => a.blackout_date.localeCompare(b.blackout_date)));
    setNewBlackoutDate("");
    setNewBlackoutReason("");
    toast.success("Blackout added");
  };

  const removeBlackout = async (id?: string) => {
    if (!id) return;
    const { error } = await supabase.from("staff_blackouts" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    setBlackouts((prev) => prev.filter((b) => b.id !== id));
  };

  // Hour rows for left axis
  const hourRows = useMemo(() => {
    const out: number[] = [];
    for (let h = HOUR_START; h < HOUR_END; h++) out.push(h);
    return out;
  }, []);

  // Compute selection rectangle while dragging
  const dragRange = (() => {
    if (!dragRef.current || !dragHover) return null;
    const day = dragRef.current.day;
    const a = Math.min(dragRef.current.startSlot, dragHover.slot);
    const b = Math.max(dragRef.current.startSlot, dragHover.slot);
    return { day, a, b };
  })();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-5 py-3 border-b border-border">
          <DialogTitle className="font-display uppercase tracking-widest text-base flex items-center justify-between">
            <span>Availability · {staffName}</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[80vh] p-4 space-y-5">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  Weekly recurring · click & drag to add or remove
                </div>
                <div
                  className="border border-border rounded-sm overflow-x-auto select-none"
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                >
                  <div className="grid min-w-[720px]" style={{ gridTemplateColumns: "60px repeat(7, minmax(0, 1fr))" }}>
                    {/* Header */}
                    <div className="bg-surface/60 border-b border-border h-7" />
                    {DAYS.map((d) => (
                      <div key={d} className="bg-surface/60 border-b border-l border-border h-7 flex items-center justify-center text-[10px] uppercase tracking-widest font-semibold">{d}</div>
                    ))}

                    {/* Hour rows: each hour spans 4 slots */}
                    {hourRows.map((h, hIndex) => (
                      <div key={h} className="contents">
                        <div className="border-t border-border text-[10px] text-muted-foreground tabular-nums px-1 py-0.5 bg-surface/30">
                          {String(h).padStart(2, "0")}:00
                        </div>
                        {DAYS.map((_, day) => {
                          // 4 slot cells per hour
                          return (
                            <div key={day} className="border-t border-l border-border relative" style={{ height: 36 }}>
                              {[0, 1, 2, 3].map((q) => {
                                const slot = hIndex * 4 + q;
                                const filled = occupancy[day][slot];
                                const inDrag = dragRange && dragRange.day === day && slot >= dragRange.a && slot <= dragRange.b;
                                const isAdd = dragRef.current?.mode === "add";
                                return (
                                  <button
                                    key={q}
                                    type="button"
                                    onPointerDown={() => onPointerDown(day, slot)}
                                    onPointerEnter={() => onPointerEnter(day, slot)}
                                    aria-label={`${DAYS[day]} ${slotToTime(slot)}`}
                                    className={[
                                      "absolute left-0 right-0 h-[9px] cursor-pointer transition-colors",
                                      q === 0 ? "top-0" : "",
                                      q === 1 ? "top-[9px]" : "",
                                      q === 2 ? "top-[18px]" : "",
                                      q === 3 ? "top-[27px]" : "",
                                      filled ? "bg-emerald-500/70 hover:bg-emerald-500/90" : "hover:bg-primary/15",
                                      inDrag ? (isAdd ? "bg-emerald-500/90" : "bg-destructive/70") : "",
                                      q < 3 ? "border-b border-border/30" : "",
                                    ].filter(Boolean).join(" ")}
                                  />
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-2">
                  Tip: click an empty slot and drag to add a block. Click a green block to delete its range.
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarOff className="h-3.5 w-3.5 text-primary" />
                  <div className="font-display text-base uppercase tracking-widest">Blackout dates</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_auto] gap-2 mb-3">
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Date</Label>
                    <Input type="date" value={newBlackoutDate} onChange={(e) => setNewBlackoutDate(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Reason (optional)</Label>
                    <Input value={newBlackoutReason} onChange={(e) => setNewBlackoutReason(e.target.value)} placeholder="Travel, vacation…" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addBlackout} className="rounded-sm uppercase tracking-widest text-[10px] h-9 w-full md:w-auto">
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>
                {blackouts.length === 0 ? (
                  <div className="text-xs text-muted-foreground border border-dashed border-border rounded-sm py-6 text-center">
                    No blackouts. Add dates the staff member is unavailable.
                  </div>
                ) : (
                  <div className="border border-border rounded-sm divide-y divide-border">
                    {blackouts.map((b) => (
                      <div key={b.id} className="flex items-center gap-2 p-2 text-xs">
                        <div className="font-mono text-foreground tabular-nums w-28">{b.blackout_date}</div>
                        <div className="flex-1 text-muted-foreground truncate">{b.reason || "—"}</div>
                        <Button size="sm" variant="ghost" onClick={() => removeBlackout(b.id)} className="h-7 text-muted-foreground hover:text-primary">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilityCalendar;
