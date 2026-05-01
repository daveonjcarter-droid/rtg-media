import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { CheckCircle2, Upload, Loader2 } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";

const ROLES = [
  "Photographer", "Videographer", "Video Editor", "Director", "Producer",
  "Audio Engineer", "Grip / Lighting", "Makeup Artist", "Production Assistant",
  "Studio Staff", "Writer", "Editor", "Social Manager", "Booking Manager",
  "Media Manager", "Other",
];

const EXPERIENCE = [
  { value: "none", label: "No prior experience" },
  { value: "beginner", label: "Beginner (under 1 year)" },
  { value: "intermediate", label: "Intermediate (1–3 years)" },
  { value: "professional", label: "Professional (3+ years)" },
];

const schema = z.object({
  full_name: z.string().trim().min(2, "Full name required").max(120),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(7, "Phone required").max(40),
  city: z.string().trim().min(2, "City required").max(120),
  role_applying_for: z.string().trim().min(1, "Select a role"),
  portfolio_url: z.string().trim().url("Portfolio link must be a valid URL").max(500),
  instagram_url: z.string().trim().url("Invalid URL").max(500).optional().or(z.literal("")),
  linkedin_url: z.string().trim().url("Invalid URL").max(500).optional().or(z.literal("")),
  why_join: z.string().trim().min(80, "Tell us more — at least 80 characters").max(3000),
  experience: z.string().trim().min(80, "At least 80 characters").max(3000),
  availability: z.string().trim().min(20, "At least 20 characters").max(1500),
  experience_level: z.enum(["none","beginner","intermediate","professional"]).optional(),
});

declare global {
  interface Window {
    turnstile?: {
      render: (el: string | HTMLElement, opts: any) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

export default function Apply() {
  const [siteKey, setSiteKey] = useState<string>("");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", city: "",
    role_applying_for: "", portfolio_url: "", instagram_url: "", linkedin_url: "",
    why_join: "", experience: "", availability: "",
    experience_level: "" as "" | "none" | "beginner" | "intermediate" | "professional",
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Load Turnstile site key
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("get-public-config");
        if (data?.turnstile_site_key) setSiteKey(data.turnstile_site_key);
      } catch { /* ignore */ }
    })();
  }, []);

  // Inject Turnstile script + render widget
  useEffect(() => {
    if (!siteKey) return;
    const renderWidget = () => {
      if (!window.turnstile || !captchaRef.current) return;
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(captchaRef.current, {
        sitekey: siteKey,
        theme: "dark",
        callback: (t: string) => setCaptchaToken(t),
        "error-callback": () => setCaptchaToken(""),
        "expired-callback": () => setCaptchaToken(""),
      });
    };
    if (!document.getElementById("cf-turnstile-script")) {
      const s = document.createElement("script");
      s.id = "cf-turnstile-script";
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true; s.defer = true;
      s.onload = renderWidget;
      document.head.appendChild(s);
    } else {
      renderWidget();
    }
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* */ }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  const onChange = (k: keyof typeof form) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA.");
      return;
    }
    if (resumeFile && resumeFile.size > 10 * 1024 * 1024) {
      toast.error("Resume must be under 10MB.");
      return;
    }

    setBusy(true);
    try {
      // 1) Upload resume if present (anonymous to private bucket)
      let resume_path: string | undefined;
      let resume_filename: string | undefined;
      if (resumeFile) {
        const ext = resumeFile.name.split(".").pop()?.toLowerCase() || "bin";
        const safeEmail = form.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const path = `${safeEmail}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("applications").upload(path, resumeFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: resumeFile.type || undefined,
        });
        if (upErr) throw new Error("Resume upload failed: " + upErr.message);
        resume_path = path;
        resume_filename = resumeFile.name;
      }

      // 2) Submit
      const { data, error } = await supabase.functions.invoke("submit-application", {
        body: {
          ...parsed.data,
          experience_level: form.experience_level || undefined,
          resume_path: resume_path ?? "",
          resume_filename: resume_filename ?? "",
          captcha_token: captchaToken,
        },
      });

      if (error) {
        // Functions invoke wraps non-2xx as error with context
        const msg = (error as any)?.context?.error || (error as any)?.message || "Submission failed";
        // Try to extract server JSON
        let serverMsg = msg;
        try {
          const ctx = (error as any).context;
          if (ctx?.body) {
            const j = typeof ctx.body === "string" ? JSON.parse(ctx.body) : ctx.body;
            if (j?.error) serverMsg = j.error;
          }
        } catch { /* */ }
        throw new Error(serverMsg);
      }
      if (data && data.error) throw new Error(data.error);

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong. Please try again.");
      // reset captcha so they get a fresh token
      try { window.turnstile?.reset(widgetIdRef.current ?? undefined); } catch { /* */ }
      setCaptchaToken("");
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <SiteLayout>
        <section className="container-rtg py-24 md:py-32 text-center max-w-2xl mx-auto">
          <CheckCircle2 className="h-12 w-12 mx-auto text-primary mb-6" />
          <div className="eyebrow text-primary mb-3">Application received</div>
          <h1 className="font-display text-4xl md:text-5xl uppercase leading-none">Thank you.</h1>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            We've received your application to join RTG Media. Our team reviews submissions
            personally — if there's a fit, we'll reach out from{" "}
            <span className="text-foreground">noreply@runnerstogreatness.com</span> with next steps
            and a secure invite link. Approval is required before any account is created.
          </p>
          <div className="mt-10">
            <Link to="/">
              <Button variant="outline" className="rounded-sm uppercase tracking-widest text-xs h-11 px-6">
                Back to homepage
              </Button>
            </Link>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="container-rtg py-16 md:py-24 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="eyebrow text-primary mb-3">Apply to join RTG</div>
          <h1 className="font-display text-4xl md:text-5xl uppercase leading-none">Build with us.</h1>
          <p className="mt-5 text-muted-foreground max-w-xl mx-auto">
            RTG Media is invite-only. Tell us about yourself and your work — if there's a fit,
            we'll send you a secure invite to set up your account. We do not create accounts
            from applications automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 border border-border rounded-sm bg-surface/30 p-6 md:p-10">
          {/* Identity */}
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Full name *">
              <Input value={form.full_name} onChange={onChange("full_name")} required maxLength={120} className="h-11 rounded-sm" />
            </Field>
            <Field label="Email *">
              <Input type="email" value={form.email} onChange={onChange("email")} required maxLength={255} className="h-11 rounded-sm" />
            </Field>
            <Field label="Phone *">
              <Input value={form.phone} onChange={onChange("phone")} required maxLength={40} className="h-11 rounded-sm" />
            </Field>
            <Field label="City *">
              <Input value={form.city} onChange={onChange("city")} required maxLength={120} className="h-11 rounded-sm" />
            </Field>
          </div>

          {/* Role */}
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Role applying for *">
              <Select value={form.role_applying_for} onValueChange={(v) => setForm((f) => ({ ...f, role_applying_for: v }))}>
                <SelectTrigger className="h-11 rounded-sm"><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Experience level">
              <Select value={form.experience_level} onValueChange={(v: any) => setForm((f) => ({ ...f, experience_level: v }))}>
                <SelectTrigger className="h-11 rounded-sm"><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  {EXPERIENCE.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Links */}
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Portfolio link * (required)">
              <Input value={form.portfolio_url} onChange={onChange("portfolio_url")} required placeholder="https://" maxLength={500} className="h-11 rounded-sm" />
            </Field>
            <Field label="Instagram (optional)">
              <Input value={form.instagram_url} onChange={onChange("instagram_url")} placeholder="https://instagram.com/…" maxLength={500} className="h-11 rounded-sm" />
            </Field>
            <Field label="LinkedIn (optional)" className="sm:col-span-2">
              <Input value={form.linkedin_url} onChange={onChange("linkedin_url")} placeholder="https://linkedin.com/in/…" maxLength={500} className="h-11 rounded-sm" />
            </Field>
          </div>

          {/* Written */}
          <Field label={`Why do you want to join RTG? * (${form.why_join.length}/80 min)`}>
            <Textarea value={form.why_join} onChange={onChange("why_join")} required minLength={80} maxLength={3000} rows={5} className="rounded-sm" />
          </Field>
          <Field label={`Relevant experience * (${form.experience.length}/80 min)`}>
            <Textarea value={form.experience} onChange={onChange("experience")} required minLength={80} maxLength={3000} rows={5} className="rounded-sm" />
          </Field>
          <Field label={`Availability * (${form.availability.length}/20 min)`}>
            <Textarea value={form.availability} onChange={onChange("availability")} required minLength={20} maxLength={1500} rows={3} placeholder="Days, hours, timezone, notice period…" className="rounded-sm" />
          </Field>

          {/* Resume */}
          <Field label="Resume / media kit (optional, PDF or image, ≤10MB)">
            <label className="flex items-center gap-3 border border-dashed border-border rounded-sm p-3 cursor-pointer hover:border-foreground/40 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground flex-1 truncate">
                {resumeFile ? resumeFile.name : "Click to upload"}
              </span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </Field>

          {/* Captcha */}
          <div className="flex justify-center">
            <div ref={captchaRef} />
          </div>
          {!siteKey && (
            <p className="text-xs text-muted-foreground text-center">Loading verification…</p>
          )}

          <Button
            type="submit"
            disabled={busy || !captchaToken}
            className="w-full h-12 rounded-sm uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {busy ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting…</> : "Submit application"}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            Submitting an application does not create an account. Only after approval will RTG send
            you a secure invite link.
          </p>
        </form>
      </section>
    </SiteLayout>
  );
}

const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={className}>
    <Label className="eyebrow mb-2 block">{label}</Label>
    {children}
  </div>
);
