import { Link } from "react-router-dom";
import { Eye, Headphones, Flame, ArrowUpRight } from "lucide-react";
import { useRtgPicks } from "@/hooks/useRtgContent";
import EmptyState from "./EmptyState";

const KIND_META: Record<string, { label: string; icon: any }> = {
  watching: { label: "What we're watching", icon: Eye },
  listening: { label: "What we're listening to", icon: Headphones },
  matters: { label: "What matters now", icon: Flame },
};

const ORDER = ["watching", "listening", "matters"];

const PicksStrip = () => {
  const { picks, loading } = useRtgPicks();

  if (loading) return null;

  if (!picks.length) {
    return (
      <EmptyState
        eyebrow="RTG Picks"
        title="The picks board is loading."
        description="What we're watching, listening to, and what matters — curated by RTG."
        icon={Flame}
        ribbon="Curating in real time"
      />
    );
  }

  const grouped = ORDER.map((kind) => ({
    kind,
    items: picks.filter((p) => p.kind === kind),
  })).filter((g) => g.items.length);

  return (
    <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
      {grouped.map(({ kind, items }) => {
        const meta = KIND_META[kind] ?? { label: kind, icon: Flame };
        const Icon = meta.icon;
        return (
          <div key={kind} className="bg-background p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border">
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">
                {meta.label}
              </span>
            </div>
            <ul className="space-y-5">
              {items.map((p, i) => {
                const Wrapper: any = p.link_url ? "a" : "div";
                const wrapperProps = p.link_url
                  ? { href: p.link_url, target: "_blank", rel: "noreferrer", className: "group block" }
                  : { className: "block" };
                return (
                  <li key={p.id}>
                    <Wrapper {...wrapperProps}>
                      <div className="flex items-start gap-3">
                        <span className="font-condensed text-2xl text-muted-foreground/50 leading-none w-6 shrink-0 mt-0.5">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-display text-base md:text-lg uppercase leading-tight group-hover:text-primary transition-colors">
                              {p.title}
                            </h4>
                            {p.link_url && (
                              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                            )}
                          </div>
                          {p.creator && (
                            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                              {p.creator}
                            </div>
                          )}
                          {p.note && (
                            <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{p.note}</p>
                          )}
                        </div>
                      </div>
                    </Wrapper>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default PicksStrip;
