import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Star, Mail, ExternalLink, FileText, Loader2, Filter, AlertTriangle } from "lucide-react";
import { ROLE_LABELS } from "@/lib/permissions";
import type { AppRole } from "@/contexts/AuthContext";

type AppStatus = "new" | "strong" | "needs_review" | "rejected" | "approved" | "invited";
type Priority = "low" | "normal" | "high";
type Experience = "none" | "beginner" | "intermediate" | "professional";

type Application = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  role_applying_for: string;
  portfolio_url: string;
  instagram_url: string | null;
  linkedin_url: string | null;
  why_join: string;
  experience: string;
  availability: string;
  experience_level: Experience | null;
  resume_path: string | null;
  resume_filename: string | null;
  status: AppStatus;
  priority: Priority;
  is_low_priority: boolean;
  completeness_score: number;
  internal_notes: string | null;
  created_at: string;
  invited_at: string | null;
  invite_id: string | null;
};

const TABS: { id: AppStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "strong", label: "Strong Candidates" },
  { id: "needs_review", label: "Needs Review" },
  { id: "rejected", label: "Rejected" },
  { id: "approved", label: "Approved" },
  { id: "invited", label: "Invited" },
];

const STATUS_COLOR: Record<AppStatus, string> = {
  new: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  strong: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  needs_review: "bg-gold/15 text-gold border-gold/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  approved: "bg-primary/15 text-primary border-primary/30",
  invited: "bg-cream/15 text-cream border-cream/30",
};

const STAFF_ROLE_OPTIONS: AppRole[] = [
  "head_admin","admin","editor","writer","social_manager","booking_manager",
  "media_manager","social_articles_lead",
];
const CREW_ROLE_OPTIONS: AppRole[] = [
  "crew","photographer","videographer","video_editor","director","producer",
  "audio_engineer","grip_lighting","makeup_artist","production_assistant","studio_staff",
];

export default function ApplicantsManager() {
  const [tab, setTab] = useState<AppStatus>("new");
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);

  // Filters
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterExperience, setFilterExperience] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all"); // all | 7d | 30d
  const [filterPortfolio, setFilterPortfolio] = useState<string>("all"); // all | yes

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("applications" as any)
      .select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setApps((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (a.status !== tab) return false;
      if (filterRole !== "all" && a.role_applying_for !== filterRole) return false;
      if (filterCity && !a.city.toLowerCase().includes(filterCity.toLowerCase())) return false;
      if (filterExperience !== "all" && a.experience_level !== filterExperience) return false;
      if (filterPortfolio === "yes" && !a.portfolio_url) return false;
      if (filterDate !== "all") {
        const days = filterDate === "7d" ? 7 : 30;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        if (new Date(a.created_at).getTime() < cutoff) return false;
      }
      return true;
    });
  }, [apps, tab, filterRole, filterCity, filterExperience, filterDate, filterPortfolio]);

  const counts = useMemo(() => {
    const c: Record<AppStatus, number> = { new: 0, strong: 0, needs_review: 0, rejected: 0, approved: 0, invited: 0 };
    for (const a of apps) c[a.status]++;
    return c;
  }, [apps]);

  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    apps.forEach((a) => a.role_applying_for && set.add(a.role_applying_for));
    return Array.from(set).sort();
  }, [apps]);

  const setStatus = async (id: string, status: AppStatus) => {
    const { error } = await supabase.from("applications" as any).update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked as ${status.replace("_", " ")}`);
    load();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const setPriority = async (id: string, priority: Priority) => {
    const { error } = await supabase.from("applications" as any).update({ priority }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
    if (selected?.id === id) setSelected({ ...selected, priority });
  };

  const saveNotes = async (id: string, internal_notes: string) => {
    const { error } = await supabase.from("applications" as any).update({ internal_notes }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Notes saved");
    if (selected?.id === id) setSelected({ ...selected, internal_notes });
  };

  const openResume = async (path: string) => {
    const { data, error } = await supabase.storage.from("applications").createSignedUrl(path, 60 * 5);
    if (error || !data?.signedUrl) return toast.error(error?.message || "Could not load file");
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-5 pb-3 border-b border-border">
        <div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Public applications</div>
          <h2 className="font-display text-xl md:text-2xl uppercase leading-none">Applicants</h2>
        </div>
        <div className="text-xs text-muted-foreground">{apps.length} total</div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-widest border transition-colors ${
              tab === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label} <span className="opacity-60">({counts[t.id]})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="h-9 rounded-sm text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roleOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Filter city…" value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="h-9 rounded-sm text-xs" />
        <Select value={filterExperience} onValueChange={setFilterExperience}>
          <SelectTrigger className="h-9 rounded-sm text-xs"><SelectValue placeholder="Experience" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All experience</SelectItem>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPortfolio} onValueChange={setFilterPortfolio}>
          <SelectTrigger className="h-9 rounded-sm text-xs"><SelectValue placeholder="Portfolio" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Portfolio: any</SelectItem>
            <SelectItem value="yes">Portfolio provided</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDate} onValueChange={setFilterDate}>
          <SelectTrigger className="h-9 rounded-sm text-xs"><SelectValue placeholder="Date" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No applications in this tab.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className="w-full text-left p-4 hover:bg-surface/40 transition-colors block"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-display uppercase">{a.full_name}</span>
                      <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 border rounded-sm ${STATUS_COLOR[a.status]}`}>
                        {a.status.replace("_", " ")}
                      </span>
                      {a.priority === "high" && <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-primary/40 text-primary rounded-sm">High priority</span>}
                      {a.is_low_priority && <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-border text-muted-foreground rounded-sm">Low priority</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.role_applying_for} · {a.city} · {a.email}
                    </div>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">
                    {new Date(a.created_at).toLocaleDateString()} · score {a.completeness_score}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <ApplicantDetail
              app={selected}
              onClose={() => setSelected(null)}
              onStatus={(s) => setStatus(selected.id, s)}
              onPriority={(p) => setPriority(selected.id, p)}
              onNotes={(n) => saveNotes(selected.id, n)}
              onApproveInvite={() => setApproveOpen(true)}
              onOpenResume={openResume}
            />
          )}
        </DialogContent>
      </Dialog>

      <ApproveInviteDialog
        open={approveOpen}
        application={selected}
        onClose={() => setApproveOpen(false)}
        onSuccess={() => { setApproveOpen(false); setSelected(null); load(); }}
      />
    </div>
  );
}

function ApplicantDetail({ app, onClose, onStatus, onPriority, onNotes, onApproveInvite, onOpenResume }: {
  app: Application;
  onClose: () => void;
  onStatus: (s: AppStatus) => void;
  onPriority: (p: Priority) => void;
  onNotes: (n: string) => void;
  onApproveInvite: () => void;
  onOpenResume: (path: string) => void;
}) {
  const [notes, setNotes] = useState(app.internal_notes ?? "");

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display uppercase">{app.full_name}</DialogTitle>
        <div className="text-xs text-muted-foreground">{app.role_applying_for} · {app.city}</div>
      </DialogHeader>

      <div className="space-y-5 text-sm">
        <Section label="Contact">
          <div>{app.email} · {app.phone}</div>
        </Section>

        <Section label="Links">
          <div className="space-y-1">
            <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline"><ExternalLink className="h-3 w-3" /> Portfolio</a>
            {app.instagram_url && <a href={app.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline"><ExternalLink className="h-3 w-3" /> Instagram</a>}
            {app.linkedin_url && <a href={app.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline"><ExternalLink className="h-3 w-3" /> LinkedIn</a>}
            {app.resume_path && (
              <button onClick={() => onOpenResume(app.resume_path!)} className="flex items-center gap-1.5 text-primary hover:underline">
                <FileText className="h-3 w-3" /> {app.resume_filename || "Resume"}
              </button>
            )}
          </div>
        </Section>

        <Section label="Why join RTG"><p className="whitespace-pre-wrap text-muted-foreground">{app.why_join}</p></Section>
        <Section label="Experience"><p className="whitespace-pre-wrap text-muted-foreground">{app.experience}</p></Section>
        <Section label="Availability"><p className="whitespace-pre-wrap text-muted-foreground">{app.availability}</p></Section>

        <Section label="Internal notes">
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-sm" />
          <Button size="sm" variant="outline" className="mt-2 rounded-sm uppercase tracking-widest text-[10px] h-8" onClick={() => onNotes(notes)}>Save notes</Button>
        </Section>

        <Section label="Priority">
          <div className="flex gap-2">
            {(["low","normal","high"] as Priority[]).map((p) => (
              <button key={p} onClick={() => onPriority(p)}
                className={`px-3 py-1.5 rounded-sm text-[10px] uppercase tracking-widest border ${
                  app.priority === p ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >{p}</button>
            ))}
          </div>
        </Section>
      </div>

      <DialogFooter className="flex-wrap gap-2 mt-4">
        <Button variant="outline" size="sm" className="rounded-sm uppercase tracking-widest text-[10px]" onClick={() => onStatus("strong")}><Star className="h-3 w-3 mr-1" /> Mark Strong</Button>
        <Button variant="outline" size="sm" className="rounded-sm uppercase tracking-widest text-[10px]" onClick={() => onStatus("needs_review")}><AlertTriangle className="h-3 w-3 mr-1" /> Needs Review</Button>
        <Button variant="outline" size="sm" className="rounded-sm uppercase tracking-widest text-[10px] text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => onStatus("rejected")}><XCircle className="h-3 w-3 mr-1" /> Reject</Button>
        <Button size="sm" className="rounded-sm uppercase tracking-widest text-[10px] bg-primary text-primary-foreground hover:bg-primary/90" onClick={onApproveInvite}>
          <CheckCircle2 className="h-3 w-3 mr-1" /> Approve & Send Invite
        </Button>
      </DialogFooter>
    </>
  );
}

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-1.5">{label}</div>
    <div>{children}</div>
  </div>
);

function ApproveInviteDialog({ open, application, onClose, onSuccess }: {
  open: boolean;
  application: Application | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [inviteType, setInviteType] = useState<"staff" | "crew" | "hybrid">("crew");
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [internalTitle, setInternalTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (application) {
      setInternalTitle(application.role_applying_for);
      setRoles([]);
      // Default invite type from role
      const lower = application.role_applying_for.toLowerCase();
      if (["editor","writer","social manager","booking manager","media manager"].some((s) => lower.includes(s))) {
        setInviteType("staff");
      } else {
        setInviteType("crew");
      }
    }
  }, [application]);

  const toggleRole = (r: AppRole) =>
    setRoles((rs) => rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]);

  const submit = async () => {
    if (!application) return;
    if (roles.length === 0) { toast.error("Select at least one role"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("approve-application", {
        body: {
          application_id: application.id,
          invite_type: inviteType,
          roles,
          internal_title: internalTitle || null,
        },
      });
      if (error) throw error;
      if (data?.email_error) {
        toast.warning("Invite created, but email failed: " + data.email_error);
      } else {
        toast.success("Invite sent");
      }
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not approve");
    } finally {
      setBusy(false);
    }
  };

  const options = inviteType === "staff" ? STAFF_ROLE_OPTIONS
    : inviteType === "crew" ? CREW_ROLE_OPTIONS
    : [...STAFF_ROLE_OPTIONS, ...CREW_ROLE_OPTIONS];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-display uppercase">Approve & Send Invite</DialogTitle></DialogHeader>
        {application && (
          <div className="space-y-4">
            <div className="text-sm">
              <div className="font-medium">{application.full_name}</div>
              <div className="text-xs text-muted-foreground">{application.email}</div>
            </div>
            <div>
              <Label className="eyebrow mb-2 block">Invite type</Label>
              <Select value={inviteType} onValueChange={(v: any) => { setInviteType(v); setRoles([]); }}>
                <SelectTrigger className="h-10 rounded-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="crew">Crew</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="eyebrow mb-2 block">Internal title</Label>
              <Input value={internalTitle} onChange={(e) => setInternalTitle(e.target.value)} className="h-10 rounded-sm" />
            </div>
            <div>
              <Label className="eyebrow mb-2 block">Assign roles</Label>
              <div className="grid grid-cols-2 gap-1 max-h-56 overflow-y-auto border border-border rounded-sm p-2">
                {options.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-surface/60 px-2 py-1 rounded-sm">
                    <input type="checkbox" checked={roles.includes(r)} onChange={() => toggleRole(r)} />
                    {ROLE_LABELS[r]}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-sm uppercase tracking-widest text-[10px] h-9">Cancel</Button>
          <Button onClick={submit} disabled={busy} className="rounded-sm uppercase tracking-widest text-[10px] h-9 bg-primary text-primary-foreground">
            {busy ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Sending…</> : <><Mail className="h-3 w-3 mr-1" /> Send Invite</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
