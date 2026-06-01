import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Instagram, Twitter, Globe, Mail, MapPin, ArrowLeft, Camera, Video } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import EmptyState from "@/components/site/EmptyState";

type Staff = {
  id: string;
  slug: string;
  display_name: string;
  role_title: string | null;
  bio: string | null;
  photo_url: string | null;
  cover_image_url: string | null;
  location: string | null;
  specialties: string[];
  service_ids: string[];
  instagram: string | null;
  twitter: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  is_bookable: boolean;
};

type Work = {
  id: string;
  title: string;
  category: string;
  client: string | null;
  year: number | null;
  thumbnail_url: string | null;
  media_url: string | null;
  media_type: string;
};

type Service = { id: string; name: string; slug: string | null };

const dayLabel = (d: number) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d];

const TeamProfile = () => {
  const { slug } = useParams();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<{ weekday: number; start_time: string; end_time: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: s } = await supabase
        .from("staff_profiles" as any)
        .select("id,slug,display_name,role_title,bio,photo_url,cover_image_url,location,specialties,service_ids,instagram,twitter,website,is_bookable")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();
      const sx = s as any as Staff | null;
      if (sx) {
        // Email/phone are gated server-side by show_email_publicly / show_phone_publicly.
        const { data: contact } = await supabase.rpc(
          "get_public_staff_contact" as never,
          { _slug: slug } as never,
        );
        const c = Array.isArray(contact) ? (contact[0] as any) : (contact as any);
        sx.email = c?.email ?? null;
        sx.phone = c?.phone ?? null;
      }
      setStaff(sx);
      if (sx) {
        const [{ data: w }, { data: a }, { data: svcs }] = await Promise.all([
          supabase.from("portfolio_items" as any).select("id,title,category,client,year,thumbnail_url,media_url,media_type").eq("staff_id", sx.id).eq("is_public", true).order("sort_order").order("year", { ascending: false }),
          supabase.from("staff_availability" as any).select("weekday,start_time,end_time").eq("staff_id", sx.id).order("weekday"),
          sx.service_ids.length > 0
            ? supabase.from("services" as any).select("id,name,slug").in("id", sx.service_ids)
            : Promise.resolve({ data: [] as any }),
        ]);
        setWorks((w as any) || []);
        setAvailability((a as any) || []);
        setServices((svcs as any) || []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="container-rtg py-24 text-sm text-muted-foreground">Loading profile…</div>
      </SiteLayout>
    );
  }

  if (!staff) {
    return (
      <SiteLayout>
        <div className="container-rtg py-24">
          <EmptyState eyebrow="404" title="Profile not found." description="That team member doesn't exist or isn't public." icon={Camera} />
          <div className="mt-8 text-center">
            <Button asChild variant="outline"><Link to="/team"><ArrowLeft className="h-3 w-3 mr-1.5" /> Back to Team</Link></Button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <Helmet>
        <title>{`${staff.display_name}${staff.role_title ? ` — ${staff.role_title}` : ""} | RTG Media`}</title>
        {staff.bio && <meta name="description" content={staff.bio.slice(0, 160)} />}
        <link rel="canonical" href={`https://runnerstogreatness.com/team/${staff.slug}`} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${staff.display_name} — RTG Media`} />
        {staff.bio && <meta property="og:description" content={staff.bio.slice(0, 200)} />}
        <meta property="og:url" content={`https://runnerstogreatness.com/team/${staff.slug}`} />
        {staff.photo_url && <meta property="og:image" content={staff.photo_url} />}
      </Helmet>
      {/* Cover */}
      <section className="relative h-[40vh] md:h-[50vh] overflow-hidden grain bg-surface">
        {staff.cover_image_url && <img src={staff.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="container-rtg relative h-full flex items-end pb-10">
          <Link to="/team" className="absolute top-6 left-6 text-[10px] uppercase tracking-widest text-cream/80 hover:text-cream inline-flex items-center gap-1.5">
            <ArrowLeft className="h-3 w-3" /> All Team
          </Link>
        </div>
      </section>

      {/* Identity */}
      <section className="container-rtg -mt-20 md:-mt-28 relative z-10">
        <div className="grid md:grid-cols-[260px_1fr] gap-8 items-end">
          <div className="aspect-square w-full bg-surface border border-border overflow-hidden">
            {staff.photo_url ? (
              <img src={staff.photo_url} alt={staff.display_name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center font-display text-7xl text-foreground/30">
                {staff.display_name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
              </div>
            )}
          </div>
          <div className="pb-2">
            <div className="eyebrow mb-2">{staff.role_title}</div>
            <h1 className="font-display text-5xl md:text-7xl uppercase leading-none">{staff.display_name}</h1>
            <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
              {staff.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {staff.location}</span>}
              {staff.instagram && <a href={`https://instagram.com/${staff.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1.5"><Instagram className="h-3 w-3" /> {staff.instagram}</a>}
              {staff.twitter && <a href={`https://twitter.com/${staff.twitter.replace("@", "")}`} target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1.5"><Twitter className="h-3 w-3" /></a>}
              {staff.website && <a href={staff.website} target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1.5"><Globe className="h-3 w-3" /></a>}
              {staff.email && <a href={`mailto:${staff.email}`} className="hover:text-primary inline-flex items-center gap-1.5"><Mail className="h-3 w-3" /></a>}
            </div>
            {staff.is_bookable && (
              <div className="mt-5">
                <Button asChild className="rounded-none uppercase tracking-widest text-xs h-11 px-6">
                  <Link to={`/book?staff=${staff.slug}`}>Book {staff.display_name.split(" ")[0]}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bio */}
      {staff.bio && (
        <section className="container-rtg py-12 md:py-16">
          <p className="max-w-2xl text-foreground/80 leading-relaxed whitespace-pre-wrap">{staff.bio}</p>
        </section>
      )}

      {/* Specialties + Services */}
      {(staff.specialties.length > 0 || services.length > 0) && (
        <section className="container-rtg py-8 border-t border-border grid md:grid-cols-2 gap-10">
          {staff.specialties.length > 0 && (
            <div>
              <div className="eyebrow mb-3">Specialties</div>
              <div className="flex flex-wrap gap-1.5">
                {staff.specialties.map((t) => (
                  <span key={t} className="text-[10px] uppercase tracking-widest px-2.5 py-1 border border-border">{t}</span>
                ))}
              </div>
            </div>
          )}
          {services.length > 0 && (
            <div>
              <div className="eyebrow mb-3">Services</div>
              <ul className="space-y-1.5">
                {services.map((sv) => (
                  <li key={sv.id} className="text-sm">{sv.name}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Availability */}
      {availability.length > 0 && (
        <section className="container-rtg py-10 border-t border-border">
          <div className="eyebrow mb-4">Typical Availability</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => {
              const slots = availability.filter((a) => a.weekday === d);
              return (
                <div key={d} className={`border border-border p-3 ${slots.length ? "bg-surface/40" : "opacity-50"}`}>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{dayLabel(d)}</div>
                  {slots.length === 0 ? (
                    <div className="text-xs mt-1.5 text-muted-foreground">Off</div>
                  ) : (
                    slots.map((s, i) => (
                      <div key={i} className="text-xs mt-1.5">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Portfolio */}
      <section className="container-rtg py-12 md:py-16 border-t border-border">
        <div className="eyebrow mb-4">Selected Work</div>
        {works.length === 0 ? (
          <div className="text-sm text-muted-foreground">No published work yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border border border-border">
            {works.map((w) => (
              <a key={w.id} href={w.media_url ?? "#"} target="_blank" rel="noreferrer" className="group bg-background block">
                <div className="aspect-[4/5] bg-surface overflow-hidden">
                  {w.thumbnail_url ? (
                    <img src={w.thumbnail_url} alt={w.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      {w.media_type === "video" ? <Video className="h-8 w-8 text-muted-foreground/40" /> : <Camera className="h-8 w-8 text-muted-foreground/40" />}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="font-display text-base uppercase leading-tight truncate">{w.title}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                    {w.category}{w.client && ` · ${w.client}`}{w.year && ` · ${w.year}`}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
};

export default TeamProfile;
