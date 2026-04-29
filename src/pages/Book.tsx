import { useState } from "react";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Camera, Home, MapPin, Users, ShieldCheck, Clock, CheckCircle2, Mail, Star,
} from "lucide-react";

const STEPS = [
  { n: "01", t: "Inquiry", d: "Tell us about your project and goals." },
  { n: "02", t: "Consultation", d: "We meet, align, and shape the vision." },
  { n: "03", t: "Deposit", d: "Lock the date, secure the team." },
  { n: "04", t: "Production", d: "We capture, direct, and create." },
  { n: "05", t: "Delivery", d: "Final cut, polished, on time." },
];

const SERVICES = ["Photography", "Videography", "Music Video", "Film Production", "Editing", "Live Event", "Podcast / Audio", "Brand Content"];

const BUDGETS = [
  { value: "< $2K", label: "Under $2K", note: "Single-session shoots, simple edits" },
  { value: "$2K – $5K", label: "$2K – $5K", note: "Half / full day, light crew" },
  { value: "$5K – $10K", label: "$5K – $10K", note: "Multi-day, full crew, post" },
  { value: "$10K – $25K", label: "$10K – $25K", note: "Music videos, brand films" },
  { value: "$25K+", label: "$25K+", note: "Episodic, large-scale productions" },
];

const SHOOT_TYPES = [
  { value: "studio", label: "Studio", icon: Home, desc: "Controlled environment. Lighting, cyc walls, blackout. Studio rental added to quote." },
  { value: "location", label: "On Location", icon: MapPin, desc: "We come to you. Travel & logistics may affect pricing based on distance." },
  { value: "hybrid", label: "Hybrid", icon: Camera, desc: "Combination of both. We'll scope studio + location together during the call." },
] as const;

const TRUST = [
  { icon: ShieldCheck, label: "Black-owned & operated" },
  { icon: Clock, label: "24-hour response time" },
  { icon: Users, label: "Full in-house production team" },
  { icon: Star, label: "Cinematic quality, every shoot" },
];

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7, "Phone is required").max(40),
  preferred_contact: z.enum(["email", "phone", "text"]),
  service: z.string().min(1, "Select a service"),
  shoot_type: z.enum(["studio", "location", "hybrid"]),
  project_date: z.string().optional(),
  duration: z.string().max(60).optional(),
  budget: z.string().optional(),
  description: z.string().trim().min(10, "Please add a few details").max(2000),
  reference_link: z.string().trim().max(500).optional().or(z.literal("")),
  location_detail: z.string().max(255).optional(),
  studio_preference: z.string().max(255).optional(),
});

const Book = () => {
  const [busy, setBusy] = useState(false);
  const [shootType, setShootType] = useState<"studio" | "location" | "hybrid">("studio");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", preferred_contact: "email" as const,
    service: "", project_date: "", duration: "", budget: "",
    description: "", reference_link: "", location_detail: "", studio_preference: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ ...form, shoot_type: shootType });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setBusy(true);
    const payload = {
      ...parsed.data,
      project_date: parsed.data.project_date || null,
      reference_link: parsed.data.reference_link || null,
      location_detail: shootType === "studio" ? null : parsed.data.location_detail || null,
      studio_preference: shootType === "location" ? null : parsed.data.studio_preference || null,
    };

    const { error } = await supabase.from("bookings").insert(payload as any);
    if (!error) {
      await supabase.from("leads").insert({
        name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, source: "booking",
      });
    }
    setBusy(false);

    if (error) { toast.error(error.message); return; }
    toast.success("Request received. We'll be in touch within 24 hours.");
    setSubmitted(true);
    setForm({ name: "", email: "", phone: "", preferred_contact: "email", service: "", project_date: "", duration: "", budget: "", description: "", reference_link: "", location_detail: "", studio_preference: "" });
  };

  if (submitted) {
    return (
      <SiteLayout>
        <section className="container-rtg py-24 md:py-32 max-w-2xl">
          <div className="border border-border bg-surface/40 p-10 md:p-14 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-primary mb-6" />
            <div className="eyebrow text-primary mb-3">Request received</div>
            <h2 className="type-mega text-4xl md:text-5xl mb-5">Thank you.</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We've received your project details. A member of the RTG team will be in touch within 24 hours
              to schedule your consultation.
            </p>
            <Button onClick={() => setSubmitted(false)} className="mt-8 rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7">
              Submit Another Request
            </Button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="bg-ink text-cream border-b border-border grain-heavy">
        <div className="container-rtg pt-20 md:pt-28 pb-14 md:pb-20">
          <div className="eyebrow text-primary mb-4">Book RTG Media</div>
          <h1 className="type-mega text-5xl md:text-7xl lg:text-8xl leading-[0.9] text-cream">
            Start Your<br /><span className="text-hollow-primary">Project.</span>
          </h1>
          <p className="mt-6 max-w-xl text-cream/80 text-lg leading-relaxed">
            Music videos. Brand films. Live events. Editorial. Tell us about your vision —
            we'll build the right team for the job and respond within 24 hours.
          </p>

          {/* Trust strip */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-cream/20 border border-cream/20 max-w-3xl">
            {TRUST.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="bg-ink p-4 flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-cream/85 leading-tight">
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container-rtg py-14 md:py-20 grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-14">
        <form onSubmit={onSubmit} className="bg-surface/40 border border-border p-7 md:p-10 space-y-10">
          {/* 1. Client Info */}
          <div>
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
              <span className="font-condensed text-2xl text-primary leading-none">01</span>
              <div>
                <div className="font-display text-base uppercase leading-none">Your Info</div>
                <div className="text-xs text-muted-foreground mt-1">How we'll reach you</div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Full Name" required value={form.name} onChange={(v) => set("name", v)} />
              <Field label="Email" type="email" required value={form.email} onChange={(v) => set("email", v)} />
              <Field label="Phone" required value={form.phone} onChange={(v) => set("phone", v)} placeholder="+1 555 555 5555" />
              <SelectField label="Preferred Contact" value={form.preferred_contact} onChange={(v) => set("preferred_contact", v)} options={["email", "phone", "text"]} />
            </div>
          </div>

          {/* 2. Project */}
          <div>
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
              <span className="font-condensed text-2xl text-primary leading-none">02</span>
              <div>
                <div className="font-display text-base uppercase leading-none">Project Details</div>
                <div className="text-xs text-muted-foreground mt-1">What you need from us</div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 mb-6">
              <SelectField label="Service Type" required value={form.service} onChange={(v) => set("service", v)} options={SERVICES} />
              <Field label="Project Date" type="date" value={form.project_date} onChange={(v) => set("project_date", v)} />
              <Field label="Duration" value={form.duration} onChange={(v) => set("duration", v)} placeholder="e.g. 4 hours, half day" />
              <Field label="Reference Link" value={form.reference_link} onChange={(v) => set("reference_link", v)} placeholder="https://" />
            </div>

            {/* Shoot type cards */}
            <div className="mb-6">
              <Label className="eyebrow mb-3 block">Shoot Location *</Label>
              <div className="grid md:grid-cols-3 gap-3">
                {SHOOT_TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = shootType === t.value;
                  return (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => setShootType(t.value)}
                      className={`text-left p-4 border transition-colors ${
                        active
                          ? "bg-primary/10 border-primary"
                          : "border-border hover:border-foreground bg-background"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-foreground"}`} />
                        <span className={`font-display text-sm uppercase tracking-widest ${active ? "text-primary" : ""}`}>
                          {t.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional */}
            {shootType !== "location" && (
              <div className="mb-5">
                <Field label="Studio Preference (optional)" value={form.studio_preference} onChange={(v) => set("studio_preference", v)} placeholder="Cyc wall, daylight, blackout…" />
              </div>
            )}
            {shootType !== "studio" && (
              <div className="mb-5">
                <Field label="Location" required value={form.location_detail} onChange={(v) => set("location_detail", v)} placeholder="City, venue, or address" />
              </div>
            )}

            <div>
              <Label className="eyebrow mb-2 block">Project Description *</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} required className="bg-background border-border rounded-sm" placeholder="Tell us about your vision, timeline, deliverables, and any references…" />
            </div>
          </div>

          {/* 3. Budget */}
          <div>
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
              <span className="font-condensed text-2xl text-primary leading-none">03</span>
              <div>
                <div className="font-display text-base uppercase leading-none">Budget Range</div>
                <div className="text-xs text-muted-foreground mt-1">Helps us scope the right team. Final quote is custom.</div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {BUDGETS.map((b) => {
                const active = form.budget === b.value;
                return (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => set("budget", b.value)}
                    className={`p-3 text-left border transition-colors ${
                      active ? "bg-primary/10 border-primary" : "border-border hover:border-foreground bg-background"
                    }`}
                  >
                    <div className={`font-display text-sm uppercase ${active ? "text-primary" : ""}`}>{b.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider leading-snug">
                      {b.note}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" disabled={busy} className="w-full md:w-auto h-12 px-8 rounded-sm uppercase tracking-[0.25em] text-xs bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Sending…" : "Submit Request"}
          </Button>
          <p className="text-xs text-muted-foreground -mt-4">
            By submitting, you agree to be contacted by RTG Media regarding your project. No spam — ever.
          </p>
        </form>

        <aside className="space-y-5">
          {/* Process */}
          <div className="border border-border bg-background p-7">
            <div className="eyebrow mb-5">The Process</div>
            <ol className="space-y-5">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="font-display text-2xl text-primary leading-none w-8 shrink-0">{s.n}</span>
                  <div>
                    <div className="font-display text-sm uppercase leading-none">{s.t}</div>
                    <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* What's included in pricing */}
          <div className="border border-border bg-background p-7">
            <div className="eyebrow mb-4">What Affects Pricing</div>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">·</span>
                <div>
                  <div className="text-foreground">Base production</div>
                  <div className="text-[11px] text-muted-foreground">Crew, direction, on-set</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">·</span>
                <div>
                  <div className="text-foreground">Equipment & setup</div>
                  <div className="text-[11px] text-muted-foreground">Cameras, lighting, audio</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">·</span>
                <div>
                  <div className="text-foreground">Studio rental <span className="text-muted-foreground">(if studio)</span></div>
                  <div className="text-[11px] text-muted-foreground">Booked separately</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">·</span>
                <div>
                  <div className="text-foreground">Travel & logistics <span className="text-muted-foreground">(if location)</span></div>
                  <div className="text-[11px] text-muted-foreground">Distance-based</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">·</span>
                <div>
                  <div className="text-foreground">Post-production</div>
                  <div className="text-[11px] text-muted-foreground">Editing, color, sound</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="border border-border bg-ink text-cream p-7">
            <div className="eyebrow text-primary mb-3">Direct Line</div>
            <a href="https://runnerstogreatness.com" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
              <Mail className="h-3.5 w-3.5" /> runnerstogreatness.com
            </a>
            <div className="text-xs text-cream/60 mt-2">Chicago, IL</div>
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
};

const Field = ({ label, type = "text", required, placeholder, value, onChange }: { label: string; type?: string; required?: boolean; placeholder?: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <Label className="eyebrow mb-2 block">{label}{required && " *"}</Label>
    <Input type={type} required={required} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 bg-background border-border rounded-sm" />
  </div>
);

const SelectField = ({ label, options, required, value, onChange }: { label: string; options: string[]; required?: boolean; value: string; onChange: (v: string) => void }) => (
  <div>
    <Label className="eyebrow mb-2 block">{label}{required && " *"}</Label>
    <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full bg-background border border-border rounded-sm px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary capitalize">
      <option value="">Select…</option>
      {options.map((o) => <option key={o} value={o} className="capitalize">{o}</option>)}
    </select>
  </div>
);

export default Book;
