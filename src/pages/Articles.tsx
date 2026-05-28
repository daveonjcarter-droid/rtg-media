import { useEffect, useMemo, useState } from "react";
import { Newspaper } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import EmptyState from "@/components/site/EmptyState";
import Reveal from "@/components/site/Reveal";
import { supabase } from "@/integrations/supabase/client";
import {
  AsteriskTicker,
  IssueRule,
  MagCard,
  type MagArticle,
} from "@/components/site/RtgMagazine";

const FILTER_CATEGORIES = [
  "All",
  "Music",
  "Film",
  "Fashion",
  "Chicago Culture",
  "RTG Breakdown",
  "Opinion",
];

const Articles = () => {
  const [active, setActive] = useState("All");
  const [articles, setArticles] = useState<MagArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("articles")
        .select(
          "id,title,slug,category,excerpt,cover_image_url,published_at,tags,writer_name,article_type"
        )
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false });
      setArticles((data ?? []) as MagArticle[]);
      setLoading(false);
    })();
  }, []);

  const counts = useMemo(() => {
    const m: Record<string, number> = { All: articles.length };
    for (const a of articles) {
      const c = a.category || "";
      m[c] = (m[c] ?? 0) + 1;
    }
    return m;
  }, [articles]);

  const filtered = useMemo(
    () => (active === "All" ? articles : articles.filter((a) => a.category === active)),
    [active, articles]
  );

  return (
    <SiteLayout>
      <div className="rtg-stage grain-heavy">
        {/* MASTHEAD */}
        <section className="border-b border-border">
          <div className="container-rtg pt-16 md:pt-24 pb-10 md:pb-14">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  The Magazine · Issue 001
                </div>
                <h1 className="rtg-period font-condensed uppercase leading-[0.85] text-cream text-7xl md:text-[10rem]">
                  Articles
                </h1>
              </div>
              <p className="max-w-sm text-sm text-muted-foreground md:text-right">
                Culture, film, music, fashion, sports, and the Chicago stories shaping what comes next.
              </p>
            </div>
            <div className="mt-10">
              <IssueRule>Issue 001 · Spring 2026</IssueRule>
            </div>
          </div>
        </section>

        {/* TICKER */}
        <AsteriskTicker />

        {/* CATEGORY FILTERS */}
        <section className="sticky top-16 z-30 border-b border-border bg-ink/85 backdrop-blur-xl">
          <div className="container-rtg flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {FILTER_CATEGORIES.map((c) => {
              const count = counts[c] ?? 0;
              const isActive = active === c;
              return (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`shrink-0 border px-4 py-2 text-[10px] uppercase tracking-[0.28em] font-bold transition-colors flex items-center gap-2 ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-cream hover:border-cream/60"
                  }`}
                >
                  {c}
                  {!loading && (
                    <span className={isActive ? "text-primary-foreground/70" : "text-muted-foreground/60"}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* GRID */}
        <section className="container-rtg py-14 md:py-20">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : !articles.length ? (
            <EmptyState
              eyebrow="The Magazine"
              title="No articles yet."
              description="Check back soon for culture, film, and music stories — straight from Chicago."
              icon={Newspaper}
              tone="dark"
              ribbon="RTG is building in real time"
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              eyebrow={active}
              title="No stories in this section yet."
              description="More drops are landing soon. Browse another category in the meantime."
              icon={Newspaper}
              tone="dark"
              ribbon="RTG is building in real time"
            />
          ) : (
            <>
              <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
                <div className="text-[10px] uppercase tracking-[0.32em] text-primary">
                  {active === "All" ? "All Stories" : active}
                </div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  {filtered.length} {filtered.length === 1 ? "Story" : "Stories"}
                </div>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 md:gap-10">
                {filtered.map((a, i) => (
                  <Reveal key={a.id}>
                    <MagCard a={a} index={i} />
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </SiteLayout>
  );
};

export default Articles;
