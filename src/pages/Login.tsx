import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoLight from "@/assets/rtg-logo-light.png";

const Login = () => {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate(from, { replace: true }); }, [user, from, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) { toast.error(error); return; }
    toast.success("Welcome back");
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ink relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        <Link to="/" className="relative flex items-center gap-3">
          <img src={logoLight} alt="RTG Media" className="h-10 " />
        </Link>
        <div className="relative">
          <div className="eyebrow text-primary mb-3">RTG Studio</div>
          <h1 className="font-display text-5xl uppercase leading-none">Tell the story.<br/>Move the culture.</h1>
          <p className="text-muted-foreground mt-6 max-w-md">The internal publishing system for RTG Media editors, writers, and producers.</p>
        </div>
        <div className="relative text-xs text-muted-foreground uppercase tracking-widest">© RTG Media — Chicago</div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex justify-center mb-4">
            <img src={logoLight} alt="RTG" className="h-10 " />
          </div>
          <div>
            <div className="eyebrow text-primary">Sign in</div>
            <h2 className="font-display text-3xl uppercase mt-1">Studio Access</h2>
            <p className="text-sm text-muted-foreground mt-2">Use your RTG team credentials.</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="eyebrow mb-2 block">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-sm" autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password" className="eyebrow mb-2 block">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-sm" autoComplete="current-password" />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot?</Link>
            </div>
          </div>

          <Button type="submit" disabled={busy} className="w-full h-11 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Signing in…" : "Sign In"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Need an account? <Link to="/signup" className="text-primary hover:underline">Request access</Link>
          </p>
          <p className="text-xs text-muted-foreground text-center">
            <Link to="/" className="hover:text-foreground">← Back to site</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
