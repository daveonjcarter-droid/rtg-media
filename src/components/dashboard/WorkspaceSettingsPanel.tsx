import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isHeadAdmin, isAdminLike } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Settings as SettingsIcon, Globe, Mail, Lock, FileText, BarChart3, Lock as LockIcon } from "lucide-react";

type SectionKey = "brand" | "seo" | "email" | "security" | "content" | "billing";

const CARDS: { key: SectionKey; icon: any; title: string; body: string }[] = [
  { key: "brand", icon: SettingsIcon, title: "Brand", body: "Logo, favicon, brand colors, typography, watermark, site name, tagline." },
  { key: "seo", icon: Globe, title: "Domains & SEO", body: "Domain status, meta defaults, keywords, social previews, indexing." },
  { key: "email", icon: Mail, title: "Email & Notifications", body: "Editorial alerts, booking auto-replies, newsletter sender, templates." },
  { key: "security", icon: Lock, title: "Security", body: "2FA enforcement, session length, login limits, role access." },
  { key: "content", icon: FileText, title: "Content Defaults", body: "Categories, tags taxonomy, review templates, approval workflow, fallback image." },
  { key: "billing", icon: BarChart3, title: "Billing & Plan", body: "Subscription, plan, billing contact email, ownership transfer." },
];

const canEdit = (section: SectionKey, roles: string[]) => {
  if (roles.includes("head_admin")) return true;
  if (section === "email" || section === "content") {
    return roles.includes("admin") || roles.includes("editor") || roles.includes("media_manager") || roles.includes("social_manager") || roles.includes("booking_manager");
  }
  return false;
};

export default function WorkspaceSettingsPanel() {
  const { roles, user } = useAuth();
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [open, setOpen] = useState<SectionKey | null>(null);
  const [draft, setDraft] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("workspace_settings" as any).select("*");
    const map: Record<string, any> = {};
    (data as any[] || []).forEach((r) => { map[r.section] = r.config; });
    setConfigs(map);
  };
  useEffect(() => { load(); }, []);

  const openCard = (key: SectionKey) => {
    if (!canEdit(key, roles)) {
      toast.error("You don't have permission to edit this section.");
      return;
    }
    setDraft(JSON.parse(JSON.stringify(configs[key] ?? {})));
    setOpen(key);
  };

  const save = async () => {
    if (!open) return;
    setSaving(true);
    const { error } = await supabase.from("workspace_settings" as any)
      .update({ config: draft, updated_by: user?.id })
      .eq("section", open);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setOpen(null); setDraft(null); load();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Admin</div>
        <div className="font-display uppercase text-2xl">Workspace Settings</div>
        <p className="text-xs text-muted-foreground mt-1">Click any card to edit. Changes save to the backend instantly.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {CARDS.map((c) => {
          const locked = !canEdit(c.key, roles);
          return (
            <button
              key={c.key}
              onClick={() => openCard(c.key)}
              disabled={locked}
              className={`text-left border rounded-sm p-4 transition-colors ${
                locked ? "border-dashed border-border bg-surface/20 opacity-60 cursor-not-allowed"
                       : "border-border bg-surface/40 hover:bg-surface/60 hover:border-foreground/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-sm bg-background border border-border flex items-center justify-center shrink-0">
                  <c.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-display uppercase text-sm">{c.title}</div>
                    {locked && <LockIcon className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">{c.body}</div>
                  {locked && <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mt-2">Head Admin only</div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={open !== null} onOpenChange={(o) => { if (!o) { setOpen(null); setDraft(null); } }}>
        <DialogContent className="bg-background border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display uppercase">
              {CARDS.find((c) => c.key === open)?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {CARDS.find((c) => c.key === open)?.body}
            </DialogDescription>
          </DialogHeader>
          {draft && open && <SectionForm section={open} draft={draft} setDraft={setDraft} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)} className="rounded-sm uppercase tracking-widest text-[10px] h-8">Cancel</Button>
            <Button onClick={save} disabled={saving} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============ Section forms ============ */

const FieldText = ({ label, value, onChange, placeholder, type = "text" }: any) => (
  <div>
    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
    <Input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 text-xs bg-background border-border rounded-sm mt-1" />
  </div>
);

const FieldArea = ({ label, value, onChange, rows = 3, placeholder }: any) => (
  <div>
    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
    <Textarea rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-background border-border rounded-sm text-xs mt-1" />
  </div>
);

const FieldToggle = ({ label, value, onChange, hint }: any) => (
  <div className="flex items-start justify-between gap-3 border border-border rounded-sm p-3 bg-surface/30">
    <div>
      <div className="text-[11px] font-medium">{label}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
    <Switch checked={!!value} onCheckedChange={onChange} />
  </div>
);

const FieldList = ({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) => (
  <div>
    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label} (comma separated)</Label>
    <Input value={(value || []).join(", ")} onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder={placeholder} className="h-9 text-xs bg-background border-border rounded-sm mt-1" />
  </div>
);

function SectionForm({ section, draft, setDraft }: { section: SectionKey; draft: any; setDraft: (d: any) => void }) {
  const set = (k: string, v: any) => setDraft({ ...draft, [k]: v });

  if (section === "brand") return (
    <div className="space-y-3">
      <FieldText label="Site Name" value={draft.site_name} onChange={(v: any) => set("site_name", v)} />
      <FieldText label="Tagline" value={draft.tagline} onChange={(v: any) => set("tagline", v)} />
      <div className="grid grid-cols-2 gap-3">
        <FieldText label="Logo URL" value={draft.logo_url} onChange={(v: any) => set("logo_url", v)} placeholder="https://…" />
        <FieldText label="Favicon URL" value={draft.favicon_url} onChange={(v: any) => set("favicon_url", v)} placeholder="https://…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldText label="Primary Color" value={draft.primary_color} onChange={(v: any) => set("primary_color", v)} placeholder="#E11D2E" />
        <FieldText label="Secondary Color" value={draft.secondary_color} onChange={(v: any) => set("secondary_color", v)} placeholder="#0A0A0A" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldText label="Heading Font" value={draft.heading_font} onChange={(v: any) => set("heading_font", v)} />
        <FieldText label="Body Font" value={draft.body_font} onChange={(v: any) => set("body_font", v)} />
      </div>
      <FieldText label="Default Watermark URL" value={draft.watermark_url} onChange={(v: any) => set("watermark_url", v)} placeholder="https://…" />
    </div>
  );

  if (section === "seo") return (
    <div className="space-y-3">
      <FieldText label="Domain Status" value={draft.domain_status} onChange={(v: any) => set("domain_status", v)} />
      <FieldText label="Default Meta Title" value={draft.meta_title} onChange={(v: any) => set("meta_title", v)} />
      <FieldArea label="Default Meta Description" value={draft.meta_description} onChange={(v: any) => set("meta_description", v)} />
      <FieldText label="SEO Keywords" value={draft.keywords} onChange={(v: any) => set("keywords", v)} />
      <FieldText label="Social Preview Image (OG)" value={draft.og_image} onChange={(v: any) => set("og_image", v)} placeholder="https://…" />
      <FieldText label="Open Graph Title" value={draft.og_title} onChange={(v: any) => set("og_title", v)} />
      <FieldArea label="Open Graph Description" value={draft.og_description} onChange={(v: any) => set("og_description", v)} />
      <FieldToggle label="Allow Google Indexing" value={draft.google_indexing} onChange={(v: any) => set("google_indexing", v)} />
      <FieldToggle label="Sitemap Enabled" value={draft.sitemap_enabled} onChange={(v: any) => set("sitemap_enabled", v)} />
      <FieldArea label="robots.txt" value={draft.robots_txt} onChange={(v: any) => set("robots_txt", v)} rows={4} />
    </div>
  );

  if (section === "email") return (
    <div className="space-y-3">
      <FieldList label="Editorial Alert Emails" value={draft.editorial_alert_emails} onChange={(v) => set("editorial_alert_emails", v)} placeholder="editor@rtg.com, ops@rtg.com" />
      <FieldArea label="Booking Auto-Reply" value={draft.booking_auto_reply} onChange={(v: any) => set("booking_auto_reply", v)} rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <FieldText label="Newsletter Sender Name" value={draft.newsletter_sender_name} onChange={(v: any) => set("newsletter_sender_name", v)} />
        <FieldText label="Newsletter Sender Email" value={draft.newsletter_sender_email} onChange={(v: any) => set("newsletter_sender_email", v)} type="email" />
      </div>
      <FieldList label="New Booking Notification Recipients" value={draft.new_booking_recipients} onChange={(v) => set("new_booking_recipients", v)} />
      <FieldList label="New Article Submission Recipients" value={draft.new_submission_recipients} onChange={(v) => set("new_submission_recipients", v)} />
      <FieldArea label="Staff Invite Email Template" value={draft.staff_invite_template} onChange={(v: any) => set("staff_invite_template", v)} rows={3} />
      <FieldArea label="Client Booking Confirmation Template" value={draft.client_booking_template} onChange={(v: any) => set("client_booking_template", v)} rows={3} />
    </div>
  );

  if (section === "security") return (
    <div className="space-y-3">
      <FieldToggle label="Require 2FA" value={draft.require_2fa} onChange={(v: any) => set("require_2fa", v)} hint="All team members must use 2FA to sign in." />
      <FieldText label="Session Timeout (minutes)" type="number" value={draft.session_timeout_minutes} onChange={(v: any) => set("session_timeout_minutes", parseInt(v) || 480)} />
      <FieldText label="Minimum Password Length" type="number" value={draft.password_min_length} onChange={(v: any) => set("password_min_length", parseInt(v) || 8)} />
      <FieldText label="Login Attempt Limit" type="number" value={draft.login_attempt_limit} onChange={(v: any) => set("login_attempt_limit", parseInt(v) || 5)} />
      <FieldToggle label="Trusted Devices Enabled" value={draft.trusted_devices_enabled} onChange={(v: any) => set("trusted_devices_enabled", v)} />
      <FieldToggle label="Force Logout on Role Change" value={draft.force_logout_on_role_change} onChange={(v: any) => set("force_logout_on_role_change", v)} />
      <div className="text-[10px] text-muted-foreground border border-border rounded-sm p-2 bg-surface/30">
        Note: Toggles here record policy. Auth provider enforcement (HIBP, etc.) is configured in Cloud auth settings.
      </div>
    </div>
  );

  if (section === "content") return (
    <div className="space-y-3">
      <FieldList label="Default Categories" value={draft.default_categories} onChange={(v) => set("default_categories", v)} />
      <FieldList label="Tag Taxonomy" value={draft.tag_taxonomy} onChange={(v) => set("tag_taxonomy", v)} />
      <FieldText label="Approval Workflow" value={draft.approval_workflow} onChange={(v: any) => set("approval_workflow", v)} placeholder="draft_review_publish" />
      <FieldText label="Fallback Featured Image URL" value={draft.fallback_featured_image} onChange={(v: any) => set("fallback_featured_image", v)} placeholder="https://…" />
      <FieldToggle label="Require SEO Fields Before Publishing" value={draft.required_seo_before_publish} onChange={(v: any) => set("required_seo_before_publish", v)} />
      <FieldText label="Default Article Status" value={draft.default_status} onChange={(v: any) => set("default_status", v)} placeholder="draft" />
      <FieldArea label="Style Guide Notes" value={draft.style_guide} onChange={(v: any) => set("style_guide", v)} rows={4} />
    </div>
  );

  if (section === "billing") return (
    <div className="space-y-3">
      <FieldText label="Plan" value={draft.plan} onChange={(v: any) => set("plan", v)} />
      <FieldText label="Billing Contact Email" type="email" value={draft.billing_contact_email} onChange={(v: any) => set("billing_contact_email", v)} />
      <FieldArea label="Notes" value={draft.note} onChange={(v: any) => set("note", v)} rows={3} />
      <div className="text-[10px] text-muted-foreground border border-border rounded-sm p-3 bg-surface/30">
        Subscription, invoices, and payment method are managed in your Lovable workspace settings. Use this card to record your plan & billing contact for the team.
      </div>
    </div>
  );

  return null;
}
