import { useMemo, useState } from "react";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Music, Film, Camera, Calendar, Mic, Sparkles,
  Home, MapPin, HelpCircle, ArrowRight, ArrowLeft,
  CheckCircle2, ShieldCheck, Clock, Users, Star, Instagram,
} from "lucide-react";

/* ============ Step config ============ */

const PROJECT_TYPES = [
  { value: "Music Video", icon: Music, desc: "Singles, visualizers, performance pieces." },
  { value: "Film / Short Film", icon: Film, desc: "Narrative shorts, documentaries, scenes." },
  { value: "Photography", icon: Camera, desc: "Editorial, fashion, portrait, product." },
  { value: "Event Coverage", icon: Calendar, desc: "Live shows, launches, recap edits." },
  { value: "Podcast / Interview", icon: Mic, desc: "Studio sit-downs, multi-cam audio." },
  { value: "Brand Content", icon: Sparkles, desc: "Campaigns, social, commercial spots." },
] as const;

const SHOOT_TYPES = [
  { value: "Studio", icon: Home, desc: "Controlled environment, lighting, cyc." },
  { value: "Location", icon: MapPin, desc: "We come to you — on-location capture." },
  { value: "Not Sure", icon: HelpCircle, desc: "We'll scope it together on the call." },
] as const;

const BUDGETS = [
  { value: "$300 – $700", note: "Quick session, single deliverable" },
  { value: "$700 – $1500", note: "Half-day shoots, light edit" },
  { value: "$1500 – $3000", note: "Full-day, full crew, post" },
  { value: "$3000+", note: "Multi-day, larger productions" },
] as const;

const TIMELINES = [
  { value: "ASAP", note: "Within the next few days" },
  { value: "Within 2 weeks", note: "Tight but workable" },
  { value: "Within a month", note: "Healthy planning window" },
  { value: "Flexible", note: "We'll find the right slot" },
] as const;

const TRUST = [
  { icon: ShieldCheck, label: "Black-owned & operated" },
  { icon: Clock, label: "48-HOUR RESPONSE TIME" },
  { icon: Users, label: "Full in-house team" },
  { icon: Star, label: "Cinematic quality" },
];

const BASELINE_PRICE = "$300";

const STEP_TITLES = [
  "Project Type",
  "Shoot Type",
  "Budget Range",
  "Timeline",
  "Project Details",
  "Contact Info",
];

/* ============ Validation ============ */

const PROJECT_VALUES = PROJECT_TYPES.map((p) => p.value) as [string, ...string[]];
const SHOOT_VALUES = SHOOT_TYPES.map((s) => s.value) as [string, ...string[]];
const BUDGET_VALUES = BUDGETS.map((b) => b.value) as [string, ...string[]];
const TIMELINE_VALUES = TIMELINES.map((t) => t.value) as [string, ...string[]];

const fullSchema = z.object({
  project_type: z.enum(PROJECT_VALUES, { errorMap: () => ({ message: "Pick a project type" }) }),
  shoot_type: z.enum(SHOOT_VALUES, { errorMap: () => ({ message: "Pick a shoot type" }) }),
  budget: z.enum(BUDGET_VALUES, { errorMap: () => ({ message: "Pick a budget range" }) }),
  timeline: z.enum(TIMELINE_VALUES, { errorMap: () => ({ message: "Pick a timeline" }) }),
  description: z.string().trim().min(10, "Tell us a bit more (min 10 chars)").max(2000),
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Phone number is required").max(40),
  instagram: z.string().trim().max(60).optional().or(z.literal("")),
});

type FormState = {
  project_type: string;
  event_type: string;
  shoot_type: string;
  budget: string;
  timeline: string;
  description: string;
  name: string;
  email: string;
  phone: string;
  instagram: string;
};

const EMPTY: FormState = {
  project_type: "", event_type: "", shoot_type: "", budget: "", timeline: "",
  description: "", name: "", email: "", phone: "", instagram: "",
};

const EVENT_TYPES = [
  { value: "Concert", desc: "Live performance, artist shows, and stage coverage." },
  { value: "Event", desc: "Private events, celebrations, parties, and special occasions." },
  { value: "Other", desc: "For anything outside standard categories." },
] as const;

/* ============ Page ============ */

const Book = () => {
  const [step, setStep] = useState(0); // 0..5 (6 input steps), 6 = submitted
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const stepValid = useMemo(() => {
    switch (step) {
      case 0:
        if (!form.project_type) return false;
        if (form.project_type === "Event Coverage" && !form.event_type) return false;
        return true;
      case 1: return !!form.shoot_type;
      case 2: return !!form.budget;
      case 3: return !!form.timeline;
      case 4: return form.description.trim().length >= 10;
      case 5: return form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) && form.phone.trim().length >= 7;
      default: return false;
    }
  }, [step, form]);

  const next = () => {
    if (!stepValid) return;
    setStep((s) => Math.min(5, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    const parsed = fullSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setBusy(true);
    const payload = {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      instagram: parsed.data.instagram || null,
      project_type: parsed.data.project_type,
      service: form.project_type === "Event Coverage" && form.event_type
        ? `${parsed.data.project_type} — ${form.event_type}`
        : parsed.data.project_type,
      timeline: parsed.data.timeline,
      budget: parsed.data.budget,
      description: form.project_type === "Event Coverage" && form.event_type
        ? `[Event type: ${form.event_type}]\n\n${parsed.data.description}`
        : parsed.data.description,
      preferred_contact: "email" as const,
    };

    const { error } = await supabase.from("bookings").insert(payload as any);
    if (!error) {
      await supabase.from("leads").insert({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        source: "booking" as const,
      });
    }
    setBusy(false);

    if (error) { toast.error(error.message); return; }
    toast.success("Project submitted. We'll be in touch.");
    setStep(6);
  };

  /* ============ Confirmation ============ */
  if (step === 6) {
    return (
      <SiteLayout>
        <section className="container-rtg py-24 md:py-32 max-w-2xl">
          <div className="border border-border bg-surface/40 p-10 md:p-14 text-center relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute inset-0 grain opacity-40" />
            <CheckCircle2 className="relative h-12 w-12 mx-auto text-primary mb-6" />
            <div className="relative eyebrow text-primary mb-3">Project received</div>
            <h2 className="relative type-mega text-4xl md:text-5xl mb-5">Thank you.</h2>
            <p className="relative text-muted-foreground max-w-md mx-auto">
              RTG will review your project and reach out within{" "}
              <span className="text-foreground font-medium">24–48 hours</span>.
            </p>
            <Button
              onClick={() => { setForm(EMPTY); setStep(0); }}
              className="relative mt-8 rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7"
            >
              Submit Another Project
            </Button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  /* ============ Form Flow ============ */
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="bg-ink text-cream border-b border-border grain-heavy">
        <div className="container-rtg pt-20 md:pt-24 pb-10 md:pb-14">
          <div className="eyebrow text-primary mb-4">Book RTG Media</div>
          <h1 className="type-mega text-5xl md:text-7xl lg:text-8xl leading-[0.9] text-cream">
            Start Your<br />
            <span className="text-hollow-primary">Project.</span>
          </h1>
          <p className="mt-6 max-w-xl text-cream/80 text-lg leading-relaxed">
            A guided intake — six quick steps. We'll review and respond in 24–48 hours.
          </p>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-cream/20 border border-cream/20 max-w-3xl">
            {TRUST.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="bg-ink p-3 flex items-center gap-2.5">
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

      {/* STEPPER */}
      <section className="border-b border-border bg-background sticky top-16 z-30 backdrop-blur-xl bg-background/80">
        <div className="container-rtg py-4 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {STEP_TITLES.map((t, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={t} className="flex items-center gap-3 shrink-0">
                <div className={`flex items-center gap-2 ${active ? "text-foreground" : done ? "text-primary" : "text-muted-foreground"}`}>
                  <span
                    className={`flex h-6 w-6 items-center justify-center text-[10px] font-bold border ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : done
                        ? "border-primary text-primary"
                        : "border-border"
                    }`}
                  >
                    {done ? "✓" : String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.25em] font-bold whitespace-nowrap">
                    {t}
                  </span>
                </div>
                {i < STEP_TITLES.length - 1 && (
                  <span className={`h-px w-6 ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FORM CARD */}
      <section className="container-rtg py-14 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-surface/40 border border-border p-7 md:p-12">
            {/* STEP HEADER */}
            <div className="flex items-baseline justify-between mb-8 pb-5 border-b border-border">
              <div>
                <div className="eyebrow text-primary mb-2">
                  Step {step + 1} of {STEP_TITLES.length}
                </div>
                <h2 className="type-mega text-3xl md:text-4xl leading-none">
                  {STEP_TITLES[step]}
                </h2>
              </div>
              <div className="font-condensed text-3xl text-muted-foreground/40">
                {String(step + 1).padStart(2, "0")}
              </div>
            </div>

            {/* STEP BODY */}
            <div className="min-h-[280px]">
              {step === 0 && (
                <>
                  <CardGrid>
                    {PROJECT_TYPES.map((p) => (
                      <ChoiceCard
                        key={p.value}
                        icon={p.icon}
                        label={p.value}
                        desc={p.desc}
                        active={form.project_type === p.value}
                        onClick={() => {
                          set("project_type", p.value);
                          if (p.value !== "Event Coverage") set("event_type", "");
                        }}
                      />
                    ))}
                  </CardGrid>

                  {form.project_type === "Event Coverage" && (
                    <div className="mt-8 pt-6 border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label className="eyebrow mb-3 block">What type of event? *</Label>
                      <CardGrid cols={3}>
                        {EVENT_TYPES.map((e) => (
                          <ChoiceCard
                            key={e.value}
                            label={e.value}
                            desc={e.desc}
                            active={form.event_type === e.value}
                            onClick={() => set("event_type", e.value)}
                          />
                        ))}
                      </CardGrid>
                    </div>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <CardGrid cols={3}>
                    {SHOOT_TYPES.map((s) => (
                      <ChoiceCard
                        key={s.value}
                        icon={s.icon}
                        label={s.value}
                        desc={s.desc}
                        active={form.shoot_type === s.value}
                        onClick={() => set("shoot_type", s.value)}
                      />
                    ))}
                  </CardGrid>
                  {form.shoot_type === "Studio" && (
                    <p className="mt-5 text-xs text-muted-foreground border-l-2 border-primary pl-3">
                      Studio rental may be included in final cost.
                    </p>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <CardGrid cols={2}>
                    {BUDGETS.map((b) => (
                      <ChoiceCard
                        key={b.value}
                        label={b.value}
                        desc={b.note}
                        active={form.budget === b.value}
                        onClick={() => set("budget", b.value)}
                      />
                    ))}
                  </CardGrid>
                  <p className="mt-5 text-xs text-muted-foreground">
                    Projects typically start at{" "}
                    <span className="text-foreground font-medium">{BASELINE_PRICE}</span>{" "}
                    depending on scope.
                  </p>
                </>
              )}

              {step === 3 && (
                <CardGrid cols={2}>
                  {TIMELINES.map((t) => (
                    <ChoiceCard
                      key={t.value}
                      label={t.value}
                      desc={t.note}
                      active={form.timeline === t.value}
                      onClick={() => set("timeline", t.value)}
                    />
                  ))}
                </CardGrid>
              )}

              {step === 4 && (
                <div>
                  <Label className="eyebrow mb-3 block">What are you trying to create? *</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value.slice(0, 2000))}
                    rows={8}
                    autoFocus
                    placeholder="A short description of your vision, goals, references, must-haves…"
                    className="bg-background border-border rounded-sm text-base"
                  />
                  <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                    <span>Min 10 characters.</span>
                    <span>{form.description.length} / 2000</span>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field
                    label="Full Name" required
                    value={form.name}
                    onChange={(v) => set("name", v.slice(0, 80))}
                  />
                  <Field
                    label="Email" type="email" required
                    value={form.email}
                    onChange={(v) => set("email", v.slice(0, 255))}
                  />
                  <Field
                    label="Phone Number" required
                    placeholder="+1 555 555 5555"
                    value={form.phone}
                    onChange={(v) => set("phone", v.slice(0, 40))}
                  />
                  <Field
                    label="Instagram Handle"
                    placeholder="@yourhandle"
                    icon={Instagram}
                    value={form.instagram}
                    onChange={(v) => set("instagram", v.slice(0, 60))}
                  />
                </div>
              )}
            </div>

            {/* NAV */}
            <div className="mt-10 pt-6 border-t border-border flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={back}
                disabled={step === 0 || busy}
                className="rounded-none uppercase tracking-[0.25em] text-xs h-12 px-5 disabled:opacity-30"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              {step < 5 ? (
                <Button
                  type="button"
                  onClick={next}
                  disabled={!stepValid}
                  className="rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={submit}
                  disabled={!stepValid || busy}
                  className="rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                >
                  {busy ? "Sending…" : "Submit Project"}
                </Button>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            By submitting, you agree to be contacted by RTG Media. No spam — ever.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
};

/* ============ Reusable bits ============ */

const CardGrid = ({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) => (
  <div className={`grid gap-3 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
    {children}
  </div>
);

const ChoiceCard = ({
  icon: Icon,
  label,
  desc,
  active,
  onClick,
}: {
  icon?: any;
  label: string;
  desc?: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative text-left p-5 border transition-all ${
      active
        ? "bg-primary/10 border-primary"
        : "border-border hover:border-foreground bg-background"
    }`}
  >
    <div className="flex items-start gap-3">
      {Icon && (
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center border ${
            active ? "border-primary text-primary" : "border-border text-foreground/70"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div
          className={`font-display text-sm uppercase tracking-widest leading-none ${
            active ? "text-primary" : ""
          }`}
        >
          {label}
        </div>
        {desc && (
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{desc}</p>
        )}
      </div>
      {active && (
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
      )}
    </div>
  </button>
);

const Field = ({
  label,
  type = "text",
  required,
  placeholder,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  icon?: any;
}) => (
  <div>
    <Label className="eyebrow mb-2 block">
      {label}
      {required && " *"}
    </Label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      )}
      <Input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 bg-background border-border rounded-sm ${Icon ? "pl-10" : ""}`}
      />
    </div>
  </div>
);

export default Book;
