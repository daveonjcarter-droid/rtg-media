import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/lib/permissions";
import { CREW_ROLES, type AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Mail, CheckCircle2, Clock, Ban, Users, Camera, Layers, Send, Link2, XCircle, AlertTriangle, KeyRound, RefreshCw } from "lucide-react";

const STAFF_ROLES: AppRole[] = [
  "head_admin", "admin", "editor", "writer",
  "social_manager", "booking_manager", "media_manager", "social_articles_lead",
];
// CREW_ROLES imported from AuthContext

type InviteType = "staff" | "crew" | "hybrid";

type EmailDeliveryStatus = "pending" | "sent" | "failed";

type Invite = {
  id: string;
  email: string;
  full_name: string | null;
  invite_type: InviteType;
  roles: AppRole[];
  reports_to: string | null;
  internal_title: string | null;
  default_rate: number | null;
  portfolio_required: boolean;
  availability_required: boolean;
  status: "pending" | "active" | "disabled";
  notes: string | null;
  created_at: string;
  accepted_at: string | null;
  invite_token: string | null;
  invite_url: string | null;
  invite_code: string | null;
  expires_at: string | null;
  email_delivery_status: EmailDeliveryStatus;
  email_sent_at: string | null;
  email_error: string | null;
};

type Profile = { id: string; display_name: string | null };

const isExpired = (inv: Invite) => !!(inv.expires_at && new Date(inv.expires_at) < new Date()) && inv.status === "pending";

const statusBadge = {
  pending: { icon: Clock, cls: "bg-gold/15 text-gold border-gold/30", label: "Pending" },
  active: { icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Used" },
  disabled: { icon: Ban, cls: "bg-muted/40 text-muted-foreground border-border", label: "Revoked" },
  expired: { icon: AlertTriangle, cls: "bg-destructive/15 text-destructive border-destructive/30", label: "Expired" },
};

const emailStatusBadge: Record<EmailDeliveryStatus, { icon: any; cls: string; label: string }> = {
  pending: { icon: Clock, cls: "bg-muted/40 text-muted-foreground border-border", label: "Email pending" },
  sent: { icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Email sent" },
  failed: { icon: AlertTriangle, cls: "bg-destructive/15 text-destructive border-destructive/30", label: "Email failed" },
};

const typeBadge: Record<InviteType, { icon: any; cls: string; label: string }> = {
  staff: { icon: Users, cls: "bg-blue-500/15 text-blue-300 border-blue-500/30", label: "Staff" },
  crew: { icon: Camera, cls: "bg-primary/15 text-primary border-primary/30", label: "Crew" },
  hybrid: { icon: Layers, cls: "bg-purple-500/15 text-purple-300 border-purple-500/30", label: "Hybrid" },
};

const emptyInvite = (type: InviteType): Invite => ({
  id: "", email: "", full_name: "", invite_type: type,
  roles: type === "crew" ? ["videographer"] : ["writer"],
  reports_to: null, internal_title: "", default_rate: null,
  portfolio_required: type !== "staff", availability_required: type !== "staff",
  status: "pending", notes: "", created_at: "", accepted_at: null,
  invite_token: null, invite_url: null,
  invite_code: null, expires_at: null,
  email_delivery_status: "pending", email_sent_at: null, email_error: null,
});

const generateBackupCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 12; i++) s += alphabet[buf[i] % alphabet.length];
  return `${s.slice(0,4)}-${s.slice(4,8)}-${s.slice(8,12)}`;
};

const generateInviteToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Production site URL — invite emails must NEVER point at preview/staging hosts.
const PUBLIC_SITE_URL = "https://runnerstogreatness.com";

const buildInviteUrl = (token: string, _email: string) =>
  `${PUBLIC_SITE_URL}/signup?invite_token=${token}`;

export default function InvitesManager() {
  const { user, hasRole } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Invite | null>(null);
  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState<InviteType | "all">("all");

  const canInviteStaff = hasRole("head_admin") || hasRole("admin");
  const canInviteCrew = hasRole("head_admin") || hasRole("admin") || hasRole("booking_manager");

  const load = async () => {
    setLoading(true);
    const [{ data: inv }, { data: pr }] = await Promise.all([
      supabase.from("invited_users" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, display_name"),
    ]);
    setInvites((inv as any) || []);
    setProfiles((pr as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startNew = (type: InviteType) => { setEditing(emptyInvite(type)); setOpen(true); };
  const startEdit = (inv: Invite) => { setEditing({ ...inv }); setOpen(true); };

  const sendInviteEmail = async (inviteId: string, opts: {
    email: string;
    fullName: string | null;
    inviteType: InviteType;
    roles: AppRole[];
    internalTitle: string | null;
    reportsToName: string | null;
    inviteUrl: string;
    inviteCode: string | null;
    expiresAt: string | null;
  }) => {
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "team-invite",
          recipientEmail: opts.email,
          idempotencyKey: `team-invite-${inviteId}-${Date.now()}`,
          templateData: {
            fullName: opts.fullName ?? undefined,
            inviteType: opts.inviteType,
            roles: opts.roles,
            internalTitle: opts.internalTitle,
            reportsToName: opts.reportsToName,
            inviteUrl: opts.inviteUrl,
            inviteCode: opts.inviteCode ?? undefined,
            expiresAt: opts.expiresAt
              ? new Date(opts.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
              : undefined,
          },
        },
      });
      if (error) throw error;
      await supabase.from("invited_users" as any).update({
        email_delivery_status: "sent",
        email_sent_at: new Date().toISOString(),
        email_error: null,
      }).eq("id", inviteId);
      return { ok: true as const };
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      await supabase.from("invited_users" as any).update({
        email_delivery_status: "failed",
        email_error: msg,
      }).eq("id", inviteId);
      return { ok: false as const, error: msg };
    }
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.email.trim()) { toast.error("Email is required"); return; }
    if (editing.roles.length === 0) { toast.error("Select at least one role"); return; }
    const email = editing.email.trim().toLowerCase();
    const isNew = !editing.id;
    const token = editing.invite_token ?? generateInviteToken();
    const inviteUrl = buildInviteUrl(token, email);
    const inviteCode = editing.invite_code ?? generateBackupCode();
    const expiresAt = editing.expires_at ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const payload: any = {
      email,
      full_name: editing.full_name?.trim() || null,
      invite_type: editing.invite_type,
      roles: editing.roles,
      reports_to: editing.reports_to,
      internal_title: editing.internal_title?.trim() || null,
      default_rate: editing.default_rate,
      portfolio_required: editing.portfolio_required,
      availability_required: editing.availability_required,
      status: editing.status,
      notes: editing.notes?.trim() || null,
      invited_by: user?.id,
      invite_token: token,
      invite_url: inviteUrl,
      invite_code: inviteCode,
      expires_at: expiresAt,
    };
    if (isNew) {
      payload.email_delivery_status = "pending";
    }

    const res = isNew
      ? await supabase.from("invited_users" as any).insert(payload).select("id").single()
      : await supabase.from("invited_users" as any).update(payload).eq("id", editing.id).select("id").single();
    if (res.error) return toast.error(res.error.message);

    const inviteId = (res.data as any)?.id ?? editing.id;
    setOpen(false); setEditing(null);

    if (isNew) {
      const supervisorName = profiles.find((p) => p.id === editing.reports_to)?.display_name ?? null;
      const result = await sendInviteEmail(inviteId, {
        email,
        fullName: editing.full_name?.trim() || null,
        inviteType: editing.invite_type,
        roles: editing.roles,
        internalTitle: editing.internal_title?.trim() || null,
        reportsToName: supervisorName,
        inviteUrl,
        inviteCode,
        expiresAt,
      });
      if (result.ok) toast.success("Invite sent");
      else toast.error("Invite saved, but email failed to send.", { description: result.error });
    } else {
      toast.success("Invite updated");
    }
    load();
  };

  const resend = async (inv: Invite) => {
    const token = inv.invite_token ?? generateInviteToken();
    const inviteUrl = inv.invite_url ?? buildInviteUrl(token, inv.email);
    const inviteCode = inv.invite_code ?? generateBackupCode();
    const expiresAt = inv.expires_at && new Date(inv.expires_at) > new Date()
      ? inv.expires_at
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const patch: any = {};
    if (!inv.invite_token || !inv.invite_url) { patch.invite_token = token; patch.invite_url = inviteUrl; }
    if (!inv.invite_code) patch.invite_code = inviteCode;
    if (expiresAt !== inv.expires_at) patch.expires_at = expiresAt;
    if (Object.keys(patch).length) {
      await supabase.from("invited_users" as any).update(patch).eq("id", inv.id);
    }
    const supervisorName = profiles.find((p) => p.id === inv.reports_to)?.display_name ?? null;
    const result = await sendInviteEmail(inv.id, {
      email: inv.email,
      fullName: inv.full_name,
      inviteType: inv.invite_type,
      roles: inv.roles,
      internalTitle: inv.internal_title,
      reportsToName: supervisorName,
      inviteUrl,
      inviteCode,
      expiresAt,
    });
    if (result.ok) toast.success("Invite resent");
    else toast.error("Email failed to send.", { description: result.error });
    load();
  };

  const copyLink = async (inv: Invite) => {
    const url = inv.invite_url ?? (inv.invite_token ? buildInviteUrl(inv.invite_token, inv.email) : null);
    if (!url) { toast.error("No invite link yet — resend the invite first."); return; }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy — copy manually:", { description: url });
    }
  };

  const copyCode = async (inv: Invite) => {
    if (!inv.invite_code) { toast.error("No backup code yet — regenerate first."); return; }
    try {
      await navigator.clipboard.writeText(inv.invite_code);
      toast.success("Backup invite code copied");
    } catch {
      toast.error("Couldn't copy — copy manually:", { description: inv.invite_code });
    }
  };

  const regenerateCode = async (inv: Invite) => {
    const newCode = generateBackupCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("invited_users" as any)
      .update({ invite_code: newCode, expires_at: expiresAt }).eq("id", inv.id);
    if (error) return toast.error(error.message);
    toast.success("New backup code generated");
    load();
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this invite? The link and code will stop working.")) return;
    const newToken = generateInviteToken();
    const { error } = await supabase.from("invited_users" as any)
      .update({ status: "disabled", invite_token: newToken, invite_url: null, invite_code: null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Invite revoked"); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this invite?")) return;
    const { error } = await supabase.from("invited_users" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed"); load();
  };

  const setStatus = async (id: string, status: Invite["status"]) => {
    const { error } = await supabase.from("invited_users" as any).update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`); load();
  };

  const visible = invites.filter((i) => filterType === "all" || (i.invite_type ?? "staff") === filterType);

  const availableRoles: AppRole[] = editing
    ? editing.invite_type === "staff" ? STAFF_ROLES
    : editing.invite_type === "crew" ? CREW_ROLES
    : [...STAFF_ROLES, ...CREW_ROLES]
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Admin</div>
          <div className="font-display uppercase text-2xl">Invites & Role Assignment</div>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Pre-assign roles, supervisors, and titles by email. When the person signs up, their access is applied automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {canInviteStaff && (
            <Button onClick={() => startNew("staff")} size="sm" variant="outline" className="rounded-sm uppercase tracking-widest text-[10px] h-9">
              <Users className="h-3 w-3 mr-1" /> Invite Staff
            </Button>
          )}
          {canInviteCrew && (
            <Button onClick={() => startNew("crew")} size="sm" variant="outline" className="rounded-sm uppercase tracking-widest text-[10px] h-9">
              <Camera className="h-3 w-3 mr-1" /> Invite Crew
            </Button>
          )}
          {canInviteStaff && (
            <Button onClick={() => startNew("hybrid")} size="sm" className="rounded-sm uppercase tracking-widest text-[10px] h-9 bg-primary text-primary-foreground">
              <Plus className="h-3 w-3 mr-1" /> Invite Hybrid
            </Button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {(["all", "staff", "crew", "hybrid"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border transition-colors ${
              filterType === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "all" ? "All" : typeBadge[t].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm p-8 text-center">
          <Mail className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">No invites yet. Add the first one.</div>
        </div>
      ) : (
        <div className="border border-border rounded-sm divide-y divide-border">
          {visible.map((inv) => {
            const Sb = statusBadge[inv.status];
            const Tb = typeBadge[(inv.invite_type ?? "staff") as InviteType];
            const Eb = emailStatusBadge[(inv.email_delivery_status ?? "pending") as EmailDeliveryStatus];
            const supervisor = profiles.find((p) => p.id === inv.reports_to);
            return (
              <div key={inv.id} className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 hover:bg-surface/40">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${Tb.cls}`}>
                      <Tb.icon className="h-2.5 w-2.5" /> {Tb.label}
                    </span>
                    <span className="font-medium text-sm break-all">{inv.full_name || inv.email}</span>
                    <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${Sb.cls}`}>
                      <Sb.icon className="h-2.5 w-2.5" /> {inv.status}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${Eb.cls}`}>
                      <Eb.icon className="h-2.5 w-2.5" /> {Eb.label}
                    </span>
                  </div>
                  {inv.full_name && <div className="text-[11px] text-muted-foreground mt-0.5 break-all">{inv.email}</div>}
                  {inv.internal_title && <div className="text-[11px] text-muted-foreground mt-0.5">{inv.internal_title}</div>}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {inv.roles.map((r) => (
                      <span key={r} className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-background border border-border rounded-sm">
                        {ROLE_LABELS[r] ?? r}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground mt-1.5">
                    {supervisor && (<span>Reports to: <span className="text-foreground">{supervisor.display_name ?? supervisor.id.slice(0,8)}</span></span>)}
                    {inv.default_rate != null && (<span>Rate: <span className="text-foreground">${inv.default_rate}</span></span>)}
                    {inv.portfolio_required && <span className="text-foreground">Portfolio req</span>}
                    {inv.availability_required && <span className="text-foreground">Availability req</span>}
                    {inv.email_sent_at && (<span>Sent: <span className="text-foreground">{new Date(inv.email_sent_at).toLocaleString()}</span></span>)}
                  </div>
                  {inv.email_delivery_status === "failed" && inv.email_error && (
                    <div className="mt-1.5 text-[10px] text-destructive break-words">
                      Email error: {inv.email_error}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button onClick={() => resend(inv)} className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1 border border-border rounded-sm hover:border-primary hover:text-primary min-h-[32px]" title="Resend invite email">
                    <Send className="h-3 w-3" /> Resend
                  </button>
                  <button onClick={() => copyLink(inv)} className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1 border border-border rounded-sm hover:border-foreground/40 min-h-[32px]" title="Copy invite link">
                    <Link2 className="h-3 w-3" /> Copy link
                  </button>
                  {inv.status !== "disabled" && (
                    <button onClick={() => revoke(inv.id)} className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1 border border-border rounded-sm hover:border-destructive hover:text-destructive min-h-[32px]" title="Revoke invite">
                      <XCircle className="h-3 w-3" /> Revoke
                    </button>
                  )}
                  {inv.status !== "active" && (
                    <button onClick={() => setStatus(inv.id, "active")} className="text-[10px] uppercase tracking-widest px-2 py-1 border border-border rounded-sm hover:border-foreground/40 min-h-[32px]">Activate</button>
                  )}
                  <button onClick={() => startEdit(inv)} className="h-8 w-8 rounded-sm border border-border hover:border-foreground/40 flex items-center justify-center" title="Edit">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => remove(inv.id)} className="h-8 w-8 rounded-sm border border-border hover:border-destructive flex items-center justify-center text-muted-foreground hover:text-destructive" title="Remove">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="bg-background border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display uppercase">{editing?.id ? "Edit Invite" : "New Invite"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              {/* Type selector */}
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Invite Type</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["staff", "crew", "hybrid"] as InviteType[]).map((t) => {
                    const T = typeBadge[t];
                    const active = editing.invite_type === t;
                    const disabled = (t === "staff" && !canInviteStaff) || (t === "crew" && !canInviteCrew) || (t === "hybrid" && !canInviteStaff);
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={disabled}
                        onClick={() => setEditing({
                          ...editing,
                          invite_type: t,
                          roles: [],
                          portfolio_required: t !== "staff",
                          availability_required: t !== "staff",
                        })}
                        className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-sm border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <T.icon className="h-3.5 w-3.5" />
                        <span className="text-[10px] uppercase tracking-widest">{T.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Email *</Label>
                  <Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="person@example.com" className="h-9 text-xs bg-background border-border rounded-sm mt-1" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Full Name</Label>
                  <Input value={editing.full_name ?? ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} placeholder="Optional" className="h-9 text-xs bg-background border-border rounded-sm mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Internal Title</Label>
                <Input value={editing.internal_title ?? ""} onChange={(e) => setEditing({ ...editing, internal_title: e.target.value })} placeholder="e.g. Lead Videographer" className="h-9 text-xs bg-background border-border rounded-sm mt-1" />
              </div>

              {/* Roles */}
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  {editing.invite_type === "hybrid" ? "Roles (Staff + Crew)" : editing.invite_type === "crew" ? "Crew Roles" : "Staff Roles"}
                </Label>
                {editing.invite_type === "hybrid" ? (
                  <div className="space-y-2">
                    <div>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Staff</div>
                      <div className="flex flex-wrap gap-1.5">
                        {STAFF_ROLES.map((r) => {
                          const active = editing.roles.includes(r);
                          return (
                            <button key={r} type="button" onClick={() => setEditing({
                              ...editing,
                              roles: active ? editing.roles.filter((x) => x !== r) : [...editing.roles, r],
                            })} className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border min-h-[32px] ${
                              active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                            }`}>{ROLE_LABELS[r] ?? r}</button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Crew</div>
                      <div className="flex flex-wrap gap-1.5">
                        {CREW_ROLES.map((r) => {
                          const active = editing.roles.includes(r);
                          return (
                            <button key={r} type="button" onClick={() => setEditing({
                              ...editing,
                              roles: active ? editing.roles.filter((x) => x !== r) : [...editing.roles, r],
                            })} className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border min-h-[32px] ${
                              active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                            }`}>{ROLE_LABELS[r] ?? r}</button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {availableRoles.map((r) => {
                      const active = editing.roles.includes(r);
                      return (
                        <button key={r} type="button" onClick={() => setEditing({
                          ...editing,
                          roles: active ? editing.roles.filter((x) => x !== r) : [...editing.roles, r],
                        })} className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border min-h-[32px] ${
                          active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                        }`}>{ROLE_LABELS[r] ?? r}</button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Reports To</Label>
                  <Select value={editing.reports_to ?? "none"} onValueChange={(v) => setEditing({ ...editing, reports_to: v === "none" ? null : v })}>
                    <SelectTrigger className="h-9 text-xs rounded-sm bg-background mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">— No supervisor —</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">{p.display_name ?? p.id.slice(0,8)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Default Rate ($)</Label>
                  <Input
                    type="number"
                    value={editing.default_rate ?? ""}
                    onChange={(e) => setEditing({ ...editing, default_rate: e.target.value === "" ? null : Number(e.target.value) })}
                    placeholder="Optional"
                    className="h-9 text-xs bg-background border-border rounded-sm mt-1"
                  />
                </div>
              </div>

              {editing.invite_type !== "staff" && (
                <div className="grid grid-cols-2 gap-3 p-3 border border-border rounded-sm bg-surface/30">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Portfolio req</Label>
                    <Switch checked={editing.portfolio_required} onCheckedChange={(v) => setEditing({ ...editing, portfolio_required: v })} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Availability req</Label>
                    <Switch checked={editing.availability_required} onCheckedChange={(v) => setEditing({ ...editing, availability_required: v })} />
                  </div>
                </div>
              )}

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</Label>
                <Select value={editing.status} onValueChange={(v: any) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger className="h-9 text-xs rounded-sm bg-background mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                    <SelectItem value="active" className="text-xs">Active</SelectItem>
                    <SelectItem value="disabled" className="text-xs">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Notes</Label>
                <Textarea value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} className="bg-background border-border rounded-sm text-xs mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-sm uppercase tracking-widest text-[10px] h-9">Cancel</Button>
            <Button onClick={save} className="rounded-sm uppercase tracking-widest text-[10px] h-9 bg-primary text-primary-foreground">{editing?.id ? "Save Invite" : "Send Invite"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
