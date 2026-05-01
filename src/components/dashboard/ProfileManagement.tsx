import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  UserPlus, Search, Link as LinkIcon, MoreHorizontal, ShieldCheck, UserX,
  Archive, CheckCircle2, Mail, Filter,
} from "lucide-react";
import type { AppRole } from "@/contexts/AuthContext";

const PROFILE_TYPES = [
  { value: "admin",          label: "Admin" },
  { value: "staff",          label: "Staff" },
  { value: "crew",           label: "Crew" },
  { value: "public_creator", label: "Public Creator" },
  { value: "client",         label: "Client" },
] as const;

const ROLE_TYPES = [
  { value: "owner",        label: "Owner" },
  { value: "co_ceo",       label: "Co-CEO" },
  { value: "admin",        label: "Admin" },
  { value: "editor",       label: "Editor" },
  { value: "journalist",   label: "Journalist" },
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "designer",     label: "Designer" },
  { value: "producer",     label: "Producer" },
  { value: "crew",         label: "Crew" },
  { value: "intern",       label: "Intern" },
  { value: "client",       label: "Client" },
] as const;

const STATUS_LIST = [
  { value: "pending",  label: "Pending",  cls: "bg-amber-500/15  text-amber-300  border-amber-500/30" },
  { value: "active",   label: "Active",   cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { value: "disabled", label: "Disabled", cls: "bg-muted text-muted-foreground border-border" },
  { value: "archived", label: "Archived", cls: "bg-zinc-700/30 text-zinc-300 border-zinc-700" },
  { value: "unlinked", label: "Unlinked", cls: "bg-primary/15 text-primary border-primary/30" },
] as const;

type ProfileMeta = {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  profile_type: string;
  role_type: string | null;
  status: string;
  profile_photo_url: string | null;
  bio: string | null;
  social_links: Record<string, string> | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

type StaffRow = {
  id: string;
  user_id: string | null;
  display_name: string;
  email: string | null;
  photo_url: string | null;
  role_title: string | null;
  is_crew: boolean;
  status: string | null;
  created_at: string;
  updated_at: string;
};

type Row = {
  key: string;
  source: "profile_meta" | "staff_profile";
  profileId: string;            // profile_meta.id or staff_profile.id
  linkedUserId: string | null;
  email: string;
  fullName: string;
  displayName: string;
  profileType: string;
  roleType: string | null;
  status: string;
  photo: string | null;
  bio: string | null;
  updatedAt: string;
  raw: ProfileMeta | StaffRow;
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_LIST.find((x) => x.value === status);
  return (
    <span className={`inline-flex items-center text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${s?.cls ?? "bg-muted text-muted-foreground border-border"}`}>
      {s?.label ?? status}
    </span>
  );
};

const ProfileManagement = () => {
  const [meta, setMeta] = useState<ProfileMeta[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [filterRoleType, setFilterRoleType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLink, setFilterLink] = useState<string>("all");

  const [editing, setEditing] = useState<Row | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: m, error: mErr }, { data: s, error: sErr }] = await Promise.all([
      supabase.from("profile_meta").select("*").order("updated_at", { ascending: false }),
      supabase
        .from("staff_profiles")
        .select("id,user_id,display_name,email,photo_url,role_title,is_crew,status,created_at,updated_at")
        .order("updated_at", { ascending: false }),
    ]);
    if (mErr) toast.error(mErr.message);
    if (sErr) toast.error(sErr.message);
    setMeta((m ?? []) as ProfileMeta[]);
    setStaff((s ?? []) as StaffRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    meta.forEach((m) => {
      out.push({
        key: `m:${m.id}`,
        source: "profile_meta",
        profileId: m.id,
        linkedUserId: m.user_id,
        email: m.email ?? "",
        fullName: m.full_name ?? "",
        displayName: m.display_name ?? m.full_name ?? "—",
        profileType: m.profile_type,
        roleType: m.role_type,
        status: m.status,
        photo: m.profile_photo_url,
        bio: m.bio,
        updatedAt: m.updated_at,
        raw: m,
      });
    });
    // staff_profiles that are not yet linked → show as "Unlinked" rows
    staff
      .filter((s) => !s.user_id)
      .forEach((s) => {
        out.push({
          key: `s:${s.id}`,
          source: "staff_profile",
          profileId: s.id,
          linkedUserId: null,
          email: s.email ?? "",
          fullName: s.display_name,
          displayName: s.display_name,
          profileType: s.is_crew ? "crew" : "staff",
          roleType: null,
          status: "unlinked",
          photo: s.photo_url,
          bio: null,
          updatedAt: s.updated_at,
          raw: s,
        });
      });
    return out;
  }, [meta, staff]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tab === "admin"   && r.profileType !== "admin")   return false;
      if (tab === "staff"   && r.profileType !== "staff")   return false;
      if (tab === "crew"    && r.profileType !== "crew")    return false;
      if (tab === "unlinked" && r.linkedUserId)             return false;
      if (tab === "pending" && r.status !== "pending")      return false;
      if (filterRoleType !== "all" && r.roleType !== filterRoleType) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterLink === "linked"   && !r.linkedUserId) return false;
      if (filterLink === "unlinked" &&  r.linkedUserId) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.email.toLowerCase().includes(q) &&
          !r.displayName.toLowerCase().includes(q) &&
          !r.fullName.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [rows, tab, filterRoleType, filterStatus, filterLink, search]);

  const counts = useMemo(() => ({
    all:      rows.length,
    admin:    rows.filter((r) => r.profileType === "admin").length,
    staff:    rows.filter((r) => r.profileType === "staff").length,
    crew:     rows.filter((r) => r.profileType === "crew").length,
    unlinked: rows.filter((r) => !r.linkedUserId).length,
    pending:  rows.filter((r) => r.status === "pending").length,
  }), [rows]);

  /* ─────────── actions ─────────── */
  const setStatus = async (row: Row, status: string) => {
    if (row.source !== "profile_meta") {
      toast.error("Link this profile to a user first.");
      return;
    }
    const { error } = await supabase.from("profile_meta").update({ status }).eq("id", row.profileId);
    if (error) return toast.error(error.message);
    toast.success(`Status set to ${status}`);
    load();
  };

  const setRoleType = async (row: Row, roleType: string) => {
    if (row.source !== "profile_meta") return;
    const { error } = await supabase.from("profile_meta").update({ role_type: roleType }).eq("id", row.profileId);
    if (error) return toast.error(error.message);
    toast.success("Role updated");
    load();
  };

  const setProfileType = async (row: Row, profileType: string) => {
    if (row.source !== "profile_meta") return;
    const { error } = await supabase.from("profile_meta").update({ profile_type: profileType }).eq("id", row.profileId);
    if (error) return toast.error(error.message);
    toast.success("Profile type updated");
    load();
  };

  /* ─────────── render ─────────── */
  const tabBtn = (id: string, label: string, count: number) => (
    <TabsTrigger value={id} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[11px] uppercase tracking-widest gap-2">
      {label} <span className="text-[10px] opacity-70">{count}</span>
    </TabsTrigger>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display tracking-tight uppercase">Profile Management</h2>
          <p className="text-sm text-muted-foreground">
            Central control for every admin, staff, crew, and creator profile across RTG.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <UserPlus className="size-4" /> Create Profile
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-surface/40 border border-border rounded-sm flex-wrap h-auto p-1 gap-1">
          {tabBtn("all",      "All Profiles",     counts.all)}
          {tabBtn("admin",    "Admin",            counts.admin)}
          {tabBtn("staff",    "Staff",            counts.staff)}
          {tabBtn("crew",     "Crew",             counts.crew)}
          {tabBtn("unlinked", "Unlinked",         counts.unlinked)}
          {tabBtn("pending",  "Pending Requests", counts.pending)}
        </TabsList>

        {/* Filters */}
        <div className="grid gap-2 md:grid-cols-5 mt-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 rounded-sm"
            />
          </div>
          <Select value={filterRoleType} onValueChange={setFilterRoleType}>
            <SelectTrigger className="h-9 rounded-sm"><SelectValue placeholder="Role type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLE_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 rounded-sm"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_LIST.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterLink} onValueChange={setFilterLink}>
            <SelectTrigger className="h-9 rounded-sm"><SelectValue placeholder="Linked" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="linked">Linked accounts</SelectItem>
              <SelectItem value="unlinked">Unlinked only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading profiles…</p>
          ) : filtered.length === 0 ? (
            <div className="border border-border/60 rounded-sm p-10 text-center">
              <p className="text-sm text-muted-foreground">No profiles match these filters.</p>
            </div>
          ) : (
            <div className="border border-border/60 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface/40 text-muted-foreground">
                  <tr className="text-left text-[10px] uppercase tracking-widest">
                    <th className="px-3 py-2 font-normal">Name</th>
                    <th className="px-3 py-2 font-normal hidden md:table-cell">Email</th>
                    <th className="px-3 py-2 font-normal">Role</th>
                    <th className="px-3 py-2 font-normal hidden lg:table-cell">Type</th>
                    <th className="px-3 py-2 font-normal">Status</th>
                    <th className="px-3 py-2 font-normal hidden lg:table-cell">Linked</th>
                    <th className="px-3 py-2 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.key} className="border-t border-border/50 hover:bg-surface/20">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-full bg-muted overflow-hidden shrink-0">
                            {r.photo && <img src={r.photo} alt="" className="size-full object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-foreground">{r.displayName}</div>
                            {r.fullName && r.fullName !== r.displayName && (
                              <div className="text-[10px] text-muted-foreground truncate">{r.fullName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground truncate">{r.email}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-[11px] uppercase tracking-widest">
                          {ROLE_TYPES.find((x) => x.value === r.roleType)?.label ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 hidden lg:table-cell">
                        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                          {PROFILE_TYPES.find((x) => x.value === r.profileType)?.label ?? r.profileType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                      <td className="px-3 py-2.5 hidden lg:table-cell">
                        {r.linkedUserId ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300">
                            <CheckCircle2 className="size-3" /> Linked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-primary">
                            <LinkIcon className="size-3" /> Unlinked
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">
                              {r.displayName}
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setEditing(r)}>
                              <ShieldCheck className="size-3.5 mr-2" /> View / Edit
                            </DropdownMenuItem>
                            {!r.linkedUserId && (
                              <DropdownMenuItem onClick={() => { setLinkTarget(r); setLinkOpen(true); }}>
                                <LinkIcon className="size-3.5 mr-2" /> Link to user account
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {r.source === "profile_meta" && (
                              <>
                                <DropdownMenuItem onClick={() => setStatus(r, "active")}>
                                  <CheckCircle2 className="size-3.5 mr-2" /> Activate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatus(r, "disabled")}>
                                  <UserX className="size-3.5 mr-2" /> Disable
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatus(r, "archived")}>
                                  <Archive className="size-3.5 mr-2" /> Archive
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─────────── Edit dialog ─────────── */}
      {editing && (
        <EditProfileDialog
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
          onChangeRoleType={(v) => setRoleType(editing, v)}
          onChangeProfileType={(v) => setProfileType(editing, v)}
        />
      )}

      {/* ─────────── Create dialog ─────────── */}
      {createOpen && (
        <CreateProfileDialog
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); load(); }}
        />
      )}

      {/* ─────────── Link dialog ─────────── */}
      {linkOpen && linkTarget && (
        <LinkAccountDialog
          row={linkTarget}
          onClose={() => { setLinkOpen(false); setLinkTarget(null); }}
          onLinked={() => { setLinkOpen(false); setLinkTarget(null); load(); }}
        />
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
 *  Edit profile dialog
 * ────────────────────────────────────────────────────────── */
const EditProfileDialog = ({
  row, onClose, onSaved, onChangeRoleType, onChangeProfileType,
}: {
  row: Row;
  onClose: () => void;
  onSaved: () => void;
  onChangeRoleType: (v: string) => void;
  onChangeProfileType: (v: string) => void;
}) => {
  const meta = row.source === "profile_meta" ? (row.raw as ProfileMeta) : null;
  const [displayName, setDisplayName] = useState(row.displayName);
  const [fullName, setFullName] = useState(row.fullName);
  const [photo, setPhoto] = useState(row.photo ?? "");
  const [bio, setBio] = useState(row.bio ?? "");
  const [instagram, setInstagram] = useState((meta?.social_links as any)?.instagram ?? "");
  const [twitter, setTwitter] = useState((meta?.social_links as any)?.twitter ?? "");
  const [website, setWebsite] = useState((meta?.social_links as any)?.website ?? "");
  const [internalNotes, setInternalNotes] = useState(meta?.internal_notes ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (row.source !== "profile_meta") {
      toast.error("Link this profile to a user before editing.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profile_meta")
      .update({
        display_name: displayName,
        full_name: fullName,
        profile_photo_url: photo || null,
        bio: bio || null,
        social_links: { instagram, twitter, website },
        internal_notes: internalNotes || null,
      })
      .eq("id", row.profileId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-tight">{row.displayName}</DialogTitle>
          <DialogDescription className="text-xs">
            Profile ID: <code>{row.profileId}</code> · {row.linkedUserId ? <>User: <code>{row.linkedUserId}</code></> : "Unlinked"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="eyebrow mb-1.5 block">Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Profile Type</Label>
              <Select value={row.profileType} onValueChange={onChangeProfileType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROFILE_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Role Type</Label>
              <Select value={row.roleType ?? ""} onValueChange={onChangeRoleType}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {ROLE_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="eyebrow mb-1.5 block">Profile Photo URL</Label>
              <Input value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://…" />
            </div>
            <div className="md:col-span-2">
              <Label className="eyebrow mb-1.5 block">Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Instagram</Label>
              <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Twitter / X</Label>
              <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className="eyebrow mb-1.5 block">Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className="eyebrow mb-1.5 block">Internal Notes (admin-only)</Label>
              <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={2} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy || row.source !== "profile_meta"} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ──────────────────────────────────────────────────────────
 *  Create profile dialog (creates profile_meta either linked or unlinked)
 * ────────────────────────────────────────────────────────── */
const CreateProfileDialog = ({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) => {
  const [profileType, setProfileType] = useState<string>("staff");
  const [roleType, setRoleType] = useState<string>("editor");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [linkNow, setLinkNow] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ id: string; email: string; display_name: string | null }[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const searchUsers = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    const { data } = await supabase
      .from("profile_meta")
      .select("user_id, email, display_name")
      .or(`email.ilike.%${q}%,display_name.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(8);
    setResults(((data ?? []) as any[])
      .filter((r) => r.user_id)
      .map((r) => ({ id: r.user_id, email: r.email ?? "", display_name: r.display_name })));
  };

  const create = async () => {
    if (!fullName || !email) {
      toast.error("Name and email are required");
      return;
    }
    if (linkNow && !selectedUser) {
      toast.error("Pick a user account to link");
      return;
    }
    setBusy(true);
    if (linkNow && selectedUser) {
      // Update existing profile_meta for this user
      const { error } = await supabase
        .from("profile_meta")
        .update({
          full_name: fullName,
          email,
          profile_type: profileType,
          role_type: roleType,
          status: "active",
        })
        .eq("user_id", selectedUser);
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Profile created and linked");
    } else {
      // Unlinked profile — store in invited_users so the next signup gets it
      const { error } = await supabase.from("invited_users").insert({
        email,
        full_name: fullName,
        roles: [roleType] as any,
        invite_type: profileType === "crew" ? "crew" : "staff",
        internal_title: ROLE_TYPES.find((r) => r.value === roleType)?.label ?? roleType,
        status: "pending",
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Unlinked profile created. They'll claim it at signup.");
    }
    onCreated();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display uppercase">Create Profile</DialogTitle>
          <DialogDescription>Create an admin, staff, or crew profile and optionally link it to a user account immediately.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="eyebrow mb-1.5 block">Profile Type</Label>
              <Select value={profileType} onValueChange={setProfileType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROFILE_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Role Type</Label>
              <Select value={roleType} onValueChange={setRoleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="eyebrow mb-1.5 block">Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label className="eyebrow mb-1.5 block">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={linkNow} onChange={(e) => setLinkNow(e.target.checked)} />
            Link to existing user account immediately
          </label>

          {linkNow && (
            <div className="border border-border rounded-sm p-3 space-y-2">
              <Label className="eyebrow block">Search User</Label>
              <Input placeholder="Search name or email…" value={search} onChange={(e) => searchUsers(e.target.value)} />
              <div className="max-h-40 overflow-y-auto border border-border/50 rounded-sm divide-y divide-border/30">
                {results.length === 0 && <div className="p-2 text-xs text-muted-foreground">Type at least 2 characters…</div>}
                {results.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUser(u.id)}
                    className={`w-full text-left p-2 text-xs hover:bg-surface/30 ${selectedUser === u.id ? "bg-primary/10" : ""}`}
                  >
                    <div className="text-foreground">{u.display_name ?? u.email}</div>
                    <div className="text-muted-foreground text-[10px]">{u.email}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={create} disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Creating…" : "Create Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ──────────────────────────────────────────────────────────
 *  Link account dialog (links a staff_profile to a user)
 * ────────────────────────────────────────────────────────── */
const LinkAccountDialog = ({
  row, onClose, onLinked,
}: { row: Row; onClose: () => void; onLinked: () => void }) => {
  const [search, setSearch] = useState(row.email ?? "");
  const [results, setResults] = useState<{ id: string; email: string; display_name: string | null }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { run(search); }, []); // eslint-disable-line

  const run = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    const { data } = await supabase
      .from("profile_meta")
      .select("user_id, email, display_name")
      .or(`email.ilike.%${q}%,display_name.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(8);
    setResults(((data ?? []) as any[])
      .filter((r) => r.user_id)
      .map((r) => ({ id: r.user_id, email: r.email ?? "", display_name: r.display_name })));
  };

  const link = async () => {
    if (!selected) { toast.error("Pick a user account"); return; }
    setBusy(true);
    if (row.source === "staff_profile") {
      const { error } = await supabase.rpc("link_staff_profile_to_user" as any, {
        _profile_id: row.profileId,
        _user_id: selected,
      });
      setBusy(false);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("profile_meta")
        .update({ user_id: selected, status: "active" })
        .eq("id", row.profileId);
      setBusy(false);
      if (error) return toast.error(error.message);
    }
    toast.success("Profile linked");
    onLinked();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display uppercase">Link to User Account</DialogTitle>
          <DialogDescription>Search for the real login account for <strong>{row.displayName}</strong> and confirm.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="eyebrow block">Search</Label>
          <Input placeholder="name or email" value={search} onChange={(e) => run(e.target.value)} />
          <div className="max-h-60 overflow-y-auto border border-border/60 rounded-sm divide-y divide-border/30">
            {results.length === 0 && <div className="p-3 text-xs text-muted-foreground">No matches yet.</div>}
            {results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelected(u.id)}
                className={`w-full text-left p-2.5 text-xs hover:bg-surface/30 ${selected === u.id ? "bg-primary/10 border-l-2 border-primary" : ""}`}
              >
                <div className="text-foreground">{u.display_name ?? u.email}</div>
                <div className="text-muted-foreground text-[10px] flex items-center gap-1"><Mail className="size-3" />{u.email}</div>
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={link} disabled={busy || !selected} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Linking…" : "Confirm Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileManagement;
