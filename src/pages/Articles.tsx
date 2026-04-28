import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import { CATEGORIES, STORIES, type Story } from "@/data/stories";

const Articles = () => {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? STORIES : STORIES.filter((s) => s.category === active);
  const [hero, second, third, ...rest] = filtered;

  return (
    <SiteLayout>
      {/* HERO MASTHEAD */}
      <section className="relative bg-ink overflow-hidden grain-heavy border-b border-border">
        <div className="container-rtg pt-20 md:pt-28 pb-12 relative">
          <div className="flex items-end justify-between gap-6 mb-6">
            <div>
              <div className="eyebrow text-primary mb-3">The Magazine · Issue 001</div>
              <h1 className="type-mega text-7xl md:text-[12rem] leading-[0.85] text-cream">
                Articles<span className="text-primary">.</span>
              </h1>
            </div>
            <div className="hidden md:block max-w-xs text-right text-cream/70 text-sm">
              Culture, film, music, fashion, sports, and the Chicago stories shaping what comes next.
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTERS */}
      <section className="sticky top-16 z-30 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="container-rtg py-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`shrink-0 px-4 py-2 text-[10px] uppercase tracking-[0.25em] font-bold border transition-colors ${
                active === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground container-rtg">No stories yet in this category.</div>
      ) : (
        <>
          {/* TOP FEATURE — full bleed */}
          {hero && (
            <section className="relative bg-ink overflow-hidden">
              <Link to={`/articles/${hero.id}`} className="group relative block">
                <div className="relative aspect-[16/10] md:aspect-[21/10] overflow-hidden">
                  <img src={hero.image} alt={hero.title} className="w-full h-full object-cover img-kinetic" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                </div>
                <div className="container-rtg relative -mt-32 md:-mt-48 pb-16 md:pb-24 z-10">
                  <span className="sticker mb-5">Cover Story · {hero.category}</span>
                  <h2 className="type-mega text-5xl md:text-8xl text-cream max-w-5xl">{hero.title}</h2>
                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-cream/70 text-xs uppercase tracking-[0.3em]">
                    <span>By {hero.author}</span>
                    <span>{hero.date}</span>
                    <span className="inline-flex items-center gap-1 text-primary">Read story <ArrowUpRight className="h-3 w-3" /></span>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* SECOND + THIRD — side-by-side editorial */}
          {(second || third) && (
            <section className="container-rtg py-16 md:py-24 grid md:grid-cols-12 gap-8 md:gap-12">
              {second && (
                <Link to={`/articles/${second.id}`} className="md:col-span-7 group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                    <img src={second.image} alt={second.title} className="w-full h-full object-cover img-kinetic" />
                  </div>
                  <div className="mt-5 max-w-2xl">
                    <div className="text-primary text-[10px] uppercase tracking-[0.3em] font-bold mb-2">{second.category}</div>
                    <h3 className="type-wide text-3xl md:text-5xl group-hover:text-primary transition-colors leading-[0.95]">{second.title}</h3>
                    <p className="mt-3 text-muted-foreground">{second.excerpt}</p>
                  </div>
                </Link>
              )}
              {third && (
                <Link to={`/articles/${third.id}`} className="md:col-span-5 group block md:mt-24">
                  <div className="relative aspect-[3/4] overflow-hidden bg-surface">
                    <img src={third.image} alt={third.title} className="w-full h-full object-cover img-kinetic" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                  </div>
                  <div className="mt-5">
                    <div className="text-primary text-[10px] uppercase tracking-[0.3em] font-bold mb-2">{third.category}</div>
                    <h3 className="font-condensed text-2xl md:text-4xl uppercase group-hover:text-primary transition-colors leading-[0.95]">{third.title}</h3>
                    <div className="mt-2 text-xs text-muted-foreground">{third.date} · {third.author}</div>
                  </div>
                </Link>
              )}
            </section>
          )}

          {/* REST — asymmetric mosaic */}
          {rest.length > 0 && (
            <section className="bg-surface/30 border-y border-border py-16 md:py-24">
              <div className="container-rtg">
                <div className="flex items-end justify-between border-b border-border pb-4 mb-10">
                  <h3 className="type-mega text-4xl md:text-6xl">More Stories</h3>
                  <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {rest.length} {rest.length === 1 ? "story" : "stories"}
                  </span>
                </div>
                <div className="grid md:grid-cols-12 gap-6 md:gap-8">
                  {rest.map((s, i) => (
                    <MosaicCard key={s.id} story={s} index={i} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </SiteLayout>
  );
};

const MosaicCard = ({ story, index }: { story: Story; index: number }) => {
  // Vary span + offset for asymmetric feel
  const variants = [
    "md:col-span-5 md:translate-y-0",
    "md:col-span-7 md:translate-y-12",
    "md:col-span-4 md:translate-y-0",
    "md:col-span-8 md:-translate-y-6",
    "md:col-span-6",
    "md:col-span-6 md:translate-y-8",
  ];
  const aspects = ["aspect-[4/3]", "aspect-video", "aspect-[3/4]", "aspect-[16/10]", "aspect-square", "aspect-[4/3]"];
  const span = variants[index % variants.length];
  const aspect = aspects[index % aspects.length];

  return (
    <Link to={`/articles/${story.id}`} className={`group block ${span}`}>
      <div className={`relative ${aspect} overflow-hidden bg-surface`}>
        <img src={story.image} alt={story.title} loading="lazy" className="w-full h-full object-cover img-kinetic" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="absolute top-3 left-3 sticker">{story.category}</span>
      </div>
      <div className="pt-4">
        <h4 className="font-condensed text-2xl md:text-3xl uppercase leading-[0.95] group-hover:text-primary transition-colors">
          {story.title}
        </h4>
        <div className="mt-2 text-xs text-muted-foreground tracking-wider">
          {story.author} · {story.date}
        </div>
      </div>
    </Link>
  );
};

export default Articles;
