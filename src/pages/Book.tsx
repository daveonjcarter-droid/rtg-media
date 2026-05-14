import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";
import { cn } from "@/lib/utils";
import {
  ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Clock, Users, Star,
  Sparkles, CalendarIcon,
} from "lucide-react";
import { CREW_PACKAGES, CREW_PACKAGE_ORDER, type CrewPackageId } from "@/lib/crewPackages";
import {
  SERVICE_TYPES, SERVICE_TYPE_ORDER, getServiceSpec,
  validateServiceDetails, type ServiceTypeId,
} from "@/lib/serviceTypes";
import { DynamicServiceForm } from "@/components/booking/DynamicServiceForm";

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

type Service = {
  id: string;
  name: string;
  base_price: number | null;
  sale_price: number | null;
};

const TRUST = [
  { icon: ShieldCheck, label: "Independent & operated" },
  { icon: Clock, label: "48-hour response" },
  { icon: Users, label: "Full in-house crew" },
  { icon: Star, label: "Cinematic quality" },
];

const STEP_TITLES = ["Service", "Project Details", "Crew", "Date", "Contact"];

type FormState = {
  service_type: ServiceTypeId | "";
  service_details: Record<string, unknown>;
  crew_request_type: CrewPackageId;
  staff_id: string | null;
  no_preference: boolean;
  project_date: Date | null;
  project_time: string | null;
  name: string;
  email: string;
  phone: string;
  instagram: string;
};

const EMPTY: FormState = {
  service_type: "",
  service_details: {},
  crew_request_type: "small_crew",
  staff_id: null,
  no_preference: true,
  project_date: null,
  project_time: null,
  name: "",
  email: "",
  phone: "",
  instagram: "",
};

// Default crew package per service for sensible starting point
const DEFAULT_CREW: Record<ServiceTypeId, CrewPackageId> = {
  music_video: "small_crew",
  photography: "photographer_only",
  film_production: "full_crew",
  editing: "videographer_only", // crew not really used; keep cheapest
  event_coverage: "small_crew",
  creative_direction: "videographer_only",
  custom: "small_crew",
};

const Book = () => {
  const [params] = useSearchParams();
  const presetServiceType = (params.get("type") || "") as ServiceTypeId | "";
  const presetStaffSlug = params.get("staff") || "";

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<FormState>({
    ...EMPTY,
    service_type: presetServiceType || "",
    crew_request_type: presetServiceType ? DEFAULT_CREW[presetServiceType] : "small_crew",
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const updateDetail = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, service_details: { ...f.service_details, [key]: value } }));

  // Picking a service mid-flow must purge stale fields from a previous service
  // and reset the suggested crew package — otherwise irrelevant data leaks through.
  const pickService = (id: ServiceTypeId) => {
    setForm((f) =>
      f.service_type === id
        ? f
        : {
            ...f,
            service_type: id,
            service_details: {},
            crew_request_type: DEFAULT_CREW[id],
          },
    );
  };

  useEffect(() => {
    import("@/lib/tracking").then(({ trackEvent }) =>
      trackEvent("booking_click", {
        source: "book_page",
        preset_service_type: presetServiceType || null,
        preset_staff: presetStaffSlug || null,
      }),
    );
    (async () => {
      const [{ data: st }, { data: svc }] = await Promise.all([
        supabase.from("staff_profiles" as any)
          .select("id,slug,display_name,role_title,photo_url,specialties,service_ids,is_bookable")
          .eq("is_public", true).eq("is_bookable", true).order("sort_order"),
        supabase.from("services" as any)
          .select("id,name,base_price,sale_price").eq("is_available", true),
      ]);
      const list = (st as any) || [];
      setStaff(list);
      setServices((svc as any) || []);
      if (presetStaffSlug) {
        const m = list.find((s: Staff) => s.slug === presetStaffSlug);
        if (m) setForm((f) => ({ ...f, staff_id: m.id, no_preference: false }));
      }
    })();
  }, [presetStaffSlug, presetServiceType]);

  const spec = useMemo(() => getServiceSpec(form.service_type || null), [form.service_type]);

  const eligibleStaff = useMemo(() => {
    if (!spec) return staff;
    const key = spec.id;
    const keywords: Record<ServiceTypeId, string[]> = {
      music_video: ["music", "video", "director", "videographer"],
      photography: ["photo", "photographer"],
      film_production: ["film", "director", "dp", "producer"],
      editing: ["edit", "editor", "post", "color"],
      event_coverage: ["event", "video", "photo"],
      creative_direction: ["creative", "director", "art"],
      custom: [],
    };
    const kw = keywords[key];
    if (kw.length === 0) return staff;
    return staff.filter((s) => {
      const blob = `${s.role_title ?? ""} ${(s.specialties ?? []).join(" ")}`.toLowerCase();
      return kw.some((k) => blob.includes(k)) || (s.specialties ?? []).length === 0;
    });
  }, [staff, spec]);

  // Fire booking_started once when the user advances past service picker
  useEffect(() => {
    if (step === 1 && form.service_type) {
      import("@/lib/tracking").then(({ trackEvent }) =>
        trackEvent("booking_started" as never, { service_type: form.service_type }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const stepValid = useMemo(() => {
    switch (step) {
      case 0: return !!form.service_type;
      case 1: return spec ? validateServiceDetails(spec, form.service_details) === null : false;
      case 2: return !!form.crew_request_type;
      case 3: return true; // date optional
      case 4:
        return form.name.trim().length >= 2
          && /\S+@\S+\.\S+/.test(form.email)
          && form.phone.trim().length >= 7;
      default: return false;
    }
  }, [step, form, spec]);

  const next = () => {
    if (!stepValid) return;
    setStep((s) => Math.min(4, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    if (!spec) return toast.error("Pick a service first");
    const err = validateServiceDetails(spec, form.service_details);
    if (err) return toast.error(err);
    if (!/\S+@\S+\.\S+/.test(form.email)) return toast.error("Enter a valid email");

    setBusy(true);
    const matchedService = services.find((s) =>
      s.name.toLowerCase().includes(spec.label.toLowerCase().split(" ")[0]),
    );
    const crewMod = CREW_PACKAGES[form.crew_request_type].priceModifier;
    const budget = (form.service_details.budget as string) || null;

    const serviceDetails: Record<string, unknown> = { ...form.service_details };
    if (!form.project_date) serviceDetails.date_flexible = true;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      instagram: form.instagram.trim() || null,
      service: spec.label,
      service_type: spec.id,
      service_details: serviceDetails,
      service_id: matchedService?.id ?? null,
      project_date: form.project_date ? format(form.project_date, "yyyy-MM-dd") : null,
      project_time: form.project_time,
      budget,
      description: typeof form.service_details.concept === "string"
        ? (form.service_details.concept as string)
        : typeof form.service_details.description === "string"
        ? (form.service_details.description as string)
        : typeof form.service_details.project_summary === "string"
        ? (form.service_details.project_summary as string)
        : "",
      requested_staff_id: form.staff_id,
      // Assigned staff must be confirmed by an admin in the dashboard.
      assigned_staff_id: null,
      no_preference: form.no_preference,
      assignment_status: "needs_assignment",
      crew_request_type: form.crew_request_type,
      crew_price_modifier: crewMod,
      internal_assignment_locked: true,
      preferred_contact: "email" as const,
    };

    const { error, data } = await supabase
      .from("bookings").insert(payload as any).select("id").maybeSingle();

    if (!error) {
      await supabase.from("leads").upsert(
        {
          name: payload.name, email: payload.email, phone: payload.phone, source: "booking" as const,
        } as any,
        { onConflict: "email", ignoreDuplicates: true },
      );
      try {
        await logActivity({
          kind: "booking_received",
          title: `${payload.name} requested ${spec.label}`,
          detail: form.staff_id
            ? `Requested specific crew member`
            : "No preference — RTG to assign",
          meta: { booking_id: data?.id, service_type: spec.id },
        });
      } catch (e) {
        console.warn("logActivity failed (non-blocking):", e);
      }
      const { trackEvent } = await import("@/lib/tracking");
      trackEvent("booking_submit", { booking_id: data?.id, service_type: spec.id });
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Project submitted. We'll be in touch.");
    setStep(5);
  };

  /* ============== Confirmation ============== */
  if (step === 5) {
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
        <p className="mt-4 max-w-xl text-muted-foreground">
          Pick what you're making — we'll tailor the intake to your project.
        </p>
      </section>

      {/* Stepper */}
      <section className="container-rtg pb-4">
        <div className="grid grid-cols-5 gap-1 max-w-3xl">
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

      <section className="container-rtg pb-16">
        <div className="border border-border bg-surface/30 p-6 md:p-10 max-w-3xl min-h-[400px]">
          {/* Step 0 — Service picker */}
          {step === 0 && (
            <Step title="What are you booking?" sub="Pick a service and we'll tailor the intake to it.">
              <div className="grid sm:grid-cols-2 gap-2">
                {SERVICE_TYPE_ORDER.map((id) => {
                  const s = SERVICE_TYPES[id];
                  const Icon = s.icon;
                  const active = form.service_type === id;
                  return (
                    <Choice key={id} active={active} onClick={() => pickService(id)}>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "h-10 w-10 shrink-0 border rounded-sm flex items-center justify-center",
                          active ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-display uppercase text-base leading-tight">{s.label}</div>
                          <div className="text-[11px] text-muted-foreground mt-1">{s.short}</div>
                        </div>
                      </div>
                    </Choice>
                  );
                })}
              </div>
            </Step>
          )}

          {/* Persistent service context — keeps the user oriented across steps */}
          {step > 0 && spec && (
            <div className="mb-6 -mt-2 flex items-center justify-between gap-3 border border-primary/30 bg-primary/5 rounded-sm px-3 py-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <spec.icon className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Booking</div>
                  <div className="font-display uppercase text-sm leading-tight truncate">{spec.label}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(0)}
                className="rounded-none uppercase tracking-widest text-[10px] h-8"
              >
                Change
              </Button>
            </div>
          )}

          {/* Step 1 — Dynamic form */}
          {step === 1 && spec && (
            <Step
              title={`${spec.label} details`}
              sub="Only the fields that matter for this kind of project."
            >
              <DynamicServiceForm
                spec={spec}
                values={form.service_details}
                onChange={updateDetail}
              />
            </Step>
          )}

          {/* Step 2 — Crew */}
          {step === 2 && (
            <Step title="Choose your crew" sub="Pick a crew package, then optionally request a specific team member.">
              <div className="eyebrow mb-3">Crew package</div>
              <div className="grid sm:grid-cols-2 gap-2 mb-6">
                {CREW_PACKAGE_ORDER.map((id) => {
                  const pkg = CREW_PACKAGES[id];
                  const active = form.crew_request_type === id;
                  return (
                    <Choice key={id} active={active} onClick={() => set("crew_request_type", id)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-display uppercase text-sm leading-tight">{pkg.label}</div>
                        <div className="text-[10px] uppercase tracking-widest text-primary whitespace-nowrap">
                          {pkg.priceModifier === 0 ? "Base" : `+$${pkg.priceModifier}`}
                        </div>
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">
                        {pkg.scale} · {pkg.qualityLabel}
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        <span className="text-foreground/80">Includes:</span> {pkg.includes.join(", ")}
                      </div>
                    </Choice>
                  );
                })}
              </div>

              <div className="eyebrow mb-3">
                Preferred crew member <span className="text-muted-foreground/60 normal-case">(optional)</span>
              </div>
              <Choice
                active={form.no_preference}
                onClick={() => { set("no_preference", true); set("staff_id", null); }}
                className="mb-3"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <div className="font-display uppercase text-base">No preference — RTG assigns</div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      We'll match you with the right crew based on the project, schedule, and chemistry.
                    </div>
                  </div>
                </div>
              </Choice>

              {eligibleStaff.length === 0 ? (
                <div className="text-xs text-muted-foreground border border-dashed border-border p-4 rounded-sm">
                  No matching crew available — RTG will assign internally.
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
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                            {s.role_title}
                          </div>
                        </div>
                      </div>
                    </Choice>
                  ))}
                </div>
              )}
            </Step>
          )}

          {/* Step 3 — Date */}
          {step === 3 && (
            <Step title="Date & time" sub="Optional — pick a target date if you have one.">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">
                    Target date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11 rounded-sm",
                          !form.project_date && "text-muted-foreground",
                        )}
                      >
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
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">
                    Time (optional)
                  </Label>
                  <Input
                    type="time"
                    value={form.project_time ?? ""}
                    onChange={(e) => set("project_time", e.target.value || null)}
                    className="h-11 rounded-sm"
                  />
                </div>
              </div>
            </Step>
          )}

          {/* Step 4 — Contact */}
          {step === 4 && (
            <Step title="Your contact info" sub="Where should RTG reach you?">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Name">
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-11 rounded-sm" />
                </Field>
                <Field label="Email">
                  <Input value={form.email} onChange={(e) => set("email", e.target.value)} className="h-11 rounded-sm" />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-11 rounded-sm" />
                </Field>
                <Field label="Instagram (optional)">
                  <Input
                    value={form.instagram}
                    onChange={(e) => set("instagram", e.target.value)}
                    className="h-11 rounded-sm" placeholder="@handle"
                  />
                </Field>
              </div>
            </Step>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost" onClick={back} disabled={step === 0}
              className="rounded-none uppercase tracking-widest text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
            </Button>
            {step < 4 ? (
              <Button
                onClick={next} disabled={!stepValid}
                className="rounded-none uppercase tracking-widest text-xs h-11 px-6"
              >
                Continue <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={submit} disabled={!stepValid || busy}
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
      active ? "border-primary bg-primary/10" : "border-border bg-background hover:border-foreground/40 hover:bg-surface/40",
      className,
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
