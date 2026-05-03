// Notifications bell — pulls last 12 entries from activity_log with realtime updates
// and supports inline actions: approve/view bookings, view/publish articles,
// mark contacted/archive leads. Each action writes back to the relevant table
// AND logs a follow-up activity row.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Activity, Briefcase, Mail, FileText, Send, Calendar as CalIcon,
  Image as ImageIcon, Check, Eye, Archive as ArchiveIcon, MessageCircle, Loader2,
  UserPlus, ChevronDown,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { fmtRelative } from "@/lib/dateUtils";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

type Row = {
  id: string;
  kind: string;
  title: string;
  detail: string | null;
  actor_name: string | null;
  link_url: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  article_published: Send, article_drafted: FileText, article_scheduled: CalIcon,
  social_scheduled: CalIcon, social_posted: Send,
  booking_received: Briefcase, booking_approved: Check, booking_assigned: UserPlus,
  booking_completed: Check, booking_canceled: ArchiveIcon,
  crew_assigned: UserPlus, crew_accepted: Check, crew_declined: ArchiveIcon,
  lead_captured: Mail, inquiry_received: Mail, media_uploaded: ImageIcon,
};

const KIND_TO_SECTION: Record<string, string> = {
  article_published: "published", article_drafted: "drafts", article_scheduled: "scheduled",
  social_scheduled: "social", social_posted: "social",
  booking_received: "bookings", booking_approved: "bookings", booking_assigned: "bookings",
  booking_completed: "bookings", booking_canceled: "bookings",
  crew_assigned: "bookings", crew_accepted: "bookings", crew_declined: "bookings",
  lead_captured: "leads", inquiry_received: "leads", media_uploaded: "media",
};

export const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignFor, setAssignFor] = useState<string | null>(null); // notification row id
  const [assignCandidates, setAssignCandidates] = useState<{ id: string; name: string; role: string | null; status: "available" | "off" | "unknown"; accepting: boolean }[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await supabase
      .from("activity_log")
      .select("id, kind, title, detail, actor_name, link_url, meta, created_at")
      .order("created_at", { ascending: false })
      .limit(12);
    setRows((data as Row[]) ?? []);
    const lastSeen = localStorage.getItem("rtg.notif.lastSeen");
    const lastSeenTs = lastSeen ? new Date(lastSeen).getTime() : 0;
    const u = (data ?? []).filter((r: any) => new Date(r.created_at).getTime() > lastSeenTs).length;
    setUnread(u);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useRealtimeTable("activity_log", load, { event: "INSERT" });

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (v) {
      localStorage.setItem("rtg.notif.lastSeen", new Date().toISOString());
      setUnread(0);
    }
  };

  const navigateTo = (r: Row) => {
    setOpen(false);
    if (r.link_url) {
      window.open(r.link_url, "_blank");
      return;
    }
    const sec = KIND_TO_SECTION[r.kind] ?? "overview";
    navigate(`/dashboard/${sec}`);
  };

  // Extract the related entity id from meta.id or link_url heuristics.
  const entityIdFor = (r: Row): string | null => {
    if (r.meta && typeof r.meta === "object") {
      const m = r.meta as Record<string, unknown>;
      if (typeof m.id === "string") return m.id;
      if (typeof m.booking_id === "string") return m.booking_id;
      if (typeof m.article_id === "string") return m.article_id;
      if (typeof m.lead_id === "string") return m.lead_id;
    }
    return null;
  };

  const cleanTitle = (t: string) => t.replace(/^(Approved|Assigned|Quick-assigned):?\s*/i, "").trim();

  const approveBooking = async (r: Row) => {
    const id = entityIdFor(r);
    if (!id) return navigateTo(r);
    setBusy(r.id);
    const { error } = await supabase.from("bookings").update({ status: "booked" }).eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Booking confirmed");
    await logActivity({
      kind: "booking_approved",
      title: cleanTitle(r.title),
      detail: "Approved from notifications",
      meta: { booking_id: id },
    });
    load();
  };

  const publishArticle = async (r: Row) => {
    const id = entityIdFor(r);
    if (!id) return navigateTo(r);
    setBusy(r.id);
    const { error } = await supabase
      .from("articles")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Article published");
    await logActivity({ kind: "article_published", title: `Published: ${r.title}`, detail: "Published from notifications", meta: { id } });
    load();
  };

  const markLeadContacted = async (r: Row) => {
    const id = entityIdFor(r);
    if (!id) return navigateTo(r);
    setBusy(r.id);
    const { error } = await supabase
      .from("leads")
      .update({ notes: `${(r.meta as any)?.notes ?? ""}\n[Contacted ${new Date().toLocaleDateString()}]`.trim() })
      .eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Marked as contacted");
    load();
  };

  const archiveLead = async (r: Row) => {
    const id = entityIdFor(r);
    if (!id) return navigateTo(r);
    setBusy(r.id);
    const { error } = await supabase.from("leads").update({ archived: true }).eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Lead archived");
    load();
  };

  // Mini-assign: load top 3 available crew for a booking's date
  const openMiniAssign = async (r: Row) => {
    const bookingId = entityIdFor(r);
    if (!bookingId) return;
    if (assignFor === r.id) { setAssignFor(null); return; }
    setAssignFor(r.id);
    setAssignLoading(true);
    setAssignCandidates([]);
    const [{ data: bk }, { data: staff }] = await Promise.all([
      supabase.from("bookings").select("project_date").eq("id", bookingId).maybeSingle(),
      supabase.from("staff_profiles").select("id,display_name,role_title,is_crew,accepting_bookings").eq("is_crew", true).order("display_name"),
    ]);
    const ids = ((staff as any) ?? []).map((s: any) => s.id);
    let weekday: number | null = null;
    const date = (bk as any)?.project_date as string | null;
    if (date) weekday = new Date(`${date}T12:00:00`).getDay();
    let avail: { staff_id: string; weekday: number }[] = [];
    if (ids.length && weekday !== null) {
      const { data: av } = await supabase
        .from("staff_availability" as any)
        .select("staff_id,weekday")
        .in("staff_id", ids)
        .eq("weekday", weekday);
      avail = ((av as any) ?? []) as typeof avail;
    }
    const candidates = ((staff as any) ?? []).map((s: any) => {
      const status: "available" | "off" | "unknown" =
        weekday === null ? "unknown" : avail.some((a) => a.staff_id === s.id) ? "available" : "off";
      return { id: s.id, name: s.display_name, role: s.role_title, status, accepting: !!s.accepting_bookings };
    });
    // Sort: available + accepting first, then unknown, then off; non-accepting last
    candidates.sort((a: any, b: any) => {
      const score = (c: any) => (c.accepting ? 0 : 10) + (c.status === "available" ? 0 : c.status === "unknown" ? 1 : 2);
      return score(a) - score(b);
    });
    setAssignCandidates(candidates.slice(0, 3));
    setAssignLoading(false);
  };

  const assignCrew = async (r: Row, staffId: string, staffName: string) => {
    const bookingId = entityIdFor(r);
    if (!bookingId) return;
    setBusy(r.id);
    const { error } = await supabase
      .from("bookings")
      .update({ assigned_staff_id: staffId, assignment_status: "assigned" })
      .eq("id", bookingId);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Assigned ${staffName}`);
    await logActivity({
      kind: "booking_assigned",
      title: cleanTitle(r.title),
      detail: `Assigned ${staffName}`,
      meta: { booking_id: bookingId, staff_id: staffId, source: "notifications" },
    });
    setAssignFor(null);
    load();
  };

  const renderActions = (r: Row) => {
    const isBusy = busy === r.id;
    if (isBusy) {
      return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
    }
    if (r.kind === "booking_received" || r.kind === "booking_approved" || r.kind === "booking_assigned") {
      const expanded = assignFor === r.id;
      const showApprove = r.kind === "booking_received";
      return (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-1.5">
            {showApprove && <ActionBtn onClick={(e) => { e.stopPropagation(); approveBooking(r); }} icon={Check} label="Approve" tone="green" />}
            <ActionBtn onClick={(e) => { e.stopPropagation(); openMiniAssign(r); }} icon={UserPlus} label={expanded ? "Hide" : "Assign"} tone="blue" />
            <ActionBtn onClick={(e) => { e.stopPropagation(); navigateTo(r); }} icon={Eye} label="View" tone="gray" />
          </div>
          {expanded && (
            <div className="border border-border/60 rounded-sm bg-surface/40 p-2 space-y-1">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground px-1">
                Top crew {assignLoading ? "· loading…" : "for this date"}
              </div>
              {assignLoading ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground mx-auto my-2" />
              ) : assignCandidates.length === 0 ? (
                <div className="text-[10px] text-muted-foreground px-1 py-1">No crew available.</div>
              ) : (
                assignCandidates.map((c) => {
                  const dot =
                    !c.accepting ? "bg-muted-foreground" :
                    c.status === "available" ? "bg-emerald-400" :
                    c.status === "off" ? "bg-primary/70" :
                    "bg-muted-foreground";
                  const tag =
                    !c.accepting ? "Not accepting" :
                    c.status === "available" ? "Available" :
                    c.status === "off" ? "Off this day" : "Unknown";
                  return (
                    <button
                      key={c.id}
                      onClick={(e) => { e.stopPropagation(); assignCrew(r, c.id, c.name); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-surface/80 transition-colors text-left"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[11px] text-cream truncate">{c.name}</span>
                        <span className="block text-[9px] uppercase tracking-widest text-muted-foreground">
                          {c.role || "Crew"} · {tag}
                        </span>
                      </span>
                      <Check className="h-3 w-3 text-muted-foreground shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      );
    }
    if (r.kind === "article_drafted" || r.kind === "article_scheduled") {
      return (
        <div className="flex items-center gap-1.5 mt-2">
          <ActionBtn onClick={(e) => { e.stopPropagation(); publishArticle(r); }} icon={Send} label="Publish" tone="green" />
          <ActionBtn onClick={(e) => { e.stopPropagation(); navigateTo(r); }} icon={Eye} label="View" tone="gray" />
        </div>
      );
    }
    if (r.kind === "lead_captured" || r.kind === "inquiry_received") {
      return (
        <div className="flex items-center gap-1.5 mt-2">
          <ActionBtn onClick={(e) => { e.stopPropagation(); markLeadContacted(r); }} icon={MessageCircle} label="Contacted" tone="blue" />
          <ActionBtn onClick={(e) => { e.stopPropagation(); archiveLead(r); }} icon={ArchiveIcon} label="Archive" tone="gray" />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 mt-2">
        <ActionBtn onClick={(e) => { e.stopPropagation(); navigateTo(r); }} icon={Eye} label="View" tone="gray" />
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative h-8 w-8 rounded-sm border border-border hover:border-foreground/40 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center border border-background animate-in zoom-in">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 bg-[#080808] border-border">
        <div className="px-4 h-11 border-b border-border flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Notifications</div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Live · {rows.length}</div>
        </div>
        <div className="max-h-[460px] overflow-y-auto">
          {loading ? (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 mx-auto mb-2 animate-spin opacity-60" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              <Activity className="h-5 w-5 mx-auto mb-2 opacity-40" />
              <div className="font-display uppercase text-cream text-sm mb-1">All caught up</div>
              <div>Notifications will appear here as your team works.</div>
            </div>
          ) : (
            rows.map((r) => {
              const Icon = KIND_ICON[r.kind] ?? Activity;
              return (
                <div
                  key={r.id}
                  className="flex gap-3 px-4 py-2.5 border-b border-border/40 last:border-0 hover:bg-surface/30 transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {r.kind.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs text-cream truncate mt-0.5">{r.title}</div>
                    <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                      {fmtRelative(r.created_at)}
                      {r.actor_name && <span className="opacity-60"> · {r.actor_name}</span>}
                    </div>
                    {renderActions(r)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ActionBtn = ({
  onClick, icon: Icon, label, tone,
}: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: "green" | "blue" | "gray" | "red";
}) => {
  const cls =
    tone === "green" ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" :
    tone === "blue" ? "border-sky-500/30 text-sky-400 hover:bg-sky-500/10" :
    tone === "red" ? "border-primary/30 text-primary hover:bg-primary/10" :
    "border-border text-muted-foreground hover:text-cream hover:border-foreground/40";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 h-6 px-2 rounded-sm border text-[10px] uppercase tracking-widest transition-colors ${cls}`}
    >
      <Icon className="h-2.5 w-2.5" /> {label}
    </button>
  );
};

export default NotificationsBell;
