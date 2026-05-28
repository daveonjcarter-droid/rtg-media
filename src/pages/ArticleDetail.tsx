import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Newspaper, ArrowLeft, ArrowUpRight, Star, Award, Clock, Calendar as CalendarIcon, Film as FilmIcon, User, AlertTriangle, Check, X, Music, Mic, Layers, Radio, MapPin, Gamepad2, Building2, Tv2 } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import EmptyState from "@/components/site/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { StarRatingDisplay, type ReviewBlock } from "@/components/dashboard/ReviewBlocks";

type Article = {
  id: string;
  title: string;
  slug: string | null;
  category: string | null;
  excerpt: string | null;
  body: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  article_type?: string | null;
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
  writer_name?: string | null;
  // music
  music_artist?: string | null;
  music_album_title?: string | null;
  music_song_title?: string | null;
  music_label?: string | null;
  music_release_date?: string | null;
  music_genre?: string | null;
  music_runtime?: string | null;
  music_track_count?: number | null;
  music_producer?: string | null;
  music_embed_url?: string | null;
  music_tracklist?: string[] | null;
  // interview
  interview_interviewee?: string | null;
  interview_role?: string | null;
  interview_date?: string | null;
  interview_location?: string | null;
  interview_photographer?: string | null;
  // breakdown
  breakdown_subject?: string | null;
  breakdown_category?: string | null;
  breakdown_episode?: string | null;
  breakdown_spoiler?: boolean | null;
  // news
  news_subheadline?: string | null;
  news_source?: string | null;
  news_date?: string | null;
  news_location?: string | null;
  // game
  game_title?: string | null;
  game_developer?: string | null;
  game_publisher?: string | null;
  game_release_date?: string | null;
  game_platforms?: string | null;
  game_genre?: string | null;
  game_esrb_rating?: string | null;
  game_reviewer?: string | null;
  game_trailer_url?: string | null;
  game_screenshots?: string[] | null;
  steam_score?: number | null;
};

const formatDate = (d: string | null | undefined) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};

const SELECT_COLS = "id,title,slug,category,excerpt,body,cover_image_url,published_at,tags,seo_title,seo_description,article_type,body_blocks,writer_name,film_title,film_release_date,film_runtime,film_director,film_studio,film_genre,film_mpaa_rating,film_reviewer,film_review_date,rtg_rating,audience_score,rotten_tomatoes_score,metacritic_score,imdb_score,is_official_rtg_review,verdict_headline,verdict_paragraph,verdict_recommendation,music_artist,music_album_title,music_song_title,music_label,music_release_date,music_genre,music_runtime,music_track_count,music_producer,music_embed_url,music_tracklist,interview_interviewee,interview_role,interview_date,interview_location,interview_photographer,breakdown_subject,breakdown_category,breakdown_episode,breakdown_spoiler,news_subheadline,news_source,news_date,news_location,game_title,game_developer,game_publisher,game_release_date,game_platforms,game_genre,game_esrb_rating,game_reviewer,game_trailer_url,game_screenshots,steam_score";

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      let { data } = await supabase
        .from("articles")
        .select(SELECT_COLS)
        .eq("slug", id)
        .eq("status", "published")
        .maybeSingle();
      if (!data) {
        const res = await supabase
          .from("articles")
          .select(SELECT_COLS)
          .eq("id", id)
          .eq("status", "published")
          .maybeSingle();
        data = res.data;
      }
      setArticle(data as Article | null);
      if (data) {
        const a = data as Article;
        const { trackEvent, bumpArticleView } = await import("@/lib/tracking");
        trackEvent("article_view", { articleId: a.id, slug: a.slug, title: a.title });
        bumpArticleView(a.id);
      }

      if (data) {
        const isReview = (data as Article).article_type === "film_review";
        const q = supabase
          .from("articles")
          .select(SELECT_COLS)
          .eq("status", "published")
          .neq("id", (data as Article).id)
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(3);
        const { data: rel } = isReview
          ? await q.eq("article_type", "film_review")
          : await q.eq("category", (data as Article).category ?? "");
        setRelated((rel ?? []) as Article[]);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SiteLayout>
        <section className="container-rtg py-20 text-sm text-muted-foreground">Loading…</section>
      </SiteLayout>
    );
  }

  if (!article) {
    return (
      <SiteLayout>
        <section className="container-rtg py-20 md:py-28">
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary mb-10"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Articles
          </Link>
          <EmptyState
            eyebrow="The Magazine"
            title="This story isn't live yet."
            description="RTG Media is preparing its first releases. The article you're looking for hasn't been published."
            icon={Newspaper}
          />
        </section>
      </SiteLayout>
    );
  }

  if (article.article_type === "film_review") return <FilmReviewView article={article} related={related} />;
  if (article.article_type === "album_review" || article.article_type === "single_review") return <MusicReviewView article={article} related={related} />;
  if (article.article_type === "game_review") return <GameReviewView article={article} related={related} />;
  if (article.article_type === "interview") return <TypedView article={article} related={related} kind="interview" />;
  if (article.article_type === "breakdown") return <TypedView article={article} related={related} kind="breakdown" />;
  if (article.article_type === "news") return <TypedView article={article} related={related} kind="news" />;

  return <StandardArticleView article={article} related={related} />;
};

/* =========== Music Review (album / single) =========== */
const MusicReviewView = ({ article, related }: { article: Article; related: Article[] }) => {
  const isAlbum = article.article_type === "album_review";
  const v = article.verdict_recommendation ? verdictMeta[article.verdict_recommendation] : null;
  const headline = isAlbum ? article.music_album_title : article.music_song_title;
  return (
    <SiteLayout>
      <section className="relative bg-ink border-b border-border">
        {article.cover_image_url && (
          <div className="absolute inset-0">
            <img src={article.cover_image_url} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
        )}
        <div className="container-rtg relative pt-20 md:pt-28 pb-10 md:pb-16">
          <Link to="/articles" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary mb-6"><ArrowLeft className="h-3 w-3" /> All Stories</Link>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {article.is_official_rtg_review && (
              <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1"><Award className="h-3 w-3" /> RTG Review</span>
            )}
            <span className="inline-flex items-center gap-1 border border-border bg-background/50 text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1 text-muted-foreground">
              {isAlbum ? <Layers className="h-3 w-3" /> : <Radio className="h-3 w-3" />} {isAlbum ? "Album Review" : "Single Review"}
            </span>
            {article.music_genre && <span className="border border-border bg-background/50 text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1 text-muted-foreground">{article.music_genre}</span>}
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{article.music_artist}</div>
          <h1 className="type-mega text-4xl md:text-6xl lg:text-7xl leading-[0.92] max-w-4xl">{headline || article.title}</h1>
          {article.excerpt && <p className="mt-6 font-editorial text-lg text-muted-foreground max-w-3xl">{article.excerpt}</p>}
          {article.rtg_rating != null && article.rtg_rating > 0 && (
            <div className="mt-6 flex items-center gap-3">
              <StarRatingDisplay value={Number(article.rtg_rating)} size={26} />
              <span className="font-display text-2xl tabular-nums">{Number(article.rtg_rating).toFixed(1)}</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">RTG Rating</span>
            </div>
          )}
        </div>
      </section>

      <section className="container-rtg py-10 md:py-14">
        <div className="grid lg:grid-cols-[1fr_300px] gap-10 max-w-5xl mx-auto">
          <div className="order-2 lg:order-1 max-w-2xl space-y-7">
            {article.music_embed_url && (
              <div className="border border-border rounded-sm p-3 bg-surface/30 text-xs">
                <div className="text-[9px] uppercase tracking-[0.3em] text-primary mb-1">Listen</div>
                <a href={article.music_embed_url} target="_blank" rel="noreferrer" className="text-foreground hover:text-primary truncate block">{article.music_embed_url}</a>
              </div>
            )}
            {Array.isArray(article.body_blocks) && article.body_blocks.map((b) => <BlockView key={b.id} block={b} />)}
            {isAlbum && article.music_tracklist && article.music_tracklist.length > 0 && (
              <div className="border border-border rounded-sm p-5 bg-surface/30">
                <div className="text-[10px] uppercase tracking-[0.3em] text-primary mb-3">Tracklist</div>
                <ol className="space-y-1.5 text-sm">
                  {article.music_tracklist.map((t, i) => (
                    <li key={i} className="flex gap-3 border-b border-border/50 pb-1.5 last:border-0">
                      <span className="text-muted-foreground tabular-nums w-6">{(i + 1).toString().padStart(2, "0")}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {(article.verdict_headline || article.verdict_paragraph || v) && <VerdictCard article={article} v={v} />}
          </div>
          <aside className="order-1 lg:order-2 lg:sticky lg:top-24 self-start">
            <div className="border border-border rounded-sm bg-surface/40 p-5 space-y-3">
              <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">Release Info</div>
              {article.music_artist && <InfoRow icon={Music} label="Artist" value={article.music_artist} />}
              {article.music_label && <InfoRow icon={Award} label="Label" value={article.music_label} />}
              {article.music_release_date && <InfoRow icon={CalendarIcon} label="Released" value={formatDate(article.music_release_date)} />}
              {article.music_runtime && <InfoRow icon={Clock} label="Runtime" value={article.music_runtime} />}
              {isAlbum && article.music_track_count != null && <InfoRow icon={Layers} label="Tracks" value={String(article.music_track_count)} />}
              {!isAlbum && article.music_producer && <InfoRow icon={User} label="Producer" value={article.music_producer} />}
              {article.writer_name && <InfoRow icon={User} label="Reviewer" value={article.writer_name} />}
            </div>
          </aside>
        </div>
      </section>
      <RelatedSection related={related} category="" eyebrow="More Reviews" title="Keep Listening" />
    </SiteLayout>
  );
};

/* =========== Game Review =========== */
const GameReviewView = ({ article, related }: { article: Article; related: Article[] }) => {
  const v = article.verdict_recommendation ? verdictMeta[article.verdict_recommendation] : null;
  const headline = article.game_title || article.title;
  return (
    <SiteLayout>
      <section className="relative bg-ink border-b border-border">
        {article.cover_image_url && (
          <div className="absolute inset-0">
            <img src={article.cover_image_url} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
        )}
        <div className="container-rtg relative pt-20 md:pt-28 pb-10 md:pb-16">
          <Link to="/articles" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary mb-6"><ArrowLeft className="h-3 w-3" /> All Stories</Link>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {article.is_official_rtg_review && (
              <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1"><Award className="h-3 w-3" /> RTG Review</span>
            )}
            <span className="inline-flex items-center gap-1 border border-border bg-background/50 text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1 text-muted-foreground">
              <Gamepad2 className="h-3 w-3" /> Game Review
            </span>
            {article.game_genre && <span className="border border-border bg-background/50 text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1 text-muted-foreground">{article.game_genre}</span>}
            {article.game_esrb_rating && <span className="border border-border bg-background/50 text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1 text-muted-foreground">ESRB {article.game_esrb_rating}</span>}
          </div>
          {article.game_developer && <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{article.game_developer}</div>}
          <h1 className="type-mega text-4xl md:text-6xl lg:text-7xl leading-[0.92] max-w-4xl">{headline}</h1>
          {article.excerpt && <p className="mt-6 font-editorial text-lg text-muted-foreground max-w-3xl">{article.excerpt}</p>}
          {article.rtg_rating != null && article.rtg_rating > 0 && (
            <div className="mt-6 flex items-center gap-3">
              <StarRatingDisplay value={Number(article.rtg_rating)} size={26} />
              <span className="font-display text-2xl tabular-nums">{Number(article.rtg_rating).toFixed(1)}</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">RTG Rating</span>
            </div>
          )}
        </div>
      </section>

      <section className="container-rtg py-10 md:py-14">
        <div className="grid lg:grid-cols-[1fr_300px] gap-10 max-w-5xl mx-auto">
          <div className="order-2 lg:order-1 max-w-2xl space-y-7">
            {article.game_trailer_url && (
              <div className="border border-border rounded-sm p-3 bg-surface/30 text-xs">
                <div className="text-[9px] uppercase tracking-[0.3em] text-primary mb-1">Trailer</div>
                <a href={article.game_trailer_url} target="_blank" rel="noreferrer" className="text-foreground hover:text-primary truncate block">{article.game_trailer_url}</a>
              </div>
            )}
            {Array.isArray(article.body_blocks) && article.body_blocks.map((b) => <BlockView key={b.id} block={b} />)}
            {Array.isArray(article.game_screenshots) && article.game_screenshots.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-primary mb-3">Screenshots</div>
                <div className="grid grid-cols-2 gap-2">
                  {article.game_screenshots.filter(Boolean).map((url, i) => (
                    <div key={i} className="aspect-video overflow-hidden border border-border bg-surface">
                      <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(article.audience_score != null || article.metacritic_score != null || article.steam_score != null) && (
              <div className="border border-border rounded-sm p-4 bg-surface/30">
                <div className="text-[10px] uppercase tracking-[0.3em] text-primary mb-3">External Scores</div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {article.metacritic_score != null && <ScoreCell label="Metacritic" value={`${article.metacritic_score}`} />}
                  {article.steam_score != null && <ScoreCell label="Steam" value={`${article.steam_score}`} />}
                  {article.audience_score != null && <ScoreCell label="Audience" value={`${article.audience_score}`} />}
                </div>
              </div>
            )}
            {(article.verdict_headline || article.verdict_paragraph || v) && <VerdictCard article={article} v={v} />}
          </div>
          <aside className="order-1 lg:order-2 lg:sticky lg:top-24 self-start">
            <div className="border border-border rounded-sm bg-surface/40 p-5 space-y-3">
              <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">Game Info</div>
              {article.game_developer && <InfoRow icon={User} label="Developer" value={article.game_developer} />}
              {article.game_publisher && <InfoRow icon={Building2} label="Publisher" value={article.game_publisher} />}
              {article.game_release_date && <InfoRow icon={CalendarIcon} label="Released" value={formatDate(article.game_release_date)} />}
              {article.game_platforms && <InfoRow icon={Tv2} label="Platforms" value={article.game_platforms} />}
              {article.game_genre && <InfoRow icon={Layers} label="Genre" value={article.game_genre} />}
              {article.game_esrb_rating && <InfoRow icon={Award} label="ESRB" value={article.game_esrb_rating} />}
              {(article.game_reviewer || article.writer_name) && <InfoRow icon={User} label="Reviewer" value={article.game_reviewer || article.writer_name!} />}
            </div>
          </aside>
        </div>
      </section>
      <RelatedSection related={related} category="" eyebrow="More Reviews" title="Keep Playing" />
    </SiteLayout>
  );
};

const ScoreCell = ({ label, value }: { label: string; value: string }) => (
  <div className="border border-border rounded-sm py-2">
    <div className="font-display text-2xl leading-none">{value}</div>
    <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mt-1">{label}</div>
  </div>
);

/* =========== Generic typed view (interview/breakdown/news) =========== */
const TypedView = ({ article, related, kind }: { article: Article; related: Article[]; kind: "interview" | "breakdown" | "news" }) => {
  const meta = {
    interview: { label: "Interview", icon: Mic },
    breakdown: { label: "RTG Breakdown", icon: Layers },
    news: { label: "News", icon: Newspaper },
  }[kind];
  const headline = kind === "interview" ? article.interview_interviewee || article.title
                 : kind === "breakdown" ? article.breakdown_subject || article.title
                 : article.title;
  return (
    <SiteLayout>
      <section className="border-b border-border bg-background">
        <div className="container-rtg pt-16 md:pt-24 pb-10">
          <Link to="/articles" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary mb-8"><ArrowLeft className="h-3 w-3" /> All Stories</Link>
          <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1 mb-5"><meta.icon className="h-3 w-3" /> {meta.label}</span>
          {kind === "interview" && article.interview_role && <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{article.interview_role}</div>}
          {kind === "breakdown" && article.breakdown_category && <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{article.breakdown_category}{article.breakdown_episode ? ` · ${article.breakdown_episode}` : ""}</div>}
          {kind === "news" && article.news_subheadline && <div className="font-editorial text-lg md:text-xl text-muted-foreground mb-3">{article.news_subheadline}</div>}
          <h1 className="type-mega text-4xl md:text-6xl lg:text-7xl leading-[0.92] max-w-4xl">{headline}</h1>
          {article.excerpt && kind !== "news" && <p className="mt-6 font-editorial text-lg text-muted-foreground max-w-3xl">{article.excerpt}</p>}
          <div className="mt-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex flex-wrap items-center gap-3">
            {article.writer_name && <span className="inline-flex items-center gap-1.5"><User className="h-3 w-3" /> {article.writer_name}</span>}
            {kind === "interview" && article.interview_date && <><span className="text-border">·</span><span><CalendarIcon className="h-3 w-3 inline mr-1" />{formatDate(article.interview_date)}</span></>}
            {kind === "interview" && article.interview_location && <><span className="text-border">·</span><span><MapPin className="h-3 w-3 inline mr-1" />{article.interview_location}</span></>}
            {kind === "interview" && article.interview_photographer && <><span className="text-border">·</span><span>Photos: {article.interview_photographer}</span></>}
            {kind === "news" && article.news_date && <><span className="text-border">·</span><span>{formatDate(article.news_date)}</span></>}
            {kind === "news" && article.news_location && <><span className="text-border">·</span><span><MapPin className="h-3 w-3 inline mr-1" />{article.news_location}</span></>}
            {kind === "news" && article.news_source && <><span className="text-border">·</span><span>Source: {article.news_source}</span></>}
          </div>
        </div>
        {article.cover_image_url && (
          <div className="container-rtg pb-12 md:pb-16">
            <div className="aspect-[16/9] overflow-hidden border border-border"><img src={article.cover_image_url} alt={headline} className="w-full h-full object-cover" /></div>
          </div>
        )}
      </section>

      {kind === "breakdown" && article.breakdown_spoiler && (
        <div className="container-rtg pt-6">
          <div className="border border-gold/40 bg-gold/10 rounded-sm p-3 flex items-center gap-2 text-gold text-[11px] uppercase tracking-[0.25em] font-semibold max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" /> Spoiler Warning — story details ahead
          </div>
        </div>
      )}

      <section className="container-rtg py-10 md:py-14">
        <article className="max-w-2xl mx-auto space-y-7">
          {Array.isArray(article.body_blocks) && article.body_blocks.length > 0
            ? article.body_blocks.map((b) => <BlockView key={b.id} block={b} />)
            : article.body && <div className="font-editorial text-lg md:text-xl leading-[1.7] whitespace-pre-line">{article.body}</div>}
        </article>
      </section>
      <RelatedSection related={related} category={article.category ?? ""} eyebrow="More Like This" title="Keep Reading" />
    </SiteLayout>
  );
};

const VerdictCard = ({ article, v }: { article: Article; v: any }) => (
  <div className="border border-border rounded-sm bg-surface/40 p-6 md:p-8">
    <div className="text-[10px] uppercase tracking-[0.3em] text-primary mb-2">Final Verdict</div>
    {article.verdict_headline && <h3 className="font-display text-2xl md:text-3xl uppercase mb-3">{article.verdict_headline}</h3>}
    {article.verdict_paragraph && <p className="font-editorial text-base md:text-lg leading-relaxed text-foreground/90">{article.verdict_paragraph}</p>}
    {v && <div className={`mt-5 inline-flex items-center gap-2 border px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-[0.25em] font-semibold ${v.cls}`}><v.icon className="h-3.5 w-3.5" /> Verdict: {v.label}</div>}
  </div>
);


/* ============================ STANDARD ARTICLE ============================ */

const StandardArticleView = ({ article, related }: { article: Article; related: Article[] }) => (
  <SiteLayout>
    <RtgMagazineArticle
      article={article as unknown as MagArticle}
      related={related as unknown as MagArticle[]}
    />
  </SiteLayout>
);


/* ============================ FILM REVIEW ============================ */

const verdictMeta = {
  recommended: { label: "Recommended", icon: Check, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40" },
  mixed: { label: "Mixed", icon: AlertTriangle, cls: "bg-gold/15 text-gold border-gold/40" },
  not_recommended: { label: "Not Recommended", icon: X, cls: "bg-destructive/15 text-destructive border-destructive/40" },
};

const FilmReviewView = ({ article, related }: { article: Article; related: Article[] }) => {
  const v = article.verdict_recommendation ? verdictMeta[article.verdict_recommendation] : null;

  return (
    <SiteLayout>
      {/* CINEMATIC HERO */}
      <section className="relative bg-ink text-foreground border-b border-border">
        {article.cover_image_url && (
          <div className="absolute inset-0">
            <img src={article.cover_image_url} alt={article.film_title ?? article.title} className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          </div>
        )}
        <div className="container-rtg relative pt-20 md:pt-32 pb-12 md:pb-20">
          <Link to="/articles" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-3 w-3" /> All Stories
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {article.is_official_rtg_review && (
              <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1">
                <Award className="h-3 w-3" /> RTG Review
              </span>
            )}
            {article.film_genre && (
              <span className="inline-block border border-border bg-background/50 text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1 text-muted-foreground">
                {article.film_genre}
              </span>
            )}
            {article.film_mpaa_rating && (
              <span className="inline-block border border-border bg-background/50 text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1 text-muted-foreground">
                {article.film_mpaa_rating}
              </span>
            )}
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Film Review</div>
          <h1 className="type-mega text-4xl md:text-6xl lg:text-7xl leading-[0.92] max-w-4xl">
            {article.film_title || article.title}
          </h1>
          {article.title && article.film_title && article.title !== article.film_title && (
            <p className="mt-4 font-editorial text-xl md:text-2xl text-muted-foreground italic max-w-3xl">{article.title}</p>
          )}
          {article.excerpt && (
            <p className="mt-6 text-base md:text-lg text-muted-foreground font-editorial leading-relaxed max-w-3xl">{article.excerpt}</p>
          )}

          {article.rtg_rating != null && article.rtg_rating > 0 && (
            <div className="mt-7 flex items-center gap-3">
              <StarRatingDisplay value={Number(article.rtg_rating)} size={26} />
              <span className="font-display text-2xl tabular-nums">{Number(article.rtg_rating).toFixed(1)}</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">RTG Rating</span>
            </div>
          )}

          <div className="mt-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex flex-wrap items-center gap-3">
            {article.film_reviewer && <span className="inline-flex items-center gap-1.5"><User className="h-3 w-3" /> {article.film_reviewer}</span>}
            {article.film_review_date && <><span className="text-border">·</span><span>Reviewed {formatDate(article.film_review_date)}</span></>}
          </div>
        </div>
      </section>

      {/* FILM INFO BOX */}
      <section className="container-rtg py-10 md:py-14">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10 max-w-5xl mx-auto">
          <div className="order-2 lg:order-1">
            {/* BLOCK BODY */}
            {Array.isArray(article.body_blocks) && article.body_blocks.length > 0 ? (
              <div className="space-y-7 max-w-2xl">
                {article.body_blocks.map((b) => <BlockView key={b.id} block={b} />)}
              </div>
            ) : article.body ? (
              <div className="font-editorial text-lg md:text-xl leading-[1.7] text-foreground/90 whitespace-pre-line max-w-2xl">{article.body}</div>
            ) : (
              <div className="text-sm text-muted-foreground">Review content coming soon.</div>
            )}

            {/* FINAL VERDICT */}
            {(article.verdict_headline || article.verdict_paragraph || v) && (
              <div className="mt-12 border border-border rounded-sm bg-surface/40 p-6 md:p-8 max-w-2xl">
                <div className="text-[10px] uppercase tracking-[0.3em] text-primary mb-2">Final Verdict</div>
                {article.verdict_headline && (
                  <h3 className="font-display text-2xl md:text-3xl uppercase mb-3">{article.verdict_headline}</h3>
                )}
                {article.verdict_paragraph && (
                  <p className="font-editorial text-base md:text-lg leading-relaxed text-foreground/90">{article.verdict_paragraph}</p>
                )}
                {v && (
                  <div className={`mt-5 inline-flex items-center gap-2 border px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-[0.25em] font-semibold ${v.cls}`}>
                    <v.icon className="h-3.5 w-3.5" /> Verdict: {v.label}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* INFO BOX */}
          <aside className="order-1 lg:order-2 lg:sticky lg:top-24 self-start">
            <div className="border border-border rounded-sm bg-surface/40 p-5 space-y-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">Film Info</div>

              {article.rtg_rating != null && article.rtg_rating > 0 && (
                <ScoreRow label="RTG Rating" value={
                  <div className="flex items-center gap-2">
                    <StarRatingDisplay value={Number(article.rtg_rating)} />
                    <span className="font-display tabular-nums">{Number(article.rtg_rating).toFixed(1)}</span>
                  </div>
                } />
              )}
              {article.audience_score != null && <ScoreRow label="Audience" value={`${article.audience_score}%`} />}
              {article.rotten_tomatoes_score != null && <ScoreRow label="Rotten Tomatoes" value={`${article.rotten_tomatoes_score}%`} />}
              {article.metacritic_score != null && <ScoreRow label="Metacritic" value={`${article.metacritic_score}`} />}
              {article.imdb_score != null && <ScoreRow label="IMDb" value={`${Number(article.imdb_score).toFixed(1)}`} />}

              <div className="pt-3 border-t border-border space-y-2">
                {article.film_runtime && <InfoRow icon={Clock} label="Runtime" value={article.film_runtime} />}
                {article.film_director && <InfoRow icon={FilmIcon} label="Director" value={article.film_director} />}
                {article.film_release_date && <InfoRow icon={CalendarIcon} label="Released" value={formatDate(article.film_release_date)} />}
                {article.film_studio && <InfoRow icon={Award} label="Studio" value={article.film_studio} />}
                {article.film_genre && <InfoRow icon={Star} label="Genre" value={article.film_genre} />}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <RelatedSection related={related} category="Film Reviews" eyebrow="Keep Watching" title="More RTG Reviews" />
    </SiteLayout>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-2 text-xs">
    <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
    <div className="flex-1">
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="text-foreground/90">{value}</div>
    </div>
  </div>
);

const ScoreRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span>
    <span className="text-sm">{value}</span>
  </div>
);

/* ============================ BLOCK RENDERERS ============================ */

const BlockView = ({ block }: { block: ReviewBlock }) => {
  switch (block.kind) {
    case "paragraph":
      return <p className="font-editorial text-lg md:text-xl leading-[1.75] text-foreground/90 whitespace-pre-line">{block.text}</p>;
    case "heading":
      return block.level === 3
        ? <h3 className="font-display text-xl md:text-2xl uppercase mt-2">{block.text}</h3>
        : <h2 className="font-display text-2xl md:text-3xl uppercase mt-2 border-l-2 border-primary pl-3">{block.text}</h2>;
    case "quote":
      return (
        <blockquote className="border-l-2 border-border pl-4 italic font-editorial text-lg leading-relaxed text-foreground/90">
          "{block.text}"
          {block.speaker && <footer className="mt-2 not-italic text-[10px] uppercase tracking-[0.3em] text-muted-foreground">— {block.speaker}</footer>}
        </blockquote>
      );
    case "pull_quote":
      return (
        <blockquote className="my-6 text-center font-display text-2xl md:text-4xl uppercase leading-tight text-primary">
          "{block.text}"
          {block.speaker && <footer className="mt-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-sans normal-case">— {block.speaker}</footer>}
        </blockquote>
      );
    case "highlight_quote":
      return (
        <blockquote className="my-4 bg-primary/10 border border-primary/30 rounded-sm p-5">
          <p className="font-editorial text-lg italic text-foreground">"{block.text}"</p>
          {block.speaker && <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-primary">— {block.speaker}</div>}
        </blockquote>
      );
    case "image":
      if (!block.url) return null;
      return (
        <figure className="my-2">
          <img src={block.url} alt={block.caption ?? ""} className="w-full border border-border rounded-sm" />
          {(block.caption || block.credit) && (
            <figcaption className="mt-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground flex items-baseline justify-between gap-3">
              <span>{block.caption}</span>
              {block.credit && <span className="italic normal-case tracking-normal text-[11px]">© {block.credit}</span>}
            </figcaption>
          )}
        </figure>
      );
    case "gallery":
      if (!block.images?.length) return null;
      return (
        <div className="my-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {block.images.filter((i) => i.url).map((img, i) => (
            <figure key={i} className="space-y-1">
              <img src={img.url} alt={img.caption ?? ""} className="w-full aspect-[4/3] object-cover border border-border rounded-sm" />
              {(img.caption || img.credit) && (
                <figcaption className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">{img.caption} {img.credit && <span className="italic normal-case">— © {img.credit}</span>}</figcaption>
              )}
            </figure>
          ))}
        </div>
      );
    case "pros_cons":
      return (
        <div className="my-4 grid md:grid-cols-2 gap-3 not-prose">
          <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-sm p-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-semibold mb-2">Pros</div>
            <ul className="space-y-1.5 text-sm">
              {(block.pros ?? []).filter(Boolean).map((p, i) => (
                <li key={i} className="flex gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /><span>{p}</span></li>
              ))}
            </ul>
          </div>
          <div className="border border-destructive/30 bg-destructive/5 rounded-sm p-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-destructive font-semibold mb-2">Cons</div>
            <ul className="space-y-1.5 text-sm">
              {(block.cons ?? []).filter(Boolean).map((c, i) => (
                <li key={i} className="flex gap-2"><X className="h-4 w-4 text-destructive shrink-0 mt-0.5" /><span>{c}</span></li>
              ))}
            </ul>
          </div>
        </div>
      );
    case "spoiler":
      return (
        <div className="my-4 border border-gold/40 bg-gold/10 rounded-sm p-4">
          <div className="flex items-center gap-2 text-gold mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold">{block.warning ?? "Spoiler warning"}</span>
          </div>
          <p className="font-editorial text-base leading-relaxed text-foreground/90 whitespace-pre-line">{block.text}</p>
        </div>
      );
    case "verdict": {
      const meta = block.recommendation ? verdictMeta[block.recommendation] : null;
      return (
        <div className="my-4 border border-border rounded-sm bg-surface/40 p-5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-primary mb-1.5">Verdict</div>
          {block.headline && <h3 className="font-display text-xl md:text-2xl uppercase mb-2">{block.headline}</h3>}
          {block.text && <p className="font-editorial leading-relaxed text-foreground/90">{block.text}</p>}
          {meta && (
            <div className={`mt-4 inline-flex items-center gap-2 border px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-[0.25em] font-semibold ${meta.cls}`}>
              <meta.icon className="h-3.5 w-3.5" /> {meta.label}
            </div>
          )}
        </div>
      );
    }
    default:
      return null;
  }
};

/* ============================ RELATED ============================ */

const RelatedSection = ({ related, category, eyebrow, title }: { related: Article[]; category: string; eyebrow: string; title: string }) => {
  if (!related.length) return null;
  return (
    <section className="border-t border-border bg-surface/40 py-14 md:py-20">
      <div className="container-rtg">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
          <div>
            <div className="eyebrow text-primary mb-2">{eyebrow}</div>
            <h2 className="font-display text-2xl md:text-3xl uppercase">{title}</h2>
          </div>
          <Link to="/articles" className="hidden sm:inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-primary">
            All Stories <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {related.map((r) => (
            <Link key={r.id} to={`/articles/${r.slug || r.id}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden border border-border bg-surface">
                {r.cover_image_url ? (
                  <img src={r.cover_image_url} alt={r.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-ink via-background to-surface flex items-center justify-center">
                    <span className="font-gothic text-4xl text-primary/40">RTG</span>
                  </div>
                )}
                {r.article_type === "film_review" && r.rtg_rating != null && r.rtg_rating > 0 && (
                  <div className="absolute top-2 left-2 bg-background/85 backdrop-blur px-2 py-1 flex items-center gap-1">
                    <StarRatingDisplay value={Number(r.rtg_rating)} size={12} />
                  </div>
                )}
              </div>
              <h3 className="mt-3 font-display text-lg uppercase group-hover:text-primary transition-colors">{r.film_title || r.title}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArticleDetail;
