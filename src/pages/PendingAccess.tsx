import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoLight from "@/assets/rtg-logo-light.png";

const PendingAccess = () => {
  const { signOut, refreshRoles, user, roles } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // If a role gets assigned in another tab, jump into the dashboard
  useEffect(() => {
    if (roles.length > 0) navigate("/dashboard", { replace: true });
  }, [roles, navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshRoles();
    if (user?.id) {
      const { data } = await supabase
        .from("profile_meta")
        .select("role_type, status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data && data.role_type && data.role_type !== "pending_staff") {
        if (data.role_type === "rejected_staff" || data.status === "rejected") {
          toast.error("Your staff request was not approved.");
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        toast("Your access is still pending admin approval.");
      }
    }
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md border border-border rounded-sm bg-surface/40 p-8 text-center space-y-6">
        <img src={logoLight} alt="RTG Media" className="h-10 mx-auto" />
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 border border-primary/30 mx-auto">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <div className="eyebrow text-primary mb-2">Pending Access</div>
          <h1 className="font-display text-2xl uppercase">Role approval pending</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Your RTG Media account has been created. Your access is pending role approval from an admin.
          </p>
          <p className="text-xs text-muted-foreground mt-2 break-all">
            Signed in as <span className="text-foreground">{user?.email}</span>
          </p>
        </div>
        <div className="space-y-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full h-11 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Checking…" : "Check Access"}
          </Button>
          <Button
            variant="outline"
            onClick={async () => { await signOut(); navigate("/login"); }}
            className="w-full h-10 rounded-sm uppercase tracking-widest text-[10px]"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PendingAccess;
