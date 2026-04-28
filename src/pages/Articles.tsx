import { useState } from "react";
import SiteLayout from "@/components/site/SiteLayout";
import ArticleCard from "@/components/site/ArticleCard";
import { CATEGORIES, STORIES } from "@/data/stories";

const Articles = () => {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? STORIES : STORIES.filter((s) => s.category === active);

  return (
    <SiteLayout>
      <section className="container-rtg pt-16 md:pt-20 pb-10 border-b border-border">
        <div className="eyebrow mb-3">The Magazine</div>
        <h1 className="font-display text-5xl md:text-7xl uppercase leading-none">Articles</h1>
        <p className="mt-5 max-w-xl text-muted-foreground">Culture, film, music, fashion, sports and the stories that shape Chicago and beyond.</p>
      </section>

      <section className="container-rtg pt-8">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`px-4 py-2 text-xs uppercase tracking-widest border rounded-sm transition-colors ${
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

      <section className="container-rtg py-12">
        {filtered.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">No stories yet in this category.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((s) => <ArticleCard key={s.id} story={s} />)}
          </div>
        )}
      </section>
    </SiteLayout>
  );
};

export default Articles;
