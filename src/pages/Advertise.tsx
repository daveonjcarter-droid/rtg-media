import { useState } from "react";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const PACKAGES = [
  { t: "Sponsored Articles", d: "Long-form editorial features written by RTG journalists." },
  { t: "Banner Ads", d: "Premium display placements across runnertogreatness.com" },
  { t: "Social Campaigns", d: "Multi-platform content built for IG, TikTok and X." },
  { t: "Video Sponsorships", d: "Branded segments inside RTG Breakdown and originals." },
  { t: "Event Coverage", d: "Full-cam coverage of activations and launches." },
  { t: "Newsletter Placement", d: "Reach our subscribed culture audience directly." },
];

const schema = z.object({
  brand: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  budget: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(2000),
});

const Advertise = () => {
  const [form, setForm] = useState({ brand: "", name: "", email: "", budget: "", message: "" });
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.from("advertise_inquiries").insert({ ...parsed.data, budget: parsed.data.budget || null } as any);
    if (!error) {
      await supabase.from("leads").insert({ name: parsed.data.name, email: parsed.data.email, source: "advertise" });
    }
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Inquiry received. Our partnerships team will reply soon.");
    setForm({ brand: "", name: "", email: "", budget: "", message: "" });
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <SiteLayout>
      <section className="container-rtg pt-16 md:pt-20 pb-10 border-b border-border">
        <div className="eyebrow mb-3">Partnerships</div>
        <h1 className="font-display text-5xl md:text-7xl uppercase leading-none">Advertise<br />With RTG.</h1>
        <p className="mt-5 max-w-xl text-muted-foreground">Reach a culture-driven audience through editorial, video, and live experiences. Built for brands that want to move with the moment.</p>
      </section>

      <section className="container-rtg py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {PACKAGES.map((p) => (
            <div key={p.t} className="bg-background p-8 hover:bg-surface transition-colors">
              <div className="font-display text-2xl uppercase">{p.t}</div>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-rtg pb-20">
        <form onSubmit={onSubmit} className="bg-surface/40 border border-border p-8 md:p-10 max-w-3xl mx-auto">
          <div className="font-display text-3xl uppercase mb-6">Inquiry Form</div>
          <div className="grid sm:grid-cols-2 gap-5">
            <F label="Brand / Company" required value={form.brand} onChange={(v) => set("brand", v)} />
            <F label="Contact Name" required value={form.name} onChange={(v) => set("name", v)} />
            <F label="Email" type="email" required value={form.email} onChange={(v) => set("email", v)} />
            <F label="Budget Range" value={form.budget} onChange={(v) => set("budget", v)} />
            <div className="sm:col-span-2">
              <Label className="eyebrow mb-2 block">Tell us about your campaign *</Label>
              <Textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={5} required className="bg-background border-border rounded-sm" />
            </div>
          </div>
          <Button type="submit" disabled={busy} className="mt-6 h-12 px-8 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Sending…" : "Submit Inquiry"}
          </Button>
        </form>
      </section>
    </SiteLayout>
  );
};

const F = ({ label, type = "text", required, value, onChange }: { label: string; type?: string; required?: boolean; value: string; onChange: (v: string) => void }) => (
  <div>
    <Label className="eyebrow mb-2 block">{label}{required && " *"}</Label>
    <Input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 bg-background border-border rounded-sm" />
  </div>
);

export default Advertise;
