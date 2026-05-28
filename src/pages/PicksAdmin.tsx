import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, Save } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminCountdown,
  ArtistPickCard,
  PICK_BUCKET,
  formatWeekOf,
  useCurrentPicks,
  type Pick,
  type PickCategory,
} from "@/components/site/ArtistPicks";
import { CornerFrame, FlagTag } from "@/components/site/RtgMagazine";

const CATEGORIES: { key: PickCategory; label: string }[] = [
  { key: "mainstream", label: "Mainstream" },
  { key: "independent", label: "Independent" },
];

type FormState = {
  artist_name: string;
  description: string;
  link: string;
  image_url: string;
};

const blank: FormState = { artist_name: "", description: "", link: "", image_url: "" };

const SlotEditor = ({
  category,
  current,
  onPublished,
}: {
  category: PickCategory;
  current: Pick | null;
  onPublished: () => void;
}) => {
  const [form, setForm] = useState<FormState>(blank);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
      artist_name: current?.artist_name ?? "",
      description: current?.description ?? "",
      link: current?.link ?? "",
      image_url: current?.image_url ?? "",
    });
  }, [current?.id]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Image required", description: "Pick a photo file.", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Too large", description: "Keep photos under 8MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${category}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from(PICK_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from(PICK_BUCKET).getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast({ title: "Photo uploaded", description: "Don't forget to Publish." });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const publish = async () => {
    if (!form.artist_name.trim()) {
      toast({ title: "Artist name required", variant: "destructive" });
      return;
    }
    setPublishing(true);
    try {
      const { error } = await supabase.rpc("publish_pick" as any, {
        _category: category,
        _artist_name: form.artist_name.trim(),
        _description: form.description.trim() || null,
        _image_url: form.image_url || null,
        _link: form.link.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Published", description: `${category === "mainstream" ? "Mainstream" : "Independent"} pick is live.` });
      onPublished();
    } catch (e: any) {
      toast({ title: "Publish failed", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const previewPick: Pick = {
    id: "preview",
    category,
    artist_name: form.artist_name || current?.artist_name || "",
    description: form.description || null,
    image_url: form.image_url || null,
    link: form.link || null,
    published_at: current?.published_at ?? new Date().toISOString(),
    is_current: true,
  };

  return (
    <div className="relative border border-border bg-card p-6 md:p-7">
      <CornerFrame />
      <div className="flex items-center justify-between gap-3 mb-5">
        <FlagTag>{category === "mainstream" ? "Mainstream" : "Independent"}</FlagTag>
        <AdminCountdown pick={current} />
      </div>

      <div className="grid gap-7 md:grid-cols-2">
        {/* PREVIEW */}
        <div>
          <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Preview</div>
          <ArtistPickCard category={category} pick={previewPick} />
          <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Current week of {formatWeekOf(current?.published_at) || "—"}
          </p>
        </div>

        {/* FORM */}
        <div className="space-y-4">
          <div>
            <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Photo (4:5)</Label>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative h-24 w-[76.8px] shrink-0 overflow-hidden border border-border bg-ink">
                {form.image_url ? (
                  <img src={form.image_url} alt="thumb" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">
                    No photo
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-sm uppercase tracking-wider text-xs"
                >
                  {uploading ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3 mr-1" />
                  )}
                  {form.image_url ? "Replace photo" : "Upload photo"}
                </Button>
                <p className="text-[10px] text-muted-foreground">JPG/PNG · cropped to 4:5</p>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Artist Name</Label>
            <Input
              value={form.artist_name}
              onChange={(e) => setForm((f) => ({ ...f, artist_name: e.target.value }))}
              placeholder="e.g. Saba"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="A short blurb on why they're the pick this week…"
              rows={4}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Link (optional)</Label>
            <Input
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
              placeholder="https://…"
              className="mt-1.5"
            />
          </div>

          <Button
            type="button"
            onClick={publish}
            disabled={publishing}
            className="btn-cinematic bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm uppercase tracking-wider"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Publish pick
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Publishing archives the previous {category} pick and resets the countdown to 7 days.
          </p>
        </div>
      </div>
    </div>
  );
};

const PicksAdmin = () => {
  const { picks, loading, refresh } = useCurrentPicks();

  return (
    <SiteLayout>
      <div className="rtg-stage grain-heavy">
        <section className="container-rtg pt-14 md:pt-20 pb-10">
          <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Admin · RTG Picks
          </div>
          <h1 className="font-condensed uppercase leading-[0.9] text-cream text-5xl md:text-7xl">
            Artist of the Week
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            Update the two weekly slots. Publishing a new pick archives the previous one automatically.
          </p>
        </section>

        <section className="container-rtg pb-20 grid gap-10">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading current picks…</div>
          ) : (
            CATEGORIES.map((c) => (
              <SlotEditor
                key={c.key}
                category={c.key}
                current={picks[c.key]}
                onPublished={refresh}
              />
            ))
          )}
        </section>
      </div>
    </SiteLayout>
  );
};

export default PicksAdmin;
