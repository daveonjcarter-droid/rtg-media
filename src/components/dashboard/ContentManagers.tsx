import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Star, Eye, EyeOff, Upload } from "lucide-react";

/* ----------------------------- types ----------------------------- */

type Episode = {
  id?: string;
  episode_number: number | null;
  title: string;
  slug: string | null;
  category: string;
  cover_image_url: string | null;
  summary: string | null;
  watch_url: string | null;
  read_url: string | null;
  breakdown_body: string | null;
  duration: string | null;
  is_featured: boolean;
  status: string;
};

type Pick = {
  id?: string;
  kind: string;
  title: string;
  creator: string | null;
  note: string | null;
  link_url: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

type Creator = {
  id?: string;
  name: string;
  role: string | null;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  city: string | null;
  sort_order: number;
  is_active: boolean;
};

type FeedItem = {
  id?: string;
  kind: string;
  title: string;
  detail: string | null;
  location: string | null;
  event_date: string | null;
  link_url: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const EPISODE_BLANK: Episode = {
  episode_number: null, title: "", slug: null, category: "Movies",
  cover_image_url: null, summary: null, watch_url: null, read_url: null,
  breakdown_body: null, duration: null, is_featured: false, status: "draft",
};
const PICK_BLANK: Pick = {
  kind: "watching", title: "", creator: null, note: null, link_url: null,
  image_url: null, sort_order: 0, is_active: true,
};
const CREATOR_BLANK: Creator = {
  name: "", role: null, description: null, image_url: null, link_url: null,
  city: "Chicago", sort_order: 0, is_active: true,
};
const FEED_BLANK: FeedItem = {
  kind: "event", title: "", detail: null, location: null, event_date: null,
  link_url: null, image_url: null, sort_order: 0, is_active: true,
};

/* ----------------------------- shared ui ----------------------------- */

const upload = async (file: File, prefix: string) => {
  if (!file.type.startsWith("image/")) { toast.error("Image only"); return null; }
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("site-content").upload(path, file, { contentType: file.type });
  if (error) { toast.error(error.message); return null; }
  return supabase.storage.from("site-content").getPublicUrl(path).data.publicUrl;
};

const ImageUpload = ({ value, onChange, prefix }: { value: string | null; onChange: (v: string | null) => void; prefix: string }) => {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} placeholder="Image URL" className="h-9 text-xs" />
        <label className={`h-9 px-3 inline-flex items-center gap-1.5 border border-border bg-background text-xs uppercase tracking-widest cursor-pointer hover:border-foreground ${busy ? "opacity-50 pointer-events-none" : ""}`}>
          <Upload className="h-3 w-3" />
          {busy ? "…" : "Upload"}
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            setBusy(true); const url = await upload(f, prefix); setBusy(false);
            if (url) onChange(url);
          }} />
        </label>
      </div>
      {value && <img src={value} alt="" className="h-16 w-24 object-cover border border-border" />}
    </div>
  );
};

const Section = ({ title, count, action, children }: { title: string; count?: number; action?: React.ReactNode; children: React.ReactNode }) => (
  <section className="border border-border rounded-sm bg-surface/40">
    <header className="flex items-center justify-between px-5 py-3 border-b border-border">
      <h3 className="font-display text-sm uppercase tracking-widest flex items-center gap-2">
        {title} {typeof count === "number" && <span className="text-muted-foreground text-xs">({count})</span>}
      </h3>
      {action}
    </header>
    <div className="p-5 space-y-3">{children}</div>
  </section>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
    {children}
  </div>
);

/* ----------------------------- BREAKDOWN ----------------------------- */

const BreakdownManager = () => {
  const [items, setItems] = useState<Episode[]>([]);
  const [editing, setEditing] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("breakdown_episodes" as any).select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as unknown as Episode[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload: any = { ...editing };
    if (payload.status === "published" && !payload.published_at) payload.published_at = new Date().toISOString();
    const { error } = editing.id
      ? await supabase.from("breakdown_episodes" as any).update(payload).eq("id", editing.id)
      : await supabase.from("breakdown_episodes" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this episode?")) return;
    const { error } = await supabase.from("breakdown_episodes" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  return (
    <Section title="RTG Breakdown Episodes" count={items.length} action={
      <Button size="sm" className="rounded-sm h-8 text-xs" onClick={() => setEditing({ ...EPISODE_BLANK })}>
        <Plus className="h-3 w-3 mr-1" /> New Episode
      </Button>
    }>
      {loading ? <div className="text-xs text-muted-foreground">Loading…</div> :
        items.length === 0 ? <div className="text-xs text-muted-foreground">No episodes yet.</div> :
        <div className="divide-y divide-border border border-border rounded-sm bg-background">
          {items.map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-3">
              <div className="h-12 w-16 bg-surface border border-border overflow-hidden shrink-0">
                {e.cover_image_url && <img src={e.cover_image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {e.is_featured && <Star className="h-3 w-3 text-primary fill-current" />}
                  <span className="text-[10px] uppercase tracking-widest text-primary">{e.category}</span>
                  <span className={`text-[10px] uppercase tracking-widest ${e.status === "published" ? "text-emerald-400" : "text-muted-foreground"}`}>· {e.status}</span>
                </div>
                <div className="text-sm font-display uppercase truncate">{e.title || "Untitled"}</div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditing(e)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={() => e.id && remove(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      }

      {editing && (
        <div className="border border-primary/40 rounded-sm bg-background p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-display uppercase">{editing.id ? "Edit Episode" : "New Episode"}</div>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditing(null)}><X className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Title"><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Slug (optional)"><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value || null })} placeholder="auto from id if blank" /></Field>
            <Field label="Episode #"><Input type="number" value={editing.episode_number ?? ""} onChange={(e) => setEditing({ ...editing, episode_number: e.target.value ? Number(e.target.value) : null })} /></Field>
            <Field label="Category">
              <select className="h-9 w-full bg-background border border-border rounded-sm px-2 text-xs" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {["Movies","TV","Anime","Comics","Music","Culture"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Duration"><Input value={editing.duration ?? ""} onChange={(e) => setEditing({ ...editing, duration: e.target.value || null })} placeholder="12 min" /></Field>
            <Field label="Status">
              <select className="h-9 w-full bg-background border border-border rounded-sm px-2 text-xs" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                <option value="draft">Draft</option><option value="published">Published</option>
              </select>
            </Field>
          </div>
          <Field label="Cover image"><ImageUpload value={editing.cover_image_url} onChange={(v) => setEditing({ ...editing, cover_image_url: v })} prefix="breakdown" /></Field>
          <Field label="Summary"><Textarea rows={2} value={editing.summary ?? ""} onChange={(e) => setEditing({ ...editing, summary: e.target.value || null })} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Watch URL"><Input value={editing.watch_url ?? ""} onChange={(e) => setEditing({ ...editing, watch_url: e.target.value || null })} placeholder="https://youtube.com/…" /></Field>
            <Field label="Read URL (article)"><Input value={editing.read_url ?? ""} onChange={(e) => setEditing({ ...editing, read_url: e.target.value || null })} placeholder="/articles/slug or full URL" /></Field>
          </div>
          <Field label="Breakdown body"><Textarea rows={6} value={editing.breakdown_body ?? ""} onChange={(e) => setEditing({ ...editing, breakdown_body: e.target.value || null })} /></Field>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} />
            <Star className="h-3 w-3 text-primary" /> Mark as featured episode
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button size="sm" onClick={save}>Save</Button>
          </div>
        </div>
      )}
    </Section>
  );
};

/* ----------------------------- PICKS ----------------------------- */

const PicksManager = () => {
  const [items, setItems] = useState<Pick[]>([]);
  const [editing, setEditing] = useState<Pick | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("rtg_picks" as any).select("*").order("kind").order("sort_order");
    setItems((data ?? []) as unknown as Pick[]); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const { error } = editing.id
      ? await supabase.from("rtg_picks" as any).update(editing).eq("id", editing.id)
      : await supabase.from("rtg_picks" as any).insert(editing);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this pick?")) return;
    const { error } = await supabase.from("rtg_picks" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };
  const toggleActive = async (p: Pick) => {
    await supabase.from("rtg_picks" as any).update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  };

  return (
    <Section title="RTG Picks" count={items.length} action={
      <Button size="sm" className="rounded-sm h-8 text-xs" onClick={() => setEditing({ ...PICK_BLANK })}>
        <Plus className="h-3 w-3 mr-1" /> New Pick
      </Button>
    }>
      {loading ? <div className="text-xs text-muted-foreground">Loading…</div> :
        items.length === 0 ? <div className="text-xs text-muted-foreground">No picks yet.</div> :
        <div className="divide-y divide-border border border-border rounded-sm bg-background">
          {items.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3">
              <span className="text-[10px] uppercase tracking-widest text-primary w-20">{p.kind}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-display uppercase truncate">{p.title}</div>
                {p.creator && <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.creator}</div>}
              </div>
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => toggleActive(p)}>
                {p.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditing(p)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={() => p.id && remove(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      }

      {editing && (
        <div className="border border-primary/40 rounded-sm bg-background p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-display uppercase">{editing.id ? "Edit Pick" : "New Pick"}</div>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditing(null)}><X className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Kind">
              <select className="h-9 w-full bg-background border border-border rounded-sm px-2 text-xs" value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value })}>
                <option value="watching">Watching</option><option value="listening">Listening</option><option value="matters">Matters Now</option>
              </select>
            </Field>
            <Field label="Sort order"><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} /></Field>
          </div>
          <Field label="Title"><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Creator / artist"><Input value={editing.creator ?? ""} onChange={(e) => setEditing({ ...editing, creator: e.target.value || null })} /></Field>
            <Field label="Link URL"><Input value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value || null })} /></Field>
          </div>
          <Field label="Note"><Textarea rows={2} value={editing.note ?? ""} onChange={(e) => setEditing({ ...editing, note: e.target.value || null })} /></Field>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button size="sm" onClick={save}>Save</Button>
          </div>
        </div>
      )}
    </Section>
  );
};

/* ----------------------------- CREATORS ----------------------------- */

const CreatorsManager = () => {
  const [items, setItems] = useState<Creator[]>([]);
  const [editing, setEditing] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("creators" as any).select("*").order("sort_order");
    setItems((data ?? []) as unknown as Creator[]); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const { error } = editing.id
      ? await supabase.from("creators" as any).update(editing).eq("id", editing.id)
      : await supabase.from("creators" as any).insert(editing);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete creator?")) return;
    const { error } = await supabase.from("creators" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  return (
    <Section title="Creator Spotlight" count={items.length} action={
      <Button size="sm" className="rounded-sm h-8 text-xs" onClick={() => setEditing({ ...CREATOR_BLANK })}>
        <Plus className="h-3 w-3 mr-1" /> New Creator
      </Button>
    }>
      {loading ? <div className="text-xs text-muted-foreground">Loading…</div> :
        items.length === 0 ? <div className="text-xs text-muted-foreground">No creators yet.</div> :
        <div className="divide-y divide-border border border-border rounded-sm bg-background">
          {items.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <div className="h-10 w-10 bg-surface border border-border overflow-hidden shrink-0 rounded-full">
                {c.image_url && <img src={c.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-display uppercase truncate">{c.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.role} {c.city && `· ${c.city}`}</div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditing(c)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={() => c.id && remove(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      }
      {editing && (
        <div className="border border-primary/40 rounded-sm bg-background p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-display uppercase">{editing.id ? "Edit Creator" : "New Creator"}</div>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditing(null)}><X className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Role"><Input value={editing.role ?? ""} onChange={(e) => setEditing({ ...editing, role: e.target.value || null })} placeholder="Photographer, Director…" /></Field>
            <Field label="City"><Input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value || null })} /></Field>
            <Field label="Sort order"><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} /></Field>
          </div>
          <Field label="Image"><ImageUpload value={editing.image_url} onChange={(v) => setEditing({ ...editing, image_url: v })} prefix="creators" /></Field>
          <Field label="Description"><Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value || null })} /></Field>
          <Field label="Link"><Input value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value || null })} placeholder="https://" /></Field>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button size="sm" onClick={save}>Save</Button>
          </div>
        </div>
      )}
    </Section>
  );
};

/* ----------------------------- CHICAGO FEED ----------------------------- */

const ChicagoFeedManager = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [editing, setEditing] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("chicago_feed" as any).select("*").order("event_date", { ascending: false, nullsFirst: false });
    setItems((data ?? []) as unknown as FeedItem[]); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload: any = { ...editing, event_date: editing.event_date || null };
    const { error } = editing.id
      ? await supabase.from("chicago_feed" as any).update(payload).eq("id", editing.id)
      : await supabase.from("chicago_feed" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete item?")) return;
    const { error } = await supabase.from("chicago_feed" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  return (
    <Section title="Chicago Feed" count={items.length} action={
      <Button size="sm" className="rounded-sm h-8 text-xs" onClick={() => setEditing({ ...FEED_BLANK })}>
        <Plus className="h-3 w-3 mr-1" /> New Item
      </Button>
    }>
      {loading ? <div className="text-xs text-muted-foreground">Loading…</div> :
        items.length === 0 ? <div className="text-xs text-muted-foreground">No feed items yet.</div> :
        <div className="divide-y divide-border border border-border rounded-sm bg-background">
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 p-3">
              <span className="text-[10px] uppercase tracking-widest text-primary w-20">{i.kind}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-display uppercase truncate">{i.title}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{i.location} {i.event_date && `· ${i.event_date}`}</div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditing(i)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={() => i.id && remove(i.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      }
      {editing && (
        <div className="border border-primary/40 rounded-sm bg-background p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-display uppercase">{editing.id ? "Edit Item" : "New Item"}</div>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditing(null)}><X className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Kind">
              <select className="h-9 w-full bg-background border border-border rounded-sm px-2 text-xs" value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value })}>
                <option value="event">Event</option><option value="moment">Moment</option><option value="activity">Activity</option>
              </select>
            </Field>
            <Field label="Date"><Input type="date" value={editing.event_date ?? ""} onChange={(e) => setEditing({ ...editing, event_date: e.target.value || null })} /></Field>
          </div>
          <Field label="Title"><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Location"><Input value={editing.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value || null })} /></Field>
            <Field label="Link"><Input value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value || null })} /></Field>
          </div>
          <Field label="Detail"><Textarea rows={2} value={editing.detail ?? ""} onChange={(e) => setEditing({ ...editing, detail: e.target.value || null })} /></Field>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button size="sm" onClick={save}>Save</Button>
          </div>
        </div>
      )}
    </Section>
  );
};

/* ----------------------------- ROOT ----------------------------- */

const ContentManagers = () => {
  const [tab, setTab] = useState<"breakdown" | "picks" | "creators" | "chicago">("breakdown");
  const tabs: { id: typeof tab; label: string }[] = [
    { id: "breakdown", label: "Breakdown" },
    { id: "picks", label: "RTG Picks" },
    { id: "creators", label: "Creators" },
    { id: "chicago", label: "Chicago Feed" },
  ];
  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <div className="eyebrow mb-1">Editor / Admin</div>
        <h2 className="font-display text-2xl md:text-3xl uppercase leading-none">Content Managers</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          Add and edit the content pillars that power the public site. Changes are live as soon as
          an item is set to published / active.
        </p>
      </div>
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs uppercase tracking-widest border-b-2 -mb-px ${
              tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "breakdown" && <BreakdownManager />}
      {tab === "picks" && <PicksManager />}
      {tab === "creators" && <CreatorsManager />}
      {tab === "chicago" && <ChicagoFeedManager />}
    </div>
  );
};

export default ContentManagers;
