import { MapPin, Calendar, ArrowUpRight, Radio } from "lucide-react";
import { useChicagoFeed } from "@/hooks/useRtgContent";
import EmptyState from "./EmptyState";

const KIND_DOT: Record<string, string> = {
  event: "bg-primary",
  moment: "bg-gold",
  activity: "bg-cream",
};

const formatDate = (d: string | null) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
};

const ChicagoFeed = ({ limit = 6 }: { limit?: number }) => {
  const { items, loading } = useChicagoFeed(limit);

  if (loading) return null;

  if (!items.length) {
    return (
      <EmptyState
        eyebrow="Chicago Feed"
        title="The feed is warming up."
        description="Local events, culture moments, and artist activity from the city."
        icon={Radio}
        ribbon="Live from Chicago"
      />
    );
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {items.map((item) => {
        const Wrapper: any = item.link_url ? "a" : "div";
        const wrapperProps = item.link_url
          ? { href: item.link_url, target: "_blank", rel: "noreferrer", className: "group block" }
          : { className: "block" };
        const date = formatDate(item.event_date);
        return (
          <li key={item.id}>
            <Wrapper {...wrapperProps}>
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-6 py-5 md:py-6 hover:px-3 transition-all">
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground w-20 md:w-28">
                  <span className={`h-1.5 w-1.5 rounded-full ${KIND_DOT[item.kind] ?? "bg-muted-foreground"}`} />
                  <span className="hidden md:inline">{item.kind}</span>
                </span>
                <div className="min-w-0">
                  <h4 className="font-display text-base md:text-xl uppercase leading-tight group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </h4>
                  {item.detail && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-1">
                      {item.detail}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 md:gap-5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  {date && (
                    <span className="hidden sm:inline-flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {date}
                    </span>
                  )}
                  {item.location && (
                    <span className="hidden md:inline-flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </span>
                  )}
                  {item.link_url && (
                    <ArrowUpRight className="h-4 w-4 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  )}
                </div>
              </div>
            </Wrapper>
          </li>
        );
      })}
    </ul>
  );
};

export default ChicagoFeed;
