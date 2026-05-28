import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Camera,
  Video,
  Music,
  Film,
  Scissors,
  Mic,
  Headphones,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import servicesStudio from "@/assets/services-studio.jpg";

type Service = {
  id: string;
  slug: string | null;
  name: string;
  icon: string | null;
  short_description: string | null;
  base_price: number | null;
  sale_price: number | null;
  pricing_model: string;
  is_featured: boolean;
};

const ICONS: Record<string, LucideIcon> = {
  Camera, Video, Music, Film, Scissors, Mic, Headphones, Sparkles,
};

// Fallback list if DB is empty (matches seed)
const FALLBACK: Service[] = [
  { id: "photography", slug: "photography", name: "Photography", icon: "Camera", short_description: "Editorial, portrait, and brand photography.", base_price: 350, sale_price: null, pricing_model: "starting_at", is_featured: true },
  { id: "videography", slug: "videography", name: "Videography", icon: "Video", short_description: "Cinematic video production for brands and artists.", base_price: 750, sale_price: null, pricing_model: "starting_at", is_featured: true },
  { id: "music-videos", slug: "music-videos", name: "Music Videos", icon: "Music", short_description: "Story-first music videos with a director's eye.", base_price: 1500, sale_price: null, pricing_model: "starting_at", is_featured: false },
  { id: "film-production", slug: "film-production", name: "Film Production", icon: "Film", short_description: "Short films, docs, and branded narratives.", base_price: 2500, sale_price: null, pricing_model: "starting_at", is_featured: false },
  { id: "editing", slug: "editing", name: "Editing", icon: "Scissors", short_description: "Color, sound, and edit services for outside footage.", base_price: 95, sale_price: null, pricing_model: "hourly", is_featured: false },
  { id: "live-events", slug: "live-events", name: "Live Events", icon: "Mic", short_description: "Multi-cam live coverage for concerts and activations.", base_price: 1200, sale_price: null, pricing_model: "starting_at", is_featured: false },
  { id: "podcast-audio", slug: "podcast-audio", name: "Podcast / Audio", icon: "Headphones", short_description: "Studio-quality podcast and audio production.", base_price: 250, sale_price: null, pricing_model: "starting_at", is_featured: false },
  { id: "brand-content", slug: "brand-content", name: "Brand Content", icon: "Sparkles", short_description: "Always-on social and brand content packages.", base_price: 2000, sale_price: null, pricing_model: "starting_at", is_featured: false },
];

const priceLabel = (s: Service) => {
  if (s.sale_price != null) return `Now $${s.sale_price}`;
  if (s.base_price == null) return "Custom quote";
  if (s.pricing_model === "hourly") return `$${s.base_price}/hr`;
  if (s.pricing_model === "half_day") return `$${s.base_price} / half day`;
  if (s.pricing_model === "full_day") return `$${s.base_price} / full day`;
  return `Starting at $${s.base_price}`;
};

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("services" as any)
        .select("id,slug,name,icon,short_description,base_price,sale_price,pricing_model,is_featured")
        .eq("is_available", true)
        .order("is_featured", { ascending: false })
        .order("sort_order");
      const list = (data as any as Service[]) || [];
      setServices(list.length > 0 ? list : FALLBACK);
      setLoading(false);
    })();
  }, []);

  return (
    <SiteLayout>
      <section className="relative h-[55vh] overflow-hidden grain">
        <img src={servicesStudio} alt="RTG Media production studio" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="container-rtg relative h-full flex items-end pb-12 bg-muted">
          <div>
            <div className="eyebrow text-cream/80 mb-3">Production Services</div>
            <h1 className="font-display text-6xl md:text-8xl uppercase leading-none">
              Crafted For<br />The Culture.
            </h1>
          </div>
        </div>
      </section>

      <section className="container-rtg py-20">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading services…</div>
        ) : (
          <div className="border-t border-border">
            {services.map((s, i) => {
              const Icon = ICONS[s.icon || ""] || Camera;
              const num = String(i + 1).padStart(2, "0");
              return (
                <Link
                  key={s.id}
                  to={`/book?service=${s.id}`}
                  className="group flex items-center gap-4 md:gap-8 border-b border-border py-6 md:py-8 px-2 md:px-4 hover:bg-surface transition-colors min-h-[88px]"
                >
                  <div className="text-xs md:text-sm font-mono text-muted-foreground tabular-nums shrink-0 w-8 md:w-12">
                    {num}
                  </div>
                  <Icon className="h-6 w-6 md:h-8 md:w-8 shrink-0 text-foreground group-hover:text-primary transition-colors" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-2xl md:text-4xl uppercase leading-tight truncate">
                      {s.name}
                    </h3>
                    {s.short_description && (
                      <p className="hidden md:block text-sm text-muted-foreground mt-1 truncate">
                        {s.short_description}
                      </p>
                    )}
                  </div>
                  <div className="hidden md:block text-xs uppercase tracking-widest text-muted-foreground shrink-0">
                    {priceLabel(s)}
                  </div>
                  <ArrowRight className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-16 text-center">
          <h2 className="font-display text-4xl md:text-5xl uppercase">Let's build something cinematic.</h2>
          <Button asChild size="lg" className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm uppercase tracking-widest text-xs h-12 px-8">
            <Link to="/book">Start a Project</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Services;
