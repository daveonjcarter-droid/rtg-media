import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, X, Clock, RefreshCw, ShieldCheck } from "lucide-react";
import type { AppRole } from "@/contexts/AuthContext";

type PendingUser = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  role_type: string | null;
  status: string | null;
  created_at: string;
};

const APPROVABLE_ROLES: AppRole[] = [
  "editor", "journalist", "photographer", "videographer",
  "booking_manager", "social_manager", "media_manager", "designer",
  "project_manager", "crew", "admin",
];

const ROLE_TO_META: Record<string, string> = {
  editor: "editor", journalist: "journalist", photographer: "photographer",
  videographer: "videographer", booking_manager: "booking_manager",
  social_manager: "social_manager", media_manager: "media_manager",
  designer: "designer", project_manager: "project_manager",
  crew: "crew", admin: "admin",
};

const StaffApprovalsSection = () => {
  const [rows, setRows] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Record<string, AppRole>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profile_meta")
      .select("user_id, email, display_name, full_name, role_type, status, created_at")
      .eq("role_type", "pending_staff")
      .order("created_at", { ascending: false });
    console.log("[StaffApprovals] fetched pending users:", data, "error:", error);
    if (error) toast.error(error.message);
    setRows((data ?? []) as PendingUser[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (u: PendingUser) => {
    const role: AppRole = chosen[u.user_id] ?? ("crew" as AppRole);
    const metaRole = ROLE_TO_META[role] ?? "crew";
    console.log("[StaffApprovals] approve clicked", { user_id: u.user_id, role, metaRole });
    setBusy(u.user_id);

    const { error: rErr } = await supabase
      .from("user_roles")
      .insert({ user_id: u.user_id, role: role as any });
    if (rErr && !String(rErr.message).toLowerCase().includes("duplicate")) {
      console.error("[StaffApprovals] user_roles insert error:", rErr);
      toast.error(rErr.message);
      setBusy(null);
      return;
    }

    const { error: mErr } = await supabase
      .from("profile_meta")
      .update({ role_type: metaRole, status: "active" })
      .eq("user_id", u.user_id);
    if (mErr) {
      console.error("[StaffApprovals] profile_meta update error:", mErr);
      toast.error(mErr.message);
      setBusy(null);
      return;
    }

    toast.success("Staff member approved.");
    setRows((r) => r.filter((x) => x.user_id !== u.user_id));
    setBusy(null);
  };

  const reject = async (u: PendingUser) => {
    console.log("[StaffApprovals] reject clicked", { user_id: u.user_id });
    setBusy(u.user_id);
    const { error } = await supabase
      .from("profile_meta")
      .update({ role_type: "rejected_staff", status: "rejected" })
      .eq("user_id", u.user_id);
    if (error) {
      console.error("[StaffApprovals] reject error:", error);
      toast.error(error.message);
      setBusy(null);
      return;
    }
    toast.success("Staff request rejected.");
    setRows((r) => r.filter((x) => x.user_id !== u.user_id));
    setBusy(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow text-primary">Admin</div>
          <h2 className="font-display text-2xl uppercase tracking-wider">Staff Approvals</h2>
          <p className="text-xs text-muted-foreground mt-1">Approve or reject newly registered staff awaiting role assignment.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="rounded-sm uppercase tracking-widest text-[10px]">
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="border border-border rounded-sm bg-surface/40 p-12 text-center">
          <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <div className="font-display uppercase tracking-widest text-sm">No pending staff</div>
          <p className="text-xs text-muted-foreground mt-1">All staff requests have been reviewed.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((u) => (
            <div key={u.user_id} className="border border-border rounded-sm bg-surface/40 p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-display uppercase tracking-wider text-base truncate">
                    {u.full_name || u.display_name || "Unnamed"}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/30">
                    <Clock className="h-3 w-3" /> Pending
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">{u.email}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                  Signed up {new Date(u.created_at).toLocaleDateString()} · Requested: {u.role_type ?? "—"}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Select
                  value={chosen[u.user_id] ?? "crew"}
                  onValueChange={(v) => setChosen((p) => ({ ...p, [u.user_id]: v as AppRole }))}
                >
                  <SelectTrigger className="h-9 w-full sm:w-[180px] rounded-sm bg-background uppercase tracking-widest text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs uppercase tracking-widest">{r.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => approve(u)}
                  disabled={busy === u.user_id}
                  className="h-9 rounded-sm uppercase tracking-widest text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" /> Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => reject(u)}
                  disabled={busy === u.user_id}
                  className="h-9 rounded-sm uppercase tracking-widest text-[10px] border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffApprovalsSection;
