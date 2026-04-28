import { useState } from "react";
import { Play } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import portfolio1 from "@/assets/portfolio-1.jpg";
import portfolio2 from "@/assets/portfolio-2.jpg";
import portfolio3 from "@/assets/portfolio-3.jpg";
import portfolio4 from "@/assets/portfolio-4.jpg";
import storyMusic from "@/assets/story-music.jpg";
import storyFilm from "@/assets/story-film.jpg";
import storyFashion from "@/assets/story-fashion.jpg";
import heroImg from "@/assets/hero-videographer.jpg";

const FILTERS = ["All", "Photography", "Music Videos", "Events", "Short Films", "Commercial"];
type Item = { id: number; title: string; cat: string; image: string; video?: boolean };

const ITEMS: Item[] = [
  { id: 1, title: "Studio Sessions Vol. 4", cat: "Music Videos", image: portfolio1, video: true },
  { id: 2, title: "Midnight Chicago", cat: "Photography", image: portfolio2 },
  { id: 3, title: "Night Drive", cat: "Music Videos", image: portfolio3, video: true },
  { id: 4, title: "Hometown Show", cat: "Events", image: portfolio4 },
  { id: 5, title: "Stage Presence", cat: "Photography", image: storyMusic },
  { id: 6, title: "Set Life", cat: "Short Films", image: storyFilm, video: true },
  { id: 7, title: "South Side Style", cat: "Photography", image: storyFashion },
  { id: 8, title: "Documenting Culture", cat: "Commercial", image: heroImg, video: true },
];

const Portfolio = () => {
  const [filter, setFilter] = useState("All");
  const items = filter === "All" ? ITEMS : ITEMS.filter((i) => i.cat === filter);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((it, i) => (
            <div key={it.id} className={`relative group overflow-hidden bg-surface ${i % 5 === 0 ? "lg:col-span-2 aspect-[16/10]" : "aspect-square"}`}>
              <img src={it.image} alt={it.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent opacity-80" />
              {it.video && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full bg-cream/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-6 w-6 text-ink fill-current ml-0.5" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">{it.cat}</div>
                <div className="font-display text-xl uppercase mt-1 leading-tight">{it.title}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
};

export default Portfolio;
