import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CREW_ROLES, type AppRole } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/lib/permissions";
import { UserPlus, Star, Mail, MapPin, Calendar, CheckCircle2, XCircle } from "lucide-react";

type StaffRow = {
  id: string;
  display_name: string;
  role_title: string | null;
  email: string | null;
  photo_url: string | null;
  location: string | null;
  is_public: boolean;
  is_bookable: boolean;
  is_featured: boolean;
  is_crew: boolean;
  hourly_rate: number | null;
  day_rate: number | null;
  skills: string[];
  status: string;
  user_id: string | null;
};

export const CrewManagement = () => {
  const [crew, setCrew] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("photographer");
  const [inviteTitle, setInviteTitle] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("staff_profiles")
      .select("id,display_name,role_title,email,photo_url,location,is_public,is_bookable,is_featured,is_crew,hourly_rate,day_rate,skills,status,user_id")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setCrew((data ?? []).filter((s: any) => s.is_crew));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return crew.filter((c) => {
      if (filterRole !== "all" && c.role_title !== filterRole) return false;
      if (search && !c.display_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [crew, filterRole, search]);

  const toggleFeatured = async (id: string, val: boolean) => {
    const { error } = await supabase.from("staff_profiles").update({ is_featured: val }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(val ? "Featured on service pages" : "Removed from featured");
    load();
  };

  const togglePublic = async (id: string, val: boolean) => {
    const { error } = await supabase.from("staff_profiles").update({ is_public: val }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(val ? "Profile is public" : "Profile hidden");
    load();
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteName) {
      toast.error("Email and name are required");
      return;
    }
    // 1) Create staff profile placeholder
    const slug = inviteName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
    const { error: spErr } = await supabase.from("staff_profiles").insert({
      display_name: inviteName,
      slug,
      email: inviteEmail,
      role_title: inviteTitle || ROLE_LABELS[inviteRole],
      is_crew: true,
      is_public: false,
      is_bookable: false,
      status: "invited",
    });
    if (spErr) return toast.error(spErr.message);

    // 2) Add to invited_users so role auto-assigns on signup
    const { error: invErr } = await supabase.from("invited_users").insert({
      email: inviteEmail,
      roles: [inviteRole] as any,
      internal_title: inviteTitle || ROLE_LABELS[inviteRole],
      status: "pending",
    });
    if (invErr) toast.warning(`Profile created, but invite row failed: ${invErr.message}`);

    toast.success(`${inviteName} added. They'll claim the profile on signup with ${inviteEmail}.`);
    setInviteOpen(false);
    setInviteEmail(""); setInviteName(""); setInviteTitle(""); setInviteRole("photographer");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display tracking-tight">Crew Management</h2>
          <p className="text-sm text-muted-foreground">Production team directory, invites, and assignments.</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="size-4" /> Invite Crew Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite Crew Member</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Full Name</Label><Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></div>
              <div>
                <Label>Crew Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CREW_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Internal Title (optional)</Label><Input value={inviteTitle} onChange={(e) => setInviteTitle(e.target.value)} placeholder="Lead Photographer" /></div>
              <Button className="w-full" onClick={handleInvite}>Send Invite & Create Profile</Button>
              <p className="text-xs text-muted-foreground">A profile is created immediately. When they sign up with this email, the crew role is auto-assigned and they take ownership of the profile.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Input placeholder="Search crew…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger><SelectValue placeholder="Filter by role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {CREW_ROLES.map((r) => <SelectItem key={r} value={ROLE_LABELS[r]}>{ROLE_LABELS[r]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground self-center">
          {filtered.length} of {crew.length} crew members
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading crew…</p>
      ) : filtered.length === 0 ? (
        <div className="border border-border/60 rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No crew members yet. Invite your first one above.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="border border-border/60 rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="size-14 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {c.photo_url ? <img src={c.photo_url} alt={c.display_name} className="size-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.display_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.role_title}</div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {c.is_featured && <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Featured</Badge>}
                    {!c.is_public && <Badge variant="outline" className="text-[10px]">Hidden</Badge>}
                    {c.user_id ? <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">Active</Badge> : <Badge variant="outline" className="text-[10px] text-muted-foreground">Pending Signup</Badge>}
                  </div>
                </div>
              </div>
              <div className="text-xs space-y-1 text-muted-foreground">
                {c.email && <div className="flex items-center gap-1.5"><Mail className="size-3" /> {c.email}</div>}
                {c.location && <div className="flex items-center gap-1.5"><MapPin className="size-3" /> {c.location}</div>}
                {(c.hourly_rate || c.day_rate) && (
                  <div>
                    {c.hourly_rate ? `$${c.hourly_rate}/hr` : ""}
                    {c.hourly_rate && c.day_rate ? " · " : ""}
                    {c.day_rate ? `$${c.day_rate}/day` : ""}
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => toggleFeatured(c.id, !c.is_featured)}>
                  <Star className={`size-3 ${c.is_featured ? "fill-primary text-primary" : ""}`} />
                  {c.is_featured ? "Unfeature" : "Feature"}
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => togglePublic(c.id, !c.is_public)}>
                  {c.is_public ? "Hide" : "Make Public"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PortfolioApprovalsQueue = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("id,title,thumbnail_url,media_url,media_type,category,staff_id,approval_status,created_at")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.from("portfolio_items").update({ approval_status: "approved" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Approved");
    load();
  };
  const reject = async (id: string) => {
    const { error } = await supabase.from("portfolio_items").update({ approval_status: "rejected", is_public: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Rejected");
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-display tracking-tight">Portfolio Approvals</h2>
        <p className="text-sm text-muted-foreground">Review crew portfolio submissions before they go public.</p>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
       items.length === 0 ? (
         <div className="border border-border/60 rounded-lg p-8 text-center">
           <CheckCircle2 className="size-8 mx-auto text-muted-foreground mb-2" />
           <p className="text-muted-foreground">No pending approvals.</p>
         </div>
       ) : (
         <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
           {items.map((it) => (
             <div key={it.id} className="border border-border/60 rounded-lg overflow-hidden">
               <div className="aspect-video bg-muted">
                 {it.thumbnail_url || it.media_url ? <img src={it.thumbnail_url || it.media_url} alt={it.title} className="size-full object-cover" /> : null}
               </div>
               <div className="p-3 space-y-2">
                 <div className="font-medium truncate">{it.title}</div>
                 <div className="text-xs text-muted-foreground">{it.category}</div>
                 <div className="flex gap-2">
                   <Button size="sm" className="flex-1 gap-1" onClick={() => approve(it.id)}><CheckCircle2 className="size-3" /> Approve</Button>
                   <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => reject(it.id)}><XCircle className="size-3" /> Reject</Button>
                 </div>
               </div>
             </div>
           ))}
         </div>
       )}
    </div>
  );
};
