import { useState } from "react";
import { Send, Sparkles, Plus, Trash2, CalendarClock, Globe, FileEdit as DraftIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AddBlockBar, BlockEditor, ReviewBlock, StarRatingInput, newBlock, REVIEW_TEMPLATE,
} from "./ReviewBlocks";

export type ArticleType =
  | "standard" | "film_review" | "album_review" | "single_review" | "game_review"
  | "interview" | "opinion" | "breakdown" | "news";

type Status = "draft" | "submitted" | "revisions" | "approved" | "scheduled" | "published" | "archived";
type PublishMode = "draft" | "submit" | "publish_now" | "schedule";

const TYPE_LABEL: Record<ArticleType, string> = {
  standard: "Standard Article",
  film_review: "Film Review",
  album_review: "Album Review",
  single_review: "Single Review",
  game_review: "Game Review",
  interview: "Interview",
  opinion: "Opinion",
  breakdown: "Breakdown",
  news: "News",
};

const inputCls = "h-9 text-xs bg-background border-border rounded-sm";
const textareaCls = "bg-background border-border rounded-sm text-xs";
const labelCls = "text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block";

const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

/* ----- per-type starter block templates ----- */
const ALBUM_TEMPLATE: ReviewBlock[] = [
  { id: crypto.randomUUID(), kind: "heading", text: "First Listen", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Standout Tracks", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Weakest Tracks", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "highlight_quote", text: "", speaker: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Production Notes", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "verdict", headline: "Final Verdict", text: "", recommendation: "recommended" },
];
const SINGLE_TEMPLATE: ReviewBlock[] = [
  { id: crypto.randomUUID(), kind: "embed", url: "", caption: "" },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "highlight_quote", text: "Lyric highlight", speaker: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Production Notes", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "verdict", headline: "Final Verdict", text: "", recommendation: "recommended" },
];
const INTERVIEW_TEMPLATE: ReviewBlock[] = [
  { id: crypto.randomUUID(), kind: "heading", text: "Intro", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "pull_quote", text: "", speaker: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "The Conversation", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "Q: \nA: " },
  { id: crypto.randomUUID(), kind: "paragraph", text: "Q: \nA: " },
  { id: crypto.randomUUID(), kind: "gallery", images: [{ url: "", caption: "", credit: "" }] },
  { id: crypto.randomUUID(), kind: "heading", text: "Closing Notes", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
];
const BREAKDOWN_TEMPLATE: ReviewBlock[] = [
  { id: crypto.randomUUID(), kind: "heading", text: "Key Points", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Timeline", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Theories", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "gallery", images: [{ url: "", caption: "", credit: "" }] },
  { id: crypto.randomUUID(), kind: "heading", text: "Final Takeaway", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
];
const NEWS_TEMPLATE: ReviewBlock[] = [
  { id: crypto.randomUUID(), kind: "heading", text: "Summary", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Key Facts", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "• " },
  { id: crypto.randomUUID(), kind: "quote", text: "", speaker: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Context", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "What Happens Next", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
];

const GAME_TEMPLATE: ReviewBlock[] = [
  { id: crypto.randomUUID(), kind: "heading", text: "Gameplay", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Story", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Graphics / Art Direction", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Sound / Music", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Performance", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "heading", text: "Replay Value", level: 2 },
  { id: crypto.randomUUID(), kind: "paragraph", text: "" },
  { id: crypto.randomUUID(), kind: "pros_cons", pros: [""], cons: [""] },
  { id: crypto.randomUUID(), kind: "highlight_quote", text: "", speaker: "" },
  { id: crypto.randomUUID(), kind: "verdict", headline: "Final Verdict", text: "", recommendation: "recommended" },
];

const TEMPLATES: Partial<Record<ArticleType, ReviewBlock[]>> = {
  film_review: REVIEW_TEMPLATE,
  album_review: ALBUM_TEMPLATE,
  single_review: SINGLE_TEMPLATE,
  game_review: GAME_TEMPLATE,
  interview: INTERVIEW_TEMPLATE,
  breakdown: BREAKDOWN_TEMPLATE,
  news: NEWS_TEMPLATE,
};

const SectionHead = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold pt-2">{children}</div>
);

const FieldGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-3">{children}</div>
);

const Field = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div className={full ? "col-span-2" : ""}>
    <Label className={labelCls}>{label}</Label>
    {children}
  </div>
);

const UniversalEditor = ({
  article,
  userId,
  initialType,
  onClose,
  onSaved,
}: {
  article: any | null;
  userId: string;
  initialType: ArticleType;
  onClose: () => void;
  onSaved: () => void;
}) => {
  // Core
  const [type, setType] = useState<ArticleType>((article?.article_type as ArticleType) ?? initialType);
  const [title, setTitle] = useState(article?.title ?? "");
  const [category, setCategory] = useState(article?.category ?? "Music");
  const [tags, setTags] = useState((article?.tags ?? []).join(", "));
  const [cover, setCover] = useState(article?.cover_image_url ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [seoTitle, setSeoTitle] = useState(article?.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(article?.seo_description ?? "");
  const [writerName, setWriterName] = useState(article?.writer_name ?? "");

  // Film
  const [filmTitle, setFilmTitle] = useState(article?.film_title ?? "");
  const [filmReleaseDate, setFilmReleaseDate] = useState(article?.film_release_date ?? "");
  const [filmRuntime, setFilmRuntime] = useState(article?.film_runtime ?? "");
  const [filmDirector, setFilmDirector] = useState(article?.film_director ?? "");
  const [filmStudio, setFilmStudio] = useState(article?.film_studio ?? "");
  const [filmGenre, setFilmGenre] = useState(article?.film_genre ?? "");
  const [filmMpaa, setFilmMpaa] = useState(article?.film_mpaa_rating ?? "");
  const [filmReviewer, setFilmReviewer] = useState(article?.film_reviewer ?? "");
  const [filmReviewDate, setFilmReviewDate] = useState(article?.film_review_date ?? "");

  // Music (album/single)
  const [musicArtist, setMusicArtist] = useState(article?.music_artist ?? "");
  const [musicAlbumTitle, setMusicAlbumTitle] = useState(article?.music_album_title ?? "");
  const [musicSongTitle, setMusicSongTitle] = useState(article?.music_song_title ?? "");
  const [musicLabel, setMusicLabel] = useState(article?.music_label ?? "");
  const [musicReleaseDate, setMusicReleaseDate] = useState(article?.music_release_date ?? "");
  const [musicGenre, setMusicGenre] = useState(article?.music_genre ?? "");
  const [musicRuntime, setMusicRuntime] = useState(article?.music_runtime ?? "");
  const [musicTrackCount, setMusicTrackCount] = useState<string>(article?.music_track_count?.toString() ?? "");
  const [musicProducer, setMusicProducer] = useState(article?.music_producer ?? "");
  const [musicEmbed, setMusicEmbed] = useState(article?.music_embed_url ?? "");
  const [tracklist, setTracklist] = useState<string[]>(
    Array.isArray(article?.music_tracklist) ? article.music_tracklist : [],
  );

  // Interview
  const [interviewee, setInterviewee] = useState(article?.interview_interviewee ?? "");
  const [intRole, setIntRole] = useState(article?.interview_role ?? "");
  const [intDate, setIntDate] = useState(article?.interview_date ?? "");
  const [intLocation, setIntLocation] = useState(article?.interview_location ?? "");
  const [intPhotographer, setIntPhotographer] = useState(article?.interview_photographer ?? "");

  // Breakdown
  const [bdSubject, setBdSubject] = useState(article?.breakdown_subject ?? "");
  const [bdCategory, setBdCategory] = useState(article?.breakdown_category ?? "Film");
  const [bdEpisode, setBdEpisode] = useState(article?.breakdown_episode ?? "");
  const [bdSpoiler, setBdSpoiler] = useState<boolean>(!!article?.breakdown_spoiler);

  // News
  const [newsSub, setNewsSub] = useState(article?.news_subheadline ?? "");
  const [newsSource, setNewsSource] = useState(article?.news_source ?? "");
  const [newsDate, setNewsDate] = useState(article?.news_date ?? "");
  const [newsLocation, setNewsLocation] = useState(article?.news_location ?? "");

  // Game
  const [gameTitle, setGameTitle] = useState(article?.game_title ?? "");
  const [gameDeveloper, setGameDeveloper] = useState(article?.game_developer ?? "");
  const [gamePublisher, setGamePublisher] = useState(article?.game_publisher ?? "");
  const [gameReleaseDate, setGameReleaseDate] = useState(article?.game_release_date ?? "");
  const [gamePlatforms, setGamePlatforms] = useState(article?.game_platforms ?? "");
  const [gameGenre, setGameGenre] = useState(article?.game_genre ?? "");
  const [gameEsrb, setGameEsrb] = useState(article?.game_esrb_rating ?? "");
  const [gameReviewer, setGameReviewer] = useState(article?.game_reviewer ?? "");
  const [steamScore, setSteamScore] = useState<string>(article?.steam_score?.toString() ?? "");
  const [gameTrailer, setGameTrailer] = useState(article?.game_trailer_url ?? "");
  const [gameScreenshots, setGameScreenshots] = useState<string[]>(
    Array.isArray(article?.game_screenshots) ? article.game_screenshots : [],
  );

  // Ratings (film + music + game)
  const [rtgRating, setRtgRating] = useState<number>(Number(article?.rtg_rating ?? 0));
  const [audience, setAudience] = useState<string>(article?.audience_score?.toString() ?? "");
  const [rt, setRt] = useState<string>(article?.rotten_tomatoes_score?.toString() ?? "");
  const [meta, setMeta] = useState<string>(article?.metacritic_score?.toString() ?? "");
  const [imdb, setImdb] = useState<string>(article?.imdb_score?.toString() ?? "");
  const [official, setOfficial] = useState<boolean>(!!article?.is_official_rtg_review);

  // Publish settings
  const initStatus = (article?.status as Status) ?? "draft";
  const initMode: PublishMode =
    initStatus === "scheduled" ? "schedule" :
    initStatus === "published" ? "publish_now" :
    initStatus === "submitted" ? "submit" : "draft";
  const [publishMode, setPublishMode] = useState<PublishMode>(initMode);
  const initSched = article?.scheduled_for ? new Date(article.scheduled_for) : null;
  const [schedDate, setSchedDate] = useState<string>(initSched ? initSched.toISOString().slice(0, 10) : "");
  const [schedTime, setSchedTime] = useState<string>(initSched ? initSched.toTimeString().slice(0, 5) : "09:00");
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [schedTz, setSchedTz] = useState<string>(article?.scheduled_timezone ?? browserTz);
  const [featuredUntil, setFeaturedUntil] = useState<string>(article?.featured_until ?? "");

  // Verdict
  const [verdictHeadline, setVerdictHeadline] = useState(article?.verdict_headline ?? "");
  const [verdictParagraph, setVerdictParagraph] = useState(article?.verdict_paragraph ?? "");
  const [verdictRec, setVerdictRec] = useState<"recommended" | "mixed" | "not_recommended">(
    (article?.verdict_recommendation as any) ?? "recommended",
  );

  // Body blocks (used by all rich types)
  const [blocks, setBlocks] = useState<ReviewBlock[]>(
    Array.isArray(article?.body_blocks) && article!.body_blocks!.length > 0 ? article!.body_blocks : [],
  );

  const [busy, setBusy] = useState(false);

  /* block ops */
  const updateBlock = (id: string, b: ReviewBlock) => setBlocks((p) => p.map((x) => (x.id === id ? b : x)));
  const moveBlock = (idx: number, dir: -1 | 1) => setBlocks((p) => {
    const arr = [...p]; const t = idx + dir;
    if (t < 0 || t >= arr.length) return p;
    [arr[idx], arr[t]] = [arr[t], arr[idx]]; return arr;
  });
  const duplicate = (idx: number) => setBlocks((p) => {
    const c = { ...p[idx], id: crypto.randomUUID() };
    return [...p.slice(0, idx + 1), c, ...p.slice(idx + 1)];
  });
  const remove = (idx: number) => setBlocks((p) => p.filter((_, i) => i !== idx));
  const add = (kind: ReviewBlock["kind"]) => setBlocks((p) => [...p, newBlock(kind)]);

  const loadTemplate = () => {
    const tpl = TEMPLATES[type];
    if (!tpl) return toast.message("No template for this type");
    if (blocks.length > 0 && !confirm("Replace current blocks with the suggested structure?")) return;
    setBlocks(tpl.map((b) => ({ ...b, id: crypto.randomUUID() })));
  };

  /* validation per type */
  const validate = (): string | null => {
    if (!title.trim()) return "Article title is required";
    if (type === "film_review" && !filmTitle.trim()) return "Film title is required";
    if (type === "album_review" && (!musicAlbumTitle.trim() || !musicArtist.trim())) return "Album title and artist are required";
    if (type === "single_review" && (!musicSongTitle.trim() || !musicArtist.trim())) return "Song title and artist are required";
    if (type === "game_review" && !gameTitle.trim()) return "Game title is required";
    if (type === "interview" && !interviewee.trim()) return "Interviewee name is required";
    if (type === "breakdown" && !bdSubject.trim()) return "Subject title is required";
    if (type === "news" && !title.trim()) return "Headline is required";
    return null;
  };

  const resolveStatusFromMode = (mode: PublishMode): { status: Status; scheduledIso: string | null } => {
    if (mode === "draft") return { status: "draft", scheduledIso: null };
    if (mode === "submit") return { status: "submitted", scheduledIso: null };
    if (mode === "publish_now") return { status: "published", scheduledIso: null };
    // schedule
    if (!schedDate) return { status: "draft", scheduledIso: null };
    const iso = new Date(`${schedDate}T${schedTime || "09:00"}:00`).toISOString();
    return { status: "scheduled", scheduledIso: iso };
  };

  const save = async (overrideStatus?: Status) => {
    const err = validate();
    if (err) return toast.error(err);

    let status: Status;
    let scheduledIso: string | null = null;
    if (overrideStatus) {
      status = overrideStatus;
    } else {
      const r = resolveStatusFromMode(publishMode);
      status = r.status;
      scheduledIso = r.scheduledIso;
      if (publishMode === "schedule" && !scheduledIso) return toast.error("Pick a publish date for scheduling");
    }

    setBusy(true);

    const isMusic = type === "album_review" || type === "single_review";
    const isGame = type === "game_review";
    const isReview = type === "film_review" || isMusic || isGame;

    const payload: any = {
      title: title.trim(),
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      cover_image_url: cover || null,
      excerpt: excerpt || null,
      body: type === "standard" ? (body || null) : null,
      body_blocks: type === "standard" ? [] : blocks,
      seo_title: seoTitle || null,
      seo_description: seoDesc || null,
      status,
      author_id: userId,
      article_type: type,
      writer_name: writerName || null,
      // scheduling
      scheduled_for: scheduledIso,
      scheduled_timezone: status === "scheduled" ? schedTz : null,
      featured_until: featuredUntil || null,
      // film
      film_title: type === "film_review" ? (filmTitle || null) : null,
      film_release_date: type === "film_review" ? (filmReleaseDate || null) : null,
      film_runtime: type === "film_review" ? (filmRuntime || null) : null,
      film_director: type === "film_review" ? (filmDirector || null) : null,
      film_studio: type === "film_review" ? (filmStudio || null) : null,
      film_genre: type === "film_review" ? (filmGenre || null) : null,
      film_mpaa_rating: type === "film_review" ? (filmMpaa || null) : null,
      film_reviewer: type === "film_review" ? (filmReviewer || null) : null,
      film_review_date: type === "film_review" ? (filmReviewDate || null) : null,
      // music
      music_artist: isMusic ? (musicArtist || null) : null,
      music_album_title: type === "album_review" ? (musicAlbumTitle || null) : null,
      music_song_title: type === "single_review" ? (musicSongTitle || null) : null,
      music_label: isMusic ? (musicLabel || null) : null,
      music_release_date: isMusic ? (musicReleaseDate || null) : null,
      music_genre: isMusic ? (musicGenre || null) : null,
      music_runtime: isMusic ? (musicRuntime || null) : null,
      music_track_count: type === "album_review" ? (numOrNull(musicTrackCount) as any) : null,
      music_producer: type === "single_review" ? (musicProducer || null) : null,
      music_embed_url: isMusic ? (musicEmbed || null) : null,
      music_tracklist: type === "album_review" ? tracklist.filter(Boolean) : [],
      // interview
      interview_interviewee: type === "interview" ? (interviewee || null) : null,
      interview_role: type === "interview" ? (intRole || null) : null,
      interview_date: type === "interview" ? (intDate || null) : null,
      interview_location: type === "interview" ? (intLocation || null) : null,
      interview_photographer: type === "interview" ? (intPhotographer || null) : null,
      // breakdown
      breakdown_subject: type === "breakdown" ? (bdSubject || null) : null,
      breakdown_category: type === "breakdown" ? (bdCategory || null) : null,
      breakdown_episode: type === "breakdown" ? (bdEpisode || null) : null,
      breakdown_spoiler: type === "breakdown" ? bdSpoiler : false,
      // news
      news_subheadline: type === "news" ? (newsSub || null) : null,
      news_source: type === "news" ? (newsSource || null) : null,
      news_date: type === "news" ? (newsDate || null) : null,
      news_location: type === "news" ? (newsLocation || null) : null,
      // game
      game_title: isGame ? (gameTitle || null) : null,
      game_developer: isGame ? (gameDeveloper || null) : null,
      game_publisher: isGame ? (gamePublisher || null) : null,
      game_release_date: isGame ? (gameReleaseDate || null) : null,
      game_platforms: isGame ? (gamePlatforms || null) : null,
      game_genre: isGame ? (gameGenre || null) : null,
      game_esrb_rating: isGame ? (gameEsrb || null) : null,
      game_reviewer: isGame ? (gameReviewer || null) : null,
      game_trailer_url: isGame ? (gameTrailer || null) : null,
      game_screenshots: isGame ? gameScreenshots.filter(Boolean) : [],
      // review bits
      rtg_rating: isReview ? (rtgRating || null) : null,
      audience_score: isReview ? (numOrNull(audience) as any) : null,
      rotten_tomatoes_score: type === "film_review" ? (numOrNull(rt) as any) : null,
      metacritic_score: (type === "film_review" || isGame) ? (numOrNull(meta) as any) : null,
      imdb_score: type === "film_review" ? (numOrNull(imdb) as any) : null,
      steam_score: isGame ? (numOrNull(steamScore) as any) : null,
      is_official_rtg_review: isReview ? official : false,
      verdict_headline: isReview ? (verdictHeadline || null) : null,
      verdict_paragraph: isReview ? (verdictParagraph || null) : null,
      verdict_recommendation: isReview ? verdictRec : null,
    };
    if (status === "published") payload.published_at = new Date().toISOString();

    const res = article?.id
      ? await supabase.from("articles").update(payload).eq("id", article.id)
      : await supabase.from("articles").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    const msg =
      status === "draft" ? "Saved as draft" :
      status === "submitted" ? "Submitted for review" :
      status === "scheduled" ? `Scheduled for ${new Date(scheduledIso!).toLocaleString()}` :
      status === "published" ? "Published" : `Moved to ${status}`;
    toast.success(msg);
    onSaved();
  };

  const isReview = type === "film_review" || type === "album_review" || type === "single_review" || type === "game_review";
  const isGame = type === "game_review";


  /* ============================== UI ============================== */
  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur z-50 flex items-stretch justify-end">
      <div className="w-full max-w-3xl bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-5 py-3 flex items-center justify-between z-10">
          <div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-primary">{TYPE_LABEL[type]}</div>
            <div className="font-display text-lg uppercase">{article?.id ? "Edit Article" : "New Article"}</div>
          </div>
          <div className="flex gap-1.5 items-center">
            {article?.status && (
              <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground border border-border rounded-sm px-2 py-1">
                {article.status}
              </span>
            )}
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-sm uppercase tracking-widest text-[10px] h-8">Close</Button>
            <Button type="button" size="sm" disabled={busy} onClick={() => save("draft")} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-secondary text-foreground hover:bg-secondary/80">Save Draft</Button>
            <Button type="button" size="sm" disabled={busy} onClick={() => save()} className="rounded-sm uppercase tracking-widest text-[10px] h-8 bg-primary text-primary-foreground hover:bg-primary/90">
              {publishMode === "publish_now" ? <><Globe className="h-3 w-3 mr-1" /> Publish</> :
               publishMode === "schedule" ? <><CalendarClock className="h-3 w-3 mr-1" /> Schedule</> :
               publishMode === "submit" ? <><Send className="h-3 w-3 mr-1" /> Submit</> :
               <><DraftIcon className="h-3 w-3 mr-1" /> Save</>}
            </Button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* TYPE + COMMON HEADER */}
          <section className="space-y-3">
            <div>
              <Label className={labelCls}>Article Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ArticleType)}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABEL) as ArticleType[]).map((k) => (
                    <SelectItem key={k} value={k} className="text-xs">{TYPE_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelCls}>{type === "news" ? "Headline" : "Article Title"}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 text-xl font-display uppercase bg-background border-border rounded-sm" placeholder={type === "news" ? "Breaking…" : "Headline"} />
            </div>
            <FieldGrid>
              <Field label="Category">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Music", "Film", "Fashion", "Chicago Culture", "Entertainment", "Sports", "RTG Breakdown", "Opinion", "News"].map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Tags (comma separated)">
                <Input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="chicago, review" />
              </Field>
            </FieldGrid>
            <Field label="Cover Image URL" full>
              <Input value={cover} onChange={(e) => setCover(e.target.value)} className={inputCls} placeholder="https://…" />
              {cover && <img src={cover} alt="" className="mt-2 aspect-[16/9] w-full object-cover border border-border rounded-sm" />}
            </Field>
            <Field label={type === "news" ? "Subheadline / Lede" : "Excerpt"} full>
              <Textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={textareaCls} placeholder="One-line hook" />
            </Field>
          </section>

          {/* ---------- FILM REVIEW PANEL ---------- */}
          {type === "film_review" && (
            <section className="space-y-3 border-t border-border pt-5">
              <SectionHead>Film Metadata</SectionHead>
              <FieldGrid>
                <Field label="Film Title *" full><Input value={filmTitle} onChange={(e) => setFilmTitle(e.target.value)} className={inputCls} /></Field>
                <Field label="Director"><Input value={filmDirector} onChange={(e) => setFilmDirector(e.target.value)} className={inputCls} /></Field>
                <Field label="Release Date"><Input type="date" value={filmReleaseDate ?? ""} onChange={(e) => setFilmReleaseDate(e.target.value)} className={inputCls} /></Field>
                <Field label="Runtime"><Input value={filmRuntime} onChange={(e) => setFilmRuntime(e.target.value)} className={inputCls} placeholder="2h 18m" /></Field>
                <Field label="Genre"><Input value={filmGenre} onChange={(e) => setFilmGenre(e.target.value)} className={inputCls} placeholder="Drama, Thriller" /></Field>
                <Field label="Studio / Distributor"><Input value={filmStudio} onChange={(e) => setFilmStudio(e.target.value)} className={inputCls} /></Field>
                <Field label="MPAA Rating">
                  <Select value={filmMpaa || "none"} onValueChange={(v) => setFilmMpaa(v === "none" ? "" : v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">—</SelectItem>
                      {["G", "PG", "PG-13", "R", "NC-17", "NR"].map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Reviewer"><Input value={filmReviewer} onChange={(e) => setFilmReviewer(e.target.value)} className={inputCls} /></Field>
                <Field label="Review Date" full><Input type="date" value={filmReviewDate ?? ""} onChange={(e) => setFilmReviewDate(e.target.value)} className={inputCls} /></Field>
              </FieldGrid>
            </section>
          )}

          {/* ---------- ALBUM REVIEW PANEL ---------- */}
          {type === "album_review" && (
            <section className="space-y-3 border-t border-border pt-5">
              <SectionHead>Album Metadata</SectionHead>
              <FieldGrid>
                <Field label="Album Title *"><Input value={musicAlbumTitle} onChange={(e) => setMusicAlbumTitle(e.target.value)} className={inputCls} /></Field>
                <Field label="Artist *"><Input value={musicArtist} onChange={(e) => setMusicArtist(e.target.value)} className={inputCls} /></Field>
                <Field label="Release Date"><Input type="date" value={musicReleaseDate ?? ""} onChange={(e) => setMusicReleaseDate(e.target.value)} className={inputCls} /></Field>
                <Field label="Genre"><Input value={musicGenre} onChange={(e) => setMusicGenre(e.target.value)} className={inputCls} placeholder="Hip-Hop, Soul" /></Field>
                <Field label="Label"><Input value={musicLabel} onChange={(e) => setMusicLabel(e.target.value)} className={inputCls} /></Field>
                <Field label="Runtime"><Input value={musicRuntime} onChange={(e) => setMusicRuntime(e.target.value)} className={inputCls} placeholder="48 min" /></Field>
                <Field label="Number of Tracks"><Input type="number" min={1} value={musicTrackCount} onChange={(e) => setMusicTrackCount(e.target.value)} className={inputCls} /></Field>
                <Field label="Reviewer"><Input value={writerName} onChange={(e) => setWriterName(e.target.value)} className={inputCls} /></Field>
                <Field label="Cover Art / Embed URL" full><Input value={musicEmbed} onChange={(e) => setMusicEmbed(e.target.value)} className={inputCls} placeholder="Spotify / Apple Music embed" /></Field>
              </FieldGrid>
              <div>
                <Label className={labelCls}>Tracklist</Label>
                <div className="space-y-1.5">
                  {tracklist.map((t, i) => (
                    <div key={i} className="flex gap-1 items-center">
                      <span className="text-[10px] tabular-nums text-muted-foreground w-6">{(i + 1).toString().padStart(2, "0")}.</span>
                      <Input value={t} onChange={(e) => { const a = [...tracklist]; a[i] = e.target.value; setTracklist(a); }} placeholder={`Track ${i + 1}`} className={inputCls} />
                      <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setTracklist(tracklist.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="rounded-sm uppercase tracking-widest text-[10px] h-7 w-full" onClick={() => setTracklist([...tracklist, ""])}><Plus className="h-3 w-3 mr-1" /> Add Track</Button>
                </div>
              </div>
            </section>
          )}

          {/* ---------- SINGLE REVIEW PANEL ---------- */}
          {type === "single_review" && (
            <section className="space-y-3 border-t border-border pt-5">
              <SectionHead>Single Metadata</SectionHead>
              <FieldGrid>
                <Field label="Song Title *"><Input value={musicSongTitle} onChange={(e) => setMusicSongTitle(e.target.value)} className={inputCls} /></Field>
                <Field label="Artist *"><Input value={musicArtist} onChange={(e) => setMusicArtist(e.target.value)} className={inputCls} /></Field>
                <Field label="Release Date"><Input type="date" value={musicReleaseDate ?? ""} onChange={(e) => setMusicReleaseDate(e.target.value)} className={inputCls} /></Field>
                <Field label="Genre"><Input value={musicGenre} onChange={(e) => setMusicGenre(e.target.value)} className={inputCls} /></Field>
                <Field label="Label"><Input value={musicLabel} onChange={(e) => setMusicLabel(e.target.value)} className={inputCls} /></Field>
                <Field label="Producer"><Input value={musicProducer} onChange={(e) => setMusicProducer(e.target.value)} className={inputCls} /></Field>
                <Field label="Runtime"><Input value={musicRuntime} onChange={(e) => setMusicRuntime(e.target.value)} className={inputCls} placeholder="3:42" /></Field>
                <Field label="Reviewer"><Input value={writerName} onChange={(e) => setWriterName(e.target.value)} className={inputCls} /></Field>
                <Field label="Song Embed URL" full><Input value={musicEmbed} onChange={(e) => setMusicEmbed(e.target.value)} className={inputCls} placeholder="YouTube / Spotify / SoundCloud" /></Field>
              </FieldGrid>
            </section>
          )}

          {/* ---------- INTERVIEW PANEL ---------- */}
          {type === "interview" && (
            <section className="space-y-3 border-t border-border pt-5">
              <SectionHead>Interview Details</SectionHead>
              <FieldGrid>
                <Field label="Interviewee Name *"><Input value={interviewee} onChange={(e) => setInterviewee(e.target.value)} className={inputCls} /></Field>
                <Field label="Role / Title"><Input value={intRole} onChange={(e) => setIntRole(e.target.value)} className={inputCls} placeholder="Director, Artist…" /></Field>
                <Field label="Interview Date"><Input type="date" value={intDate ?? ""} onChange={(e) => setIntDate(e.target.value)} className={inputCls} /></Field>
                <Field label="Location"><Input value={intLocation} onChange={(e) => setIntLocation(e.target.value)} className={inputCls} placeholder="Chicago, IL" /></Field>
                <Field label="Photographer"><Input value={intPhotographer} onChange={(e) => setIntPhotographer(e.target.value)} className={inputCls} /></Field>
                <Field label="Writer"><Input value={writerName} onChange={(e) => setWriterName(e.target.value)} className={inputCls} /></Field>
              </FieldGrid>
            </section>
          )}

          {/* ---------- BREAKDOWN PANEL ---------- */}
          {type === "breakdown" && (
            <section className="space-y-3 border-t border-border pt-5">
              <SectionHead>Breakdown Details</SectionHead>
              <FieldGrid>
                <Field label="Subject Title *"><Input value={bdSubject} onChange={(e) => setBdSubject(e.target.value)} className={inputCls} /></Field>
                <Field label="Category">
                  <Select value={bdCategory} onValueChange={setBdCategory}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Film", "TV", "Anime", "Music", "Culture"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Episode / Chapter (optional)"><Input value={bdEpisode} onChange={(e) => setBdEpisode(e.target.value)} className={inputCls} placeholder="S2E5 / Ch. 12" /></Field>
                <Field label="Writer"><Input value={writerName} onChange={(e) => setWriterName(e.target.value)} className={inputCls} /></Field>
              </FieldGrid>
              <div className="flex items-center justify-between border border-border rounded-sm px-3 py-2 bg-surface/30">
                <div>
                  <div className="text-xs font-medium">Spoiler Warning</div>
                  <div className="text-[10px] text-muted-foreground">Show a spoiler banner at the top of this breakdown.</div>
                </div>
                <Switch checked={bdSpoiler} onCheckedChange={setBdSpoiler} />
              </div>
            </section>
          )}

          {/* ---------- NEWS PANEL ---------- */}
          {type === "news" && (
            <section className="space-y-3 border-t border-border pt-5">
              <SectionHead>News Details</SectionHead>
              <FieldGrid>
                <Field label="Subheadline" full><Input value={newsSub} onChange={(e) => setNewsSub(e.target.value)} className={inputCls} /></Field>
                <Field label="Source"><Input value={newsSource} onChange={(e) => setNewsSource(e.target.value)} className={inputCls} placeholder="AP, Reuters, RTG…" /></Field>
                <Field label="Date"><Input type="date" value={newsDate ?? ""} onChange={(e) => setNewsDate(e.target.value)} className={inputCls} /></Field>
                <Field label="Location"><Input value={newsLocation} onChange={(e) => setNewsLocation(e.target.value)} className={inputCls} placeholder="Chicago, IL" /></Field>
                <Field label="Writer"><Input value={writerName} onChange={(e) => setWriterName(e.target.value)} className={inputCls} /></Field>
              </FieldGrid>
            </section>
          )}

          {/* ---------- GAME REVIEW PANEL ---------- */}
          {type === "game_review" && (
            <section className="space-y-3 border-t border-border pt-5">
              <SectionHead>Game Metadata</SectionHead>
              <FieldGrid>
                <Field label="Game Title *" full><Input value={gameTitle} onChange={(e) => setGameTitle(e.target.value)} className={inputCls} /></Field>
                <Field label="Developer"><Input value={gameDeveloper} onChange={(e) => setGameDeveloper(e.target.value)} className={inputCls} placeholder="FromSoftware" /></Field>
                <Field label="Publisher"><Input value={gamePublisher} onChange={(e) => setGamePublisher(e.target.value)} className={inputCls} placeholder="Bandai Namco" /></Field>
                <Field label="Release Date"><Input type="date" value={gameReleaseDate ?? ""} onChange={(e) => setGameReleaseDate(e.target.value)} className={inputCls} /></Field>
                <Field label="Platforms"><Input value={gamePlatforms} onChange={(e) => setGamePlatforms(e.target.value)} className={inputCls} placeholder="PS5, Xbox Series X, PC" /></Field>
                <Field label="Genre"><Input value={gameGenre} onChange={(e) => setGameGenre(e.target.value)} className={inputCls} placeholder="Action RPG" /></Field>
                <Field label="ESRB Rating">
                  <Select value={gameEsrb || "none"} onValueChange={(v) => setGameEsrb(v === "none" ? "" : v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">—</SelectItem>
                      {["E", "E10+", "T", "M", "AO", "RP"].map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Reviewer"><Input value={gameReviewer} onChange={(e) => setGameReviewer(e.target.value)} className={inputCls} /></Field>
                <Field label="Trailer / Gameplay Embed URL" full><Input value={gameTrailer} onChange={(e) => setGameTrailer(e.target.value)} className={inputCls} placeholder="YouTube URL" /></Field>
              </FieldGrid>
              <div>
                <Label className={labelCls}>Screenshots Gallery</Label>
                <div className="space-y-1.5">
                  {gameScreenshots.map((url, i) => (
                    <div key={i} className="flex gap-1 items-center">
                      <Input value={url} onChange={(e) => { const a = [...gameScreenshots]; a[i] = e.target.value; setGameScreenshots(a); }} placeholder="https://… screenshot URL" className={inputCls} />
                      {url && <img src={url} alt="" className="h-9 w-12 object-cover rounded-sm border border-border" />}
                      <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setGameScreenshots(gameScreenshots.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="rounded-sm uppercase tracking-widest text-[10px] h-7 w-full" onClick={() => setGameScreenshots([...gameScreenshots, ""])}><Plus className="h-3 w-3 mr-1" /> Add Screenshot</Button>
                </div>
              </div>
            </section>
          )}

          {/* ---------- RATINGS (review types only) ---------- */}
          {isReview && (
            <section className="space-y-3 border-t border-border pt-5">
              <SectionHead>Ratings</SectionHead>
              <div className="border border-border rounded-sm p-3 bg-surface/30">
                <Label className={labelCls}>RTG Rating</Label>
                <StarRatingInput value={rtgRating} onChange={setRtgRating} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="Audience (0-100)"><Input type="number" min={0} max={100} value={audience} onChange={(e) => setAudience(e.target.value)} className={inputCls} /></Field>
                {type === "film_review" && (
                  <>
                    <Field label="Rotten Tomatoes (0-100)"><Input type="number" min={0} max={100} value={rt} onChange={(e) => setRt(e.target.value)} className={inputCls} /></Field>
                    <Field label="Metacritic (0-100)"><Input type="number" min={0} max={100} value={meta} onChange={(e) => setMeta(e.target.value)} className={inputCls} /></Field>
                    <Field label="IMDb (0-10)"><Input type="number" min={0} max={10} step={0.1} value={imdb} onChange={(e) => setImdb(e.target.value)} className={inputCls} /></Field>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between border border-border rounded-sm px-3 py-2 bg-surface/30">
                <div>
                  <div className="text-xs font-medium">Official RTG Review</div>
                  <div className="text-[10px] text-muted-foreground">Displays an "RTG REVIEW" badge on the article.</div>
                </div>
                <Switch checked={official} onCheckedChange={setOfficial} />
              </div>
            </section>
          )}

          {/* ---------- BODY (standard uses textarea, others use blocks) ---------- */}
          {type === "standard" ? (
            <section className="space-y-3 border-t border-border pt-5">
              <SectionHead>Body</SectionHead>
              <Textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} className={textareaCls} placeholder="Tell the story…" />
            </section>
          ) : (
            <section className="space-y-3 border-t border-border pt-5">
              <div className="flex items-center justify-between">
                <SectionHead>Article Body</SectionHead>
                {TEMPLATES[type] && (
                  <Button type="button" variant="outline" size="sm" onClick={loadTemplate} className="rounded-sm uppercase tracking-widest text-[10px] h-7">
                    <Sparkles className="h-3 w-3 mr-1" /> Load Template
                  </Button>
                )}
              </div>
              {blocks.length === 0 && (
                <div className="border border-dashed border-border rounded-sm py-8 text-center text-xs text-muted-foreground">
                  No blocks yet. Add one below or load a template.
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
          )}

          {/* ---------- VERDICT (review types only) ---------- */}
          {isReview && (
            <section className="space-y-3 border-t border-border pt-5">
              <SectionHead>Final Verdict (Summary)</SectionHead>
              <Input value={verdictHeadline} onChange={(e) => setVerdictHeadline(e.target.value)} className={inputCls} placeholder="Verdict headline" />
              <Textarea rows={3} value={verdictParagraph} onChange={(e) => setVerdictParagraph(e.target.value)} className={textareaCls} placeholder="Short final verdict" />
              <Select value={verdictRec} onValueChange={(v) => setVerdictRec(v as any)}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended" className="text-xs">Recommended</SelectItem>
                  <SelectItem value="mixed" className="text-xs">Mixed</SelectItem>
                  <SelectItem value="not_recommended" className="text-xs">Not Recommended</SelectItem>
                </SelectContent>
              </Select>
            </section>
          )}

          {/* ---------- SEO ---------- */}
          <section className="space-y-2.5 border-t border-border pt-5">
            <SectionHead>SEO</SectionHead>
            <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={60} className={inputCls} placeholder="SEO Title (≤60 chars)" />
            <Textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} maxLength={160} rows={2} className={textareaCls} placeholder="Meta description (≤160 chars)" />
          </section>
        </div>
      </div>
    </div>
  );
};

export default UniversalEditor;
