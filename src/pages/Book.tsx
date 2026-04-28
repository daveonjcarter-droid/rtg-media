import { useState } from "react";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const STEPS = [
  { n: "01", t: "Inquiry", d: "Tell us about your project and goals." },
  { n: "02", t: "Consultation", d: "We meet, align, and shape the vision." },
  { n: "03", t: "Deposit", d: "Lock the date, secure the team." },
  { n: "04", t: "Production", d: "We capture, direct, and create." },
  { n: "05", t: "Delivery", d: "Final cut, polished, on time." },
];

const SERVICES = ["Photography", "Videography", "Music Video", "Film Production", "Editing", "Live Event", "Podcast / Audio", "Brand Content"];
const BUDGETS = ["< $2K", "$2K – $5K", "$5K – $10K", "$10K – $25K", "$25K+"];

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

    const { error } = await supabase.from("bookings").insert(payload);
    if (!error) {
      // Best-effort lead capture (non-blocking)
      await supabase.from("leads").insert({
        name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, source: "booking",
      });
    }
    setBusy(false);

    if (error) { toast.error(error.message); return; }
    toast.success("Request received. We'll be in touch within 24 hours.");
    setForm({ name: "", email: "", phone: "", preferred_contact: "email", service: "", project_date: "", duration: "", budget: "", description: "", reference_link: "", location_detail: "", studio_preference: "" });
  };

  return (
    <SiteLayout>
      <section className="container-rtg pt-16 md:pt-20 pb-10 border-b border-border">
        <div className="eyebrow mb-3">Book RTG Media</div>
        <h1 className="font-display text-5xl md:text-7xl uppercase leading-none">Start Your<br />Project.</h1>
        <p className="mt-5 max-w-xl text-muted-foreground">Tell us about your vision. From music videos and brand films to live events and editorial — we'll build the right team for the job.</p>
      </section>

      <section className="container-rtg py-16 grid lg:grid-cols-[1fr_360px] gap-12">
        <form onSubmit={onSubmit} className="bg-surface/40 border border-border p-8 md:p-10 space-y-8">
          {/* Client Info */}
          <div>
            <div className="eyebrow text-primary mb-4">Client Info</div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Full Name" required value={form.name} onChange={(v) => set("name", v)} />
              <Field label="Email" type="email" required value={form.email} onChange={(v) => set("email", v)} />
              <Field label="Phone" required value={form.phone} onChange={(v) => set("phone", v)} placeholder="+1 555 555 5555" />
              <SelectField label="Preferred Contact" value={form.preferred_contact} onChange={(v) => set("preferred_contact", v)} options={["email", "phone", "text"]} />
            </div>
          </div>

          {/* Project Info */}
          <div>
            <div className="eyebrow text-primary mb-4">Project Info</div>
            <div className="grid sm:grid-cols-2 gap-5">
              <SelectField label="Service Type" required value={form.service} onChange={(v) => set("service", v)} options={SERVICES} />
              <div>
                <Label className="eyebrow mb-2 block">Shoot Type *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["studio", "location", "hybrid"] as const).map((t) => (
                    <button type="button" key={t} onClick={() => setShootType(t)}
                      className={`h-12 rounded-sm text-xs uppercase tracking-widest border transition-colors ${
                        shootType === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
              <Field label="Project Date" type="date" value={form.project_date} onChange={(v) => set("project_date", v)} />
              <Field label="Duration" value={form.duration} onChange={(v) => set("duration", v)} placeholder="e.g. 4 hours, half day" />
              <SelectField label="Budget" value={form.budget} onChange={(v) => set("budget", v)} options={BUDGETS} />
              <Field label="Reference Link" value={form.reference_link} onChange={(v) => set("reference_link", v)} placeholder="https://" />
            </div>

            {/* Conditional fields */}
            {shootType !== "location" && (
              <div className="mt-5 grid sm:grid-cols-[1fr_auto] gap-5 items-start">
                <Field label="Studio Preference" value={form.studio_preference} onChange={(v) => set("studio_preference", v)} placeholder="Cyc wall, daylight, blackout…" />
                <div className="text-xs text-muted-foreground bg-background border border-border rounded-sm p-3 max-w-xs">
                  <strong className="text-cream">Studio rental cost</strong> will be added to your final quote.
                </div>
              </div>
            )}
            {shootType !== "studio" && (
              <div className="mt-5 grid sm:grid-cols-[1fr_auto] gap-5 items-start">
                <Field label="Location" required value={form.location_detail} onChange={(v) => set("location_detail", v)} placeholder="City, venue, or address" />
                <div className="text-xs text-muted-foreground bg-background border border-border rounded-sm p-3 max-w-xs">
                  <strong className="text-cream">Travel & logistics</strong> may affect final pricing.
                </div>
              </div>
            )}

            <div className="mt-5">
              <Label className="eyebrow mb-2 block">Project Description *</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} required className="bg-background border-border rounded-sm" placeholder="Tell us about your vision, timeline, and any references…" />
            </div>
          </div>

          <Button type="submit" disabled={busy} className="h-12 px-8 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Sending…" : "Submit Request"}
          </Button>
        </form>

        <aside>
          <div className="border border-border p-8 sticky top-24">
            <div className="eyebrow mb-4">The Process</div>
            <ol className="space-y-6">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="font-display text-2xl text-primary leading-none">{s.n}</span>
                  <div>
                    <div className="font-display text-lg uppercase leading-none">{s.t}</div>
                    <div className="text-sm text-muted-foreground mt-1">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 pt-6 border-t border-border text-sm">
              <div className="eyebrow mb-2">Pricing Structure</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>· Base production</li>
                <li>· Studio rental (if studio)</li>
                <li>· Travel & logistics (if location)</li>
                <li>· Equipment & crew</li>
              </ul>
            </div>
            <div className="mt-6 pt-6 border-t border-border text-sm">
              <div className="eyebrow mb-2">Contact</div>
              <div>hello@rtgmedia.com</div>
              <div className="text-muted-foreground mt-1">Chicago, IL</div>
            </div>
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
