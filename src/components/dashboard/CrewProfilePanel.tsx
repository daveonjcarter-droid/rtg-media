import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MediaUploader } from "./MediaUploader";
import { PortfolioManager } from "./PortfolioManager";

type Profile = {
  id: string;
  display_name: string;
  role_title: string | null;
  bio: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  instagram: string | null;
  website: string | null;
  equipment: string | null;
  reel_links: any;
  skills: string[];
  specialties: string[];
  hourly_rate: number | null;
  day_rate: number | null;
  booking_notes: string | null;
  show_email_publicly: boolean;
  show_phone_publicly: boolean;
  is_public: boolean;
  is_bookable: boolean;
};

export const CrewProfilePanel = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reelInput, setReelInput] = useState("");
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data as any);
        setLoading(false);
        return;
      }

      // Auto-create a profile so the user is never blocked.
      const fallbackName =
        (user.user_metadata as any)?.display_name ||
        user.email?.split("@")[0] ||
        "New Member";
      const baseSlug = fallbackName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "member";
      const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

      const { data: created, error: createErr } = await supabase
        .from("staff_profiles")
        .insert({
          user_id: user.id,
          display_name: fallbackName,
          slug,
          email: user.email ?? null,
          is_public: false,
          is_bookable: false,
          status: "active",
        })
        .select("*")
        .maybeSingle();

      if (createErr) {
        toast.error(createErr.message);
        setLoading(false);
        return;
      }

      setProfile((created as any) ?? null);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <p className="text-sm text-muted-foreground">Setting up your profile…</p>;
  if (!profile) return <p className="text-sm text-muted-foreground">Could not load profile.</p>;

  const update = (patch: Partial<Profile>) => setProfile((p) => p ? { ...p, ...patch } : p);

  const addReel = () => {
    if (!reelInput.trim()) return;
    const next = Array.isArray(profile.reel_links) ? [...profile.reel_links, reelInput.trim()] : [reelInput.trim()];
    update({ reel_links: next });
    setReelInput("");
  };
  const removeReel = (i: number) => {
    const next = (profile.reel_links as string[]).filter((_, idx) => idx !== i);
    update({ reel_links: next });
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    update({ skills: [...(profile.skills ?? []), skillInput.trim()] });
    setSkillInput("");
  };
  const removeSkill = (i: number) => update({ skills: profile.skills.filter((_, idx) => idx !== i) });

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("staff_profiles").update({
      display_name: profile.display_name,
      role_title: profile.role_title,
      bio: profile.bio,
      photo_url: profile.photo_url,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      instagram: profile.instagram,
      website: profile.website,
      equipment: profile.equipment,
      reel_links: profile.reel_links,
      skills: profile.skills,
      hourly_rate: profile.hourly_rate,
      day_rate: profile.day_rate,
      booking_notes: profile.booking_notes,
      show_email_publicly: profile.show_email_publicly,
      show_phone_publicly: profile.show_phone_publicly,
      is_public: profile.is_public,
      is_bookable: profile.is_bookable,
    }).eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-display tracking-tight">My Crew Profile</h2>
        <p className="text-sm text-muted-foreground">Edit your public profile, rates, equipment, and booking preferences.</p>
      </div>

      <section className="border border-border/60 rounded-lg p-4 space-y-3">
        <h3 className="font-display text-lg">Basics</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Full Name</Label><Input value={profile.display_name} onChange={(e) => update({ display_name: e.target.value })} /></div>
          <div><Label>Role / Specialty</Label><Input value={profile.role_title ?? ""} onChange={(e) => update({ role_title: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Bio</Label><Textarea rows={4} value={profile.bio ?? ""} onChange={(e) => update({ bio: e.target.value })} /></div>
          <div><Label>Profile Photo URL</Label><Input value={profile.photo_url ?? ""} onChange={(e) => update({ photo_url: e.target.value })} /></div>
          <div><Label>Location</Label><Input value={profile.location ?? ""} onChange={(e) => update({ location: e.target.value })} /></div>
        </div>
      </section>

      <section className="border border-border/60 rounded-lg p-4 space-y-3">
        <h3 className="font-display text-lg">Contact & Visibility</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Email</Label><Input value={profile.email ?? ""} onChange={(e) => update({ email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={profile.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} /></div>
          <div><Label>Instagram</Label><Input value={profile.instagram ?? ""} onChange={(e) => update({ instagram: e.target.value })} /></div>
          <div><Label>Website</Label><Input value={profile.website ?? ""} onChange={(e) => update({ website: e.target.value })} /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center justify-between text-sm gap-3 border border-border/40 rounded p-2">
            Show email publicly
            <Switch checked={profile.show_email_publicly} onCheckedChange={(v) => update({ show_email_publicly: v })} />
          </label>
          <label className="flex items-center justify-between text-sm gap-3 border border-border/40 rounded p-2">
            Show phone publicly
            <Switch checked={profile.show_phone_publicly} onCheckedChange={(v) => update({ show_phone_publicly: v })} />
          </label>
          <label className="flex items-center justify-between text-sm gap-3 border border-border/40 rounded p-2">
            Profile is public
            <Switch checked={profile.is_public} onCheckedChange={(v) => update({ is_public: v })} />
          </label>
          <label className="flex items-center justify-between text-sm gap-3 border border-border/40 rounded p-2">
            Available for bookings
            <Switch checked={profile.is_bookable} onCheckedChange={(v) => update({ is_bookable: v })} />
          </label>
        </div>
      </section>

      <section className="border border-border/60 rounded-lg p-4 space-y-3">
        <h3 className="font-display text-lg">Rates & Booking</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Hourly Rate ($)</Label><Input type="number" value={profile.hourly_rate ?? ""} onChange={(e) => update({ hourly_rate: e.target.value ? Number(e.target.value) : null })} /></div>
          <div><Label>Day Rate ($)</Label><Input type="number" value={profile.day_rate ?? ""} onChange={(e) => update({ day_rate: e.target.value ? Number(e.target.value) : null })} /></div>
          <div className="md:col-span-2"><Label>Booking Preferences / Notes</Label><Textarea rows={3} value={profile.booking_notes ?? ""} onChange={(e) => update({ booking_notes: e.target.value })} placeholder="E.g. Prefer 48-hour notice. Available weekends. No travel beyond 50 miles." /></div>
        </div>
      </section>

      <section className="border border-border/60 rounded-lg p-4 space-y-3">
        <h3 className="font-display text-lg">Equipment & Skills</h3>
        <div><Label>Equipment</Label><Textarea rows={3} value={profile.equipment ?? ""} onChange={(e) => update({ equipment: e.target.value })} placeholder="E.g. Sony A7S III, DJI Ronin RS3, Aputure 600D" /></div>

        <div>
          <Label>Skills / Tags</Label>
          <div className="flex gap-2">
            <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Add a skill" />
            <Button type="button" onClick={addSkill}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {profile.skills?.map((s, i) => (
              <Badge key={i} variant="outline" className="cursor-pointer" onClick={() => removeSkill(i)}>{s} ×</Badge>
            ))}
          </div>
        </div>

        <div>
          <Label>Reel / Video Links</Label>
          <div className="flex gap-2">
            <Input value={reelInput} onChange={(e) => setReelInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addReel())} placeholder="https://vimeo.com/..." />
            <Button type="button" onClick={addReel}>Add</Button>
          </div>
          <div className="space-y-1 mt-2">
            {(profile.reel_links as string[] | null)?.map((url, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-xs border border-border/40 rounded p-2">
                <a href={url} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">{url}</a>
                <Button size="sm" variant="ghost" onClick={() => removeReel(i)}>Remove</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Button onClick={save} disabled={saving} className="w-full md:w-auto">{saving ? "Saving…" : "Save Profile"}</Button>
    </div>
  );
};

export const MyAssignedBookings = () => {
  const { user } = useAuth();
  const [staffId, setStaffId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: sp } = await supabase.from("staff_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!sp) { setLoading(false); return; }
      setStaffId(sp.id);
      const { data } = await supabase.from("bookings").select("id,name,service,project_date,project_time,status,crew_response_status,description,location_detail").eq("assigned_staff_id", sp.id).order("project_date", { ascending: true });
      setBookings(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  const respond = async (id: string, status: "accepted" | "declined") => {
    const { error } = await supabase.from("bookings").update({ crew_response_status: status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Booking ${status}`);
    setBookings((b) => b.map((x) => x.id === id ? { ...x, crew_response_status: status } : x));
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading bookings…</p>;
  if (!staffId) return <p className="text-sm text-muted-foreground">No crew profile linked yet.</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-display tracking-tight">My Assigned Bookings</h2>
        <p className="text-sm text-muted-foreground">Review and respond to your assigned jobs.</p>
      </div>
      {bookings.length === 0 ? (
        <div className="border border-border/60 rounded-lg p-8 text-center text-muted-foreground">No assignments yet.</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="border border-border/60 rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-medium">{b.service ?? "Booking"} — {b.name}</div>
                  <div className="text-xs text-muted-foreground">{b.project_date ?? "TBD"} {b.project_time ?? ""} · {b.location_detail ?? "Location TBD"}</div>
                </div>
                <Badge variant="outline" className={b.crew_response_status === "accepted" ? "border-emerald-500/40 text-emerald-400" : b.crew_response_status === "declined" ? "border-destructive/40 text-destructive" : "border-gold/40 text-gold"}>
                  {b.crew_response_status}
                </Badge>
              </div>
              {b.description && <p className="text-sm text-muted-foreground">{b.description}</p>}
              {b.crew_response_status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => respond(b.id, "accepted")}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => respond(b.id, "declined")}>Decline</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
