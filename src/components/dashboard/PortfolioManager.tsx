import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Plus, ExternalLink } from "lucide-react";
import { MediaUploader } from "./MediaUploader";
import { deleteProfileMediaByUrl } from "@/lib/mediaUpload";

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  media_type: string;
  media_url: string | null;
  thumbnail_url: string | null;
  tags: string[];
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
};

const CATEGORIES = ["Photography", "Video", "Music Video", "Short Film", "Design", "Resume", "Other"];

export const PortfolioManager = ({ staffId, userId }: { staffId: string; userId: string }) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    category: "Photography",
    media_url: "",
    thumbnail_url: "",
    media_type: "image",
    tags: "",
    is_public: true,
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("staff_id", staffId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [staffId]);

  const reset = () => {
    setDraft({
      title: "",
      description: "",
      category: "Photography",
      media_url: "",
      thumbnail_url: "",
      media_type: "image",
      tags: "",
      is_public: true,
    });
    setAdding(false);
  };

  const create = async () => {
    if (!draft.title.trim()) return toast.error("Add a title");
    if (!draft.media_url) return toast.error("Upload a file or paste a URL");
    const tags = draft.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const { error } = await supabase.from("portfolio_items").insert({
      staff_id: staffId,
      submitted_by: userId,
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      category: draft.category,
      media_type: draft.media_type,
      media_url: draft.media_url,
      thumbnail_url: draft.thumbnail_url || null,
      tags,
      is_public: draft.is_public,
      approval_status: "approved",
    });
    if (error) return toast.error(error.message);
    toast.success("Project added");
    reset();
    load();
  };

  const remove = async (item: PortfolioItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    if (item.media_url) await deleteProfileMediaByUrl(item.media_url).catch(() => {});
    if (item.thumbnail_url) await deleteProfileMediaByUrl(item.thumbnail_url).catch(() => {});
    const { error } = await supabase.from("portfolio_items").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    setItems((xs) => xs.filter((x) => x.id !== item.id));
  };

  return (
    <section className="border border-border/60 rounded-lg p-4 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-display text-lg">Portfolio</h3>
          <p className="text-xs text-muted-foreground">Upload images, videos, PDFs, or paste links from YouTube, Vimeo, Drive, etc.</p>
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add Project
          </Button>
        )}
      </div>

      {adding && (
        <div className="border border-border/40 rounded-lg p-3 space-y-3 bg-background/30">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Media</Label>
              <MediaUploader
                userId={userId}
                folder="portfolio"
                accept="image/*,video/*,application/pdf"
                currentUrl={draft.media_url || null}
                onChange={(url, kind) =>
                  setDraft({ ...draft, media_url: url, media_type: kind === "external_url" ? "video" : kind })
                }
                onClear={() => setDraft({ ...draft, media_url: "" })}
                label="Image, video, or PDF (or paste a URL)"
                preview="thumb"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Thumbnail (optional, recommended for video / PDF)</Label>
              <MediaUploader
                userId={userId}
                folder="covers"
                accept="image/*"
                currentUrl={draft.thumbnail_url || null}
                onChange={(url) => setDraft({ ...draft, thumbnail_url: url })}
                onClear={() => setDraft({ ...draft, thumbnail_url: "" })}
                label="Image only"
                preview="thumb"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Tags (comma separated)</Label>
              <Input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="music video, cinematic, brand" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={reset}>Cancel</Button>
            <Button size="sm" onClick={create}>Save Project</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading portfolio…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet. Add your first one above.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((it) => {
            const thumb = it.thumbnail_url || (it.media_type === "image" ? it.media_url : null);
            return (
              <div key={it.id} className="border border-border/40 rounded-lg overflow-hidden bg-background/30 group relative">
                <div className="aspect-square bg-muted/40 flex items-center justify-center">
                  {thumb ? (
                    <img src={thumb} alt={it.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground px-2 text-center break-all">{it.media_type.toUpperCase()}</span>
                  )}
                </div>
                <div className="p-2 space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-medium truncate flex-1">{it.title}</p>
                    <button onClick={() => remove(it)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <Badge variant="outline" className="text-[10px]">{it.category}</Badge>
                    {it.media_url && (
                      <a href={it.media_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
