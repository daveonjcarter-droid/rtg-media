import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";
import { cn } from "@/lib/utils";
import {
  Camera, Home, MapPin, HelpCircle, ArrowRight, ArrowLeft,
  CheckCircle2, ShieldCheck, Clock, Users, Star, Sparkles, CalendarIcon, Briefcase,
} from "lucide-react";
import { CREW_PACKAGES, CREW_PACKAGE_ORDER, type CrewPackageId } from "@/lib/crewPackages";

type Service = {
  id: string;
  slug: string | null;
  name: string;
  short_description: string | null;
  pricing_model: string;
  base_price: number | null;
  sale_price: number | null;
};

type Staff = {
  id: string;
  slug: string;
  display_name: string;
  role_title: string | null;
  photo_url: string | null;
  specialties: string[];
  service_ids: string[];
  is_bookable: boolean;
};

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

const TRUST = [
  { icon: ShieldCheck, label: "Black-owned & operated" },
  { icon: Clock, label: "48-hour response" },
  { icon: Users, label: "Full in-house crew" },
  { icon: Star, label: "Cinematic quality" },
];

const STEP_TITLES = [
  "Service",
  "Shoot Type",
  "Choose Crew",
  "Date & Time",
  "Project Details",
  "Contact Info",
];

const schema = z.object({
  service_id: z.string().uuid("Pick a service"),
  shoot_type: z.enum(["Studio", "Location", "Not Sure"]),
  staff_id: z.string().uuid().nullable(),
  no_preference: z.boolean(),
  project_date: z.date().nullable(),
  project_time: z.string().nullable(),
  budget: z.string().min(1, "Pick a budget"),
  description: z.string().trim().min(10, "Tell us a bit more (min 10 chars)").max(2000),
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Phone number is required").max(40),
  instagram: z.string().trim().max(60).optional().or(z.literal("")),
});

type Form = z.infer<typeof schema>;

const EMPTY: Form = {
  service_id: "",
  shoot_type: "Studio",
  staff_id: null,
  no_preference: false,
  project_date: null,
  project_time: null,
  budget: "",
  description: "",
  name: "",
  email: "",
  phone: "",
  instagram: "",
};

const Book = () => {
  const [params] = useSearchParams();
  const presetServiceId = params.get("service") || "";
  const presetStaffSlug = params.get("staff") || "";

  const [step, setStep] = useState(0); // 0..5, 6 = submitted
  const [busy, setBusy] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState<Form>({ ...EMPTY, service_id: presetServiceId });

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    (async () => {
      const [{ data: svc }, { data: st }] = await Promise.all([
        supabase.from("services" as any).select("*").eq("is_available", true).order("sort_order"),
        supabase.from("staff_profiles" as any).select("id,slug,display_name,role_title,photo_url,specialties,service_ids,is_bookable").eq("is_public", true).eq("is_bookable", true).order("sort_order"),
      ]);
      setServices((svc as any) || []);
      const staffList = (st as any) || [];
      setStaff(staffList);
      // preset staff from query string
      if (presetStaffSlug) {
        const match = staffList.find((s: Staff) => s.slug === presetStaffSlug);
        if (match) setForm((f) => ({ ...f, staff_id: match.id }));
      }
    })();
  }, [presetStaffSlug]);

  // Filter staff to those offering the chosen service
  const eligibleStaff = useMemo(() => {
    if (!form.service_id) return staff;
    return staff.filter((s) => s.service_ids.includes(form.service_id) || s.service_ids.length === 0);
  }, [staff, form.service_id]);

  const stepValid = useMemo(() => {
    switch (step) {
      case 0: return !!form.service_id;
      case 1: return !!form.shoot_type;
      case 2: return form.no_preference || !!form.staff_id;
      case 3: return !!form.budget; // date is optional but budget required
      case 4: return form.description.trim().length >= 10;
      case 5: return form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) && form.phone.trim().length >= 7;
      default: return false;
    }
  }, [step, form]);

  const next = () => stepValid && setStep((s) => Math.min(5, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const svc = services.find((s) => s.id === parsed.data.service_id);
    const staffPick = staff.find((s) => s.id === parsed.data.staff_id);

    const assignment_status = parsed.data.no_preference
      ? "rtg_assigning"
      : parsed.data.staff_id
        ? "assigned"
        : "needs_assignment";

    const payload = {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      instagram: parsed.data.instagram || null,
      service: svc?.name ?? null,
      service_id: parsed.data.service_id,
      shoot_type: parsed.data.shoot_type === "Not Sure" ? null : (parsed.data.shoot_type === "Studio" ? "studio" : "on_location"),
      project_date: parsed.data.project_date ? format(parsed.data.project_date, "yyyy-MM-dd") : null,
      project_time: parsed.data.project_time,
      budget: parsed.data.budget,
      description: parsed.data.description,
      requested_staff_id: parsed.data.staff_id,
      assigned_staff_id: parsed.data.staff_id, // pre-assigned if requested
      no_preference: parsed.data.no_preference,
      assignment_status,
      preferred_contact: "email" as const,
    };

    const { error, data } = await supabase.from("bookings").insert(payload as any).select("id").maybeSingle();

    if (!error) {
      await supabase.from("leads").insert({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        source: "booking" as const,
      } as any);
      logActivity({
        kind: "booking_received",
        title: `${parsed.data.name} requested ${svc?.name ?? "a project"}`,
        detail: staffPick ? `Requested ${staffPick.display_name}` : (parsed.data.no_preference ? "No preference — RTG to assign" : "Crew assignment needed"),
        meta: { booking_id: data?.id, service_id: parsed.data.service_id },
      });
    }
    setBusy(false);

    if (error) { toast.error(error.message); return; }
    toast.success("Project submitted. We'll be in touch.");
    setStep(6);
  };

  /* ============== Confirmation ============== */
  if (step === 6) {
    return (
      <SiteLayout>
        <section className="container-rtg py-24 md:py-32 max-w-2xl">
          <div className="border border-border bg-surface/40 p-10 md:p-14 text-center relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute inset-0 grain opacity-40" />
            <CheckCircle2 className="relative h-12 w-12 mx-auto text-primary mb-6" />
            <div className="relative eyebrow text-primary mb-3">Project received</div>
            <h2 className="relative font-display text-4xl md:text-5xl uppercase mb-5">Thank you.</h2>
            <p className="relative text-muted-foreground max-w-md mx-auto">
              RTG will review your project and reach out within{" "}
              <span className="text-foreground font-medium">24–48 hours</span>.
            </p>
            <Button
              onClick={() => { setForm({ ...EMPTY }); setStep(0); }}
              className="relative mt-8 rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7"
            >
              Submit Another Project
            </Button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="container-rtg pt-12 md:pt-16 pb-6">
        <div className="eyebrow mb-3">Book RTG</div>
        <h1 className="font-display text-4xl md:text-6xl uppercase leading-none">Start a Project.</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">Six quick steps. No friction. We'll be in touch within 48 hours.</p>
      </section>

      {/* Stepper */}
      <section className="container-rtg pb-4">
        <div className="grid grid-cols-6 gap-1 max-w-3xl">
          {STEP_TITLES.map((t, i) => (
            <div key={t} className="text-center">
              <div className={cn(
                "h-1 transition-colors",
                i < step ? "bg-primary" : i === step ? "bg-primary/70" : "bg-border"
              )} />
              <div className={cn(
                "mt-2 text-[9px] uppercase tracking-widest",
                i === step ? "text-foreground" : "text-muted-foreground"
              )}>
                {t}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Step body */}
      <section className="container-rtg pb-16">
        <div className="border border-border bg-surface/30 p-6 md:p-10 max-w-3xl min-h-[400px]">
          {step === 0 && (
            <Step title="Choose a service" sub="What are we creating together?">
              {services.length === 0 ? (
                <div className="text-sm text-muted-foreground">Loading services…</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {services.map((s) => (
                    <Choice key={s.id} active={form.service_id === s.id} onClick={() => set("service_id", s.id)}>
                      <div className="font-display uppercase text-base leading-tight">{s.name}</div>
                      {s.short_description && <div className="text-[11px] text-muted-foreground mt-1.5">{s.short_description}</div>}
                      {(s.base_price != null || s.sale_price != null) && (
                        <div className="text-[10px] uppercase tracking-widest mt-2 text-primary">
                          {s.sale_price != null ? `Now $${s.sale_price}` : `From $${s.base_price}`}
                        </div>
                      )}
                    </Choice>
                  ))}
                </div>
              )}
            </Step>
          )}

          {step === 1 && (
            <Step title="Shoot type" sub="Where should we capture this?">
              <div className="grid sm:grid-cols-3 gap-2">
                {SHOOT_TYPES.map((s) => (
                  <Choice key={s.value} active={form.shoot_type === s.value} onClick={() => set("shoot_type", s.value)}>
                    <s.icon className="h-5 w-5 text-primary mb-2" />
                    <div className="font-display uppercase text-sm">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{s.desc}</div>
                  </Choice>
                ))}
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step title="Pick your crew" sub="Choose someone specific, or let RTG assign the right team.">
              <Choice
                active={form.no_preference}
                onClick={() => { set("no_preference", true); set("staff_id", null); }}
                className="mb-3"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <div className="font-display uppercase text-base">No preference — assign RTG staff</div>
                    <div className="text-[11px] text-muted-foreground mt-1">We'll pair you with the right crew based on the project, schedule, and chemistry.</div>
                  </div>
                </div>
              </Choice>

              {eligibleStaff.length === 0 ? (
                <div className="text-xs text-muted-foreground border border-dashed border-border p-4 rounded-sm">
                  No staff available for this service yet — RTG will assign internally.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {eligibleStaff.map((s) => (
                    <Choice
                      key={s.id}
                      active={!form.no_preference && form.staff_id === s.id}
                      onClick={() => { set("staff_id", s.id); set("no_preference", false); }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 shrink-0 bg-surface border border-border overflow-hidden rounded-sm">
                          {s.photo_url
                            ? <img src={s.photo_url} alt="" className="h-full w-full object-cover" />
                            : <div className="h-full w-full flex items-center justify-center font-display text-sm text-muted-foreground">
                                {s.display_name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                              </div>}
                        </div>
                        <div className="min-w-0">
                          <div className="font-display uppercase text-sm leading-tight truncate">{s.display_name}</div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{s.role_title}</div>
                          {s.specialties?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {s.specialties.slice(0, 2).map((t) => (
                                <span key={t} className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-border text-muted-foreground">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Choice>
                  ))}
                </div>
              )}
            </Step>
          )}

          {step === 3 && (
            <Step title="Date & budget" sub="Pick a target date — we'll confirm availability.">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Target date">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11 rounded-sm", !form.project_date && "text-muted-foreground")}>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {form.project_date ? format(form.project_date, "PPP") : "Pick a date (optional)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.project_date ?? undefined}
                        onSelect={(d) => set("project_date", d ?? null)}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
                <Field label="Time (optional)">
                  <Input type="time" value={form.project_time ?? ""} onChange={(e) => set("project_time", e.target.value || null)} className="h-11 rounded-sm" />
                </Field>
              </div>
              <div className="mt-5">
                <div className="eyebrow mb-3">Budget</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {BUDGETS.map((b) => (
                    <Choice key={b.value} active={form.budget === b.value} onClick={() => set("budget", b.value)}>
                      <div className="font-display uppercase text-sm">{b.value}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">{b.note}</div>
                    </Choice>
                  ))}
                </div>
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step title="Project details" sub="Tell us what you're making — vibe, references, deliverables.">
              <Textarea
                rows={8}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="A short narrative film exploring identity in Chicago neighborhoods. 3-day shoot, mostly locations, need final edit + color in 4 weeks…"
                className="rounded-sm"
              />
              <div className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">{form.description.length} / 2000</div>
            </Step>
          )}

          {step === 5 && (
            <Step title="Your contact info" sub="Where should RTG reach you?">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-11 rounded-sm" /></Field>
                <Field label="Email"><Input value={form.email} onChange={(e) => set("email", e.target.value)} className="h-11 rounded-sm" /></Field>
                <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-11 rounded-sm" /></Field>
                <Field label="Instagram (optional)"><Input value={form.instagram ?? ""} onChange={(e) => set("instagram", e.target.value)} className="h-11 rounded-sm" placeholder="@handle" /></Field>
              </div>
            </Step>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={back}
              disabled={step === 0}
              className="rounded-none uppercase tracking-widest text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
            </Button>
            {step < 5 ? (
              <Button
                onClick={next}
                disabled={!stepValid}
                className="rounded-none uppercase tracking-widest text-xs h-11 px-6"
              >
                Continue <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={!stepValid || busy}
                className="rounded-none uppercase tracking-widest text-xs h-11 px-6"
              >
                {busy ? "Submitting…" : "Submit Project"}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container-rtg pb-20 border-t border-border pt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST.map((t) => (
            <div key={t.label} className="flex items-center gap-2.5 text-xs">
              <t.icon className="h-4 w-4 text-primary" />
              <span className="uppercase tracking-widest">{t.label}</span>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
};

const Step = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
  <div>
    <div className="mb-5">
      <h2 className="font-display text-2xl md:text-3xl uppercase leading-tight">{title}</h2>
      {sub && <p className="text-sm text-muted-foreground mt-1.5">{sub}</p>}
    </div>
    {children}
  </div>
);

const Choice = ({
  active, onClick, children, className,
}: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "text-left border rounded-sm p-4 transition-all w-full",
      active
        ? "border-primary bg-primary/10"
        : "border-border bg-background hover:border-foreground/40 hover:bg-surface/40",
      className
    )}
  >
    {children}
  </button>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">{label}</Label>
    {children}
  </div>
);

export default Book;
