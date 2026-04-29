import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, Save, Send, RotateCcw, Upload, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

/* ----------------------------- Types & defaults ----------------------------- */

export type HomepageContent = {
  hero: {
    headline: string;
    subheadline: string;
    backgroundImage: string;
    ctaText: string;
    ctaLink: string;
  };
  manifesto: {
    headline: string;
    body: string;
    signatures: string;
    locationDate: string;
  };
  featured: {
    articleHeadline: string;
    articleImage: string;
    trendingHeadline: string;
    trendingImage: string;
    picksHeadline: string;
    picksImage: string;
    breakdownHeadline: string;
    breakdownImage: string;
  };
  servicesPreview: {
    headline: string;
    description: string;
    image: string;
    ctaText: string;
    ctaLink: string;
  };
  portfolioPreview: {
    project1Title: string;
    project1Image: string;
    project2Title: string;
    project2Image: string;
  };
  drops: {
    headline: string;
    text: string;
    image: string;
    ctaText: string;
  };
  footer: {
    email: string;
    phone: string;
    instagram: string;
    youtube: string;
    twitter: string;
    tagline: string;
  };
};

export const DEFAULT_HOMEPAGE: HomepageContent = {
  hero: {
    headline: "Runners\nTo Greatness",
    subheadline:
      "We document the culture before it has a name. Film. Music. Fashion. The Chicago stories the rest of the world will be talking about next.",
    backgroundImage: "",
    ctaText: "Read The Magazine",
    ctaLink: "/articles",
  },
  manifesto: {
    headline: "Manifesto",
    body:
      "We are not waiting for permission. We document the South Side at midnight, the studios at 4am, the designers cutting silhouettes you'll see in Paris next year. If you're not on RTG, you're missing what's next.",
    signatures: "— Daveon J. Carter, Founder\n— Brendan Shields, Co-CEO",
    locationDate: "Chicago · 2026",
  },
  featured: {
    articleHeadline: "",
    articleImage: "",
    trendingHeadline: "",
    trendingImage: "",
    picksHeadline: "",
    picksImage: "",
    breakdownHeadline: "RTG Breakdown",
    breakdownImage: "",
  },
  servicesPreview: {
    headline: "Production Services",
    description:
      "Full-stack production. One team. One vision. From a single photo set to a full episodic series — we shoot, cut, score, and ship.",
    image: "",
    ctaText: "Book A Consult",
    ctaLink: "/book",
  },
  portfolioPreview: {
    project1Title: "",
    project1Image: "",
    project2Title: "",
    project2Image: "",
  },
  drops: {
    headline: "RTG Drops",
    text: "Apparel, hats, and limited drops built around the brand. Sign up for first access.",
    image: "",
    ctaText: "Notify Me",
  },
  footer: {
    email: "",
    phone: "",
    instagram: "",
    youtube: "",
    twitter: "",
    tagline: "Runners To Greatness · Chicago",
  },
};

/** Merge stored partial content with defaults so missing keys never crash. */
export function mergeHomepage(partial: any): HomepageContent {
  const out: any = { ...DEFAULT_HOMEPAGE };
  if (!partial || typeof partial !== "object") return out;
  for (const k of Object.keys(DEFAULT_HOMEPAGE) as (keyof HomepageContent)[]) {
    out[k] = { ...DEFAULT_HOMEPAGE[k], ...(partial[k] ?? {}) };
  }
  return out;
}

/* --------------------------------- Component -------------------------------- */

const QuickSiteUpdates = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE);
  const [savedDraft, setSavedDraft] = useState<HomepageContent>(DEFAULT_HOMEPAGE);
  const [published, setPublished] = useState<HomepageContent>(DEFAULT_HOMEPAGE);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const dirty = JSON.stringify(content) !== JSON.stringify(savedDraft);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_content")
      .select("draft, published")
      .eq("section", "homepage")
      .maybeSingle();
    if (error) toast.error(error.message);
    const draft = mergeHomepage(data?.draft);
    const pub = mergeHomepage(data?.published);
    setContent(draft);
    setSavedDraft(draft);
    setPublished(pub);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = <K extends keyof HomepageContent>(group: K, patch: Partial<HomepageContent[K]>) => {
    setContent((c) => ({ ...c, [group]: { ...c[group], ...patch } }));
  };

  const saveDraft = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("site_content")
      .upsert(
        { section: "homepage", draft: content as any, updated_by: user?.id },
        { onConflict: "section" }
      );
    setBusy(false);
    if (error) return toast.error(error.message);
    setSavedDraft(content);
    toast.success("Draft saved");
  };

  const publish = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("site_content")
      .upsert(
        {
          section: "homepage",
          draft: content as any,
          published: content as any,
          updated_by: user?.id,
        },
        { onConflict: "section" }
      );
    setBusy(false);
    if (error) return toast.error(error.message);
    setSavedDraft(content);
    setPublished(content);
    toast.success("Changes published — visitors will see them on the homepage");
  };

  const resetToPublished = () => {
    setContent(published);
    toast.message("Reverted to last published version", {
      description: "Click Save Draft or Publish to commit the change.",
    });
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading site content…</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header / actions */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="eyebrow mb-1">Admin only</div>
          <h2 className="font-display text-2xl md:text-3xl uppercase leading-none">Quick Site Updates</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Swap photos, change headlines, and update featured content without touching code.
            Save a draft to keep working, or publish to make changes live on the homepage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-sm">
            <Link to="/" target="_blank" rel="noreferrer">
              <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview Site
              <ExternalLink className="h-3 w-3 ml-1.5 opacity-70" />
            </Link>
          </Button>
          <Button onClick={resetToPublished} variant="outline" size="sm" className="rounded-sm" disabled={busy}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
          </Button>
          <Button onClick={saveDraft} variant="secondary" size="sm" className="rounded-sm" disabled={busy || !dirty}>
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Draft
          </Button>
          <Button onClick={publish} size="sm" className="rounded-sm bg-primary hover:bg-primary/90" disabled={busy}>
            <Send className="h-3.5 w-3.5 mr-1.5" /> Publish
          </Button>
        </div>
      </div>

      {dirty && (
        <div className="text-xs uppercase tracking-widest text-gold border border-gold/30 bg-gold/5 px-3 py-2 rounded-sm">
          You have unsaved changes
        </div>
      )}

      {/* Sections */}
      <Section title="Homepage Hero">
        <Field label="Headline (use a new line for line breaks)">
          <Textarea rows={2} value={content.hero.headline} onChange={(e) => update("hero", { headline: e.target.value })} />
        </Field>
        <Field label="Subheadline">
          <Textarea rows={3} value={content.hero.subheadline} onChange={(e) => update("hero", { subheadline: e.target.value })} />
        </Field>
        <ImageField label="Background image" value={content.hero.backgroundImage} onChange={(v) => update("hero", { backgroundImage: v })} />
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="CTA button text">
            <Input value={content.hero.ctaText} onChange={(e) => update("hero", { ctaText: e.target.value })} />
          </Field>
          <Field label="CTA button link">
            <Input value={content.hero.ctaLink} onChange={(e) => update("hero", { ctaLink: e.target.value })} placeholder="/articles" />
          </Field>
        </div>
      </Section>

      <Section title="Manifesto">
        <Field label="Manifesto headline / label">
          <Input value={content.manifesto.headline} onChange={(e) => update("manifesto", { headline: e.target.value })} />
        </Field>
        <Field label="Manifesto body">
          <Textarea rows={5} value={content.manifesto.body} onChange={(e) => update("manifesto", { body: e.target.value })} />
        </Field>
        <Field label="Signature names (one per line)">
          <Textarea rows={3} value={content.manifesto.signatures} onChange={(e) => update("manifesto", { signatures: e.target.value })} />
        </Field>
        <Field label="Chicago / date label">
          <Input value={content.manifesto.locationDate} onChange={(e) => update("manifesto", { locationDate: e.target.value })} />
        </Field>
      </Section>

      <Section title="Featured Content">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Featured article headline">
            <Input value={content.featured.articleHeadline} onChange={(e) => update("featured", { articleHeadline: e.target.value })} />
          </Field>
          <ImageField compact label="Featured article image" value={content.featured.articleImage} onChange={(v) => update("featured", { articleImage: v })} />
          <Field label="Trending headline">
            <Input value={content.featured.trendingHeadline} onChange={(e) => update("featured", { trendingHeadline: e.target.value })} />
          </Field>
          <ImageField compact label="Trending image" value={content.featured.trendingImage} onChange={(v) => update("featured", { trendingImage: v })} />
          <Field label="RTG Picks headline">
            <Input value={content.featured.picksHeadline} onChange={(e) => update("featured", { picksHeadline: e.target.value })} />
          </Field>
          <ImageField compact label="RTG Picks image" value={content.featured.picksImage} onChange={(v) => update("featured", { picksImage: v })} />
          <Field label="RTG Breakdown headline">
            <Input value={content.featured.breakdownHeadline} onChange={(e) => update("featured", { breakdownHeadline: e.target.value })} />
          </Field>
          <ImageField compact label="RTG Breakdown image" value={content.featured.breakdownImage} onChange={(v) => update("featured", { breakdownImage: v })} />
        </div>
      </Section>

      <Section title="Production Services Preview">
        <Field label="Section headline">
          <Input value={content.servicesPreview.headline} onChange={(e) => update("servicesPreview", { headline: e.target.value })} />
        </Field>
        <Field label="Short description">
          <Textarea rows={3} value={content.servicesPreview.description} onChange={(e) => update("servicesPreview", { description: e.target.value })} />
        </Field>
        <ImageField label="Service preview image" value={content.servicesPreview.image} onChange={(v) => update("servicesPreview", { image: v })} />
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="CTA text">
            <Input value={content.servicesPreview.ctaText} onChange={(e) => update("servicesPreview", { ctaText: e.target.value })} />
          </Field>
          <Field label="CTA link">
            <Input value={content.servicesPreview.ctaLink} onChange={(e) => update("servicesPreview", { ctaLink: e.target.value })} />
          </Field>
        </div>
      </Section>

      <Section title="Portfolio Preview">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Featured project 1 — title">
            <Input value={content.portfolioPreview.project1Title} onChange={(e) => update("portfolioPreview", { project1Title: e.target.value })} />
          </Field>
          <ImageField compact label="Project 1 image" value={content.portfolioPreview.project1Image} onChange={(v) => update("portfolioPreview", { project1Image: v })} />
          <Field label="Featured project 2 — title">
            <Input value={content.portfolioPreview.project2Title} onChange={(e) => update("portfolioPreview", { project2Title: e.target.value })} />
          </Field>
          <ImageField compact label="Project 2 image" value={content.portfolioPreview.project2Image} onChange={(v) => update("portfolioPreview", { project2Image: v })} />
        </div>
      </Section>

      <Section title="RTG Drops">
        <Field label="Headline">
          <Input value={content.drops.headline} onChange={(e) => update("drops", { headline: e.target.value })} />
        </Field>
        <Field label="Short text">
          <Textarea rows={3} value={content.drops.text} onChange={(e) => update("drops", { text: e.target.value })} />
        </Field>
        <ImageField label="Drop image (optional)" value={content.drops.image} onChange={(v) => update("drops", { image: v })} />
        <Field label="Signup CTA text">
          <Input value={content.drops.ctaText} onChange={(e) => update("drops", { ctaText: e.target.value })} />
        </Field>
      </Section>

      <Section title="Footer Basics">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Contact email">
            <Input type="email" value={content.footer.email} onChange={(e) => update("footer", { email: e.target.value })} />
          </Field>
          <Field label="Phone number">
            <Input value={content.footer.phone} onChange={(e) => update("footer", { phone: e.target.value })} />
          </Field>
          <Field label="Instagram URL">
            <Input value={content.footer.instagram} onChange={(e) => update("footer", { instagram: e.target.value })} placeholder="https://instagram.com/…" />
          </Field>
          <Field label="YouTube URL">
            <Input value={content.footer.youtube} onChange={(e) => update("footer", { youtube: e.target.value })} placeholder="https://youtube.com/…" />
          </Field>
          <Field label="Twitter / X URL">
            <Input value={content.footer.twitter} onChange={(e) => update("footer", { twitter: e.target.value })} placeholder="https://x.com/…" />
          </Field>
          <Field label="Footer tagline">
            <Input value={content.footer.tagline} onChange={(e) => update("footer", { tagline: e.target.value })} />
          </Field>
        </div>
      </Section>

      {/* Sticky footer actions for long forms */}
      <div className="sticky bottom-0 -mx-5 md:-mx-7 px-5 md:px-7 py-3 bg-background/95 backdrop-blur border-t border-border flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </div>
        <div className="flex gap-2">
          <Button onClick={saveDraft} variant="secondary" size="sm" className="rounded-sm" disabled={busy || !dirty}>
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Draft
          </Button>
          <Button onClick={publish} size="sm" className="rounded-sm bg-primary hover:bg-primary/90" disabled={busy}>
            <Send className="h-3.5 w-3.5 mr-1.5" /> Publish Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------- Subviews -------------------------------- */

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border border-border rounded-sm bg-surface/40 p-5 space-y-4">
    <h3 className="font-display text-lg uppercase tracking-wider">{title}</h3>
    <div className="space-y-4">{children}</div>
  </section>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const ImageField = ({
  label,
  value,
  onChange,
  compact,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `homepage/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("site-content").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("site-content").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success("Image uploaded");
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-[160px_1fr]"} items-start`}>
        <div
          className={`relative rounded-sm border border-border bg-background overflow-hidden flex items-center justify-center ${
            compact ? "h-24 w-full" : "h-28 w-full md:w-40"
          }`}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
          )}
        </div>
        <div className="space-y-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste image URL or upload below"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-sm h-8"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-sm h-8 text-muted-foreground"
                onClick={() => onChange("")}
              >
                Clear
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default QuickSiteUpdates;
