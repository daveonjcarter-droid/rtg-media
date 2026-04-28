import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Camera, Video, Music, Film, Scissors, Radio, Mic, Sparkles, Play } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import NewsletterForm from "@/components/site/NewsletterForm";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-videographer.jpg";
import breakdownBg from "@/assets/breakdown-bg.jpg";
import servicesStudio from "@/assets/services-studio.jpg";
import portfolio1 from "@/assets/portfolio-1.jpg";
import portfolio2 from "@/assets/portfolio-2.jpg";
import portfolio3 from "@/assets/portfolio-3.jpg";
import portfolio4 from "@/assets/portfolio-4.jpg";
import storyFilm from "@/assets/story-film.jpg";
import { STORIES } from "@/data/stories";

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

const FEATURED = [portfolio1, portfolio2, portfolio3, portfolio4, storyFilm];

const Index = () => {
  const feature = STORIES[0];
  const stack = STORIES.slice(1, 4);
  const editorialA = STORIES[4];
  const editorialB = STORIES[5];

  return (
    <SiteLayout>
      {/* ============ HERO — cinematic, asymmetric ============ */}
      <section className="relative min-h-[100svh] overflow-hidden bg-ink grain-heavy light-leak">
        <img
          src={heroImg}
          alt="RTG Media videographer documenting Chicago at night"
          className="absolute inset-0 w-full h-full object-cover ken-burns"
          width={1600}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-transparent" />

        {/* Side vertical label */}
        <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-6 z-20 items-center gap-3 text-cream/60">
          <span className="vertical-rl text-[10px] uppercase tracking-[0.5em]">Issue 001 · Spring 2026</span>
          <div className="h-24 w-px bg-cream/30" />
        </div>

        {/* Bottom-left mega type */}
        <div className="container-rtg relative z-10 min-h-[100svh] flex flex-col justify-end pb-10 md:pb-16 pt-32">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div className="flex items-center gap-3 text-cream/70 text-[10px] uppercase tracking-[0.4em]">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live from Chicago
            </div>
            <div className="hidden md:block text-right text-cream/70 text-[10px] uppercase tracking-[0.3em] max-w-xs">
              A Black-owned media & production company. Founded by Daveon J. Carter & Brendan Shields.
            </div>
          </div>

          <h1 className="type-mega text-[22vw] md:text-[16vw] lg:text-[13vw] text-cream fade-in-up">
            Runners
            <br />
            <span className="text-hollow-primary">To Greatness</span>
          </h1>

          <div className="mt-8 grid md:grid-cols-12 gap-6 items-end">
            <p className="md:col-span-5 text-cream/85 text-base md:text-lg leading-relaxed max-w-md">
              We document the culture before it has a name. Film. Music. Fashion. The Chicago
              stories the rest of the world will be talking about next.
            </p>
            <div className="md:col-span-4 md:col-start-9 flex flex-wrap gap-3 justify-start md:justify-end">
              <Button asChild size="lg" className="group bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7">
                <Link to="/articles">
                  Read The Magazine
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
      <section className="border-y border-border bg-ink overflow-hidden relative">
        <div className="flex whitespace-nowrap marquee py-5">
          {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="font-condensed text-3xl md:text-5xl uppercase mx-6 text-foreground/90">
              {t} <span className="text-primary mx-3">✱</span>
            </span>
          ))}
        </div>
      </section>

      {/* ============ FEATURE STORY — magazine cover style ============ */}
      <section className="relative bg-background py-16 md:py-24 overflow-hidden">
        <div className="container-rtg">
          <div className="flex items-end justify-between mb-8 border-b border-border pb-4">
            <div>
              <div className="eyebrow mb-2">The Cover Story</div>
              <div className="font-condensed text-2xl md:text-3xl uppercase text-muted-foreground">No. 01 / This Week</div>
            </div>
            <Link to="/articles" className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary group">
              All Stories <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Massive feature */}
            <Link to={`/articles/${feature.id}`} className="lg:col-span-8 group relative block">
              <div className="relative aspect-[4/5] md:aspect-[16/11] overflow-hidden bg-surface">
                <img src={feature.image} alt={feature.title} className="w-full h-full object-cover img-kinetic" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                <span className="sticker absolute top-5 left-5">{feature.category}</span>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                  <div className="text-cream/70 text-[10px] uppercase tracking-[0.4em] mb-3">{feature.date} · By {feature.author}</div>
                  <h2 className="type-mega text-[10vw] md:text-7xl lg:text-[5.5rem] text-cream max-w-3xl">
                    {feature.title}
                  </h2>
                  <p className="hidden md:block mt-4 max-w-xl text-cream/80 text-base">{feature.excerpt}</p>
                </div>
              </div>
            </Link>

            {/* Stacked sidebar */}
            <div className="lg:col-span-4 flex flex-col divide-y divide-border border-y border-border lg:border-y-0 lg:border-l lg:pl-6">
              {stack.map((s, i) => (
                <Link key={s.id} to={`/articles/${s.id}`} className="group py-5 first:pt-0 last:pb-0 flex gap-5 items-start">
                  <div className="font-condensed text-4xl md:text-5xl text-muted-foreground/60 group-hover:text-primary transition-colors w-12 shrink-0">
                    0{i + 2}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold mb-2">{s.category}</div>
                    <h3 className="font-condensed text-2xl md:text-3xl uppercase leading-[0.95] group-hover:text-primary transition-colors">
                      {s.title}
                    </h3>
                    <div className="mt-2 text-xs text-muted-foreground">{s.date}</div>
                  </div>
                  <div className="w-20 h-20 shrink-0 overflow-hidden bg-surface hidden sm:block">
                    <img src={s.image} alt="" className="w-full h-full object-cover img-kinetic" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FULL-BLEED EDITORIAL SPLIT ============ */}
      <section className="relative bg-ink overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[80vh]">
          <Link to={`/articles/${editorialA.id}`} className="group relative overflow-hidden grain-heavy">
            <img src={editorialA.image} alt={editorialA.title} className="absolute inset-0 w-full h-full object-cover img-kinetic" />
            <div className="absolute inset-0 bg-gradient-to-tr from-ink via-ink/40 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-between p-8 md:p-14">
              <div className="flex items-center gap-3 text-cream text-[10px] uppercase tracking-[0.4em]">
                <span className="h-px w-10 bg-primary" /> Field Notes
              </div>
              <div>
                <div className="text-primary text-[10px] uppercase tracking-[0.3em] mb-3">{editorialA.category}</div>
                <h3 className="type-wide text-3xl md:text-5xl text-cream leading-[0.95] max-w-md">
                  {editorialA.title}
                </h3>
                <p className="mt-4 max-w-md text-cream/75 text-sm">{editorialA.excerpt}</p>
              </div>
            </div>
          </Link>
          <Link to={`/articles/${editorialB.id}`} className="group relative overflow-hidden bg-surface md:translate-y-12">
            <img src={editorialB.image} alt={editorialB.title} className="absolute inset-0 w-full h-full object-cover img-kinetic opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-bl from-primary/30 via-ink/60 to-ink" />
            <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-14">
              <div className="text-cream/80 text-[10px] uppercase tracking-[0.3em] mb-3">{editorialB.category} · {editorialB.date}</div>
              <h3 className="type-mega text-5xl md:text-7xl text-cream max-w-md">
                {editorialB.title}
              </h3>
              <div className="mt-6 inline-flex items-center gap-2 text-primary text-xs uppercase tracking-[0.3em]">
                Read the essay <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ============ RTG BREAKDOWN — episode wall ============ */}
      <section className="relative overflow-hidden bg-ink py-20 md:py-28 grain-heavy">
        <img src={breakdownBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/85 to-ink" />

        <div className="container-rtg relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <div className="eyebrow text-primary mb-3">Now Streaming</div>
              <h2 className="type-mega text-6xl md:text-8xl lg:text-9xl text-cream">
                RTG <span className="text-hollow">Breakdown</span>
              </h2>
              <p className="mt-5 max-w-lg text-cream/75">
                Movies, TV, anime, comics. Frame-by-frame breakdowns of everything the culture is talking about.
              </p>
            </div>
            <Button asChild size="lg" className="self-start md:self-end bg-cream text-ink hover:bg-cream/90 rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7">
              <Link to="/breakdown">All Episodes <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          {/* Featured episode + thumbnails grid */}
          <div className="grid lg:grid-cols-12 gap-6">
            <Link to="/breakdown" className="lg:col-span-7 group relative block aspect-video overflow-hidden bg-surface">
              <img src={STORIES[3].image} alt={STORIES[3].title} className="w-full h-full object-cover img-kinetic" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
              <div className="absolute top-4 left-4 sticker">EP 12 · Featured</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_60px_hsl(355_78%_56%/0.6)]">
                  <Play className="h-9 w-9 text-primary-foreground fill-current ml-1.5" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <h3 className="type-wide text-2xl md:text-4xl text-cream max-w-xl leading-tight">{STORIES[3].title}</h3>
                <div className="mt-2 text-cream/70 text-xs uppercase tracking-[0.3em]">42 min · Breakdown</div>
              </div>
            </Link>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {STORIES.slice(4, 8).map((s, i) => (
                <Link
                  key={s.id}
                  to="/breakdown"
                  className={`group relative aspect-video overflow-hidden bg-surface ${i === 1 ? "translate-y-6" : ""} ${i === 2 ? "-translate-y-6" : ""}`}
                >
                  <img src={s.image} alt={s.title} className="w-full h-full object-cover img-kinetic" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                  <div className="absolute top-2 left-2 bg-ink/80 backdrop-blur px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] text-cream font-bold">
                    EP {String(i + 8).padStart(2, "0")}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-ink/80 backdrop-blur px-2 py-0.5 text-[9px] uppercase tracking-widest text-cream">
                    {18 + i * 4} min
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                      <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 pt-8 bg-gradient-to-t from-ink via-ink/70 to-transparent">
                    <div className="font-condensed text-base uppercase leading-tight text-cream line-clamp-2">{s.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ MANIFESTO STRIP ============ */}
      <section className="relative bg-cream text-ink overflow-hidden py-24 md:py-32">
        <div className="container-rtg relative">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-3 md:sticky md:top-24">
              <div className="text-[10px] uppercase tracking-[0.4em] text-ink/60 mb-3">Manifesto</div>
              <div className="font-condensed text-4xl md:text-5xl leading-none">No. 02</div>
            </div>
            <div className="md:col-span-9">
              <p className="font-editorial text-3xl md:text-5xl leading-[1.05] tracking-tight">
                We are not waiting for permission. We document the South Side at midnight, the studios at 4am, the
                designers cutting silhouettes you'll see in Paris next year. <span className="text-primary">If you're not on RTG, you're missing what's next.</span>
              </p>
              <div className="mt-10 flex flex-wrap gap-x-12 gap-y-4 text-xs uppercase tracking-[0.3em] text-ink/70">
                <span>— Daveon J. Carter, Founder</span>
                <span>— Brendan Shields, Co-CEO</span>
                <span className="text-primary">Chicago · 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRODUCTION SERVICES — overlapping ============ */}
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
                Full-stack production. One team. One vision. From a single photo set to a full episodic series — we shoot, cut, score, and ship.
              </p>
              <Button asChild className="mt-8 rounded-none uppercase tracking-[0.25em] text-xs h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/book">Book A Consult <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
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

        {/* Full-bleed studio image with slant */}
        <div className="relative mt-16 md:mt-20 aspect-[21/8] overflow-hidden grain-heavy clip-slant">
          <img src={servicesStudio} alt="RTG Media production studio" className="absolute inset-0 w-full h-full object-cover ken-burns" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/30 to-transparent" />
          <div className="container-rtg relative h-full flex items-center">
            <div className="max-w-xl">
              <div className="text-primary text-[10px] uppercase tracking-[0.4em] mb-4">Behind The Lens</div>
              <div className="type-mega text-5xl md:text-7xl text-cream">One team. One vision. Cinematic by default.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURED WORK — horizontal cinematic scroll ============ */}
      <section className="relative bg-ink py-20 md:py-24 border-y border-border overflow-hidden">
        <div className="container-rtg flex items-end justify-between mb-10">
          <div>
            <div className="eyebrow text-primary mb-2">Selected Work</div>
            <h2 className="type-mega text-5xl md:text-7xl">The Reel</h2>
          </div>
          <Link to="/portfolio" className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-cream/80 hover:text-primary group">
            Full Portfolio <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </div>
        <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide px-6 md:px-10 pb-4 snap-x">
          {FEATURED.map((src, i) => (
            <Link
              key={i}
              to="/portfolio"
              className={`snap-start shrink-0 group relative overflow-hidden bg-surface ${
                i % 2 === 0 ? "w-[300px] md:w-[420px] aspect-[3/4]" : "w-[260px] md:w-[360px] aspect-square mt-10"
              }`}
            >
              <img src={src} alt={`Featured work ${i + 1}`} loading="lazy" className="w-full h-full object-cover img-kinetic" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
              <div className="absolute top-3 left-3 text-cream text-[10px] uppercase tracking-[0.3em]">№ {String(i + 1).padStart(2, "0")}</div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center">
                  <Play className="h-6 w-6 text-primary-foreground fill-current ml-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ MERCH TEASER — streetwear energy ============ */}
      <section className="relative bg-background py-24 md:py-32 overflow-hidden">
        <div className="container-rtg relative">
          <div className="text-center">
            <div className="font-gothic text-3xl md:text-4xl text-primary mb-6">RTG Drops</div>
            <h2 className="type-mega text-[20vw] md:text-[14vw] lg:text-[12rem] leading-[0.85]">
              Coming
              <br />
              <span className="text-hollow">Soon.</span>
            </h2>
            <p className="mt-8 max-w-md mx-auto text-muted-foreground">
              Apparel, hats, and limited drops built around the brand. Sign up for first access.
            </p>
          </div>
        </div>
        {/* Marquee promo */}
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

      {/* ============ NEWSLETTER / CTA ============ */}
      <section className="relative bg-ink overflow-hidden grain-heavy">
        <div className="container-rtg py-20 md:py-28 grid lg:grid-cols-12 gap-12 items-center relative">
          <div className="lg:col-span-7">
            <div className="eyebrow text-primary mb-4">The Dispatch</div>
            <h2 className="type-mega text-5xl md:text-7xl lg:text-8xl text-cream leading-[0.9]">
              Get on the<br />
              <span className="text-primary">list.</span>
            </h2>
            <p className="mt-6 text-cream/75 max-w-md">
              Stories, breakdowns, and drops — straight to your inbox. No spam, just culture before everyone else.
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
