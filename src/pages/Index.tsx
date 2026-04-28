import { Link } from "react-router-dom";
import { ArrowRight, Camera, Video, Music, Film, Scissors, Radio, Mic, Sparkles, Play } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import ArticleCard from "@/components/site/ArticleCard";
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

const TICKER = ["Music", "Film", "Fashion", "Chicago Culture", "Entertainment", "Sports", "Nerd Culture"];

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
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative min-h-[88vh] flex items-end overflow-hidden grain">
        <img
          src={heroImg}
          alt="RTG Media videographer documenting Chicago at night"
          className="absolute inset-0 w-full h-full object-cover"
          width={1600}
          height={1280}
        />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="container-rtg relative pb-20 md:pb-28 pt-32">
          <div className="max-w-3xl fade-in-up">
            <div className="eyebrow text-cream/80 mb-5">Runners To Greatness · Est. 2024 · Chicago</div>
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl leading-[0.95] uppercase">
              We Document<br />Culture.<br />
              <span className="text-primary">We Create Legacy.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base md:text-lg text-cream/80 leading-relaxed">
              A Black-owned media & production company based in Chicago — telling the stories that shape a generation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm uppercase tracking-widest text-xs h-12 px-7">
                <Link to="/articles">Explore Articles</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-sm uppercase tracking-widest text-xs h-12 px-7 border-cream/40 bg-transparent text-cream hover:bg-cream hover:text-ink">
                <Link to="/book">Book Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY TICKER */}
      <section className="border-y border-border bg-ink overflow-hidden">
        <div className="flex whitespace-nowrap marquee py-4">
          {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="font-display text-2xl md:text-3xl uppercase mx-8 text-foreground/80">
              {t} <span className="text-primary mx-4">●</span>
            </span>
          ))}
        </div>
      </section>

      {/* LATEST STORIES */}
      <section className="container-rtg py-20 md:py-28">
        <SectionHead eyebrow="Editorial" title="Latest Stories" link="/articles" linkLabel="View All Articles" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-10">
          {STORIES.slice(0, 4).map((s) => (
            <ArticleCard key={s.id} story={s} />
          ))}
        </div>
      </section>

      {/* TRENDING NOW (horizontal scroll) */}
      <section className="py-16 md:py-20 bg-surface/40 border-y border-border">
        <div className="container-rtg">
          <SectionHead eyebrow="Hot Right Now" title="Trending" link="/articles" linkLabel="See More" />
        </div>
        <div className="mt-8 flex gap-5 overflow-x-auto scrollbar-hide px-6 md:px-10 pb-4 snap-x">
          {STORIES.slice(2, 8).map((s) => (
            <Link key={s.id} to={`/articles/${s.id}`} className="snap-start shrink-0 w-[280px] md:w-[340px] group">
              <div className="aspect-[4/5] overflow-hidden bg-surface relative">
                <img src={s.image} alt={s.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-2">{s.category}</div>
                  <div className="font-display text-xl uppercase leading-tight">{s.title}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* RTG PICKS */}
      <section className="container-rtg py-20 md:py-28">
        <SectionHead eyebrow="Curated By Us" title="RTG Picks" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          <div className="lg:col-span-2">
            <ArticleCard story={STORIES[1]} size="lg" />
          </div>
          <div className="space-y-8">
            {STORIES.slice(4, 6).map((s) => (
              <Link key={s.id} to={`/articles/${s.id}`} className="flex gap-4 group">
                <div className="w-32 h-24 shrink-0 overflow-hidden bg-surface">
                  <img src={s.image} alt={s.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">{s.category}</div>
                  <div className="font-display text-lg uppercase leading-tight mt-1 group-hover:text-primary transition-colors">{s.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.date}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* RTG BREAKDOWN */}
      <section className="relative overflow-hidden grain">
        <img src={breakdownBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/70 to-ink" />
        <div className="container-rtg relative py-24 md:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="eyebrow text-primary mb-4">A Cultural Engine</div>
            <h2 className="font-display text-5xl md:text-7xl uppercase leading-none">
              RTG<br />Breakdown
            </h2>
            <p className="mt-6 max-w-md text-cream/80 leading-relaxed">
              Movies. TV. Comics. Anime. We dissect the stories the culture is talking about — frame by frame, episode by episode.
            </p>
            <Button asChild size="lg" className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm uppercase tracking-widest text-xs h-12 px-7">
              <Link to="/breakdown">Explore Breakdowns <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {STORIES.slice(3, 7).map((s, i) => (
              <Link key={s.id} to="/breakdown" className={`group relative aspect-[4/5] overflow-hidden bg-surface ${i % 2 ? "translate-y-8" : ""}`}>
                <img src={s.image} alt={s.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center">
                    <Play className="h-6 w-6 text-primary-foreground fill-current ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-1">Episode {i + 1}</div>
                  <div className="font-display text-base uppercase leading-tight">{s.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTION SERVICES */}
      <section className="container-rtg py-20 md:py-28">
        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <div className="eyebrow mb-4">What We Do</div>
            <h2 className="font-display text-5xl md:text-6xl uppercase leading-none">Production<br />Services</h2>
            <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
              Professional. Cinematic. Elevated. From concept to final cut — we bring your vision to life.
            </p>
            <Button asChild className="mt-8 rounded-sm uppercase tracking-widest text-xs h-11 px-6 bg-cream text-ink hover:bg-cream/90">
              <Link to="/services">View All Services</Link>
            </Button>
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
            {SERVICES.map((s) => (
              <div key={s.label} className="bg-background p-6 hover:bg-surface transition-colors group cursor-pointer">
                <s.icon className="h-6 w-6 text-primary mb-4" />
                <div className="font-display text-lg uppercase tracking-wide group-hover:text-primary transition-colors">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 relative aspect-[21/9] overflow-hidden">
          <img src={servicesStudio} alt="RTG Media production studio" loading="lazy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/40 to-transparent" />
          <div className="absolute inset-0 flex items-center px-8 md:px-16">
            <div>
              <div className="font-display text-3xl md:text-5xl uppercase max-w-md leading-tight">Full-stack production. One team. One vision.</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED WORK */}
      <section className="border-t border-border py-20 md:py-24 bg-surface/30">
        <div className="container-rtg">
          <SectionHead eyebrow="Selected Work" title="Featured Work" link="/portfolio" linkLabel="View Portfolio" />
        </div>
        <div className="mt-10 flex gap-4 overflow-x-auto scrollbar-hide px-6 md:px-10 pb-4">
          {FEATURED.map((src, i) => (
            <Link key={i} to="/portfolio" className="shrink-0 w-[260px] md:w-[320px] aspect-square relative group overflow-hidden bg-surface">
              <img src={src} alt={`Featured work ${i + 1}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="h-12 w-12 text-cream fill-current" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MERCH TEASER */}
      <section className="container-rtg py-20 md:py-24 text-center">
        <div className="eyebrow text-gold mb-4">RTG Drops</div>
        <h2 className="font-display text-5xl md:text-7xl uppercase">Coming Soon</h2>
        <p className="mt-4 max-w-md mx-auto text-muted-foreground">Apparel, hats, and limited drops built around the brand. Sign up to get first access.</p>
      </section>

      {/* NEWSLETTER / CTA */}
      <section className="border-t border-border bg-ink relative overflow-hidden">
        <div className="container-rtg py-20 md:py-24 grid md:grid-cols-2 gap-12 items-center relative">
          <div>
            <div className="eyebrow text-primary mb-4">Stay Connected</div>
            <h2 className="font-display text-4xl md:text-6xl uppercase leading-none">
              Ready to bring<br />your vision<br />to life?
            </h2>
            <p className="mt-5 text-muted-foreground max-w-md">Get the latest stories, breakdowns, and drops — straight to your inbox. No spam. Just culture.</p>
            <Button asChild className="mt-8 rounded-sm uppercase tracking-widest text-xs h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/book">Book a Consultation</Link>
            </Button>
          </div>
          <NewsletterForm />

        </div>
      </section>
    </SiteLayout>
  );
};

const SectionHead = ({ eyebrow, title, link, linkLabel }: { eyebrow: string; title: string; link?: string; linkLabel?: string }) => (
  <div className="flex items-end justify-between gap-6 border-b border-border pb-4">
    <div>
      <div className="eyebrow mb-2">{eyebrow}</div>
      <h2 className="font-display text-3xl md:text-5xl uppercase leading-none">{title}</h2>
    </div>
    {link && (
      <Link to={link} className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary hover:gap-3 transition-all">
        {linkLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    )}
  </div>
);

export default Index;
