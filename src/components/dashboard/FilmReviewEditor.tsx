import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AddBlockBar, BlockEditor, REVIEW_TEMPLATE, ReviewBlock, StarRatingInput, newBlock,
} from "./ReviewBlocks";

const inputCls = "h-9 text-xs bg-background border-border rounded-sm";
const textareaCls = "bg-background border-border rounded-sm text-xs";
const labelCls = "text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block";

type Status = "draft" | "submitted" | "revisions" | "approved" | "published";

export type FilmReviewArticle = {
  id: string;
  title: string;
  category: string | null;
  tags: string[] | null;
  cover_image_url: string | null;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  body_blocks?: ReviewBlock[] | null;
  film_title?: string | null;
  film_release_date?: string | null;
  film_runtime?: string | null;
  film_director?: string | null;
  film_studio?: string | null;
  film_genre?: string | null;
  film_mpaa_rating?: string | null;
  film_reviewer?: string | null;
  film_review_date?: string | null;
  rtg_rating?: number | null;
  audience_score?: number | null;
  rotten_tomatoes_score?: number | null;
  metacritic_score?: number | null;
  imdb_score?: number | null;
  is_official_rtg_review?: boolean | null;
  verdict_headline?: string | null;
  verdict_paragraph?: string | null;
  verdict_recommendation?: "recommended" | "mixed" | "not_recommended" | null;
};

const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

const FilmReviewEditor = ({
  article,
  userId,
  onClose,
  onSaved,
}: {
  article: FilmReviewArticle | null;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [title, setTitle] = useState(article?.title ?? "");
  const [category, setCategory] = useState(article?.category ?? "Film");
  const [tags, setTags] = useState((article?.tags ?? []).join(", "));
  const [cover, setCover] = useState(article?.cover_image_url ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [seoTitle, setSeoTitle] = useState(article?.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(article?.seo_description ?? "");

  const [filmTitle, setFilmTitle] = useState(article?.film_title ?? "");
  const [releaseDate, setReleaseDate] = useState(article?.film_release_date ?? "");
  const [runtime, setRuntime] = useState(article?.film_runtime ?? "");
  const [director, setDirector] = useState(article?.film_director ?? "");
  const [studio, setStudio] = useState(article?.film_studio ?? "");
  const [genre, setGenre] = useState(article?.film_genre ?? "");
  const [mpaa, setMpaa] = useState(article?.film_mpaa_rating ?? "");
  const [reviewer, setReviewer] = useState(article?.film_reviewer ?? "");
  const [reviewDate, setReviewDate] = useState(article?.film_review_date ?? new Date().toISOString().slice(0, 10));

  const [rtgRating, setRtgRating] = useState<number>(Number(article?.rtg_rating ?? 0));
  const [audience, setAudience] = useState<string>(article?.audience_score?.toString() ?? "");
  const [rt, setRt] = useState<string>(article?.rotten_tomatoes_score?.toString() ?? "");
  const [meta, setMeta] = useState<string>(article?.metacritic_score?.toString() ?? "");
  const [imdb, setImdb] = useState<string>(article?.imdb_score?.toString() ?? "");
  const [official, setOfficial] = useState<boolean>(!!article?.is_official_rtg_review);

  const [verdictHeadline, setVerdictHeadline] = useState(article?.verdict_headline ?? "");
  const [verdictParagraph, setVerdictParagraph] = useState(article?.verdict_paragraph ?? "");
  const [verdictRec, setVerdictRec] = useState<"recommended" | "mixed" | "not_recommended">(
    (article?.verdict_recommendation as any) ?? "recommended",
  );

  const [blocks, setBlocks] = useState<ReviewBlock[]>(
    Array.isArray(article?.body_blocks) && article!.body_blocks!.length > 0 ? article!.body_blocks! : [],
  );

  const [busy, setBusy] = useState(false);

  const updateBlock = (id: string, b: ReviewBlock) => setBlocks((prev) => prev.map((x) => (x.id === id ? b : x)));
  const moveBlock = (idx: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const arr = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= arr.length) return prev;
      [arr[idx], arr[t]] = [arr[t], arr[idx]];
      return arr;
    });
  };
  const duplicate = (idx: number) => setBlocks((prev) => {
    const copy = { ...prev[idx], id: crypto.randomUUID() };
    return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
  });
  const remove = (idx: number) => setBlocks((prev) => prev.filter((_, i) => i !== idx));
  const add = (kind: ReviewBlock["kind"]) => setBlocks((prev) => [...prev, newBlock(kind)]);

  const loadTemplate = () => {
    if (blocks.length > 0 && !confirm("Replace current blocks with the suggested review structure?")) return;
    setBlocks(REVIEW_TEMPLATE.map((b) => ({ ...b, id: crypto.randomUUID() })));
  };

  const save = async (status: Status) => {
    if (!title.trim()) return toast.error("Article title is required");
    if (!filmTitle.trim()) return toast.error("Film title is required");

    setBusy(true);
    const payload: any = {
      title: title.trim(),
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      cover_image_url: cover || null,
      excerpt: excerpt || null,
      seo_title: seoTitle || null,
      seo_description: seoDesc || null,
      status,
      author_id: userId,
      article_type: "film_review",
      body_blocks: blocks,
      film_title: filmTitle || null,
      film_release_date: releaseDate || null,
      film_runtime: runtime || null,
      film_director: director || null,
      film_studio: studio || null,
      film_genre: genre || null,
      film_mpaa_rating: mpaa || null,
      film_reviewer: reviewer || null,
      film_review_date: reviewDate || null,
      rtg_rating: rtgRating || null,
      audience_score: numOrNull(audience),
      rotten_tomatoes_score: numOrNull(rt),
      metacritic_score: numOrNull(meta),
      imdb_score: numOrNull(imdb),
      is_official_rtg_review: official,
      verdict_headline: verdictHeadline || null,
      verdict_paragraph: verdictParagraph || null,
      verdict_recommendation: verdictRec,
    };
    if (status === "published") payload.published_at = new Date().toISOString();

    const res = article?.id
      ? await supabase.from("articles").update(payload).eq("id", article.id)
      : await supabase.from("articles").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(status === "draft" ? "Saved as draft" : status === "published" ? "Published" : "Submitted for review");
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur z-50 flex items-stretch justify-end">
      <div className="w-full max-w-3xl bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-5 py-3 flex items-center justify-between z-10">
          <div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-primary">Film Review</div>
            <div className="font-display text-lg uppercase">{article?.id ? "Edit Review" : "New Review"}</div>
          </div>
          <div className="flex gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-sm uppercase tracking-widest text-[10px] h-8">Close</Button>
            <Button type="button" size="sm" disabled={busy} onClick={() => save("draft")} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-secondary text-foreground hover:bg-secondary/80">Save Draft</Button>
            <Button type="button" size="sm" disabled={busy} onClick={() => save("submitted")} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="h-3 w-3 mr-1" /> Submit
            </Button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* HEADER */}
          <section className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">Article</div>
            <div>
              <Label className={labelCls}>Article Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 text-xl font-display uppercase bg-background border-border rounded-sm" placeholder="Headline" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={labelCls}>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Film", "Music", "Fashion", "Chicago Culture", "Entertainment", "RTG Breakdown", "Opinion"].map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelCls}>Tags (comma separated)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="film, review" />
              </div>
            </div>
            <div>
              <Label className={labelCls}>Cinematic Hero Image URL</Label>
              <Input value={cover} onChange={(e) => setCover(e.target.value)} className={inputCls} placeholder="https://…" />
              {cover && <img src={cover} alt="" className="mt-2 aspect-[21/9] w-full object-cover border border-border rounded-sm" />}
            </div>
            <div>
              <Label className={labelCls}>Excerpt / Tagline</Label>
              <Textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={textareaCls} placeholder="One-line hook" />
            </div>
            <div className="flex items-center justify-between border border-border rounded-sm px-3 py-2 bg-surface/30">
              <div>
                <div className="text-xs font-medium">This is an official RTG review</div>
                <div className="text-[10px] text-muted-foreground">Displays an "RTG REVIEW" badge on the article.</div>
              </div>
              <Switch checked={official} onCheckedChange={setOfficial} />
            </div>
          </section>

          {/* FILM METADATA */}
          <section className="space-y-3 border-t border-border pt-5">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">Film Metadata</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className={labelCls}>Film Title *</Label>
                <Input value={filmTitle} onChange={(e) => setFilmTitle(e.target.value)} className={inputCls} />
              </div>
              <div><Label className={labelCls}>Release Date</Label><Input type="date" value={releaseDate ?? ""} onChange={(e) => setReleaseDate(e.target.value)} className={inputCls} /></div>
              <div><Label className={labelCls}>Runtime</Label><Input value={runtime} onChange={(e) => setRuntime(e.target.value)} className={inputCls} placeholder="2h 18m" /></div>
              <div><Label className={labelCls}>Director</Label><Input value={director} onChange={(e) => setDirector(e.target.value)} className={inputCls} /></div>
              <div><Label className={labelCls}>Studio / Distributor</Label><Input value={studio} onChange={(e) => setStudio(e.target.value)} className={inputCls} /></div>
              <div><Label className={labelCls}>Genre</Label><Input value={genre} onChange={(e) => setGenre(e.target.value)} className={inputCls} placeholder="Drama, Thriller" /></div>
              <div>
                <Label className={labelCls}>MPAA Rating</Label>
                <Select value={mpaa || "none"} onValueChange={(v) => setMpaa(v === "none" ? "" : v)}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">—</SelectItem>
                    {["G", "PG", "PG-13", "R", "NC-17", "NR"].map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className={labelCls}>RTG Reviewer</Label><Input value={reviewer} onChange={(e) => setReviewer(e.target.value)} className={inputCls} /></div>
              <div><Label className={labelCls}>Review Date</Label><Input type="date" value={reviewDate ?? ""} onChange={(e) => setReviewDate(e.target.value)} className={inputCls} /></div>
            </div>
          </section>

          {/* RATINGS */}
          <section className="space-y-3 border-t border-border pt-5">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">Ratings</div>
            <div className="border border-border rounded-sm p-3 bg-surface/30">
              <Label className={labelCls}>RTG Rating</Label>
              <StarRatingInput value={rtgRating} onChange={setRtgRating} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label className={labelCls}>Audience (0-100)</Label><Input type="number" min={0} max={100} value={audience} onChange={(e) => setAudience(e.target.value)} className={inputCls} /></div>
              <div><Label className={labelCls}>Rotten Tomatoes (0-100)</Label><Input type="number" min={0} max={100} value={rt} onChange={(e) => setRt(e.target.value)} className={inputCls} /></div>
              <div><Label className={labelCls}>Metacritic (0-100)</Label><Input type="number" min={0} max={100} value={meta} onChange={(e) => setMeta(e.target.value)} className={inputCls} /></div>
              <div><Label className={labelCls}>IMDb (0-10)</Label><Input type="number" min={0} max={10} step={0.1} value={imdb} onChange={(e) => setImdb(e.target.value)} className={inputCls} /></div>
            </div>
            <div className="text-[10px] text-muted-foreground">Scores are entered manually. External APIs not connected yet.</div>
          </section>

          {/* BODY BLOCKS */}
          <section className="space-y-3 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">Review Body</div>
              <Button type="button" variant="outline" size="sm" onClick={loadTemplate} className="rounded-sm uppercase tracking-widest text-[10px] h-7">
                <Sparkles className="h-3 w-3 mr-1" /> Load Template
              </Button>
            </div>
            {blocks.length === 0 && (
              <div className="border border-dashed border-border rounded-sm py-8 text-center text-xs text-muted-foreground">
                No blocks yet. Add a block below or load the suggested review structure.
              </div>
            )}
            <div className="space-y-2">
              {blocks.map((b, i) => (
                <BlockEditor
                  key={b.id}
                  block={b}
                  index={i}
                  total={blocks.length}
                  onChange={(nb) => updateBlock(b.id, nb)}
                  onMoveUp={() => moveBlock(i, -1)}
                  onMoveDown={() => moveBlock(i, 1)}
                  onDuplicate={() => duplicate(i)}
                  onDelete={() => remove(i)}
                />
              ))}
            </div>
            <AddBlockBar onAdd={add} />
          </section>

          {/* FINAL VERDICT */}
          <section className="space-y-3 border-t border-border pt-5">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">Final Verdict (Summary)</div>
            <Input value={verdictHeadline} onChange={(e) => setVerdictHeadline(e.target.value)} className={inputCls} placeholder="Verdict headline" />
            <Textarea rows={3} value={verdictParagraph} onChange={(e) => setVerdictParagraph(e.target.value)} className={textareaCls} placeholder="Short final verdict paragraph" />
            <Select value={verdictRec} onValueChange={(v) => setVerdictRec(v as any)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended" className="text-xs">Recommended</SelectItem>
                <SelectItem value="mixed" className="text-xs">Mixed</SelectItem>
                <SelectItem value="not_recommended" className="text-xs">Not Recommended</SelectItem>
              </SelectContent>
            </Select>
          </section>

          {/* SEO */}
          <section className="space-y-2.5 border-t border-border pt-5">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">SEO</div>
            <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={60} className={inputCls} placeholder="SEO Title (≤60 chars)" />
            <Textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} maxLength={160} rows={2} className={textareaCls} placeholder="Meta description (≤160 chars)" />
          </section>
        </div>
      </div>
    </div>
  );
};

export default FilmReviewEditor;
