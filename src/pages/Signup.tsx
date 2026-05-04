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

const INVALID_INVITE_MSG = "Your invite link is invalid or expired. Please contact RTG Media admin for a new invite.";

const Signup = () => {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inviteToken = params.get("invite_token");
  const adminCodeParam = params.get("code");
  const staffCodeParam = params.get("staff_code");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState(adminCodeParam ?? "");
  const [staffCode, setStaffCode] = useState(staffCodeParam ?? "");
  const [showStaffCode, setShowStaffCode] = useState(!!staffCodeParam);
  const [busy, setBusy] = useState(false);

  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [inviteLoading, setInviteLoading] = useState<boolean>(!!inviteToken);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Backup code lookup state
  const [staffCodeInvite, setStaffCodeInvite] = useState<InvitePreview | null>(null);
  const [staffCodeError, setStaffCodeError] = useState<string | null>(null);
  const [staffCodeChecking, setStaffCodeChecking] = useState(false);

  useEffect(() => { if (user) navigate("/dashboard", { replace: true }); }, [user, navigate]);

  const loadInviteRow = async (whereCol: "invite_token" | "invite_code", value: string) => {
    const { data, error } = await supabase
      .from("invited_users" as any)
      .select("id, email, full_name, invite_type, roles, internal_title, status, invited_by, expires_at, invite_code, invite_token")
      .eq(whereCol, whereCol === "invite_code" ? value.toUpperCase() : value)
      .maybeSingle();
    if (error || !data) return { error: INVALID_INVITE_MSG, inv: null as any };
    const inv: any = data;
    if (inv.status === "disabled" || inv.status === "revoked") return { error: "This invite has been revoked.", inv: null };
    if (inv.status === "active") return { error: "This invite has already been used. Please sign in instead.", inv: null };
    if (inv.expires_at && new Date(inv.expires_at) < new Date()) return { error: INVALID_INVITE_MSG, inv: null };
    let invitedByName: string | null = null;
    if (inv.invited_by) {
      const { data: p } = await supabase.from("profiles").select("display_name").eq("id", inv.invited_by).maybeSingle();
      invitedByName = p?.display_name ?? null;
    }
    const preview: InvitePreview = {
      id: inv.id, email: inv.email, full_name: inv.full_name,
      invite_type: inv.invite_type, roles: inv.roles ?? [],
      internal_title: inv.internal_title, status: inv.status,
      invited_by_name: invitedByName,
    };
    return { error: null as string | null, inv: preview };
  };

  // Load + validate invite token from URL
  useEffect(() => {
    if (!inviteToken) return;
    let cancelled = false;
    (async () => {
      setInviteLoading(true);
      setInviteError(null);
      const { error, inv } = await loadInviteRow("invite_token", inviteToken);
      if (cancelled) return;
      if (error || !inv) { setInviteError(error || INVALID_INVITE_MSG); setInviteLoading(false); return; }
      setInvite(inv);
      setEmail(inv.email);
      if (inv.full_name) setName(inv.full_name);
      setInviteLoading(false);
    })();
    return () => { cancelled = true; };
  }, [inviteToken]);

  const checkStaffCode = async () => {
    const code = staffCode.trim().toUpperCase();
    if (!code) { setStaffCodeError("Enter your invite code."); return; }
    setStaffCodeChecking(true);
    setStaffCodeError(null);
    const { error, inv } = await loadInviteRow("invite_code", code);
    setStaffCodeChecking(false);
    if (error || !inv) { setStaffCodeError(error || INVALID_INVITE_MSG); setStaffCodeInvite(null); return; }
    setStaffCodeInvite(inv);
    setEmail(inv.email);
    if (inv.full_name) setName(inv.full_name);
    toast.success("Invite code accepted");
  };

  const activeInvite = invite || staffCodeInvite;
  const emailLocked = useMemo(() => !!activeInvite, [activeInvite]);

  // INVITE-ONLY: block when no token, no admin code, no staff code attempt
  if (!inviteToken && !adminCodeParam && !adminCode && !showStaffCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <Link to="/" className="inline-flex">
            <img src={logoLight} alt="RTG Media" className="h-12 mx-auto" />
          </Link>
          <div className="eyebrow text-primary">Access Restricted</div>
          <h1 className="font-display text-3xl uppercase">Invite-only signup</h1>
          <p className="text-sm text-muted-foreground">
            RTG Media accounts are created by invitation only. Use the link from your invite email,
            or enter a code below if you have one.
          </p>
          <div className="space-y-3 text-left">
            <div>
              <Label className="eyebrow">Admin Invite Code</Label>
              <Input value={adminCode} onChange={(e) => setAdminCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX-XXXX-XXXX" className="h-11 rounded-sm uppercase tracking-widest mt-1" />
            </div>
            <div className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">— or —</div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowStaffCode(true)}
              className="w-full h-11 rounded-sm uppercase tracking-widest text-xs"
            >
              Use staff invite code
            </Button>
          </div>
          <div className="flex justify-center pt-2">
            <Link to="/login" className="inline-block">
              <Button className="h-11 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90">
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
      if (!invite) { toast.error(INVALID_INVITE_MSG); return; }
    }
    if (showStaffCode && !staffCodeInvite) {
      toast.error("Validate your staff invite code before continuing.");
      return;
    }
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (activeInvite && parsed.data.email.toLowerCase() !== activeInvite.email.toLowerCase()) {
      toast.error("Email must match the invited address.");
      return;
    }
    setBusy(true);
    const { error } = await signUp(
      parsed.data.email,
      parsed.data.password,
      parsed.data.name,
      adminCode || undefined,
      staffCodeInvite ? staffCode.trim().toUpperCase() : undefined,
    );
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
            <div className="border border-destructive/40 bg-destructive/10 rounded-sm p-3 text-xs text-destructive space-y-2">
              <div>{inviteError}</div>
              <button
                type="button"
                onClick={() => setShowStaffCode(true)}
                className="underline uppercase tracking-widest text-[10px]"
              >
                Have a backup invite code? Enter it below.
              </button>
            </div>
          )}

          {/* Backup invite code section */}
          {showStaffCode && !invite && (
            <div className="border border-border rounded-sm p-3 space-y-2 bg-surface/30">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Having trouble with your invite link? Enter your staff invite code.
              </div>
              <div className="flex gap-2">
                <Input
                  value={staffCode}
                  onChange={(e) => { setStaffCode(e.target.value.toUpperCase()); setStaffCodeInvite(null); setStaffCodeError(null); }}
                  placeholder="XXXX-XXXX-XXXX"
                  className="h-10 rounded-sm uppercase tracking-widest text-xs"
                />
                <Button type="button" onClick={checkStaffCode} disabled={staffCodeChecking} className="h-10 rounded-sm uppercase tracking-widest text-[10px] bg-primary text-primary-foreground">
                  {staffCodeChecking ? "…" : "Verify"}
                </Button>
              </div>
              {staffCodeError && <div className="text-[11px] text-destructive">{staffCodeError}</div>}
              {staffCodeInvite && <div className="text-[11px] text-emerald-400">Code valid — finish signup below.</div>}
            </div>
          )}

          {activeInvite && (
            <div className="border border-primary/30 bg-primary/5 rounded-sm p-4 space-y-2">
              <div className="text-[9px] uppercase tracking-[0.3em] text-primary">Invitation</div>
              <div className="text-sm">
                <span className="text-muted-foreground">Type: </span>
                <span className="uppercase tracking-widest text-xs">{activeInvite.invite_type}</span>
              </div>
              {activeInvite.internal_title && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Title: </span>
                  <span>{activeInvite.internal_title}</span>
                </div>
              )}
              {activeInvite.roles.length > 0 && (
                <div className="text-xs flex flex-wrap gap-1 pt-1">
                  {activeInvite.roles.map((r) => (
                    <span key={r} className="px-1.5 py-0.5 bg-background border border-border rounded-sm uppercase tracking-widest text-[9px]">
                      {ROLE_LABELS[r as keyof typeof ROLE_LABELS] ?? r}
                    </span>
                  ))}
                </div>
              )}
              {activeInvite.invited_by_name && (
                <div className="text-[11px] text-muted-foreground pt-1">
                  Invited by <span className="text-foreground">{activeInvite.invited_by_name}</span>
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
            {!inviteToken && !showStaffCode && (
              <div>
                <Label className="eyebrow mb-2 block">Admin Invite Code</Label>
                <Input value={adminCode} onChange={(e) => setAdminCode(e.target.value.toUpperCase())} required className="h-11 rounded-sm uppercase tracking-widest" placeholder="XXXX-XXXX-XXXX-XXXX" />
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Required for admin/leadership access.</p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={busy || (!!inviteToken && (inviteLoading || !!inviteError || !invite)) || (showStaffCode && !staffCodeInvite && !invite)}
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
