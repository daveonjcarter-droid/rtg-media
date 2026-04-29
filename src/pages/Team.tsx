import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, ArrowRight } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import EmptyState from "@/components/site/EmptyState";
import { supabase } from "@/integrations/supabase/client";

type Staff = {
  id: string;
  slug: string;
  display_name: string;
  role_title: string | null;
  bio: string | null;
  photo_url: string | null;
  location: string | null;
  specialties: string[];
  is_bookable: boolean;
};

const Team = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("staff_profiles" as any)
        .select("id,slug,display_name,role_title,bio,photo_url,location,specialties,is_bookable")
        .eq("is_public", true)
        .order("sort_order");
      setStaff((data as any) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <SiteLayout>
      <section className="container-rtg pt-16 md:pt-20 pb-10 border-b border-border">
        <div className="eyebrow mb-3">The People Behind The Brand</div>
        <h1 className="font-display text-5xl md:text-7xl uppercase leading-none">The Team</h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          A collective of writers, directors, photographers, and producers building the next great cultural media brand out of Chicago.
        </p>
      </section>

      <section className="container-rtg py-16">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : staff.length === 0 ? (
          <EmptyState
            eyebrow="The Team"
            title="No team members published yet."
            description="Staff profiles will appear here as they're added."
            icon={Users}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {staff.map((s) => (
              <Link
                key={s.id}
                to={`/team/${s.slug}`}
                className="group bg-background p-6 hover:bg-surface transition-colors"
              >
                <div className="aspect-[4/5] mb-5 bg-gradient-to-br from-primary/20 via-surface to-ink overflow-hidden">
                  {s.photo_url ? (
                    <img
                      src={s.photo_url}
                      alt={s.display_name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-display text-5xl text-foreground/40">
                      {s.display_name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="font-display text-2xl uppercase leading-tight">{s.display_name}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.role_title}</div>
                {s.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {s.specialties.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] uppercase tracking-widest px-2 py-0.5 border border-border text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="inline-flex items-center gap-2 mt-4 text-[10px] uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                  View Profile <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
};

export default Team;
