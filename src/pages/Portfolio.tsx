import { useState } from "react";
import { Camera } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import EmptyState from "@/components/site/EmptyState";

const FILTERS = ["All", "Photography", "Music Videos", "Events", "Short Films", "Commercial"];

const Portfolio = () => {
  const [filter, setFilter] = useState("All");

  return (
    <SiteLayout>
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
        <EmptyState
          eyebrow="The Reel"
          title="No projects uploaded yet."
          description="RTG production work — photography, music videos, short films, and commercial sets — will appear here."
          icon={Camera}
        />
      </section>
    </SiteLayout>
  );
};

export default Portfolio;
