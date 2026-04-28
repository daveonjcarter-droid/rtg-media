import { useState } from "react";
import { Newspaper } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import EmptyState from "@/components/site/EmptyState";
import { CATEGORIES } from "@/data/stories";

const Articles = () => {
  const [active, setActive] = useState("All");

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

      {/* EMPTY STATE — pre-launch */}
      <section className="container-rtg py-16 md:py-24">
        <EmptyState
          eyebrow="The Magazine"
          title="No articles yet."
          description="Check back soon for culture, film, and music stories — straight from Chicago."
          icon={Newspaper}
        />
      </section>
    </SiteLayout>
  );
};

export default Articles;
