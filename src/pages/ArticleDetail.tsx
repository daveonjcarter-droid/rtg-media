import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Newspaper, ArrowLeft, ArrowUpRight } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import EmptyState from "@/components/site/EmptyState";
import { supabase } from "@/integrations/supabase/client";

type Article = {
  id: string;
  title: string;
  slug: string | null;
  category: string | null;
  excerpt: string | null;
  body: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
};

const formatDate = (d: string | null) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      let { data } = await supabase
        .from("articles")
        .select("id,title,slug,category,excerpt,body,cover_image_url,published_at,tags,seo_title,seo_description")
        .eq("slug", id)
        .eq("status", "published")
        .maybeSingle();
      if (!data) {
        const res = await supabase
          .from("articles")
          .select("id,title,slug,category,excerpt,body,cover_image_url,published_at,tags,seo_title,seo_description")
          .eq("id", id)
          .eq("status", "published")
          .maybeSingle();
        data = res.data;
      }
      setArticle(data as Article | null);

      if (data?.category) {
        const { data: rel } = await supabase
          .from("articles")
          .select("id,title,slug,category,excerpt,body,cover_image_url,published_at,tags,seo_title,seo_description")
          .eq("status", "published")
          .eq("category", data.category)
          .neq("id", data.id)
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(3);
        setRelated((rel ?? []) as Article[]);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SiteLayout>
        <section className="container-rtg py-20 text-sm text-muted-foreground">Loading…</section>
      </SiteLayout>
    );
  }

  if (!article) {
    return (
      <SiteLayout>
        <section className="container-rtg py-20 md:py-28">
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary mb-10"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Articles
          </Link>
          <EmptyState
            eyebrow="The Magazine"
            title="This story isn't live yet."
            description="RTG Media is preparing its first releases. The article you're looking for hasn't been published."
            icon={Newspaper}
          />
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      {/* MASTHEAD */}
      <section className="border-b border-border bg-background">
        <div className="container-rtg pt-16 md:pt-24 pb-10">
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary mb-8"
          >
            <ArrowLeft className="h-3 w-3" /> All Stories
          </Link>
          <div className="max-w-3xl">
            {article.category && (
              <span className="inline-block bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.25em] px-2 py-1 mb-5">
                {article.category}
              </span>
            )}
            <h1 className="type-mega text-4xl md:text-6xl lg:text-7xl leading-[0.92]">{article.title}</h1>
            {article.excerpt && (
              <p className="mt-6 text-lg md:text-xl text-muted-foreground font-editorial leading-relaxed">
                {article.excerpt}
              </p>
            )}
            <div className="mt-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex flex-wrap items-center gap-3">
              {article.published_at && <span>{formatDate(article.published_at)}</span>}
              {article.tags && article.tags.length > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span className="flex flex-wrap gap-2">
                    {article.tags.slice(0, 4).map((t) => (
                      <span key={t} className="border border-border px-2 py-0.5">{t}</span>
                    ))}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {article.cover_image_url && (
          <div className="container-rtg pb-12 md:pb-16">
            <div className="aspect-[16/9] overflow-hidden border border-border">
              <img src={article.cover_image_url} alt={article.title} className="w-full h-full object-cover" />
            </div>
          </div>
        )}
      </section>

      {/* BODY */}
      {article.body && (
        <section className="container-rtg py-14 md:py-20">
          <article className="max-w-2xl mx-auto">
            <div className="font-editorial text-lg md:text-xl leading-[1.7] text-foreground/90 whitespace-pre-line">
              {article.body}
            </div>
          </article>
        </section>
      )}

      {/* MORE LIKE THIS */}
      {related.length > 0 && (
        <section className="border-t border-border bg-surface/40 py-14 md:py-20">
          <div className="container-rtg">
            <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
              <div>
                <div className="eyebrow text-primary mb-2">More Like This</div>
                <h2 className="font-display text-2xl md:text-3xl uppercase">More from {article.category}</h2>
              </div>
              <Link to="/articles" className="hidden sm:inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-primary">
                All Stories <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((r) => (
                <Link key={r.id} to={`/articles/${r.slug || r.id}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden border border-border bg-surface">
                    {r.cover_image_url ? (
                      <img src={r.cover_image_url} alt={r.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-ink via-background to-surface flex items-center justify-center">
                        <span className="font-gothic text-4xl text-primary/40">RTG</span>
                      </div>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-lg uppercase group-hover:text-primary transition-colors">{r.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
};

export default ArticleDetail;
