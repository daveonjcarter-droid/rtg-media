import { useState } from "react";
import { Play, Clock, Eye } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import { STORIES } from "@/data/stories";
import breakdownBg from "@/assets/breakdown-bg.jpg";

const TABS = ["All", "Movies", "TV", "Anime", "Comics"];

const Breakdown = () => {
  const [tab, setTab] = useState("All");
  const items = STORIES;
  const featured = items[0];
  const rest = items.slice(1);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden grain-heavy border-b border-border bg-ink">
        <img src={breakdownBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 ken-burns" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/70 to-ink" />
        <div className="container-rtg relative pt-24 md:pt-32 pb-20 md:pb-28">
          <div className="eyebrow text-primary mb-4">A Cultural Engine · Now Streaming</div>
          <h1 className="type-mega text-7xl md:text-[14rem] leading-[0.82] text-cream">
            RTG
            <br />
            <span className="text-hollow-primary">Breakdown</span>
          </h1>
          <p className="mt-8 max-w-xl text-cream/85 text-lg">
            Movies. TV. Comics. Anime. The biggest stories in pop culture — broken down frame by frame.
          </p>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="sticky top-16 z-30 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="container-rtg py-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] font-bold border transition ${
                tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED EPISODE */}
      <section className="container-rtg pt-12 md:pt-16">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 group relative aspect-video overflow-hidden bg-surface cursor-pointer">
            <img src={featured.image} alt={featured.title} className="w-full h-full object-cover img-kinetic" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
            <div className="absolute top-4 left-4 sticker">EP 12 · Featured</div>
            <div className="absolute top-4 right-4 flex items-center gap-3 text-cream/90 text-[10px] uppercase tracking-widest">
              <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> 142K</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> 42 min</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_80px_hsl(355_78%_56%/0.55)]">
                <Play className="h-10 w-10 text-primary-foreground fill-current ml-1.5" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="text-primary text-[10px] uppercase tracking-[0.3em] font-bold mb-3">Episode 12 · {featured.category}</div>
            <h2 className="type-mega text-4xl md:text-6xl">{featured.title}</h2>
            <p className="mt-4 text-muted-foreground">{featured.excerpt}</p>
            <div className="mt-6 flex gap-3">
              <button className="px-6 py-3 bg-primary text-primary-foreground text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-primary/90 transition">
                <Play className="inline h-3 w-3 mr-2 fill-current" /> Watch Now
              </button>
              <button className="px-6 py-3 border border-border text-[10px] uppercase tracking-[0.3em] font-bold hover:border-foreground transition">
                Read Notes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* EPISODE WALL — YouTube-thumbnail energy */}
      <section className="container-rtg py-16 md:py-24">
        <div className="flex items-end justify-between border-b border-border pb-4 mb-10">
          <div>
            <div className="eyebrow text-primary mb-2">All Episodes</div>
            <h2 className="type-mega text-4xl md:text-6xl">The Vault</h2>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {rest.length} episodes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {rest.map((s, i) => {
            const epNum = String(i + 1).padStart(2, "0");
            const views = Math.floor(20 + Math.random() * 200);
            const minutes = 18 + (i % 5) * 6;
            return (
              <div key={s.id} className="group cursor-pointer">
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-surface">
                  <img src={s.image} alt={s.title} loading="lazy" className="w-full h-full object-cover img-kinetic" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />

                  {/* Episode number badge */}
                  <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] font-bold">
                    EP {epNum}
                  </div>
                  {/* Duration */}
                  <div className="absolute bottom-3 right-3 bg-ink/90 backdrop-blur px-2 py-1 text-[10px] font-bold text-cream tabular-nums">
                    {minutes}:00
                  </div>

                  {/* Hover play */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_hsl(355_78%_56%/0.6)]">
                      <Play className="h-7 w-7 text-primary-foreground fill-current ml-1" />
                    </div>
                  </div>

                  {/* Big bottom title overlay */}
                  <div className="absolute bottom-0 left-0 right-12 p-4 pt-10 bg-gradient-to-t from-ink via-ink/60 to-transparent">
                    <div className="font-condensed text-xl md:text-2xl uppercase leading-[0.95] text-cream line-clamp-2">
                      {s.title}
                    </div>
                  </div>
                </div>

                {/* Meta row */}
                <div className="pt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  <span className="text-primary font-bold">{s.category}</span>
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {views}K</span>
                    <span>{s.date}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </SiteLayout>
  );
};

export default Breakdown;
