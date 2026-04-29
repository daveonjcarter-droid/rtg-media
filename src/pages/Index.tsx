import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Camera, Video, Music, Film, Scissors, Radio, Mic, Sparkles, Newspaper, Users, Flame, Play } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import NewsletterForm from "@/components/site/NewsletterForm";
import EmptyState from "@/components/site/EmptyState";
import Reveal from "@/components/site/Reveal";
import EpisodeCard from "@/components/site/EpisodeCard";
import PicksStrip from "@/components/site/PicksStrip";
import CreatorGrid from "@/components/site/CreatorGrid";
import ChicagoFeed from "@/components/site/ChicagoFeed";
import RtgMark from "@/components/site/RtgMark";
import { Button } from "@/components/ui/button";
import breakdownBg from "@/assets/breakdown-bg.jpg";
import servicesStudio from "@/assets/services-studio.jpg";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { useBreakdownEpisodes } from "@/hooks/useRtgContent";
import { supabase } from "@/integrations/supabase/client";

const TICKER = ["Music", "Film", "Fashion", "Chicago", "Entertainment", "Sports", "Anime", "Streetwear", "Culture"];

const SERVICES = [
  { icon: Camera, label: "Photography" },
  { icon: Video, label: "Videography" },
  { icon: Music, label: "Music Videos" },
  { icon: Film, label: "Film Production" },
  { icon: Scissors, label: "Editing" },
  { icon: Sparkles, label: "Live Events" },
  { icon: Mic, label: "Podcast / Audio" },
  { icon: Radio, label: "Brand Content" },
];

type CoverArticle = {
  id: string;
  title: string;
  slug: string | null;
  category: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
};

const Index = () => {
  const { content } = useHomepageContent();
  const { episodes } = useBreakdownEpisodes({ limit: 3 });
  const [cover, setCover] = useState<CoverArticle | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("articles")
        .select("id,title,slug,category,excerpt,cover_image_url")
        .eq("status", "published")
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      setCover(data as CoverArticle | null);
    })();
  }, []);

  const heroLines = content.hero.headline.split("\n");
  const signatureLines = content.manifesto.signatures.split("\n").filter(Boolean);
  const breakdownImg = content.featured.breakdownImage || breakdownBg;
  const servicesImg = content.servicesPreview.image || servicesStudio;
  const featuredEpisode = episodes.find((e) => e.is_featured) ?? episodes[0];

  return (
    <SiteLayout>
      {/* ============ HERO ============ */}
      <section className="relative min-h-[100svh] overflow-hidden bg-ink grain-heavy light-leak">
        {content.hero.backgroundImage ? (
          <>
            <img src={content.hero.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/60 to-ink" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-ink via-background to-ink" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.18),transparent_60%)]" />
          </>
        )}

        <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-6 z-20 items-center gap-3 text-cream/60">
          <span className="vertical-rl text-[10px] uppercase tracking-[0.5em]">Issue 001 · Spring 2026</span>
          <div className="h-24 w-px bg-cream/30" />
        </div>

        <div className="container-rtg relative z-10 min-h-[100svh] flex flex-col justify-end pb-10 md:pb-16 pt-32">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div className="flex items-center gap-3 text-cream/70 text-[10px] uppercase tracking-[0.4em]">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live from Chicago
            </div>
            <div className="hidden md:block text-right text-cream/70 text-[10px] uppercase tracking-[0.3em] max-w-xs">
              A BLACK-OWNED MEDIA & PRODUCTION COMPANY. FOUNDED BY DAVEON J. CARTER & BRENDYN SHIELDS.
            </div>
          </div>

          <h1 className="type-mega text-[22vw] md:text-[16vw] lg:text-[13vw] text-cream fade-in-up">
            {heroLines.map((line, i) => (
              <span key={i}>
                {i === heroLines.length - 1 && heroLines.length > 1 ? (
                  <span className="text-hollow-primary">{line}</span>
                ) : (
                  line
                )}
                {i < heroLines.length - 1 && <br />}
              </span>
            ))}
          </h1>

          <div className="mt-8 grid md:grid-cols-12 gap-6 items-end">
            <p className="md:col-span-5 text-cream/85 text-base md:text-lg leading-relaxed max-w-md">
              {content.hero.subheadline}
            </p>
            <div className="md:col-span-4 md:col-start-9 flex flex-wrap gap-3 justify-start md:justify-end">
              <Button asChild size="lg" className="group bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7">
                <Link to={content.hero.ctaLink || "/articles"}>
                  {content.hero.ctaText}
                  <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7 border-cream/40 bg-transparent text-cream hover:bg-cream hover:text-ink">
                <Link to="/book">Book Studio</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TICKER ============ */}
      <section className="relative border-y border-border bg-ink overflow-hidden section-bridge-ink-top">
        <div className="flex whitespace-nowrap marquee py-5">
          {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="font-condensed text-3xl md:text-5xl uppercase mx-6 text-foreground/90">
              {t} <span className="text-primary mx-3">✱</span>
            </span>
          ))}
        </div>
      </section>

      {/* ============ COVER STORY (real article or empty) ============ */}
      <section className="relative bg-background py-16 md:py-24 overflow-hidden">
        <div className="container-rtg">
          <div className="flex items-end justify-between mb-8 border-b border-border pb-4">
            <div>
              <div className="eyebrow mb-2">The Cover Story</div>
              <div className="font-condensed text-2xl md:text-3xl uppercase text-muted-foreground">No. 01 / Issue 001</div>
            </div>
            <Link to="/articles" className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary group">
              All Stories <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {cover ? (
            <Reveal>
              <Link to={`/articles/${cover.slug || cover.id}`} className="group grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 relative aspect-[16/10] overflow-hidden border border-border bg-surface">
                  {cover.cover_image_url ? (
                    <img src={cover.cover_image_url} alt={cover.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-ink via-background to-surface flex items-center justify-center">
                      <span className="font-gothic text-6xl text-primary/40">RTG</span>
                    </div>
                  )}
                </div>
                <div className="lg:col-span-5">
                  {cover.category && (
                    <span className="inline-block bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1 mb-4">
                      {cover.category}
                    </span>
                  )}
                  <h3 className="type-mega text-3xl md:text-5xl leading-[0.95] group-hover:text-primary transition-colors">
                    {cover.title}
                  </h3>
                  {cover.excerpt && <p className="mt-4 text-muted-foreground leading-relaxed">{cover.excerpt}</p>}
                  <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
                    Read the story <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ) : (
            <Reveal>
              <EmptyState
                eyebrow="The Magazine"
                title="The cover story drops with Issue 001."
                description="RTG Media is preparing its first releases. Stay close."
                icon={Newspaper}
                ribbon="Issue 001 — incoming"
              />
            </Reveal>
          )}
        </div>
      </section>

      {/* ============ MANIFESTO MOMENT ============ */}
      <section className="relative min-h-[80svh] bg-ink overflow-hidden grain-heavy flex items-center section-bridge-ink-top section-bridge-ink-bottom">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,hsl(var(--primary)/0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_90%,hsl(45_65%_52%/0.10),transparent_60%)]" />
        <div className="container-rtg relative py-20 md:py-28">
          <Reveal>
            <div className="eyebrow text-primary mb-6">Statement · 001</div>
          </Reveal>
          <Reveal delay={120} y={48}>
            <h2 className="type-mega text-cream text-[14vw] md:text-[10vw] leading-[0.86]">
              If you're not on RTG,
              <br />
              <span className="glitch text-primary" data-text="you're missing what's next.">
                you're missing what's next.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={260}>
            <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-3 text-[11px] uppercase tracking-[0.4em] text-cream/60">
              <span className="h-px w-12 bg-cream/40" />
              <span>Chicago</span>
              <span>·</span>
              <span>Independent</span>
              <span>·</span>
              <span>Black-owned</span>
              <span>·</span>
              <span>Issue 001</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ RTG BREAKDOWN — episode-driven ============ */}
      <section className="relative overflow-hidden bg-ink py-20 md:py-28 grain-heavy section-bridge-ink-bottom">
        <img src={breakdownImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 ken-burns" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/85 to-ink" />

        <div className="container-rtg relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <div className="eyebrow text-primary mb-3 flex items-center gap-2">
                <Play className="h-3 w-3 fill-current" /> Episode Series
              </div>
              <h2 className="type-mega text-6xl md:text-8xl lg:text-9xl text-cream">
                <RtgMark wordClassName="text-hollow">Breakdown</RtgMark>
              </h2>
              <p className="mt-5 max-w-lg text-cream/75">
                Frame-by-frame on the films, shows, and stories the culture is talking about.
                Watch it. Read it. Get the breakdown.
              </p>
            </div>
            <Button asChild size="lg" className="self-start md:self-end bg-cream text-ink hover:bg-cream/90 rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7">
              <Link to="/breakdown">All Episodes <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          {episodes.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {episodes.slice(0, 3).map((ep, i) => (
                <Reveal key={ep.id} delay={i * 80}>
                  <EpisodeCard episode={ep} size={i === 0 && featuredEpisode ? "lg" : "md"} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal>
              <EmptyState
                eyebrow="The Vault"
                title="First episodes drop with Issue 001."
                description="Deep dives on film, TV, anime, and culture coming soon."
                icon={Film}
                tone="dark"
                ribbon="Premiere · 001"
              />
            </Reveal>
          )}
        </div>
      </section>

      {/* ============ RTG PICKS ============ */}
      <section className="relative bg-background py-20 md:py-28">
        <div className="container-rtg">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
            <div>
              <div className="eyebrow text-primary mb-2 flex items-center gap-2">
                <Flame className="h-3 w-3" /> <RtgMark wordClassName="tracking-[0.25em]">Picks</RtgMark>
              </div>
              <h2 className="type-mega text-5xl md:text-7xl">If You Know,<br/><span className="text-hollow-primary">You Know.</span></h2>
            </div>
          </div>
          <Reveal>
            <PicksStrip />
          </Reveal>
        </div>
      </section>

      {/* ============ CREATOR SPOTLIGHT ============ */}
      <section className="relative bg-ink text-cream py-20 md:py-28 grain-heavy border-y border-border">
        <div className="container-rtg">
          <div className="flex items-end justify-between mb-10 pb-4 border-b border-cream/15">
            <div>
              <div className="eyebrow text-primary mb-2 flex items-center gap-2">
                <Users className="h-3 w-3" /> Creator Spotlight
              </div>
              <h2 className="type-mega text-5xl md:text-7xl text-cream">
                People You<br/><span className="text-hollow">Should Know.</span>
              </h2>
            </div>
          </div>
          <Reveal>
            <CreatorGrid limit={6} />
          </Reveal>
        </div>
      </section>

      {/* ============ CHICAGO FEED ============ */}
      <section className="relative bg-background py-20 md:py-28">
        <div className="container-rtg">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
            <div>
              <div className="eyebrow text-primary mb-2 flex items-center gap-2">
                <Radio className="h-3 w-3" /> Chicago Feed
              </div>
              <h2 className="type-mega text-5xl md:text-7xl">Live From<br/><span className="text-hollow-primary">The City.</span></h2>
              <p className="mt-4 text-muted-foreground max-w-md">
                Local events, culture moments, artist activity. From the streets up.
              </p>
            </div>
          </div>
          <Reveal>
            <ChicagoFeed limit={6} />
          </Reveal>
        </div>
      </section>

      {/* ============ MANIFESTO STRIP ============ */}
      <section className="relative bg-cream text-ink overflow-hidden py-24 md:py-32">
        <div className="container-rtg relative">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-3 md:sticky md:top-24">
              <div className="text-[10px] uppercase tracking-[0.4em] text-ink/60 mb-3">{content.manifesto.headline}</div>
              <div className="font-condensed text-4xl md:text-5xl leading-none">No. 02</div>
            </div>
            <div className="md:col-span-9">
              <p className="font-editorial text-3xl md:text-5xl leading-[1.05] tracking-tight whitespace-pre-line">
                {content.manifesto.body}
              </p>
              <div className="mt-10 flex flex-wrap gap-x-12 gap-y-4 text-xs uppercase tracking-[0.3em] text-ink/70">
                {signatureLines.map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
                {content.manifesto.locationDate && (
                  <span className="text-primary">{content.manifesto.locationDate}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRODUCTION SERVICES ============ */}
      <section className="relative bg-background overflow-hidden py-20 md:py-28">
        <div className="container-rtg">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
              <div className="eyebrow mb-3">The Studio</div>
              <h2 className="type-mega text-6xl md:text-7xl lg:text-8xl">
                Production
                <br />
                <span className="text-hollow-primary">Services</span>
              </h2>
              <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
                {content.servicesPreview.description}
              </p>
              <Button asChild className="mt-8 rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to={content.servicesPreview.ctaLink || "/book"}>{content.servicesPreview.ctaText} <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="lg:col-span-7">
              <ul className="divide-y divide-border border-y border-border">
                {SERVICES.map((s, i) => (
                  <li key={s.label} className="group">
                    <Link to="/services" className="flex items-center justify-between py-6 hover:px-4 transition-all">
                      <div className="flex items-center gap-6">
                        <span className="font-condensed text-2xl text-muted-foreground/60 w-10">{String(i + 1).padStart(2, "0")}</span>
                        <s.icon className="h-6 w-6 text-primary opacity-70 group-hover:opacity-100 transition" />
                        <span className="type-wide text-2xl md:text-4xl group-hover:text-primary transition-colors">{s.label}</span>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="relative mt-16 md:mt-20 aspect-[21/8] overflow-hidden grain-heavy clip-slant">
          <img src={servicesImg} alt="RTG Media production studio" className="absolute inset-0 w-full h-full object-cover ken-burns" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/30 to-transparent" />
          <div className="container-rtg relative h-full flex items-center">
            <div className="max-w-xl">
              <div className="text-primary text-[10px] uppercase tracking-[0.4em] mb-4">Behind The Lens</div>
              <div className="type-mega text-5xl md:text-7xl text-cream">One team. One vision. Cinematic by default.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MERCH TEASER ============ */}
      <section className="relative bg-background py-24 md:py-32 overflow-hidden">
        <div className="container-rtg relative grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-5 md:translate-y-6">
            {content.drops.image ? (
              <div className="aspect-[4/5] overflow-hidden rounded-sm border border-border grain">
                <img src={content.drops.image} alt={content.drops.headline} className="w-full h-full object-cover img-kinetic" />
              </div>
            ) : (
              <div className="aspect-[4/5] border border-border bg-surface/40 flex items-center justify-center">
                <span className="font-gothic text-6xl text-primary/60">RTG</span>
              </div>
            )}
          </div>

          <div className="md:col-span-7 md:-translate-y-4 md:pl-6">
            <div className="font-gothic text-3xl md:text-4xl text-primary mb-4">{content.drops.headline}</div>
            <h2 className="type-mega text-[18vw] md:text-[12vw] lg:text-[10rem] leading-[0.85]">
              Coming
              <br />
              <span className="text-hollow">Soon.</span>
            </h2>
            <p className="mt-8 max-w-md text-muted-foreground">
              {content.drops.text}
            </p>
            {content.drops.ctaText && (
              <div className="mt-6 text-xs uppercase tracking-[0.3em] text-primary">{content.drops.ctaText} ↓</div>
            )}
          </div>
        </div>
        <div className="mt-16 border-y border-border bg-ink overflow-hidden py-4">
          <div className="flex whitespace-nowrap marquee-reverse">
            {Array(8).fill(0).map((_, i) => (
              <span key={i} className="font-condensed text-2xl md:text-4xl uppercase mx-6 text-cream/90">
                Limited Run · Numbered · Chicago Made <span className="text-primary mx-3">●</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ NEWSLETTER ============ */}
      <section className="relative bg-ink overflow-hidden grain-heavy">
        <div className="container-rtg py-20 md:py-28 grid lg:grid-cols-12 gap-12 items-center relative">
          <div className="lg:col-span-7">
            <div className="eyebrow text-primary mb-4">The Dispatch</div>
            <h2 className="type-mega text-5xl md:text-7xl lg:text-8xl text-cream leading-[0.9]">
              Get on the<br />
              <span className="text-primary">list.</span>
            </h2>
            <p className="mt-6 text-cream/75 max-w-md">
              Culture before everyone else. No noise.
            </p>
          </div>
          <div className="lg:col-span-5">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Index;
