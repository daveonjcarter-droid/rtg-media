import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, KeyRound, Plus, Ban, RotateCcw } from "lucide-react";

type Row = {
  id: string;
  code: string;
  label: string | null;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  status: string;
  created_at: string;
};

const SIGNUP_URL = "https://runnerstogreatness.com/signup";

const generateCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 12; i++) s += alphabet[buf[i] % alphabet.length];
  return `${s.slice(0,4)}-${s.slice(4,8)}-${s.slice(8,12)}`;
};

const SignupCodesManager = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(7);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("signup_codes" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(((data as any) ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const expires_at = expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const code = generateCode();
    const { error } = await supabase.from("signup_codes" as any).insert({
      code,
      label: label.trim() || null,
      max_uses: Math.max(1, maxUses),
      expires_at,
      created_by: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("Signup code created");
    setOpen(false); setLabel(""); setMaxUses(1); setExpiresInDays(7);
    load();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("signup_codes" as any).update({ status: "revoked" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Code revoked"); load();
  };

  const reactivate = async (id: string) => {
    const { error } = await supabase.from("signup_codes" as any).update({ status: "active" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Code reactivated"); load();
  };

  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(`${what} copied`); }
    catch { toast.error("Couldn't copy"); }
  };

  const statusOf = (r: Row): { label: string; cls: string } => {
    if (r.status === "revoked") return { label: "Revoked", cls: "bg-muted text-muted-foreground border-border" };
    if (r.expires_at && new Date(r.expires_at) < new Date()) return { label: "Expired", cls: "bg-destructive/15 text-destructive border-destructive/30" };
    if (r.used_count >= r.max_uses) return { label: "Used", cls: "bg-muted text-muted-foreground border-border" };
    return { label: "Active", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Admin</div>
          <h2 className="text-2xl font-display tracking-tight uppercase">Signup Codes</h2>
          <p className="text-sm text-muted-foreground max-w-xl mt-1">
            Generate codes that simply unlock staff signup at <code className="text-foreground">/signup</code>.
            New accounts start as <strong>Pending Staff</strong>; assign roles in Role Management.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="size-4" /> New Signup Code
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="border border-border/60 rounded-sm p-10 text-center text-sm text-muted-foreground">
          No signup codes yet.
        </div>
      ) : (
        <div className="border border-border/60 rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface/40 text-muted-foreground text-[10px] uppercase tracking-widest">
              <tr className="text-left">
                <th className="px-3 py-2 font-normal">Code</th>
                <th className="px-3 py-2 font-normal">Label</th>
                <th className="px-3 py-2 font-normal">Uses</th>
                <th className="px-3 py-2 font-normal">Expires</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="px-3 py-2 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = statusOf(r);
                const link = `${SIGNUP_URL}?code=${encodeURIComponent(r.code)}`;
                return (
                  <tr key={r.id} className="border-t border-border/50">
                    <td className="px-3 py-2.5">
                      <code className="text-xs bg-surface/40 px-2 py-1 rounded-sm">{r.code}</code>
                    </td>
                    <td className="px-3 py-2.5">{r.label || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2.5 text-xs">{r.used_count} / {r.max_uses}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => copy(r.code, "Code")} title="Copy code">
                        <Copy className="size-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => copy(link, "Signup link")} title="Copy signup link">
                        <KeyRound className="size-3" />
                      </Button>
                      {r.status === "active" ? (
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-destructive" onClick={() => revoke(r.id)} title="Revoke">
                          <Ban className="size-3" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => reactivate(r.id)} title="Reactivate">
                          <RotateCcw className="size-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display uppercase flex items-center gap-2">
              <KeyRound className="size-4" /> New Signup Code
            </DialogTitle>
            <DialogDescription>
              Generate a code anyone can use at <code>/signup</code>. New accounts start as Pending Staff.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="eyebrow mb-1.5 block">Label (optional)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Fall 2026 Crew" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="eyebrow mb-1.5 block">Max uses</Label>
                <Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(parseInt(e.target.value || "1", 10))} />
              </div>
              <div>
                <Label className="eyebrow mb-1.5 block">Expires in (days)</Label>
                <Input type="number" min={0} value={expiresInDays} onChange={(e) => setExpiresInDays(parseInt(e.target.value || "0", 10))} />
                <p className="text-[10px] text-muted-foreground mt-1">0 = no expiry.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Generate Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignupCodesManager;
