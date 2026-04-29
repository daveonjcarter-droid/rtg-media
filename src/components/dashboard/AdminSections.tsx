import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  BarChart3, FileText, Briefcase, Mail, Image as ImageIcon, Calendar,
  Globe, Settings, Lock, Film, Music2, Camera, ExternalLink, Save,
} from "lucide-react";

/* =================================================================
   SHARED PRIMITIVES
   ================================================================= */

export const PageHead = ({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) => (
  <div className="flex items-end justify-between gap-4 mb-5 pb-3 border-b border-border">
    <div>
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-1">{sub ?? "Section"}</div>
      <h2 className="font-display text-xl md:text-2xl uppercase leading-none">{title}</h2>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const StatCard = ({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) => (
  <div className="border border-border rounded-sm bg-surface/40 p-4 hover:bg-surface/60 transition-colors">
    <div className="flex items-center justify-between">
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      {accent && <span className={`h-1.5 w-1.5 rounded-full ${accent}`} />}
    </div>
    <div className="font-display text-3xl mt-1.5 leading-none">{value}</div>
    {sub && <div className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">{sub}</div>}
  </div>
);

export const LockedSection = ({ title, body }: { title: string; body?: string }) => (
  <div className="border border-dashed border-border rounded-sm py-14 px-6 text-center">
    <Lock className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
    <div className="font-display uppercase text-base">{title}</div>
    {body && <div className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">{body}</div>}
  </div>
);

/* =================================================================
   ANALYTICS  (mock + a few real counts)
   ================================================================= */

export const AnalyticsView = () => {
  const [counts, setCounts] = useState({
    total: 0, published: 0, drafts: 0, scheduled: 0, bookings: 0, social: 0, leads: 0,
  });
  const [topCats, setTopCats] = useState<{ name: string; n: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, b, l, s] = await Promise.all([
        supabase.from("articles").select("status, category, published_at"),
        supabase.from("bookings").select("id").eq("archived", false),
        supabase.from("leads").select("id").eq("archived", false),
        supabase.from("social_posts").select("id, status"),
      ]);
      const arts = (a.data ?? []) as any[];
      const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
      const c: Record<string, number> = {};
      arts.forEach((x) => { if (x.category) c[x.category] = (c[x.category] ?? 0) + 1; });
      const top = Object.entries(c).map(([name, n]) => ({ name, n })).sort((x, y) => y.n - x.n).slice(0, 5);
      setTopCats(top);
      setCounts({
        total: arts.length,
        published: arts.filter((x) => x.status === "published" && x.published_at && new Date(x.published_at) > monthAgo).length,
        drafts: arts.filter((x) => x.status === "draft").length,
        scheduled: arts.filter((x) => x.status === "scheduled").length,
        bookings: (b.data ?? []).length,
        social: (s.data ?? []).filter((x: any) => x.status === "scheduled").length,
        leads: (l.data ?? []).length,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-muted-foreground text-sm">Loading analytics…</div>;

  return (
    <div className="space-y-6">
      <PageHead title="Analytics Overview" sub="At a Glance" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Articles" value={String(counts.total)} accent="bg-primary" />
        <StatCard label="Published / 30d" value={String(counts.published)} sub="Live this month" accent="bg-emerald-500" />
        <StatCard label="Drafts Pending" value={String(counts.drafts)} accent="bg-muted-foreground" />
        <StatCard label="Scheduled" value={String(counts.scheduled)} accent="bg-sky-500" />
        <StatCard label="Booking Inquiries" value={String(counts.bookings)} sub="Open" accent="bg-gold" />
        <StatCard label="Leads" value={String(counts.leads)} sub="Inbound" accent="bg-cream" />
        <StatCard label="Social Scheduled" value={String(counts.social)} sub="Queued posts" accent="bg-primary" />
      </div>
      <div>
        <PageHead title="Top Categories" sub="By Article Count" />
        {topCats.length === 0 ? (
          <div className="text-xs text-muted-foreground">Once you publish a few articles, your top categories will rank here.</div>
        ) : (
          <div className="border border-border rounded-sm divide-y divide-border">
            {topCats.map((c, i) => (
              <div key={c.name} className="p-3 flex items-center gap-3">
                <div className="font-display text-lg text-primary w-8">0{i + 1}</div>
                <div className="flex-1 font-medium text-sm">{c.name}</div>
                <div className="text-xs text-muted-foreground tabular-nums">{c.n} article{c.n === 1 ? "" : "s"}</div>
                <div className="w-24 h-1.5 rounded-full bg-surface overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(c.n / topCats[0].n) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* =================================================================
   SETTINGS
   ================================================================= */

export const SettingsView = ({ canBilling }: { canBilling: boolean }) => {
  return (
    <div className="space-y-6">
      <PageHead title="Workspace Settings" sub="Admin" />
      <div className="grid md:grid-cols-2 gap-4">
        <SettingsCard icon={Settings} title="Brand" body="Logo, colors, typography. Locked behind ownership." locked={!canBilling} />
        <SettingsCard icon={Globe} title="Domains & SEO" body="runnerstogreatness.com — published. Configure SEO defaults and social previews." />
        <SettingsCard icon={Mail} title="Email & Notifications" body="Editorial alerts, booking auto-replies, newsletter sender address." />
        <SettingsCard icon={Lock} title="Security" body="2FA enforcement, session length, leaked-password protection." locked={!canBilling} />
        <SettingsCard icon={FileText} title="Content Defaults" body="Default categories, tag taxonomy, RTG review template policies." />
        <SettingsCard icon={BarChart3} title="Billing & Plan" body="Subscription, invoices, ownership transfer." locked={!canBilling} />
      </div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Settings save to backend (coming soon) — UI is wired and ready.
      </div>
    </div>
  );
};

const SettingsCard = ({ icon: Icon, title, body, locked }: { icon: any; title: string; body: string; locked?: boolean }) => (
  <div className={`border rounded-sm p-4 transition-colors ${locked ? "border-dashed border-border bg-surface/20" : "border-border bg-surface/40 hover:bg-surface/60 cursor-pointer"}`}>
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-sm bg-background border border-border flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-display uppercase text-sm">{title}</div>
          {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
        </div>
        <div className="text-xs text-muted-foreground mt-1.5">{body}</div>
        {locked && <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mt-2">Head Admin only</div>}
      </div>
    </div>
  </div>
);

/* =================================================================
   PRODUCTION SERVICES (admin view of services offered + bookings shortcut)
   ================================================================= */

export const ProductionServicesView = () => (
  <div className="space-y-6">
    <PageHead title="Production Services" sub="Offering" actions={
      <Button asChild size="sm" variant="outline" className="rounded-sm uppercase tracking-widest text-[10px] h-8">
        <Link to="/services" target="_blank"><ExternalLink className="h-3 w-3 mr-1.5" /> View Public Page</Link>
      </Button>
    } />
    <div className="grid md:grid-cols-3 gap-3">
      {[
        { name: "Editorial Photography", desc: "Magazine-grade shoots, talent coverage, fashion editorials.", icon: Camera },
        { name: "Music Videos", desc: "Treatment, shoot, edit, color, delivery.", icon: Music2 },
        { name: "Documentary", desc: "Short-form and long-form non-fiction storytelling.", icon: Film },
        { name: "Brand Films", desc: "Premium brand storytelling and campaign content.", icon: Film },
        { name: "Event Coverage", desc: "Concerts, drops, festivals, brand activations.", icon: Camera },
        { name: "Studio Sessions", desc: "Controlled-environment shoots in Chicago studios.", icon: Camera },
      ].map((s) => (
        <div key={s.name} className="border border-border rounded-sm p-4 bg-surface/40 hover:bg-surface/60 transition-colors">
          <s.icon className="h-5 w-5 text-primary mb-3" />
          <div className="font-display uppercase text-sm">{s.name}</div>
          <div className="text-xs text-muted-foreground mt-2">{s.desc}</div>
        </div>
      ))}
    </div>
    <div className="text-xs text-muted-foreground border-t border-border pt-3">
      Manage incoming inquiries from the <span className="text-foreground font-semibold">Bookings</span> tab.
    </div>
  </div>
);

/* =================================================================
   PORTFOLIO MANAGER (manages portfolioPreview slice of site_content)
   ================================================================= */

type PortfolioItem = { title: string; image: string; category?: string; link?: string };

export const PortfolioManager = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_content")
      .select("draft, published")
      .eq("section", "portfolio")
      .maybeSingle();
    const arr = (data?.draft as any)?.items ?? (data?.published as any)?.items ?? [];
    setItems(Array.isArray(arr) ? arr : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (publish: boolean) => {
    setBusy(true);
    const payload: any = { section: "portfolio", draft: { items } };
    if (publish) payload.published = { items };
    const { error } = await supabase.from("site_content").upsert(payload, { onConflict: "section" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(publish ? "Portfolio published" : "Draft saved");
  };

  if (loading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="space-y-4">
      <PageHead title="Portfolio Manager" sub="Project Showcase" actions={
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setItems([...items, { title: "New project", image: "" }])} className="rounded-sm uppercase tracking-widest text-[10px] h-8">
            Add Project
          </Button>
          <Button size="sm" variant="secondary" onClick={() => save(false)} disabled={busy} className="rounded-sm uppercase tracking-widest text-[10px] h-8">
            <Save className="h-3 w-3 mr-1.5" /> Save Draft
          </Button>
          <Button size="sm" onClick={() => save(true)} disabled={busy} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground hover:bg-primary/90">
            Publish
          </Button>
        </div>
      } />
      {items.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm py-14 px-6 text-center">
          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
          <div className="font-display uppercase text-base">No projects yet</div>
          <div className="text-xs text-muted-foreground mt-1.5">Add your first portfolio project to start.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="border border-border rounded-sm p-3 bg-surface/40 grid md:grid-cols-[120px_1fr_auto] gap-3 items-start">
              <div className="aspect-video bg-surface border border-border overflow-hidden">
                {it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground m-auto mt-6" />}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Title</Label>
                  <Input value={it.title} onChange={(e) => setItems((p) => p.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} className="h-9 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Image URL</Label>
                  <Input value={it.image} onChange={(e) => setItems((p) => p.map((x, idx) => idx === i ? { ...x, image: e.target.value } : x))} className="h-9 text-xs" placeholder="https://…" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Category</Label>
                  <Input value={it.category ?? ""} onChange={(e) => setItems((p) => p.map((x, idx) => idx === i ? { ...x, category: e.target.value } : x))} className="h-9 text-xs" placeholder="Music Video, Editorial…" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Link (optional)</Label>
                  <Input value={it.link ?? ""} onChange={(e) => setItems((p) => p.map((x, idx) => idx === i ? { ...x, link: e.target.value } : x))} className="h-9 text-xs" />
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} className="rounded-sm uppercase tracking-widest text-[10px] h-8">
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* =================================================================
   RTG FILMS / ORIGINALS  (managed as a dedicated site_content slice)
   ================================================================= */

type FilmItem = { title: string; tagline?: string; image: string; status: string; year?: string; link?: string };

export const RtgFilmsManager = () => {
  const [items, setItems] = useState<FilmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("site_content").select("draft, published").eq("section", "films").maybeSingle();
    const arr = (data?.draft as any)?.items ?? (data?.published as any)?.items ?? [];
    setItems(Array.isArray(arr) ? arr : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (publish: boolean) => {
    setBusy(true);
    const payload: any = { section: "films", draft: { items } };
    if (publish) payload.published = { items };
    const { error } = await supabase.from("site_content").upsert(payload, { onConflict: "section" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(publish ? "Films catalog published" : "Draft saved");
  };

  if (loading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="space-y-4">
      <PageHead title="RTG Films / Originals" sub="Studio Slate" actions={
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setItems([...items, { title: "Untitled", image: "", status: "in-development" }])} className="rounded-sm uppercase tracking-widest text-[10px] h-8">
            Add Title
          </Button>
          <Button size="sm" variant="secondary" onClick={() => save(false)} disabled={busy} className="rounded-sm uppercase tracking-widest text-[10px] h-8">
            <Save className="h-3 w-3 mr-1.5" /> Save Draft
          </Button>
          <Button size="sm" onClick={() => save(true)} disabled={busy} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground hover:bg-primary/90">
            Publish
          </Button>
        </div>
      } />
      {items.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm py-14 px-6 text-center">
          <Film className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
          <div className="font-display uppercase text-base">No titles yet</div>
          <div className="text-xs text-muted-foreground mt-1.5">Add your first RTG Original.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map((it, i) => (
            <div key={i} className="border border-border rounded-sm p-3 bg-surface/40 space-y-2">
              <div className="aspect-video bg-surface border border-border overflow-hidden">
                {it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <Input value={it.title} onChange={(e) => setItems((p) => p.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} className="h-8 text-xs" placeholder="Title" />
              <Input value={it.tagline ?? ""} onChange={(e) => setItems((p) => p.map((x, idx) => idx === i ? { ...x, tagline: e.target.value } : x))} className="h-8 text-xs" placeholder="Tagline" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={it.status} onChange={(e) => setItems((p) => p.map((x, idx) => idx === i ? { ...x, status: e.target.value } : x))} className="h-8 text-xs" placeholder="status" />
                <Input value={it.year ?? ""} onChange={(e) => setItems((p) => p.map((x, idx) => idx === i ? { ...x, year: e.target.value } : x))} className="h-8 text-xs" placeholder="year" />
              </div>
              <Input value={it.image} onChange={(e) => setItems((p) => p.map((x, idx) => idx === i ? { ...x, image: e.target.value } : x))} className="h-8 text-xs" placeholder="Poster image URL" />
              <Input value={it.link ?? ""} onChange={(e) => setItems((p) => p.map((x, idx) => idx === i ? { ...x, link: e.target.value } : x))} className="h-8 text-xs" placeholder="Watch / info link" />
              <Button size="sm" variant="outline" onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} className="rounded-sm uppercase tracking-widest text-[10px] h-7 w-full">
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* =================================================================
   RTG FEST MANAGER (manages /fest page + early-access list count)
   ================================================================= */

export const RtgFestManager = () => {
  const [content, setContent] = useState({ headline: "RTG FEST", subheadline: "Chicago. Culture. Live.", date: "", venue: "", lineup: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_content").select("draft, published").eq("section", "fest").maybeSingle();
      const c = (data?.draft as any) ?? (data?.published as any) ?? {};
      setContent({
        headline: c.headline ?? "RTG FEST",
        subheadline: c.subheadline ?? "Chicago. Culture. Live.",
        date: c.date ?? "",
        venue: c.venue ?? "",
        lineup: c.lineup ?? "",
      });
      setLoading(false);
    })();
  }, []);

  const save = async (publish: boolean) => {
    setBusy(true);
    const payload: any = { section: "fest", draft: content };
    if (publish) payload.published = content;
    const { error } = await supabase.from("site_content").upsert(payload, { onConflict: "section" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(publish ? "RTG Fest page updated" : "Draft saved");
  };

  if (loading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="space-y-5">
      <PageHead title="RTG Fest" sub="Event Page" actions={
        <div className="flex gap-1.5">
          <Button asChild size="sm" variant="outline" className="rounded-sm uppercase tracking-widest text-[10px] h-8">
            <Link to="/fest" target="_blank"><ExternalLink className="h-3 w-3 mr-1.5" /> View Public Page</Link>
          </Button>
          <Button size="sm" variant="secondary" onClick={() => save(false)} disabled={busy} className="rounded-sm uppercase tracking-widest text-[10px] h-8">
            <Save className="h-3 w-3 mr-1.5" /> Save Draft
          </Button>
          <Button size="sm" onClick={() => save(true)} disabled={busy} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground hover:bg-primary/90">
            Publish
          </Button>
        </div>
      } />
      <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Headline</Label>
          <Input value={content.headline} onChange={(e) => setContent({ ...content, headline: e.target.value })} className="h-9 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Subheadline</Label>
          <Input value={content.subheadline} onChange={(e) => setContent({ ...content, subheadline: e.target.value })} className="h-9 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Date</Label>
          <Input value={content.date} onChange={(e) => setContent({ ...content, date: e.target.value })} className="h-9 text-xs" placeholder="Summer 2026" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Venue</Label>
          <Input value={content.venue} onChange={(e) => setContent({ ...content, venue: e.target.value })} className="h-9 text-xs" placeholder="TBA — Chicago" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Lineup / Notes</Label>
          <Textarea rows={6} value={content.lineup} onChange={(e) => setContent({ ...content, lineup: e.target.value })} className="text-xs" placeholder="One artist per line" />
        </div>
      </div>
    </div>
  );
};

/* =================================================================
   ARTICLE IMPORT (wraps the existing dialog as a section)
   ================================================================= */

export const ArticleImportView = ({ onOpenImport }: { onOpenImport: () => void }) => (
  <div className="space-y-5">
    <PageHead title="Article Import" sub="From Document" actions={
      <Button size="sm" onClick={onOpenImport} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground hover:bg-primary/90">
        Import Document
      </Button>
    } />
    <div className="border border-dashed border-border rounded-sm py-14 px-6 text-center">
      <FileText className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
      <div className="font-display uppercase text-base">Bring in writing from anywhere</div>
      <div className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto">
        Upload a PDF, DOCX, TXT, RTF, or Markdown file. We'll extract the body, save it as a draft, and open the editor so you can pick the article type and add metadata.
      </div>
      <Button size="sm" onClick={onOpenImport} className="mt-5 rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground hover:bg-primary/90">
        Choose a File
      </Button>
    </div>
  </div>
);
