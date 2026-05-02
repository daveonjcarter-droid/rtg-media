import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, KeyRound, Trash2, Plus, Mail, MailCheck, MailX, Send } from "lucide-react";

type Invite = {
  id: string;
  email: string;
  invite_code: string;
  role_type: string;
  app_roles: string[];
  status: string;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
  email_sent: boolean;
  email_sent_at: string | null;
  email_error: string | null;
};

const ELEVATED_ROLES = [
  { value: "owner",      label: "Owner",      app_roles: ["owner", "head_admin", "admin"] },
  { value: "co_ceo",     label: "Co-CEO",     app_roles: ["co_ceo", "head_admin", "admin"] },
  { value: "admin",      label: "Admin",      app_roles: ["admin"] },
  { value: "editor",     label: "Editor",     app_roles: ["editor"] },
  { value: "journalist", label: "Journalist", app_roles: ["writer", "journalist"] },
  { value: "designer",   label: "Designer",   app_roles: ["designer"] },
  { value: "producer",   label: "Producer",   app_roles: ["producer"] },
];

const SIGNUP_URL = "https://runnerstogreatness.com/signup";

const generateCode = () =>
  Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 6).toUpperCase()).join("-");

const AdminInvitesManager = () => {
  const [list, setList] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleType, setRoleType] = useState("admin");
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_invites")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setList((data ?? []) as Invite[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sendInviteEmail = async (invite: { id: string; email: string; role_type: string; invite_code: string }) => {
    setSendingId(invite.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "admin-invite",
          recipientEmail: invite.email,
          idempotencyKey: `admin-invite:${invite.id}`,
          templateData: {
            email: invite.email,
            role: invite.role_type,
            inviteCode: invite.invite_code,
            signupUrl: SIGNUP_URL,
          },
        },
      });
      if (error) throw error;
      if (data && (data as any).error) throw new Error((data as any).error);

      await supabase.from("admin_invites").update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        email_error: null,
      }).eq("id", invite.id);
      toast.success("Invite email sent");
      return true;
    } catch (err: any) {
      const msg = err?.message ?? "Failed to send email";
      await supabase.from("admin_invites").update({
        email_sent: false,
        email_error: msg,
      }).eq("id", invite.id);
      toast.error(`Email failed: ${msg}`);
      return false;
    } finally {
      setSendingId(null);
    }
  };

  const create = async () => {
    if (!email) { toast.error("Email required"); return; }
    const def = ELEVATED_ROLES.find((r) => r.value === roleType)!;
    const code = generateCode();
    const { data: created, error } = await supabase.from("admin_invites").insert({
      email,
      invite_code: code,
      role_type: roleType,
      app_roles: def.app_roles as any,
    }).select("*").single();
    if (error) return toast.error(error.message);
    toast.success("Invite created — sending email…");
    setEmail("");
    setOpen(false);

    if (created) {
      await sendInviteEmail(created as any);
    }
    load();
  };

  const resend = async (inv: Invite) => {
    const ok = await sendInviteEmail(inv);
    if (ok) load();
    else load();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("admin_invites").update({ status: "revoked" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Revoked");
    load();
  };

  const renderEmailStatus = (inv: Invite) => {
    if (inv.email_sent) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
          <MailCheck className="size-3" /> Sent
        </span>
      );
    }
    if (inv.email_error) {
      return (
        <span title={inv.email_error} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm border bg-destructive/15 text-destructive border-destructive/40">
          <MailX className="size-3" /> Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm border bg-muted text-muted-foreground border-border">
        <Mail className="size-3" /> Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display tracking-tight uppercase">Admin Invite Codes</h2>
          <p className="text-sm text-muted-foreground">
            One-time codes for elevated roles. Recipients must sign up with both the matching email <em>and</em> the code.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="size-4" /> New Invite Code
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <div className="border border-border/60 rounded-sm p-10 text-center text-sm text-muted-foreground">
          No admin invites yet. Use the button above to issue one.
        </div>
      ) : (
        <div className="border border-border/60 rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface/40 text-muted-foreground text-[10px] uppercase tracking-widest">
              <tr className="text-left">
                <th className="px-3 py-2 font-normal">Email</th>
                <th className="px-3 py-2 font-normal">Role</th>
                <th className="px-3 py-2 font-normal">Code</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="px-3 py-2 font-normal">Email</th>
                <th className="px-3 py-2 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((inv) => (
                <tr key={inv.id} className="border-t border-border/50">
                  <td className="px-3 py-2.5">{inv.email}</td>
                  <td className="px-3 py-2.5 uppercase tracking-widest text-xs">{inv.role_type}</td>
                  <td className="px-3 py-2.5">
                    <code className="text-xs bg-surface/40 px-2 py-1 rounded-sm">{inv.invite_code}</code>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
                      inv.status === "pending"  ? "bg-amber-500/15 text-amber-300 border-amber-500/30" :
                      inv.status === "used"     ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                      "bg-muted text-muted-foreground border-border"
                    }`}>{inv.status}</span>
                  </td>
                  <td className="px-3 py-2.5">{renderEmailStatus(inv)}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => {
                      navigator.clipboard.writeText(inv.invite_code);
                      toast.success("Code copied");
                    }} title="Copy code"><Copy className="size-3" /></Button>
                    {inv.status === "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1"
                        disabled={sendingId === inv.id}
                        onClick={() => resend(inv)}
                        title="Resend email"
                      >
                        <Send className="size-3" />
                      </Button>
                    )}
                    {inv.status === "pending" && (
                      <Button size="sm" variant="ghost" className="h-7 gap-1 text-destructive" onClick={() => revoke(inv.id)} title="Revoke">
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display uppercase flex items-center gap-2">
              <KeyRound className="size-4" /> New Admin Invite
            </DialogTitle>
            <DialogDescription>
              The recipient must sign up with this email <strong>and</strong> the generated code to receive elevated access.
              An email will be sent automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="eyebrow mb-1.5 block">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Role</Label>
              <Select value={roleType} onValueChange={setRoleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ELEVATED_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Generate &amp; Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvitesManager;
