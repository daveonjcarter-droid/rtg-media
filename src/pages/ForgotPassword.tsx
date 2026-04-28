import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/rtg-logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success("If an account exists, a reset link is on the way.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
        <Link to="/" className="flex justify-center mb-4"><img src={logo} alt="RTG" className="h-10 invert" /></Link>
        <div className="text-center">
          <div className="eyebrow text-primary">Reset</div>
          <h2 className="font-display text-3xl uppercase mt-1">Forgot Password</h2>
          <p className="text-sm text-muted-foreground mt-2">Enter your email and we'll send a reset link.</p>
        </div>
        {sent ? (
          <div className="border border-border p-6 text-center text-sm bg-surface/40">
            Check your inbox for a reset link.
          </div>
        ) : (
          <>
            <div>
              <Label className="eyebrow mb-2 block">Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-sm" />
            </div>
            <Button type="submit" className="w-full h-11 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              Send Reset Link
            </Button>
          </>
        )}
        <p className="text-xs text-muted-foreground text-center">
          <Link to="/login" className="hover:text-foreground">← Back to sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;
