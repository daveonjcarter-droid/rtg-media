import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Play, BookOpen, Film, Clock } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import EmptyState from "@/components/site/EmptyState";
import EpisodeCard from "@/components/site/EpisodeCard";
import { supabase } from "@/integrations/supabase/client";
import type { BreakdownEpisode } from "@/hooks/useRtgContent";

const BreakdownDetail = () => {
  const { slug } = useParams();
  const [episode, setEpisode] = useState<BreakdownEpisode | null>(null);
  const [related, setRelated] = useState<BreakdownEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      // Try slug first, then id
      let { data } = await supabase
        .from("breakdown_episodes" as any)
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (!data) {
        const res = await supabase
          .from("breakdown_episodes" as any)
          .select("*")
          .eq("id", slug)
          .eq("status", "published")
          .maybeSingle();
        data = res.data;
      }
      const ep = (data ?? null) as unknown as BreakdownEpisode | null;
      setEpisode(ep);

      if (ep) {
        const { data: rel } = await supabase
          .from("breakdown_episodes" as any)
          .select("*")
          .eq("status", "published")
          .eq("category", ep.category)
          .neq("id", ep.id)
          .limit(3);
        setRelated((rel ?? []) as unknown as BreakdownEpisode[]);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <SiteLayout>
        <section className="container-rtg py-20 text-sm text-muted-foreground">Loading…</section>
      </SiteLayout>
    );
  }

  if (!episode) {
    return (
      <SiteLayout>
        <section className="container-rtg py-20 md:py-28">
          <Link
            to="/breakdown"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary mb-10"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Breakdown
          </Link>
          <EmptyState
            eyebrow={<RtgMark wordClassName="tracking-[0.25em]">Breakdown</RtgMark> as any}
            title="This episode isn't live yet."
            description="The breakdown you're looking for hasn't been published."
            icon={Film}
          />
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative bg-ink text-cream border-b border-border overflow-hidden grain-heavy">
        {episode.cover_image_url && (
          <>
            <img src={episode.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/85 to-ink" />
          </>
        )}
        <div className="container-rtg relative pt-20 md:pt-28 pb-16 md:pb-20">
          <Link
            to="/breakdown"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-cream/70 hover:text-primary mb-8"
          >
            <ArrowLeft className="h-3 w-3" /> All Episodes
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1">
              {episode.category}
            </span>
            {episode.episode_number && (
              <span className="font-condensed text-cream/80 text-sm uppercase tracking-widest">
                Episode {String(episode.episode_number).padStart(3, "0")}
              </span>
            )}
            {episode.duration && (
              <span className="text-[10px] uppercase tracking-[0.25em] text-cream/60 inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> {episode.duration}
              </span>
            )}
          </div>
          <h1 className="type-mega text-5xl md:text-7xl lg:text-8xl leading-[0.9] text-cream">
            {episode.title}
          </h1>
          {episode.summary && (
            <p className="mt-6 max-w-2xl text-cream/80 text-lg leading-relaxed">{episode.summary}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {episode.watch_url && (
              <a
                href={episode.watch_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 h-12 bg-primary text-primary-foreground text-xs uppercase tracking-[0.25em] font-bold hover:bg-primary/90 transition"
              >
                <Play className="h-4 w-4 fill-current" /> Watch
              </a>
            )}
            {episode.read_url && (
              <a
                href={episode.read_url}
                target={episode.read_url.startsWith("http") ? "_blank" : undefined}
                rel={episode.read_url.startsWith("http") ? "noreferrer" : undefined}
                className="inline-flex items-center gap-2 px-6 h-12 border border-cream/40 text-cream text-xs uppercase tracking-[0.25em] font-bold hover:bg-cream hover:text-ink transition"
              >
                <BookOpen className="h-4 w-4" /> Read Article
              </a>
            )}
          </div>
        </div>
      </section>

      {/* BODY */}
      {episode.breakdown_body && (
        <section className="container-rtg py-16 md:py-24">
          <article className="max-w-3xl mx-auto prose prose-invert prose-headings:font-display prose-headings:uppercase">
            <div className="whitespace-pre-line text-foreground/90 text-lg leading-relaxed font-editorial">
              {episode.breakdown_body}
            </div>
          </article>
        </section>
      )}

      {/* RELATED */}
      {related.length > 0 && (
        <section className="border-t border-border bg-background py-16 md:py-20">
          <div className="container-rtg">
            <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
              <div>
                <div className="eyebrow text-primary mb-2">More Like This</div>
                <h2 className="font-display text-2xl md:text-3xl uppercase">More from {episode.category}</h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((r) => (
                <EpisodeCard key={r.id} episode={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
};

export default BreakdownDetail;
