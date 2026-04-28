import { useState } from "react";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const STEPS = [
  { n: "01", t: "Inquiry", d: "Tell us about your project and goals." },
  { n: "02", t: "Consultation", d: "We meet, align, and shape the vision." },
  { n: "03", t: "Deposit", d: "Lock the date, secure the team." },
  { n: "04", t: "Production", d: "We capture, direct, and create." },
  { n: "05", t: "Delivery", d: "Final cut, polished, on time." },
];

const Book = () => {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Request received. We'll be in touch within 24 hours.");
      (e.target as HTMLFormElement).reset();
    }, 700);
  };

  return (
    <SiteLayout>
      <section className="container-rtg pt-16 md:pt-20 pb-10 border-b border-border">
        <div className="eyebrow mb-3">Book RTG Media</div>
        <h1 className="font-display text-5xl md:text-7xl uppercase leading-none">Start Your<br />Project.</h1>
        <p className="mt-5 max-w-xl text-muted-foreground">Tell us about your vision. From music videos and brand films to live events and editorial — we'll build the right team for the job.</p>
      </section>

      <section className="container-rtg py-16 grid lg:grid-cols-[1fr_360px] gap-12">
        <form onSubmit={onSubmit} className="bg-surface/40 border border-border p-8 md:p-10">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Full Name" name="name" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="Phone" name="phone" />
            <SelectField label="Service Type" name="service" options={["Photography", "Videography", "Music Video", "Film Production", "Editing", "Live Event", "Podcast / Audio", "Brand Content"]} />
            <Field label="Project Date" name="date" type="date" />
            <SelectField label="Budget Range" name="budget" options={["< $2K", "$2K – $5K", "$5K – $10K", "$10K – $25K", "$25K+"]} />
            <div className="sm:col-span-2"><Field label="Location" name="location" placeholder="City, venue, or address" /></div>
            <div className="sm:col-span-2">
              <Label className="eyebrow mb-2 block">Project Description</Label>
              <Textarea name="description" rows={5} required className="bg-background border-border rounded-sm" placeholder="Tell us about your vision, timeline, and any references…" />
            </div>
            <div className="sm:col-span-2"><Field label="Reference Link" name="reference" placeholder="https://" /></div>
          </div>
          <Button type="submit" disabled={submitting} className="mt-8 h-12 px-8 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90">
            {submitting ? "Sending…" : "Submit Request"}
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

const Field = ({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) => (
  <div>
    <Label htmlFor={name} className="eyebrow mb-2 block">{label}{required && " *"}</Label>
    <Input id={name} name={name} type={type} required={required} placeholder={placeholder} className="h-12 bg-background border-border rounded-sm" />
  </div>
);

const SelectField = ({ label, name, options }: { label: string; name: string; options: string[] }) => (
  <div>
    <Label htmlFor={name} className="eyebrow mb-2 block">{label}</Label>
    <select id={name} name={name} className="h-12 w-full bg-background border border-border rounded-sm px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
      <option value="">Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default Book;
