import { Link } from "react-router-dom";
import { Play, BookOpen, FileText, Clock } from "lucide-react";
import type { BreakdownEpisode } from "@/hooks/useRtgContent";

type Props = {
  episode: BreakdownEpisode;
  size?: "lg" | "md";
};

const EpisodeCard = ({ episode, size = "md" }: Props) => {
  const aspect = size === "lg" ? "aspect-[16/9]" : "aspect-[16/10]";
  const num = episode.episode_number ? String(episode.episode_number).padStart(3, "0") : null;

  return (
    <article className="group flex flex-col">
      <div className={`relative overflow-hidden ${aspect} bg-surface border border-border`}>
        {episode.cover_image_url ? (
          <img
            src={episode.cover_image_url}
            alt={episode.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ink via-background to-surface flex items-center justify-center">
            <span className="font-gothic text-6xl text-primary/40">RTG</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-1">
            {episode.category}
          </span>
          {num && (
            <span className="font-condensed text-cream/90 text-sm uppercase tracking-widest">
              EP {num}
            </span>
          )}
        </div>

        {/* Play button */}
        {episode.watch_url && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
              <Play className="h-7 w-7 text-primary-foreground fill-current ml-1" />
            </span>
          </div>
        )}

        {/* Duration */}
        {episode.duration && (
          <div className="absolute bottom-3 right-3 bg-ink/85 text-cream text-[10px] uppercase tracking-widest px-2 py-1 flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {episode.duration}
          </div>
        )}
      </div>

      <div className="pt-4 flex-1 flex flex-col">
        <h3
          className={`${
            size === "lg" ? "text-2xl md:text-3xl" : "text-lg md:text-xl"
          } font-display uppercase leading-tight group-hover:text-primary transition-colors`}
        >
          {episode.title}
        </h3>
        {episode.summary && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{episode.summary}</p>
        )}

        {/* Three CTAs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {episode.watch_url && (
            <a
              href={episode.watch_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary/60 text-primary text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Play className="h-3 w-3 fill-current" /> Watch
            </a>
          )}
          {episode.read_url && (
            <Link
              to={episode.read_url.startsWith("http") ? "#" : episode.read_url}
              {...(episode.read_url.startsWith("http")
                ? { onClick: (e: any) => { e.preventDefault(); window.open(episode.read_url!, "_blank"); } }
                : {})}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-foreground text-[10px] uppercase tracking-[0.25em] font-bold hover:border-foreground transition-colors"
            >
              <BookOpen className="h-3 w-3" /> Read
            </Link>
          )}
          {episode.breakdown_body && (
            <Link
              to={`/breakdown/${episode.slug || episode.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-foreground text-[10px] uppercase tracking-[0.25em] font-bold hover:border-foreground transition-colors"
            >
              <FileText className="h-3 w-3" /> Breakdown
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

export default EpisodeCard;
