import { useState } from "react";
import { Film } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import EmptyState from "@/components/site/EmptyState";
import breakdownBg from "@/assets/breakdown-bg.jpg";

const TABS = ["All", "Movies", "TV", "Anime", "Comics"];

const Breakdown = () => {
  const [tab, setTab] = useState("All");

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden grain-heavy border-b border-border bg-ink">
        <img src={breakdownBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 ken-burns" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/70 to-ink" />
        <div className="container-rtg relative pt-24 md:pt-32 pb-20 md:pb-28">
          <div className="eyebrow text-primary mb-4">A Cultural Engine · Coming Soon</div>
          <h1 className="type-mega text-7xl md:text-[14rem] leading-[0.82] text-cream">
            RTG
            <br />
            <span className="text-hollow-primary">Breakdown</span>
          </h1>
          <p className="mt-8 max-w-xl text-cream/85 text-lg">
            Movies. TV. Comics. Anime. The biggest stories in pop culture — broken down frame by frame.
          </p>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="sticky top-16 z-30 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="container-rtg py-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] font-bold border transition ${
                tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* EMPTY STATE */}
      <section className="container-rtg py-16 md:py-24">
        <EmptyState
          eyebrow="The Vault"
          title="Breakdowns coming soon."
          description="We're preparing deep dives into film, TV, anime, and culture. First episodes drop with Issue 001."
          icon={Film}
          tone="dark"
        />
      </section>
    </SiteLayout>
  );
};

export default Breakdown;
