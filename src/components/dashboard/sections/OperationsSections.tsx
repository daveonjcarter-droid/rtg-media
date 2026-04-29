// RTG OS — Operations admin sections (Services, Staff, Portfolio)
// CRUD against services / staff_profiles / portfolio_items tables.
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Save, ExternalLink, Camera, Users, Briefcase, Image as ImageIcon, Star, Eye, EyeOff, Calendar, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHead, EmptyState } from "@/components/dashboard/shared/Primitives";
import { logActivity } from "@/lib/activity";
import AvailabilityCalendar from "@/components/dashboard/AvailabilityCalendar";
import { CrewSlotsDialog } from "@/components/dashboard/CrewSlotsDialog";
import { CREW_PACKAGES, type CrewPackageId } from "@/lib/crewPackages";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* ============================================================
   SERVICES MANAGER
   ============================================================ */

type ServiceRow = {
  id: string;
  slug: string | null;
  name: string;
  short_description: string | null;
  long_description: string | null;
  icon: string | null;
  cover_image_url: string | null;
  pricing_model: string;
  base_price: number | null;
  sale_price: number | null;
  packages: any;
  add_ons: any;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
};

const PRICING_MODELS = [
  { value: "starting_at", label: "Starting at" },
  { value: "hourly", label: "Hourly" },
  { value: "half_day", label: "Half day" },
  { value: "full_day", label: "Full day" },
  { value: "custom", label: "Custom quote" },
];

export const ServicesManager = () => {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services" as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = () => {
    setEditing({
      id: "", slug: "", name: "", short_description: "", long_description: "", icon: "",
      cover_image_url: "", pricing_model: "starting_at", base_price: null, sale_price: null,
      packages: [], add_ons: [], is_available: true, is_featured: false, sort_order: rows.length,
    });
    setOpen(true);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("services" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Service removed");
    load();
  };

  return (
    <div className="space-y-5">
      <PageHead
        title="Production Services"
        sub="Catalog"
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-sm uppercase tracking-widest text-[10px] h-8">
              <Link to="/services" target="_blank"><ExternalLink className="h-3 w-3 mr-1.5" /> Public</Link>
            </Button>
            <Button size="sm" onClick={create} className="rounded-sm uppercase tracking-widest text-[10px] h-8">
              <Plus className="h-3 w-3 mr-1.5" /> New Service
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No services yet"
          body="Add a production service so clients can request it during booking."
          action={<Button size="sm" onClick={create}><Plus className="h-3 w-3 mr-1.5" />Add Service</Button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {rows.map((s) => (
            <div key={s.id} className="border border-border rounded-sm p-4 bg-surface/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-lg uppercase leading-tight">{s.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    {PRICING_MODELS.find((p) => p.value === s.pricing_model)?.label}
                    {s.base_price != null && ` · $${s.base_price}`}
                    {s.sale_price != null && ` · Sale $${s.sale_price}`}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {s.is_featured && <Star className="h-3.5 w-3.5 text-gold" />}
                  {s.is_available ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </div>
              {s.short_description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{s.short_description}</p>}
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                <Button size="sm" variant="outline" onClick={() => { setEditing(s); setOpen(true); }} className="h-7 text-[10px] uppercase tracking-widest">
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {s.name}?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(s.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && editing && (
        <ServiceEditor
          row={editing}
          onClose={() => { setOpen(false); setEditing(null); }}
          onSaved={() => { setOpen(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
};

const ServiceEditor = ({ row, onClose, onSaved }: { row: ServiceRow; onClose: () => void; onSaved: () => void }) => {
  const [r, setR] = useState<ServiceRow>(row);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!r.name.trim()) return toast.error("Name is required");
    setBusy(true);
    const payload = {
      slug: r.slug || slugify(r.name),
      name: r.name.trim(),
      short_description: r.short_description,
      long_description: r.long_description,
      icon: r.icon,
      cover_image_url: r.cover_image_url,
      pricing_model: r.pricing_model,
      base_price: r.base_price,
      sale_price: r.sale_price,
      packages: r.packages,
      add_ons: r.add_ons,
      is_available: r.is_available,
      is_featured: r.is_featured,
      sort_order: r.sort_order,
    };
    const { error } = r.id
      ? await supabase.from("services" as any).update(payload).eq("id", r.id)
      : await supabase.from("services" as any).insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(r.id ? "Service updated" : "Service created");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-widest text-lg">
            {r.id ? "Edit Service" : "New Service"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <Field label="Name">
            <Input value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} placeholder="Music Videos" />
          </Field>
          <Field label="Short description">
            <Input value={r.short_description ?? ""} onChange={(e) => setR({ ...r, short_description: e.target.value })} />
          </Field>
          <Field label="Long description">
            <Textarea rows={4} value={r.long_description ?? ""} onChange={(e) => setR({ ...r, long_description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Pricing model">
              <Select value={r.pricing_model} onValueChange={(v) => setR({ ...r, pricing_model: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRICING_MODELS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Base price ($)">
              <Input type="number" value={r.base_price ?? ""} onChange={(e) => setR({ ...r, base_price: e.target.value ? Number(e.target.value) : null })} />
            </Field>
            <Field label="Sale price ($)">
              <Input type="number" value={r.sale_price ?? ""} onChange={(e) => setR({ ...r, sale_price: e.target.value ? Number(e.target.value) : null })} />
            </Field>
          </div>
          <Field label="Cover image URL">
            <Input value={r.cover_image_url ?? ""} onChange={(e) => setR({ ...r, cover_image_url: e.target.value })} placeholder="https://…" />
          </Field>

          {/* PACKAGES */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Packages</Label>
              <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]"
                onClick={() => setR({ ...r, packages: [...(Array.isArray(r.packages) ? r.packages : []), { name: "", price: 0, includes: "" }] })}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {(Array.isArray(r.packages) ? r.packages : []).map((pkg: any, i: number) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start border border-border rounded-sm p-2 bg-background">
                  <Input className="col-span-4 h-8 text-xs" placeholder="Package name" value={pkg.name ?? ""}
                    onChange={(e) => { const arr = [...r.packages]; arr[i] = { ...arr[i], name: e.target.value }; setR({ ...r, packages: arr }); }} />
                  <Input className="col-span-2 h-8 text-xs" type="number" placeholder="Price" value={pkg.price ?? ""}
                    onChange={(e) => { const arr = [...r.packages]; arr[i] = { ...arr[i], price: e.target.value ? Number(e.target.value) : 0 }; setR({ ...r, packages: arr }); }} />
                  <Input className="col-span-5 h-8 text-xs" placeholder="What's included" value={pkg.includes ?? ""}
                    onChange={(e) => { const arr = [...r.packages]; arr[i] = { ...arr[i], includes: e.target.value }; setR({ ...r, packages: arr }); }} />
                  <Button type="button" size="sm" variant="ghost" className="col-span-1 h-8 w-8 p-0"
                    onClick={() => setR({ ...r, packages: r.packages.filter((_: any, j: number) => j !== i) })}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {(!r.packages || r.packages.length === 0) && (
                <div className="text-[11px] text-muted-foreground italic">No packages. Clients see only the base/sale price.</div>
              )}
            </div>
          </div>

          {/* ADD-ONS */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Add-ons</Label>
              <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]"
                onClick={() => setR({ ...r, add_ons: [...(Array.isArray(r.add_ons) ? r.add_ons : []), { name: "", price: 0 }] })}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {(Array.isArray(r.add_ons) ? r.add_ons : []).map((ad: any, i: number) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start border border-border rounded-sm p-2 bg-background">
                  <Input className="col-span-8 h-8 text-xs" placeholder="Add-on name" value={ad.name ?? ""}
                    onChange={(e) => { const arr = [...r.add_ons]; arr[i] = { ...arr[i], name: e.target.value }; setR({ ...r, add_ons: arr }); }} />
                  <Input className="col-span-3 h-8 text-xs" type="number" placeholder="Price" value={ad.price ?? ""}
                    onChange={(e) => { const arr = [...r.add_ons]; arr[i] = { ...arr[i], price: e.target.value ? Number(e.target.value) : 0 }; setR({ ...r, add_ons: arr }); }} />
                  <Button type="button" size="sm" variant="ghost" className="col-span-1 h-8 w-8 p-0"
                    onClick={() => setR({ ...r, add_ons: r.add_ons.filter((_: any, j: number) => j !== i) })}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {(!r.add_ons || r.add_ons.length === 0) && (
                <div className="text-[11px] text-muted-foreground italic">No add-ons configured.</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest">
              <Switch checked={r.is_available} onCheckedChange={(v) => setR({ ...r, is_available: v })} />
              Available
            </label>
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest">
              <Switch checked={r.is_featured} onCheckedChange={(v) => setR({ ...r, is_featured: v })} />
              Featured
            </label>
            <Field label="Sort">
              <Input type="number" value={r.sort_order} onChange={(e) => setR({ ...r, sort_order: Number(e.target.value) })} className="w-20" />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}><Save className="h-3.5 w-3.5 mr-1.5" />{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================
   STAFF MANAGER
   ============================================================ */

type StaffRow = {
  id: string;
  user_id: string | null;
  slug: string;
  display_name: string;
  role_title: string | null;
  production_position: string | null;
  bio: string | null;
  photo_url: string | null;
  cover_image_url: string | null;
  location: string | null;
  specialties: string[];
  service_ids: string[];
  preferred_service_ids: string[];
  travel_radius_miles: number | null;
  internal_notes: string | null;
  status: string;
  instagram: string | null;
  twitter: string | null;
  website: string | null;
  email: string | null;
  is_public: boolean;
  is_bookable: boolean;
  sort_order: number;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending: "bg-gold/15 text-gold border-gold/30",
  suspended: "bg-destructive/15 text-destructive border-destructive/30",
};

export const StaffManager = () => {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [availabilityFor, setAvailabilityFor] = useState<StaffRow | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: staff }, { data: svcs }] = await Promise.all([
      supabase.from("staff_profiles" as any).select("*").order("sort_order", { ascending: true }),
      supabase.from("services" as any).select("id,name").order("name"),
    ]);
    setRows((staff as any) || []);
    setServices((svcs as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = () => setEditing({
    id: "", user_id: null, slug: "", display_name: "", role_title: "", production_position: "", bio: "",
    photo_url: "", cover_image_url: "", location: "Chicago", specialties: [], service_ids: [],
    preferred_service_ids: [], travel_radius_miles: null, internal_notes: "", status: "active",
    instagram: "", twitter: "", website: "", email: "",
    is_public: true, is_bookable: true, sort_order: rows.length,
  });

  const remove = async (id: string) => {
    const { error } = await supabase.from("staff_profiles" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  return (
    <div className="space-y-5">
      <PageHead
        title="Staff & Crew"
        sub="Team Directory"
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-sm uppercase tracking-widest text-[10px] h-8">
              <Link to="/team" target="_blank"><ExternalLink className="h-3 w-3 mr-1.5" /> Public</Link>
            </Button>
            <Button size="sm" onClick={create} className="rounded-sm uppercase tracking-widest text-[10px] h-8">
              <Plus className="h-3 w-3 mr-1.5" /> New Member
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No staff yet" body="Add team members to power the booking flow."
          action={<Button size="sm" onClick={create}><Plus className="h-3 w-3 mr-1.5" />Add Member</Button>} />
      ) : (
        <div className="grid md:grid-cols-3 gap-3">
          {rows.map((s) => (
            <div key={s.id} className="border border-border rounded-sm p-4 bg-surface/40">
              <div className="flex gap-3">
                <div className="h-14 w-14 shrink-0 bg-surface border border-border overflow-hidden rounded-sm">
                  {s.photo_url
                    ? <img src={s.photo_url} alt="" className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center font-display text-base text-muted-foreground">
                        {s.display_name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base uppercase leading-tight truncate">{s.display_name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{s.role_title}{s.production_position ? ` · ${s.production_position}` : ""}</div>
                  <span className={`inline-block mt-1 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${STATUS_STYLES[s.status] || STATUS_STYLES.active}`}>
                    {s.status || "active"}
                  </span>
                </div>
              </div>
              {s.specialties?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {s.specialties.slice(0, 3).map((t) => (
                    <span key={t} className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-border rounded-sm text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setEditing(s)} className="h-7 text-[10px] uppercase tracking-widest">
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAvailabilityFor(s)} className="h-7 text-[10px] uppercase tracking-widest" disabled={!s.id}>
                  <Calendar className="h-3 w-3 mr-1" /> Availability
                </Button>
                <span className="ml-auto flex items-center gap-1.5">
                  {s.is_public ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {s.display_name}?</AlertDialogTitle>
                        <AlertDialogDescription>Their portfolio and availability will be removed.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(s.id)}>Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <StaffEditor
          row={editing}
          services={services}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {availabilityFor && (
        <AvailabilityCalendar
          staffId={availabilityFor.id}
          staffName={availabilityFor.display_name}
          open={!!availabilityFor}
          onClose={() => setAvailabilityFor(null)}
        />
      )}
    </div>
  );
};

const StaffEditor = ({ row, services, onClose, onSaved }: {
  row: StaffRow; services: { id: string; name: string }[]; onClose: () => void; onSaved: () => void;
}) => {
  const [r, setR] = useState<StaffRow>(row);
  const [busy, setBusy] = useState(false);
  const [specialtyInput, setSpecialtyInput] = useState("");

  const save = async () => {
    if (!r.display_name.trim()) return toast.error("Name required");
    setBusy(true);
    const payload = {
      ...r,
      slug: r.slug || slugify(r.display_name),
    };
    const { id, ...rest } = payload as any;
    const { error } = r.id
      ? await supabase.from("staff_profiles" as any).update(rest).eq("id", r.id)
      : await supabase.from("staff_profiles" as any).insert(rest);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(r.id ? "Updated" : "Created");
    onSaved();
  };

  const addSpecialty = () => {
    const v = specialtyInput.trim();
    if (!v) return;
    setR({ ...r, specialties: Array.from(new Set([...r.specialties, v])) });
    setSpecialtyInput("");
  };

  const toggleService = (id: string) => {
    const has = r.service_ids.includes(id);
    setR({ ...r, service_ids: has ? r.service_ids.filter((x) => x !== id) : [...r.service_ids, id] });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-widest text-lg">{r.id ? "Edit Member" : "New Member"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Display name"><Input value={r.display_name} onChange={(e) => setR({ ...r, display_name: e.target.value })} /></Field>
            <Field label="Role / title"><Input value={r.role_title ?? ""} onChange={(e) => setR({ ...r, role_title: e.target.value })} placeholder="Director of Photography" /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Production position"><Input value={r.production_position ?? ""} onChange={(e) => setR({ ...r, production_position: e.target.value })} placeholder="DP, Editor, Producer…" /></Field>
            <Field label="Status">
              <Select value={r.status || "active"} onValueChange={(v) => setR({ ...r, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Bio"><Textarea rows={4} value={r.bio ?? ""} onChange={(e) => setR({ ...r, bio: e.target.value })} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Photo URL"><Input value={r.photo_url ?? ""} onChange={(e) => setR({ ...r, photo_url: e.target.value })} /></Field>
            <Field label="Cover image URL"><Input value={r.cover_image_url ?? ""} onChange={(e) => setR({ ...r, cover_image_url: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Location"><Input value={r.location ?? ""} onChange={(e) => setR({ ...r, location: e.target.value })} /></Field>
            <Field label="Email"><Input value={r.email ?? ""} onChange={(e) => setR({ ...r, email: e.target.value })} /></Field>
            <Field label="Travel radius (mi)"><Input type="number" value={r.travel_radius_miles ?? ""} onChange={(e) => setR({ ...r, travel_radius_miles: e.target.value ? Number(e.target.value) : null })} /></Field>
          </div>
          <Field label="Internal notes (admin only)">
            <Textarea rows={3} value={r.internal_notes ?? ""} onChange={(e) => setR({ ...r, internal_notes: e.target.value })} placeholder="Rates, availability quirks, gear preferences…" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Instagram"><Input value={r.instagram ?? ""} onChange={(e) => setR({ ...r, instagram: e.target.value })} placeholder="@handle" /></Field>
            <Field label="Twitter"><Input value={r.twitter ?? ""} onChange={(e) => setR({ ...r, twitter: e.target.value })} /></Field>
            <Field label="Website"><Input value={r.website ?? ""} onChange={(e) => setR({ ...r, website: e.target.value })} /></Field>
          </div>

          <Field label="Specialties">
            <div className="flex gap-2">
              <Input value={specialtyInput} onChange={(e) => setSpecialtyInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())} placeholder="Lighting, color, music videos…" />
              <Button type="button" size="sm" onClick={addSpecialty}>Add</Button>
            </div>
            {r.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {r.specialties.map((t) => (
                  <button key={t} onClick={() => setR({ ...r, specialties: r.specialties.filter((x) => x !== t) })} className="text-[10px] uppercase tracking-widest px-2 py-1 border border-border rounded-sm hover:border-primary hover:text-primary">
                    {t} ✕
                  </button>
                ))}
              </div>
            )}
          </Field>

          <Field label="Services offered">
            <div className="grid grid-cols-2 gap-1.5">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-xs border border-border rounded-sm px-2 py-1.5 cursor-pointer hover:border-primary/50">
                  <input type="checkbox" checked={r.service_ids.includes(s.id)} onChange={() => toggleService(s.id)} />
                  {s.name}
                </label>
              ))}
              {services.length === 0 && <div className="text-xs text-muted-foreground col-span-2">Add services first.</div>}
            </div>
          </Field>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest">
              <Switch checked={r.is_public} onCheckedChange={(v) => setR({ ...r, is_public: v })} /> Public
            </label>
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest">
              <Switch checked={r.is_bookable} onCheckedChange={(v) => setR({ ...r, is_bookable: v })} /> Bookable
            </label>
            <Field label="Sort"><Input type="number" value={r.sort_order} onChange={(e) => setR({ ...r, sort_order: Number(e.target.value) })} className="w-20" /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}><Save className="h-3.5 w-3.5 mr-1.5" />{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================
   PORTFOLIO MANAGER (real table)
   ============================================================ */

type PortfolioRow = {
  id: string;
  staff_id: string | null;
  title: string;
  category: string;
  client: string | null;
  year: number | null;
  thumbnail_url: string | null;
  media_url: string | null;
  media_type: string;
  description: string | null;
  tags: string[];
  is_featured: boolean;
  is_public: boolean;
  sort_order: number;
};

const CATEGORIES = ["Photography", "Music Videos", "Events", "Short Films", "Commercial", "Studio"];

export const PortfolioWorksManager = () => {
  const [rows, setRows] = useState<PortfolioRow[]>([]);
  const [staff, setStaff] = useState<{ id: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PortfolioRow | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const load = async () => {
    setLoading(true);
    const [{ data: items }, { data: st }] = await Promise.all([
      supabase.from("portfolio_items" as any).select("*").order("sort_order").order("year", { ascending: false }),
      supabase.from("staff_profiles" as any).select("id,display_name").order("display_name"),
    ]);
    setRows((items as any) || []);
    setStaff((st as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = filter === "All" ? rows : rows.filter((r) => r.category === filter);

  const create = () => setEditing({
    id: "", staff_id: null, title: "", category: "Photography", client: "", year: new Date().getFullYear(),
    thumbnail_url: "", media_url: "", media_type: "image", description: "", tags: [],
    is_featured: false, is_public: true, sort_order: rows.length,
  });

  const remove = async (id: string) => {
    const { error } = await supabase.from("portfolio_items" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  return (
    <div className="space-y-5">
      <PageHead
        title="Portfolio"
        sub="Selected Work"
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-sm uppercase tracking-widest text-[10px] h-8">
              <Link to="/portfolio" target="_blank"><ExternalLink className="h-3 w-3 mr-1.5" /> Public</Link>
            </Button>
            <Button size="sm" onClick={create} className="rounded-sm uppercase tracking-widest text-[10px] h-8">
              <Plus className="h-3 w-3 mr-1.5" /> New Work
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`text-[10px] uppercase tracking-widest px-3 py-1.5 border rounded-sm transition ${filter === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Camera} title="No work yet" body="Upload pieces to showcase RTG production work."
          action={<Button size="sm" onClick={create}><Plus className="h-3 w-3 mr-1.5" />Add Work</Button>} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="border border-border rounded-sm bg-surface/40 group">
              <div className="aspect-video bg-surface overflow-hidden">
                {p.thumbnail_url
                  ? <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  : <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground/40" /></div>}
              </div>
              <div className="p-3">
                <div className="font-display text-sm uppercase leading-tight truncate">{p.title}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                  {p.category}{p.year && ` · ${p.year}`}
                </div>
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)} className="h-6 text-[9px] uppercase tracking-widest">
                    <Pencil className="h-2.5 w-2.5 mr-1" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-6 ml-auto text-muted-foreground hover:text-primary">
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {p.title}?</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(p.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <PortfolioEditor row={editing} staff={staff} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
};

const PortfolioEditor = ({ row, staff, onClose, onSaved }: {
  row: PortfolioRow; staff: { id: string; display_name: string }[]; onClose: () => void; onSaved: () => void;
}) => {
  const [r, setR] = useState<PortfolioRow>(row);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!r.title.trim()) return toast.error("Title required");
    setBusy(true);
    const { id, ...rest } = r as any;
    const payload = {
      ...rest,
      tags: r.tags,
      year: r.year ?? null,
      staff_id: r.staff_id || null,
    };
    const { error } = r.id
      ? await supabase.from("portfolio_items" as any).update(payload).eq("id", r.id)
      : await supabase.from("portfolio_items" as any).insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(r.id ? "Updated" : "Added");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle className="font-display uppercase tracking-widest text-lg">{r.id ? "Edit Work" : "New Work"}</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <Field label="Title"><Input value={r.title} onChange={(e) => setR({ ...r, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={r.category} onValueChange={(v) => setR({ ...r, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Media type">
              <Select value={r.media_type} onValueChange={(v) => setR({ ...r, media_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client"><Input value={r.client ?? ""} onChange={(e) => setR({ ...r, client: e.target.value })} /></Field>
            <Field label="Year"><Input type="number" value={r.year ?? ""} onChange={(e) => setR({ ...r, year: e.target.value ? Number(e.target.value) : null })} /></Field>
          </div>
          <Field label="Thumbnail URL"><Input value={r.thumbnail_url ?? ""} onChange={(e) => setR({ ...r, thumbnail_url: e.target.value })} /></Field>
          <Field label={r.media_type === "video" ? "Video URL" : "Full media URL"}>
            <Input value={r.media_url ?? ""} onChange={(e) => setR({ ...r, media_url: e.target.value })} placeholder={r.media_type === "video" ? "https://youtu.be/…" : "https://…"} />
          </Field>
          <Field label="Description"><Textarea rows={3} value={r.description ?? ""} onChange={(e) => setR({ ...r, description: e.target.value })} /></Field>
          <Field label="Credit to staff (optional)">
            <Select value={r.staff_id ?? "none"} onValueChange={(v) => setR({ ...r, staff_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Studio (no specific staff)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Studio (no specific staff)</SelectItem>
                {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest">
              <Switch checked={r.is_public} onCheckedChange={(v) => setR({ ...r, is_public: v })} /> Public
            </label>
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest">
              <Switch checked={r.is_featured} onCheckedChange={(v) => setR({ ...r, is_featured: v })} /> Featured
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}><Save className="h-3.5 w-3.5 mr-1.5" />{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================
   BOOKINGS DASHBOARD with assignment
   ============================================================ */

type BookingRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string | null;
  service_id: string | null;
  requested_staff_id: string | null;
  assigned_staff_id: string | null;
  assignment_status: string;
  no_preference: boolean;
  status: string;
  project_date: string | null;
  project_time: string | null;
  budget: string | null;
  description: string | null;
  notes: string | null;
  total_estimate: number | null;
  deposit_paid: boolean;
  archived: boolean;
  created_at: string;
  crew_request_type: string | null;
  crew_price_modifier: number | null;
  internal_assignment_locked: boolean;
};

const BOOKING_STATUSES = ["new", "contacted", "pending_deposit", "booked", "completed", "declined"] as const;

export const BookingsDashboard = () => {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [staff, setStaff] = useState<{ id: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("active");
  const [editing, setEditing] = useState<BookingRow | null>(null);
  const [crewSlotsFor, setCrewSlotsFor] = useState<BookingRow | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: bookings }, { data: st }] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("staff_profiles" as any).select("id,display_name").eq("is_bookable", true).order("display_name"),
    ]);
    setRows((bookings as any) || []);
    setStaff((st as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "active") return rows.filter((r) => !r.archived && r.status !== "completed" && r.status !== "declined");
    if (filter === "needs_assignment") return rows.filter((r) => !r.archived && (r.assignment_status === "needs_assignment" || (!r.assigned_staff_id && !r.no_preference)));
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const updateBooking = async (id: string, patch: Partial<BookingRow>) => {
    const { error } = await supabase.from("bookings").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, active: 0, needs_assignment: 0 };
    rows.forEach((r) => {
      if (!r.archived && r.status !== "completed" && r.status !== "declined") c.active++;
      if (!r.archived && (r.assignment_status === "needs_assignment" || (!r.assigned_staff_id && !r.no_preference))) c.needs_assignment++;
      c[r.status] = (c[r.status] || 0) + 1;
    });
    return c;
  }, [rows]);

  return (
    <div className="space-y-5">
      <PageHead title="Bookings" sub="Client Pipeline" />

      <div className="flex flex-wrap gap-1.5">
        {[
          { id: "active", label: "Active" },
          { id: "needs_assignment", label: "Needs Assignment" },
          ...BOOKING_STATUSES.map((s) => ({ id: s, label: s.replace("_", " ") })),
          { id: "all", label: "All" },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`text-[10px] uppercase tracking-widest px-3 py-1.5 border rounded-sm transition flex items-center gap-1.5 ${filter === f.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground"}`}>
            {f.label}
            {counts[f.id] != null && <span className="opacity-70">({counts[f.id]})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : visible.length === 0 ? (
        <EmptyState icon={Briefcase} title="No bookings here" body="Bookings submitted from /book will land here." />
      ) : (
        <div className="space-y-2">
          {visible.map((b) => {
            const assigned = staff.find((s) => s.id === b.assigned_staff_id);
            const requested = staff.find((s) => s.id === b.requested_staff_id);
            return (
              <div key={b.id} className="border border-border rounded-sm p-4 bg-surface/40">
                <div className="flex flex-wrap items-start gap-3 justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-display text-base uppercase">{b.name}</div>
                      <span className="text-[9px] uppercase tracking-widest border border-border rounded-sm px-1.5 py-0.5 text-muted-foreground">
                        {b.status.replace("_", " ")}
                      </span>
                      {!b.assigned_staff_id && !b.no_preference && (
                        <span className="text-[9px] uppercase tracking-widest border border-primary/40 text-primary rounded-sm px-1.5 py-0.5">
                          Staff Assignment Needed
                        </span>
                      )}
                      {b.no_preference && <span className="text-[9px] uppercase tracking-widest border border-gold/40 text-gold rounded-sm px-1.5 py-0.5">RTG Pick</span>}
                      {b.crew_request_type && CREW_PACKAGES[b.crew_request_type as CrewPackageId] && (
                        <span className="text-[9px] uppercase tracking-widest border border-primary/30 text-primary rounded-sm px-1.5 py-0.5">
                          {CREW_PACKAGES[b.crew_request_type as CrewPackageId].label}
                          {b.crew_price_modifier ? ` · +$${b.crew_price_modifier}` : ""}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {b.service || "—"}{b.budget && ` · ${b.budget}`}{b.project_date && ` · ${b.project_date}`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {b.email}{b.phone && ` · ${b.phone}`}
                    </div>
                    {(requested || assigned) && (
                      <div className="text-[10px] uppercase tracking-widest mt-1 text-muted-foreground">
                        {requested && <>Requested: <span className="text-foreground">{requested.display_name}</span></>}
                        {assigned && <> · Assigned: <span className="text-emerald-400">{assigned.display_name}</span></>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Select value={b.assigned_staff_id ?? "none"} onValueChange={(v) => updateBooking(b.id, { assigned_staff_id: v === "none" ? null : v, assignment_status: v === "none" ? "needs_assignment" : "assigned" })}>
                      <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue placeholder="Assign…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Unassigned —</SelectItem>
                        {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={b.status} onValueChange={(v) => updateBooking(b.id, { status: v })}>
                      <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => setCrewSlotsFor(b)} className="h-8 text-[10px] uppercase tracking-widest">
                      <Users className="h-3 w-3 mr-1" /> Crew Slots
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(b)} className="h-8 text-[10px] uppercase tracking-widest">
                      <Pencil className="h-3 w-3 mr-1" /> Notes
                    </Button>
                  </div>
                </div>
                {b.description && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border whitespace-pre-wrap line-clamp-3">{b.description}</p>}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <BookingNotesEditor row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
};

const BookingNotesEditor = ({ row, onClose, onSaved }: { row: BookingRow; onClose: () => void; onSaved: () => void }) => {
  const [notes, setNotes] = useState(row.notes ?? "");
  const [estimate, setEstimate] = useState<string>(row.total_estimate?.toString() ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("bookings").update({
      notes,
      total_estimate: estimate ? Number(estimate) : null,
    } as any).eq("id", row.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle className="font-display uppercase tracking-widest text-lg">Booking · {row.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Internal notes"><Textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          <Field label="Total estimate ($)"><Input type="number" value={estimate} onChange={(e) => setEstimate(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}><Save className="h-3.5 w-3.5 mr-1.5" />Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================
   Helpers
   ============================================================ */

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">{label}</Label>
    {children}
  </div>
);
