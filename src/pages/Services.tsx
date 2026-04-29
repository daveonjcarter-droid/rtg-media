import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Camera } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import EmptyState from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import servicesStudio from "@/assets/services-studio.jpg";

type Pkg = { name?: string; price?: number; includes?: string };
type AddOn = { name?: string; price?: number };

type Service = {
  id: string;
  slug: string | null;
  name: string;
  short_description: string | null;
  long_description: string | null;
  pricing_model: string;
  base_price: number | null;
  sale_price: number | null;
  cover_image_url: string | null;
  is_featured: boolean;
  packages: Pkg[] | null;
  add_ons: AddOn[] | null;
};

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
        .select("id,slug,name,short_description,long_description,pricing_model,base_price,sale_price,cover_image_url,is_featured,packages,add_ons")
        .eq("is_available", true)
        .order("is_featured", { ascending: false })
        .order("sort_order");
      setServices((data as any) || []);
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
        ) : services.length === 0 ? (
          <EmptyState
            eyebrow="Production"
            title="Services coming soon."
            description="Our production menu will appear here as it's published."
            icon={Camera}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
            {services.map((s) => (
              <div key={s.id} className="bg-background p-8 md:p-10 hover:bg-surface transition-colors group flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-3xl uppercase leading-tight">{s.name}</h3>
                  <div className="text-right shrink-0">
                    <div className={`text-xs uppercase tracking-widest ${s.sale_price != null ? "text-primary" : "text-muted-foreground"}`}>
                      {priceLabel(s)}
                    </div>
                    {s.sale_price != null && s.base_price != null && (
                      <div className="text-[10px] text-muted-foreground line-through">${s.base_price}</div>
                    )}
                  </div>
                </div>
                {s.short_description && (
                  <p className="text-muted-foreground mt-3 leading-relaxed">{s.short_description}</p>
                )}
                {s.long_description && (
                  <p className="text-muted-foreground/80 mt-2 text-sm leading-relaxed">{s.long_description}</p>
                )}

                {Array.isArray(s.packages) && s.packages.length > 0 && (
                  <div className="mt-5 border-t border-border pt-4">
                    <div className="eyebrow text-muted-foreground mb-3">Packages</div>
                    <div className="space-y-2">
                      {s.packages.filter((p) => p?.name).map((p, i) => (
                        <div key={i} className="flex items-baseline justify-between gap-3 text-sm">
                          <div>
                            <div className="font-medium">{p.name}</div>
                            {p.includes && <div className="text-xs text-muted-foreground">{p.includes}</div>}
                          </div>
                          {p.price != null && <div className="text-primary text-xs uppercase tracking-widest shrink-0">${p.price}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(s.add_ons) && s.add_ons.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <div className="eyebrow text-muted-foreground mb-2">Add-ons</div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.add_ons.filter((a) => a?.name).map((a, i) => (
                        <span key={i} className="text-[11px] uppercase tracking-wider border border-border px-2 py-1 rounded-sm">
                          {a.name}{a.price != null ? ` · $${a.price}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  to={`/book?service=${s.id}`}
                  className="inline-flex items-center gap-2 mt-6 text-xs uppercase tracking-widest text-foreground group-hover:text-primary transition-colors mt-auto pt-6"
                >
                  Inquire <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
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
