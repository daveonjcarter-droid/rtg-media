import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, type SectionId } from "@/lib/permissions";
import type { AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Mail, CheckCircle2, Clock, Ban } from "lucide-react";

const ALL_ROLES: AppRole[] = [
  "head_admin", "admin", "editor", "writer",
  "social_manager", "booking_manager", "media_manager", "social_articles_lead",
];

type Invite = {
  id: string;
  email: string;
  roles: AppRole[];
  reports_to: string | null;
  internal_title: string | null;
  status: "pending" | "active" | "disabled";
  notes: string | null;
  created_at: string;
  accepted_at: string | null;
};

type Profile = { id: string; display_name: string | null };

const statusBadge = {
  pending: { icon: Clock, cls: "bg-gold/15 text-gold border-gold/30" },
  active: { icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  disabled: { icon: Ban, cls: "bg-muted/40 text-muted-foreground border-border" },
};

export default function InvitesManager() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Invite | null>(null);
  const [open, setOpen] = useState(false);

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

  const startNew = () => {
    setEditing({
      id: "", email: "", roles: ["writer"], reports_to: null,
      internal_title: "", status: "pending", notes: "",
      created_at: "", accepted_at: null,
    });
    setOpen(true);
  };

  const startEdit = (inv: Invite) => { setEditing({ ...inv }); setOpen(true); };

  const save = async () => {
    if (!editing) return;
    if (!editing.email.trim()) { toast.error("Email is required"); return; }
    const payload = {
      email: editing.email.trim().toLowerCase(),
      roles: editing.roles,
      reports_to: editing.reports_to,
      internal_title: editing.internal_title?.trim() || null,
      status: editing.status,
      notes: editing.notes?.trim() || null,
      invited_by: user?.id,
    };
    const res = editing.id
      ? await supabase.from("invited_users" as any).update(payload).eq("id", editing.id)
      : await supabase.from("invited_users" as any).insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing.id ? "Invite updated" : "Invite created");
    setOpen(false); setEditing(null); load();
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
        <Button onClick={startNew} size="sm" className="rounded-sm uppercase tracking-widest text-[10px] h-9 bg-primary text-primary-foreground">
          <Plus className="h-3 w-3 mr-1" /> New Invite
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : invites.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm p-8 text-center">
          <Mail className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">No invites yet. Add the first one.</div>
        </div>
      ) : (
        <div className="border border-border rounded-sm divide-y divide-border">
          {invites.map((inv) => {
            const Sb = statusBadge[inv.status];
            const supervisor = profiles.find((p) => p.id === inv.reports_to);
            return (
              <div key={inv.id} className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 hover:bg-surface/40">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm break-all">{inv.email}</span>
                    <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${Sb.cls}`}>
                      <Sb.icon className="h-2.5 w-2.5" /> {inv.status}
                    </span>
                  </div>
                  {inv.internal_title && <div className="text-[11px] text-muted-foreground mt-0.5">{inv.internal_title}</div>}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {inv.roles.map((r) => (
                      <span key={r} className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-background border border-border rounded-sm">
                        {ROLE_LABELS[r]}
                      </span>
                    ))}
                  </div>
                  {supervisor && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Reports to: <span className="text-foreground">{supervisor.display_name ?? supervisor.id.slice(0,8)}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {inv.status !== "active" && (
                    <button onClick={() => setStatus(inv.id, "active")} className="text-[10px] uppercase tracking-widest px-2 py-1 border border-border rounded-sm hover:border-foreground/40">Activate</button>
                  )}
                  {inv.status !== "disabled" && (
                    <button onClick={() => setStatus(inv.id, "disabled")} className="text-[10px] uppercase tracking-widest px-2 py-1 border border-border rounded-sm hover:border-foreground/40">Disable</button>
                  )}
                  <button onClick={() => startEdit(inv)} className="h-7 w-7 rounded-sm border border-border hover:border-foreground/40 flex items-center justify-center" title="Edit">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => remove(inv.id)} className="h-7 w-7 rounded-sm border border-border hover:border-destructive flex items-center justify-center text-muted-foreground hover:text-destructive" title="Remove">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="bg-background border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display uppercase">{editing?.id ? "Edit Invite" : "New Invite"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Email</Label>
                <Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="person@example.com" className="h-9 text-xs bg-background border-border rounded-sm mt-1" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Internal Title</Label>
                <Input value={editing.internal_title ?? ""} onChange={(e) => setEditing({ ...editing, internal_title: e.target.value })} placeholder="e.g. Head of Social / Articles Lead" className="h-9 text-xs bg-background border-border rounded-sm mt-1" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Roles</Label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_ROLES.map((r) => {
                    const active = editing.roles.includes(r);
                    return (
                      <button key={r} type="button" onClick={() => {
                        setEditing({
                          ...editing,
                          roles: active ? editing.roles.filter((x) => x !== r) : [...editing.roles, r],
                        });
                      }} className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border transition-colors ${
                        active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                      }`}>{ROLE_LABELS[r]}</button>
                    );
                  })}
                </div>
              </div>
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
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-sm uppercase tracking-widest text-[10px] h-8">Cancel</Button>
            <Button onClick={save} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground">Save Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
