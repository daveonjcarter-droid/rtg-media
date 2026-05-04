import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import logoLight from "@/assets/rtg-logo-light.png";

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(128),
});

const Signup = () => {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const codeParam = params.get("code") ?? params.get("signup_code") ?? "";
  const adminCodeParam = params.get("admin_code") ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState(adminCodeParam);
  const [signupCode, setSignupCode] = useState(codeParam);
  const [codeLabel, setCodeLabel] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [codeAccepted, setCodeAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate("/dashboard", { replace: true }); }, [user, navigate]);

  const validateCode = async () => {
    const code = signupCode.trim();
    if (!code) { setCodeError("Enter your invite code."); return; }
    setValidating(true);
    setCodeError(null);
    const { data, error } = await supabase.rpc("validate_signup_code" as any, { _code: code });
    setValidating(false);
    if (error) { setCodeError(error.message); return; }
    const result = (data as any) ?? {};
    if (!result.valid) {
      setCodeAccepted(false);
      setCodeLabel(null);
      setCodeError(result.error || "Invalid code.");
      return;
    }
    setCodeAccepted(true);
    setCodeLabel(result.label ?? null);
    setCodeError(null);
    toast.success("Code accepted. Complete your account.");
  };

  // Auto-validate when arriving with ?code=
  useEffect(() => {
    if (codeParam && !codeAccepted && !codeError) { validateCode(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = codeAccepted || !!adminCode.trim();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Validate your signup code first.");
      return;
    }
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await signUp(
      parsed.data.email,
      parsed.data.password,
      parsed.data.name,
      adminCode.trim() || undefined,
      undefined,
      codeAccepted ? signupCode.trim() : undefined,
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
          <img src={logoLight} alt="RTG Media" className="h-10" />
        </Link>
        <div className="relative">
          <div className="eyebrow text-primary mb-3">Join the studio</div>
          <h1 className="font-display text-5xl uppercase leading-none">Build the next<br/>chapter with us.</h1>
          <p className="text-muted-foreground mt-6 max-w-md">
            Enter your signup code to create your account. An admin will assign your role after signup.
          </p>
        </div>
        <div className="relative text-xs text-muted-foreground uppercase tracking-widest">© RTG Media — Chicago</div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={onSubmit} noValidate className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex justify-center mb-4">
            <img src={logoLight} alt="RTG" className="h-10" />
          </div>
          <div>
            <div className="eyebrow text-primary">Create account</div>
            <h2 className="font-display text-3xl uppercase mt-1">Staff Signup</h2>
          </div>

          {/* Signup code section */}
          <div className="border border-border rounded-sm p-4 space-y-3 bg-surface/30">
            <div>
              <h3 className="font-display text-base uppercase tracking-widest">Signup code</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the code provided by your admin to unlock account creation.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={signupCode}
                onChange={(e) => { setSignupCode(e.target.value.toUpperCase()); setCodeAccepted(false); setCodeError(null); setCodeLabel(null); }}
                placeholder="Signup code"
                className="h-10 rounded-sm uppercase tracking-widest text-xs"
                disabled={codeAccepted}
              />
              <Button
                type="button"
                onClick={validateCode}
                disabled={validating || codeAccepted}
                className="h-10 rounded-sm uppercase tracking-widest text-[10px] bg-primary text-primary-foreground whitespace-nowrap"
              >
                {validating ? "…" : codeAccepted ? "Accepted" : "Validate Code"}
              </Button>
            </div>
            {codeError && !codeAccepted && (
              <div className="border border-destructive/40 bg-destructive/10 rounded-sm p-2 text-[11px] text-destructive">
                {codeError}
              </div>
            )}
            {codeAccepted && (
              <div className="flex items-start gap-2 border border-emerald-500/30 bg-emerald-500/10 rounded-sm p-2 text-[11px] text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div>
                  Code accepted. Complete your account below.
                  {codeLabel && <div className="text-emerald-400/70 mt-0.5">Code: {codeLabel}</div>}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="eyebrow mb-2 block">Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-sm" />
            </div>
            <div>
              <Label className="eyebrow mb-2 block">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-sm" />
            </div>
            <div>
              <Label className="eyebrow mb-2 block">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-sm" />
              <p className="text-xs text-muted-foreground mt-1">Min 8 characters.</p>
            </div>
            {!codeAccepted && (
              <div>
                <Label className="eyebrow mb-2 block">Admin Invite Code (optional)</Label>
                <Input value={adminCode} onChange={(e) => setAdminCode(e.target.value.toUpperCase())} className="h-11 rounded-sm uppercase tracking-widest" placeholder="XXXX-XXXX-XXXX-XXXX" />
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">For admin/leadership access only.</p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={busy || !canSubmit}
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
