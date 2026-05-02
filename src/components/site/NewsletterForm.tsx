import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/tracking";

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email("Please enter a valid email").max(255),
});

const NewsletterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name: name || undefined, email });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: parsed.data.email, name: parsed.data.name ?? null } as any);
    if (!error) {
      await supabase.from("leads").insert({ name: parsed.data.name ?? null, email: parsed.data.email, source: "newsletter" } as any);
      trackEvent("newsletter_signup", { email: parsed.data.email });
    }
    setBusy(false);
    if (error && !/duplicate/i.test(error.message)) { toast.error(error.message); return; }
    toast.success("You're on the list.");
    setName(""); setEmail("");
  };

  return (
    <form onSubmit={onSubmit} className="bg-surface border border-border p-8 md:p-10">
      <div className="font-display text-2xl uppercase mb-1">Join the movement</div>
      <div className="text-sm text-muted-foreground mb-6">Newsletter · Weekly</div>
      <div className="space-y-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-12 bg-background border-border rounded-sm" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email address" className="h-12 bg-background border-border rounded-sm" />
        <Button type="submit" disabled={busy} className="w-full h-12 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90">
          {busy ? "Subscribing…" : "Subscribe"}
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">By subscribing you agree to receive emails from RTG Media.</p>
    </form>
  );
};

export default NewsletterForm;
