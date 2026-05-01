import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS } from "@/lib/permissions";
import { toast } from "sonner";
import { z } from "zod";
import logoLight from "@/assets/rtg-logo-light.png";

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(128),
});

type InvitePreview = {
  id: string;
  email: string;
  full_name: string | null;
  invite_type: "staff" | "crew" | "hybrid";
  roles: string[];
  internal_title: string | null;
  status: string;
  invited_by_name: string | null;
};

const Signup = () => {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inviteToken = params.get("invite_token");
  const adminCodeParam = params.get("code");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState(adminCodeParam ?? "");
  const [busy, setBusy] = useState(false);

  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [inviteLoading, setInviteLoading] = useState<boolean>(!!inviteToken);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => { if (user) navigate("/dashboard", { replace: true }); }, [user, navigate]);

  // Load + validate invite token
  useEffect(() => {
    if (!inviteToken) return;
    let cancelled = false;
    (async () => {
      setInviteLoading(true);
      setInviteError(null);
      const { data, error } = await supabase
        .from("invited_users" as any)
        .select("id, email, full_name, invite_type, roles, internal_title, status, invited_by")
        .eq("invite_token", inviteToken)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setInviteError("This invite link is invalid or has been revoked.");
        setInviteLoading(false);
        return;
      }
      const inv: any = data;
      if (inv.status === "disabled" || inv.status === "revoked") {
        setInviteError("This invite has been revoked.");
        setInviteLoading(false);
        return;
      }
      if (inv.status === "active") {
        setInviteError("This invite has already been used. Please sign in instead.");
        setInviteLoading(false);
        return;
      }
      let invitedByName: string | null = null;
      if (inv.invited_by) {
        const { data: p } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", inv.invited_by)
          .maybeSingle();
        invitedByName = p?.display_name ?? null;
      }
      setInvite({
        id: inv.id,
        email: inv.email,
        full_name: inv.full_name,
        invite_type: inv.invite_type,
        roles: inv.roles ?? [],
        internal_title: inv.internal_title,
        status: inv.status,
        invited_by_name: invitedByName,
      });
      setEmail(inv.email);
      if (inv.full_name) setName(inv.full_name);
      setInviteLoading(false);
    })();
    return () => { cancelled = true; };
  }, [inviteToken]);

  const emailLocked = useMemo(() => !!invite, [invite]);

  // INVITE-ONLY: block the form when there's no token AND no admin code
  if (!inviteToken && !adminCodeParam && !adminCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <Link to="/" className="inline-flex">
            <img src={logoLight} alt="RTG Media" className="h-12 mx-auto" />
          </Link>
          <div className="eyebrow text-primary">Access Restricted</div>
          <h1 className="font-display text-3xl uppercase">Invite-only signup</h1>
          <p className="text-sm text-muted-foreground">
            RTG Media accounts are created by invitation only. If you have an admin invite code, paste it below.
          </p>
          <div className="space-y-2 text-left">
            <Label className="eyebrow">Admin Invite Code</Label>
            <Input value={adminCode} onChange={(e) => setAdminCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX-XXXX-XXXX" className="h-11 rounded-sm uppercase tracking-widest" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/" className="inline-block">
              <Button variant="outline" className="w-full sm:w-auto h-11 rounded-sm uppercase tracking-widest text-xs">
                Back to homepage
              </Button>
            </Link>
            <Link to="/login" className="inline-block">
              <Button className="w-full sm:w-auto h-11 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteToken) {
      if (inviteError) { toast.error(inviteError); return; }
      if (!invite) { toast.error("Invalid invite. Please use the link from your invitation email."); return; }
    }
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (invite && parsed.data.email.toLowerCase() !== invite.email.toLowerCase()) {
      toast.error("Email must match the invited address.");
      return;
    }
    setBusy(true);
    const { error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.name, adminCode || undefined);
    setBusy(false);
    if (error) { toast.error(error); return; }
    toast.success("Account created");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ink relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        <Link to="/" className="relative flex items-center gap-3">
          <img src={logoLight} alt="RTG Media" className="h-10 " />
        </Link>
        <div className="relative">
          <div className="eyebrow text-primary mb-3">Join the studio</div>
          <h1 className="font-display text-5xl uppercase leading-none">Build the next<br/>chapter with us.</h1>
          <p className="text-muted-foreground mt-6 max-w-md">
            You've been invited. Your access will be applied automatically after signup.
          </p>
        </div>
        <div className="relative text-xs text-muted-foreground uppercase tracking-widest">© RTG Media — Chicago</div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex justify-center mb-4">
            <img src={logoLight} alt="RTG" className="h-10 " />
          </div>
          <div>
            <div className="eyebrow text-primary">Create account</div>
            <h2 className="font-display text-3xl uppercase mt-1">Accept Invitation</h2>
          </div>

          {inviteLoading && (
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Validating invite…</div>
          )}

          {inviteError && (
            <div className="border border-destructive/40 bg-destructive/10 rounded-sm p-3 text-xs text-destructive">
              {inviteError}
            </div>
          )}

          {invite && (
            <div className="border border-primary/30 bg-primary/5 rounded-sm p-4 space-y-2">
              <div className="text-[9px] uppercase tracking-[0.3em] text-primary">Invitation</div>
              <div className="text-sm">
                <span className="text-muted-foreground">Type: </span>
                <span className="uppercase tracking-widest text-xs">{invite.invite_type}</span>
              </div>
              {invite.internal_title && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Title: </span>
                  <span>{invite.internal_title}</span>
                </div>
              )}
              {invite.roles.length > 0 && (
                <div className="text-xs flex flex-wrap gap-1 pt-1">
                  {invite.roles.map((r) => (
                    <span key={r} className="px-1.5 py-0.5 bg-background border border-border rounded-sm uppercase tracking-widest text-[9px]">
                      {ROLE_LABELS[r as keyof typeof ROLE_LABELS] ?? r}
                    </span>
                  ))}
                </div>
              )}
              {invite.invited_by_name && (
                <div className="text-[11px] text-muted-foreground pt-1">
                  Invited by <span className="text-foreground">{invite.invited_by_name}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label className="eyebrow mb-2 block">Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 rounded-sm" />
            </div>
            <div>
              <Label className="eyebrow mb-2 block">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                readOnly={emailLocked}
                className={`h-11 rounded-sm ${emailLocked ? "bg-surface/40 cursor-not-allowed" : ""}`}
              />
              {emailLocked && (
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
                  Locked to invited address
                </p>
              )}
            </div>
            <div>
              <Label className="eyebrow mb-2 block">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 rounded-sm" />
              <p className="text-xs text-muted-foreground mt-1">Min 8 characters. Checked against known breached passwords.</p>
            </div>
            {!inviteToken && (
              <div>
                <Label className="eyebrow mb-2 block">Admin Invite Code</Label>
                <Input value={adminCode} onChange={(e) => setAdminCode(e.target.value.toUpperCase())} required className="h-11 rounded-sm uppercase tracking-widest" placeholder="XXXX-XXXX-XXXX-XXXX" />
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Required for admin/leadership access.</p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={busy || (!!inviteToken && (inviteLoading || !!inviteError || !invite))}
            className="w-full h-11 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {busy ? "Creating…" : "Accept & Create Account"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Already have access? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
