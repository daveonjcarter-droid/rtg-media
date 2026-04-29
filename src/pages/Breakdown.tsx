import { useEffect, useMemo, useState } from "react";
import { Film, Play } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import EmptyState from "@/components/site/EmptyState";
import EpisodeCard from "@/components/site/EpisodeCard";
import Reveal from "@/components/site/Reveal";
import breakdownBg from "@/assets/breakdown-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import type { BreakdownEpisode } from "@/hooks/useRtgContent";

const TABS = ["All", "Movies", "TV", "Anime", "Comics", "Music", "Culture"];

const Breakdown = () => {
  const [tab, setTab] = useState("All");
  const [episodes, setEpisodes] = useState<BreakdownEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("breakdown_episodes" as any)
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      setEpisodes((data ?? []) as unknown as BreakdownEpisode[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => (tab === "All" ? episodes : episodes.filter((e) => e.category === tab)),
    [tab, episodes]
  );

  const featured = useMemo(() => episodes.find((e) => e.is_featured) ?? episodes[0] ?? null, [episodes]);
  const rest = useMemo(
    () => filtered.filter((e) => !featured || e.id !== featured.id),
    [filtered, featured]
  );

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden grain-heavy border-b border-border bg-ink">
        <img src={breakdownBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 ken-burns" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/70 to-ink" />
        <div className="container-rtg relative pt-24 md:pt-32 pb-20 md:pb-28">
          <div className="eyebrow text-primary mb-4">A Cultural Engine · Episode Series</div>
          <h1 className="type-mega text-7xl md:text-[14rem] leading-[0.82] text-cream flex flex-col items-start">
            <span className="font-gothic tracking-[0.02em]" style={{ fontSize: "0.9em", lineHeight: 0.85 }}>RTG</span>
            <span className="text-hollow-primary">Breakdown</span>
          </h1>
          <p className="mt-8 max-w-xl text-cream/85 text-lg">
            Movies. TV. Comics. Anime. Music. The biggest stories in pop culture — broken down frame by frame.
            Watch it. Read it. Get the breakdown.
          </p>
        </div>
      </section>

      {/* FEATURED EPISODE */}
      {featured && tab === "All" && (
        <section className="border-b border-border bg-background">
          <div className="container-rtg py-12 md:py-16">
            <div className="flex items-center justify-between mb-6">
              <div className="eyebrow text-primary flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Featured Episode
              </div>
              {featured.episode_number && (
                <span className="font-condensed text-2xl text-muted-foreground">
                  EP {String(featured.episode_number).padStart(3, "0")}
                </span>
              )}
            </div>
            <Reveal>
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <EpisodeCard episode={featured} size="lg" />
                </div>
                <div className="lg:col-span-5">
                  <span className="inline-block bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-1 mb-4">
                    {featured.category}
                  </span>
                  <h2 className="type-mega text-4xl md:text-5xl lg:text-6xl leading-[0.95]">
                    {featured.title}
                  </h2>
                  {featured.summary && (
                    <p className="mt-5 text-muted-foreground leading-relaxed">{featured.summary}</p>
                  )}
                  {featured.watch_url && (
                    <a
                      href={featured.watch_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-7 inline-flex items-center gap-2 px-5 h-12 bg-primary text-primary-foreground text-xs uppercase tracking-[0.25em] font-bold hover:bg-primary/90 transition"
                    >
                      <Play className="h-4 w-4 fill-current" /> Watch Episode
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* FILTER BAR */}
      <section className="sticky top-16 z-30 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="container-rtg py-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => {
            const count = t === "All" ? episodes.length : episodes.filter((e) => e.category === t).length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] font-bold border transition flex items-center gap-2 ${
                  tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
                }`}
              >
                {t}
                {!loading && (
                  <span className={`text-[9px] ${tab === t ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* EPISODES GRID */}
      <section className="container-rtg py-12 md:py-20">
        {loading ? (
          <div className="text-muted-foreground text-sm">Loading episodes…</div>
        ) : rest.length === 0 && !featured ? (
          <EmptyState
            eyebrow="The Vault"
            title="First episodes drop with Issue 001."
            description="We're preparing deep dives into film, TV, anime, music, and culture."
            icon={Film}
            ribbon="Premiere · 001"
          />
        ) : rest.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No episodes in <span className="text-foreground uppercase tracking-widest">{tab}</span> yet.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
              <div className="eyebrow">All Episodes</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {rest.length} {rest.length === 1 ? "Episode" : "Episodes"}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {rest.map((ep) => (
                <Reveal key={ep.id}>
                  <EpisodeCard episode={ep} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </section>
    </SiteLayout>
  );
};

export default Breakdown;
