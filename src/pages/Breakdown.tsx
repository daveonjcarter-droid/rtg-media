import { useState } from "react";
import { Play, BookOpen, FileText } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import { STORIES } from "@/data/stories";
import breakdownBg from "@/assets/breakdown-bg.jpg";

const TABS = ["All", "Movies", "TV", "Anime", "Comics"];

const Breakdown = () => {
  const [tab, setTab] = useState("All");
  const items = STORIES;

  return (
    <SiteLayout>
      <section className="relative overflow-hidden grain border-b border-border">
        <img src={breakdownBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 to-ink" />
        <div className="container-rtg relative pt-20 md:pt-28 pb-16">
          <div className="eyebrow text-primary mb-4">A Cultural Engine</div>
          <h1 className="font-display text-6xl md:text-8xl uppercase leading-[0.9]">RTG<br />Breakdown</h1>
          <p className="mt-6 max-w-xl text-cream/80 text-lg">Movies. TV. Comics. Anime. The biggest stories in pop culture — broken down frame by frame.</p>
        </div>
      </section>

      <section className="container-rtg py-10">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-xs uppercase tracking-widest border rounded-sm transition ${
                tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="container-rtg pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((s, i) => (
            <div key={s.id} className="group">
              <div className="relative aspect-video overflow-hidden bg-surface">
                <img src={s.image} alt={s.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                <div className="absolute top-3 left-3 bg-ink/80 backdrop-blur px-2 py-1 text-[10px] uppercase tracking-widest text-cream font-semibold">
                  Episode {String(i + 1).padStart(2, "0")}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-7 w-7 text-primary-foreground fill-current ml-1" />
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">{s.category}</div>
                <h3 className="font-display text-xl uppercase mt-2 leading-tight group-hover:text-primary transition-colors">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.excerpt}</p>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] uppercase tracking-widest border border-border hover:bg-primary hover:border-primary hover:text-primary-foreground transition rounded-sm">
                    <Play className="h-3 w-3" /> Watch
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] uppercase tracking-widest border border-border hover:bg-foreground hover:text-background transition rounded-sm">
                    <BookOpen className="h-3 w-3" /> Read
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] uppercase tracking-widest border border-border hover:bg-foreground hover:text-background transition rounded-sm">
                    <FileText className="h-3 w-3" /> Notes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
};

export default Breakdown;
