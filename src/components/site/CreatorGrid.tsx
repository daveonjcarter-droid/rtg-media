import { Users, ArrowUpRight } from "lucide-react";
import { useCreators } from "@/hooks/useRtgContent";
import EmptyState from "./EmptyState";

const CreatorGrid = ({ limit }: { limit?: number }) => {
  const { creators, loading } = useCreators(limit);

  if (loading) return null;

  if (!creators.length) {
    return (
      <EmptyState
        eyebrow="Creator Spotlight"
        title="People you should know — coming soon."
        description="Photographers, artists, directors, and the creatives shaping Chicago next."
        icon={Users}
        ribbon="Building in real time"
      />
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {creators.map((c, i) => {
        const Wrapper: any = c.link_url ? "a" : "div";
        const wrapperProps = c.link_url
          ? { href: c.link_url, target: "_blank", rel: "noreferrer", className: "group block" }
          : { className: "block" };
        return (
          <Wrapper key={c.id} {...wrapperProps}>
            <div className="relative aspect-[4/5] overflow-hidden border border-border bg-surface grain">
              {c.image_url ? (
                <img
                  src={c.image_url}
                  alt={c.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-ink via-background to-surface flex items-center justify-center">
                  <span className="font-gothic text-5xl text-primary/40">{c.name.slice(0, 1)}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/30 to-transparent" />
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="font-condensed text-cream/90 text-xs uppercase tracking-[0.3em]">
                  No. {String(i + 1).padStart(2, "0")}
                </span>
                {c.link_url && (
                  <ArrowUpRight className="h-4 w-4 text-cream/80 group-hover:text-primary transition-colors" />
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-display text-2xl md:text-3xl uppercase text-cream leading-tight group-hover:text-primary transition-colors">
                  {c.name}
                </h3>
                {c.role && (
                  <div className="text-[10px] uppercase tracking-[0.3em] text-primary mt-1.5">
                    {c.role}
                    {c.city && <span className="text-cream/60"> · {c.city}</span>}
                  </div>
                )}
              </div>
            </div>
            {c.description && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {c.description}
              </p>
            )}
          </Wrapper>
        );
      })}
    </div>
  );
};

export default CreatorGrid;
