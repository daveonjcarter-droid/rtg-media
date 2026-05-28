import { useEffect, useMemo, useState } from "react";
import { Camera, Video } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import PageSeo from "@/components/site/PageSeo";
import EmptyState from "@/components/site/EmptyState";
import { supabase } from "@/integrations/supabase/client";

type Work = {
  id: string;
  title: string;
  category: string;
  client: string | null;
  year: number | null;
  thumbnail_url: string | null;
  media_url: string | null;
  media_type: string;
  is_featured: boolean;
};

const FILTERS = ["All", "Photography", "Music Videos", "Events", "Short Films", "Commercial", "Studio"];

const Portfolio = () => {
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("portfolio_items" as any)
        .select("id,title,category,client,year,thumbnail_url,media_url,media_type,is_featured")
        .eq("is_public", true)
        .order("is_featured", { ascending: false })
        .order("sort_order")
        .order("year", { ascending: false });
      setItems((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const visible = useMemo(
    () => (filter === "All" ? items : items.filter((i) => i.category === filter)),
    [filter, items]
  );

  return (
    <SiteLayout>
      <PageSeo title="Portfolio — Selected Production Work | RTG Media" description="Selected photo, video, music video, and brand production work from the RTG Media studio in Chicago." path="/portfolio" />
      <section className="container-rtg pt-16 md:pt-20 pb-10 border-b border-border">
        <div className="eyebrow mb-3">Selected Work</div>
        <h1 className="font-display text-5xl md:text-7xl uppercase leading-none">Portfolio</h1>
      </section>

      <section className="container-rtg py-8">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs uppercase tracking-widest border rounded-sm transition ${
                filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      <section className="container-rtg pb-20">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : visible.length === 0 ? (
          <EmptyState
            eyebrow="The Reel"
            title="No projects in this category yet."
            description="RTG production work — photography, music videos, short films, and commercial sets — will appear here."
            icon={Camera}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-border border border-border">
            {visible.map((w) => (
              <a key={w.id} href={w.media_url ?? "#"} target="_blank" rel="noreferrer" className="group bg-background block">
                <div className="aspect-[4/5] bg-surface overflow-hidden">
                  {w.thumbnail_url ? (
                    <img src={w.thumbnail_url} alt={w.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      {w.media_type === "video" ? <Video className="h-8 w-8 text-muted-foreground/40" /> : <Camera className="h-8 w-8 text-muted-foreground/40" />}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="font-display text-base uppercase leading-tight truncate">{w.title}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                    {w.category}{w.client && ` · ${w.client}`}{w.year && ` · ${w.year}`}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
};

export default Portfolio;
