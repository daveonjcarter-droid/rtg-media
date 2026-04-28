import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import logoLight from "@/assets/rtg-logo-light.png";

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(128),
});

const Signup = () => {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate("/dashboard", { replace: true }); }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.name);
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
          <p className="text-muted-foreground mt-6 max-w-md">New accounts default to Writer. An Admin will assign you elevated roles when ready.</p>
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
            <h2 className="font-display text-3xl uppercase mt-1">Request Access</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="eyebrow mb-2 block">Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 rounded-sm" />
            </div>
            <div>
              <Label className="eyebrow mb-2 block">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-sm" />
            </div>
            <div>
              <Label className="eyebrow mb-2 block">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 rounded-sm" />
              <p className="text-xs text-muted-foreground mt-1">Min 8 characters. Checked against known breached passwords.</p>
            </div>
            <div>
              <Label className="eyebrow mb-2 block">Role</Label>
              <div className="h-11 px-3 flex items-center text-sm border border-border rounded-sm bg-surface/40 text-muted-foreground">Writer (default)</div>
            </div>
          </div>

          <Button type="submit" disabled={busy} className="w-full h-11 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Creating…" : "Create Account"}
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
