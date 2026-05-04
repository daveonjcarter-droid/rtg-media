import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, ShieldCheck, RefreshCw, Clock } from "lucide-react";
import logoLight from "@/assets/rtg-logo-light.png";

type PendingUser = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  created_at: string;
};

const APPROVABLE_ROLES: AppRole[] = [
  "editor", "journalist", "photographer", "videographer",
  "booking_manager", "social_manager", "media_manager", "designer",
  "project_manager", "crew", "admin",
];

const StaffApprovals = () => {
  const { user, roles, loading: authLoading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Record<string, AppRole>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setAllowed(false); return; }
    (async () => {
      const { data } = await supabase
        .from("profile_meta")
        .select("role_type")
        .eq("user_id", user.id)
        .maybeSingle();
      const rt = data?.role_type;
      const ok =
        rt === "admin" || rt === "owner" ||
        roles.includes("admin") || roles.includes("owner") || roles.includes("head_admin") || roles.includes("co_ceo");
      setAllowed(ok);
    })();
  }, [user, roles, authLoading]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profile_meta")
      .select("user_id, email, display_name, full_name, created_at")
      .eq("role_type", "pending_staff")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as PendingUser[]);
    setLoading(false);
  };

  useEffect(() => { if (allowed) load(); }, [allowed]);

  const approve = async (u: PendingUser) => {
    const role: AppRole = chosen[u.user_id] ?? ("crew" as AppRole);
    setBusy(u.user_id);
    console.log("[StaffApprovals] approve", { user_id: u.user_id, role });

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
      .update({ role_type: role, status: "active" })
      .eq("user_id", u.user_id);
    if (mErr) {
      console.error("[StaffApprovals] profile_meta update error:", mErr);
      toast.error(mErr.message);
      setBusy(null);
      return;
    }

    toast.success("User approved.");
    setRows((r) => r.filter((x) => x.user_id !== u.user_id));
    setBusy(null);
  };

  if (authLoading || allowed === null) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-xs uppercase tracking-widest text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-2">
          <div className="font-display text-2xl uppercase">Unauthorized</div>
          <p className="text-sm text-muted-foreground">You do not have access to this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoLight} alt="RTG Media" className="h-8" />
            <div>
              <div className="eyebrow text-primary">Admin</div>
              <h1 className="font-display text-2xl uppercase tracking-wider">Staff Approvals</h1>
            </div>
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
            <div className="font-display uppercase tracking-widest text-sm">No pending staff approvals.</div>
          </div>
        ) : (
          <div className="grid gap-3">
            {rows.map((u) => (
              <div key={u.user_id} className="border border-border rounded-sm bg-surface/40 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
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
                    Signed up {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Select
                  value={chosen[u.user_id] ?? "crew"}
                  onValueChange={(v) => setChosen((p) => ({ ...p, [u.user_id]: v as AppRole }))}
                >
                  <SelectTrigger className="h-10 w-full sm:w-[200px] rounded-sm bg-background uppercase tracking-widest text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs uppercase tracking-widest">
                        {r.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => approve(u)}
                  disabled={busy === u.user_id}
                  className="h-10 rounded-sm uppercase tracking-widest text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" /> Approve
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffApprovals;
