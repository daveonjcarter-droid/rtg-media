import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CornerFrame, FlagTag } from "@/components/site/RtgMagazine";

/* ============================================================================
   RTG PICKS — Artist of the Week
   Two slots: MAINSTREAM + INDEPENDENT. Weekly cadence (drop every 7d).
   ========================================================================= */

export type PickCategory = "mainstream" | "independent";

export type Pick = {
  id: string;
  category: PickCategory;
  artist_name: string;
  description: string | null;
  image_url: string | null;
  link: string | null;
  published_at: string;
  is_current: boolean;
};

const PICK_TABLE = "picks" as any;
export const PICK_BUCKET = "artist-picks";
export const PICK_CADENCE_MS = 7 * 24 * 60 * 60 * 1000;

const CATEGORY_LABEL: Record<PickCategory, string> = {
  mainstream: "Mainstream",
  independent: "Independent",
};

/* ---------- hooks ---------- */

export function useCurrentPicks() {
  const [picks, setPicks] = useState<Record<PickCategory, Pick | null>>({
    mainstream: null,
    independent: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchPicks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from(PICK_TABLE)
      .select("*")
      .eq("is_current", true)
      .order("published_at", { ascending: false });
    const rows = (data ?? []) as unknown as Pick[];
    setPicks({
      mainstream: rows.find((r) => r.category === "mainstream") ?? null,
      independent: rows.find((r) => r.category === "independent") ?? null,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchPicks();
  }, []);

  return { picks, loading, refresh: fetchPicks };
}

/* ---------- countdown helpers ---------- */

export const dueAt = (publishedAt: string) =>
  new Date(publishedAt).getTime() + PICK_CADENCE_MS;

const useNow = (intervalMs = 60_000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
};

const formatRemaining = (ms: number) => {
  if (ms <= 0) return { d: 0, h: 0, m: 0, overdue: true };
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return { d, h, m, overdue: false };
};

/** Public, short countdown — "New picks drop in Xd Xh". */
export const PublicCountdown = ({ pick }: { pick: Pick | null }) => {
  const now = useNow();
  if (!pick) return null;
  const { d, h, overdue } = formatRemaining(dueAt(pick.published_at) - now);
  if (overdue) {
    return (
      <span className="text-primary">New picks dropping soon</span>
    );
  }
  return (
    <span>
      New picks drop in <span className="text-cream">{d}d {h}h</span>
    </span>
  );
};

/** Admin, precise countdown — "Next drop due in Xd Xh Xm." */
export const AdminCountdown = ({ pick }: { pick: Pick | null }) => {
  const now = useNow(30_000);
  if (!pick) {
    return (
      <span className="text-primary uppercase tracking-[0.25em] text-[10px]">
        No pick yet — upload the first one.
      </span>
    );
  }
  const { d, h, m, overdue } = formatRemaining(dueAt(pick.published_at) - now);
  if (overdue) {
    return (
      <span className="text-primary uppercase tracking-[0.25em] text-[10px]">
        Overdue — upload a new pick.
      </span>
    );
  }
  return (
    <span className="uppercase tracking-[0.25em] text-[10px] text-muted-foreground">
      Next drop due in{" "}
      <span className="text-cream">
        {d}d {h}h {m}m
      </span>
      .
    </span>
  );
};

/* ---------- formatting ---------- */

export const formatWeekOf = (iso?: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso)
      .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      .toUpperCase();
  } catch {
    return "";
  }
};

/* ---------- card ---------- */

export const ArtistPickCard = ({
  category,
  pick,
}: {
  category: PickCategory;
  pick: Pick | null;
}) => {
  return (
    <article className="relative border border-border bg-card group transition-all duration-500 hover:border-primary/60 hover:shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.55)]">
      {/* PHOTO — 4:5 portrait, editorial grade */}
      <div className="relative aspect-[4/5] overflow-hidden bg-ink rtg-photo-wrap">
        {pick?.image_url ? (
          <img
            src={pick.image_url}
            alt={pick.artist_name}
            loading="lazy"
            className="rtg-photo h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink via-background to-surface">
            <span className="font-gothic text-6xl text-primary/40">RTG</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent z-[2]" />
        <div className="absolute left-3 top-3 z-[3]">
          <FlagTag>{CATEGORY_LABEL[category]}</FlagTag>
        </div>
        <CornerFrame />
      </div>

      {/* COPY */}
      <div className="p-6 md:p-7">
        <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Artist of the Week · {CATEGORY_LABEL[category]}
        </div>
        <h3 className="font-condensed uppercase leading-[0.95] text-3xl md:text-4xl text-cream">
          {pick?.artist_name || "To be announced"}
        </h3>
        {pick?.description && (
          <p className="mt-4 font-editorial text-base leading-relaxed text-muted-foreground line-clamp-5">
            {pick.description}
          </p>
        )}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          <span>Week of {formatWeekOf(pick?.published_at) || "—"}</span>
          {pick?.link && (
            <a
              href={pick.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground/90 hover:text-primary transition-colors"
            >
              Listen <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

/* ---------- two-up grid (public) ---------- */

export const ArtistPicksGrid = ({
  picks,
  loading,
}: {
  picks: Record<PickCategory, Pick | null>;
  loading: boolean;
}) => {
  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading picks…</div>;
  }
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-10">
      <ArtistPickCard category="mainstream" pick={picks.mainstream} />
      <ArtistPickCard category="independent" pick={picks.independent} />
    </div>
  );
};

/* ---------- homepage block ---------- */

export const ArtistPicksHomeBlock = () => {
  const { picks, loading } = useCurrentPicks();
  const nextDrop = useMemo(() => {
    const all = [picks.mainstream, picks.independent].filter(Boolean) as Pick[];
    if (!all.length) return null;
    // soonest upcoming drop across the two slots
    return all.reduce((soonest, p) =>
      dueAt(p.published_at) < dueAt(soonest.published_at) ? p : soonest
    );
  }, [picks]);

  return (
    <section className="relative bg-background py-20 md:py-28">
      <div className="container-rtg">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
          <div>
            <div className="eyebrow text-primary mb-2 flex items-center gap-2">
              <Flame className="h-3 w-3" /> RTG PICKS · ARTIST OF THE WEEK
            </div>
            <h2 className="type-mega text-5xl md:text-7xl">
              Two Names.<br />
              <span className="text-hollow-primary">One Mainstream, One Indie.</span>
            </h2>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            <PublicCountdown pick={nextDrop} />
            <Link to="/picks" className="text-foreground/80 hover:text-primary transition-colors">
              All picks →
            </Link>
          </div>
        </div>
        <ArtistPicksGrid picks={picks} loading={loading} />
        <div className="mt-6 flex md:hidden items-center justify-between text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          <PublicCountdown pick={nextDrop} />
          <Link to="/picks" className="text-foreground/80 hover:text-primary">
            All picks →
          </Link>
        </div>
      </div>
    </section>
  );
};
