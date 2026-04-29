import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper, ArrowUpRight } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import EmptyState from "@/components/site/EmptyState";
import Reveal from "@/components/site/Reveal";
import { CATEGORIES } from "@/data/stories";
import { supabase } from "@/integrations/supabase/client";

type PublicArticle = {
  id: string;
  title: string;
  slug: string | null;
  category: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  is_featured: boolean;
  is_trending: boolean;
  is_rtg_pick: boolean;
  published_at: string | null;
  tags: string[] | null;
};

const formatDate = (d: string | null) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};

const ArticleCardLg = ({ a }: { a: PublicArticle }) => (
  <Link to={`/articles/${a.slug || a.id}`} className="group block">
    <div className="relative aspect-[16/10] overflow-hidden border border-border bg-surface">
      {a.cover_image_url ? (
        <img src={a.cover_image_url} alt={a.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-background to-surface flex items-center justify-center">
          <span className="font-gothic text-5xl text-primary/40">RTG</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
      {a.category && (
        <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-1">
          {a.category}
        </span>
      )}
    </div>
    <div className="pt-4">
      <h3 className="font-display text-2xl md:text-3xl uppercase leading-tight group-hover:text-primary transition-colors">
        {a.title}
      </h3>
      {a.excerpt && <p className="mt-2 text-muted-foreground line-clamp-2">{a.excerpt}</p>}
      {a.published_at && <div className="mt-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{formatDate(a.published_at)}</div>}
    </div>
  </Link>
);

const ArticleCardSm = ({ a }: { a: PublicArticle }) => (
  <Link to={`/articles/${a.slug || a.id}`} className="group block">
    <div className="relative aspect-[4/3] overflow-hidden border border-border bg-surface">
      {a.cover_image_url ? (
        <img src={a.cover_image_url} alt={a.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-background to-surface flex items-center justify-center">
          <span className="font-gothic text-4xl text-primary/40">RTG</span>
        </div>
      )}
      {a.category && (
        <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1">
          {a.category}
        </span>
      )}
    </div>
    <div className="pt-3">
      <h4 className="font-display text-base md:text-lg uppercase leading-tight group-hover:text-primary transition-colors">
        {a.title}
      </h4>
      {a.published_at && <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{formatDate(a.published_at)}</div>}
    </div>
  </Link>
);

const Articles = () => {
  const [active, setActive] = useState("All");
  const [articles, setArticles] = useState<PublicArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("articles")
        .select("id,title,slug,category,excerpt,cover_image_url,is_featured,is_trending,is_rtg_pick,published_at,tags")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false });
      setArticles((data ?? []) as PublicArticle[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => (active === "All" ? articles : articles.filter((a) => a.category === active)),
    [active, articles]
  );

  const cover = useMemo(
    () => articles.find((a) => a.is_featured) ?? articles[0] ?? null,
    [articles]
  );
  const trending = useMemo(
    () => articles.filter((a) => a.is_trending && a.id !== cover?.id).slice(0, 3),
    [articles, cover]
  );
  const rest = useMemo(
    () => filtered.filter((a) => a.id !== cover?.id && !trending.find((t) => t.id === a.id)),
    [filtered, cover, trending]
  );

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

      {/* COVER STORY + TRENDING */}
      {cover && active === "All" && (
        <section className="border-b border-border bg-background">
          <div className="container-rtg py-12 md:py-16 grid lg:grid-cols-12 gap-8 md:gap-12">
            <div className="lg:col-span-8">
              <div className="eyebrow text-primary mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                The Cover Story
              </div>
              <Reveal>
                <ArticleCardLg a={cover} />
              </Reveal>
            </div>
            {trending.length > 0 && (
              <div className="lg:col-span-4">
                <div className="eyebrow mb-4">Trending</div>
                <ul className="divide-y divide-border border-y border-border">
                  {trending.map((a, i) => (
                    <li key={a.id}>
                      <Link to={`/articles/${a.slug || a.id}`} className="group flex items-start gap-4 py-4 hover:px-2 transition-all">
                        <span className="font-condensed text-2xl text-muted-foreground/50 leading-none w-6 shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex-1 min-w-0">
                          {a.category && (
                            <div className="text-[10px] uppercase tracking-[0.25em] text-primary mb-1">
                              {a.category}
                            </div>
                          )}
                          <h4 className="font-display text-base uppercase leading-tight group-hover:text-primary transition-colors">
                            {a.title}
                          </h4>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CATEGORY FILTERS */}
      <section className="sticky top-16 z-30 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="container-rtg py-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((c) => {
            const count = c === "All" ? articles.length : articles.filter((a) => a.category === c).length;
            return (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`shrink-0 px-4 py-2 text-[10px] uppercase tracking-[0.25em] font-bold border transition-colors flex items-center gap-2 ${
                  active === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                }`}
              >
                {c}
                {!loading && (
                  <span className={`text-[9px] ${active === c ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* GRID */}
      <section className="container-rtg py-12 md:py-20">
        {loading ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : !articles.length ? (
          <EmptyState
            eyebrow="The Magazine"
            title="No articles yet."
            description="Check back soon for culture, film, and music stories — straight from Chicago."
            icon={Newspaper}
            ribbon="RTG is building in real time"
          />
        ) : rest.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No stories in <span className="text-foreground uppercase tracking-widest">{active}</span> yet.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
              <div className="eyebrow">{active === "All" ? "All Stories" : active}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {rest.length} {rest.length === 1 ? "Story" : "Stories"}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {rest.map((a) => (
                <Reveal key={a.id}>
                  <ArticleCardSm a={a} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </section>
    </SiteLayout>
  );
};

export default Articles;
