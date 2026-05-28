import { useMemo } from "react";
import SiteLayout from "@/components/site/SiteLayout";
import PageSeo from "@/components/site/PageSeo";
import {
  ArtistPicksGrid,
  PublicCountdown,
  useCurrentPicks,
  dueAt,
  type Pick,
} from "@/components/site/ArtistPicks";
import { IssueRule } from "@/components/site/RtgMagazine";

const Picks = () => {
  const { picks, loading } = useCurrentPicks();

  const nextDrop = useMemo(() => {
    const all = [picks.mainstream, picks.independent].filter(Boolean) as Pick[];
    if (!all.length) return null;
    return all.reduce((soonest, p) =>
      dueAt(p.published_at) < dueAt(soonest.published_at) ? p : soonest
    );
  }, [picks]);

  return (
    <SiteLayout>
      <PageSeo title="RTG Picks — Editor Recommendations in Music, Film & Culture" description="The RTG editors' running list of recommended music, films, gear, and cultural moments worth your attention." path="/picks" />
      <div className="rtg-stage grain-heavy">
        {/* MASTHEAD */}
        <section className="border-b border-border">
          <div className="container-rtg pt-16 md:pt-24 pb-10 md:pb-14">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  RTG Picks · Artist of the Week
                </div>
                <h1 className="rtg-period font-condensed uppercase leading-[0.85] text-cream text-7xl md:text-[10rem]">
                  Picks
                </h1>
              </div>
              <div className="md:text-right">
                <p className="max-w-sm text-sm text-muted-foreground">
                  Every week, two names from RTG: one from the mainstream, one from the underground.
                </p>
                <div className="mt-4 text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                  <PublicCountdown pick={nextDrop} />
                </div>
              </div>
            </div>
            <div className="mt-10">
              <IssueRule>Issue 001 · Spring 2026</IssueRule>
            </div>
          </div>
        </section>

        {/* TWO-UP CARDS */}
        <section className="container-rtg py-14 md:py-20">
          <ArtistPicksGrid picks={picks} loading={loading} />
        </section>
      </div>
    </SiteLayout>
  );
};

export default Picks;
