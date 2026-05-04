// CRM — list + create + detail of clients with linked projects & bookings
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ArrowLeft, Mail, Phone, Building2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_TONE, formatMoney, type ClientStatus } from "@/lib/business";

type Client = {
  id: string; name: string; email: string | null; phone: string | null;
  company: string | null; artist_name: string | null; notes: string | null;
  status: ClientStatus; total_spend: number; tags: string[];
  user_id: string | null; created_at: string;
};

const ClientsSection = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search && !`${c.name} ${c.email ?? ""} ${c.company ?? ""} ${c.artist_name ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [rows, search, statusFilter]);

  if (openId) {
    const c = rows.find(x => x.id === openId);
    return c ? <ClientDetail client={c} onBack={() => { setOpenId(null); load(); }} /> : null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">CRM</div>
          <h2 className="text-2xl font-light">Clients</h2>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="rounded-sm uppercase tracking-widest text-[10px]">
          <Plus className="h-3 w-3 mr-1" /> New Client
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search clients…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(["lead","active","past","vip"] as ClientStatus[]).map(s => (
              <SelectItem key={s} value={s}>{CLIENT_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? <div className="text-sm text-muted-foreground">Loading…</div> :
       filtered.length === 0 ? <div className="text-sm text-muted-foreground border border-border/60 rounded-sm p-8 text-center">No clients yet.</div> :
       (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <button key={c.id} onClick={() => setOpenId(c.id)}
              className="text-left border border-border/60 hover:border-foreground/40 rounded-sm p-4 bg-background/40 transition">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.company || c.artist_name || c.email}</div>
                </div>
                <span className={`shrink-0 text-[9px] uppercase tracking-widest border rounded-sm px-1.5 py-0.5 ${CLIENT_STATUS_TONE[c.status]}`}>
                  {CLIENT_STATUS_LABELS[c.status]}
                </span>
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground flex items-center justify-between">
                <span>{formatMoney(c.total_spend)} lifetime</span>
                <span>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
       )}

      <CreateClientDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} createdBy={user?.id} />
    </div>
  );
};

const CreateClientDialog = ({ open, onClose, onCreated, createdBy }: { open: boolean; onClose: () => void; onCreated: () => void; createdBy?: string }) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", artist_name: "", status: "lead" as ClientStatus, notes: "" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    const { error } = await supabase.from("clients").insert({ ...form, created_by: createdBy } as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Client created");
    onCreated(); onClose();
    setForm({ name: "", email: "", phone: "", company: "", artist_name: "", status: "lead", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Company</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
            <div><Label>Artist name</Label><Input value={form.artist_name} onChange={e => setForm(f => ({ ...f, artist_name: e.target.value }))} /></div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as ClientStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["lead","active","past","vip"] as ClientStatus[]).map(s => (
                <SelectItem key={s} value={s}>{CLIENT_STATUS_LABELS[s]}</SelectItem>
              ))}</SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ClientDetail = ({ client, onBack }: { client: Client; onBack: () => void }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [edit, setEdit] = useState(client);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [pc, bk, inv, qt] = await Promise.all([
        supabase.from("project_clients").select("project_id, projects:projects(id,title,status,due_date)").eq("client_id", client.id),
        supabase.from("bookings").select("id,name,project_type,project_date,status").eq("client_id", client.id).order("created_at", { ascending: false }),
        supabase.from("invoices").select("id,number,status,amount_due,amount_paid,issued_at,due_date").eq("client_id", client.id).order("created_at", { ascending: false }),
        supabase.from("quotes").select("id,number,status,total,created_at").eq("client_id", client.id).order("created_at", { ascending: false }),
      ]);
      setProjects((pc.data as any)?.map((r: any) => r.projects).filter(Boolean) ?? []);
      setBookings((bk.data as any) ?? []);
      setInvoices((inv.data as any) ?? []);
      setQuotes((qt.data as any) ?? []);
    })();
  }, [client.id]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("clients").update({
      name: edit.name, email: edit.email, phone: edit.phone, company: edit.company,
      artist_name: edit.artist_name, status: edit.status, notes: edit.notes,
    }).eq("id", client.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to clients
      </button>

      <div className="border border-border/60 rounded-sm p-5 bg-background/40">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{CLIENT_STATUS_LABELS[client.status]}</div>
            <h2 className="text-2xl font-light">{client.name}</h2>
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
              {client.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</span>}
              {client.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</span>}
              {client.company && <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{client.company}</span>}
              {client.artist_name && <span className="inline-flex items-center gap-1"><UserIcon className="h-3 w-3" />{client.artist_name}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Lifetime</div>
            <div className="text-xl font-light">{formatMoney(client.total_spend)}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-border/60 rounded-sm p-4 bg-background/40">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Edit</div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Name</Label><Input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></div>
              <div><Label>Status</Label>
                <Select value={edit.status} onValueChange={(v) => setEdit({ ...edit, status: v as ClientStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(["lead","active","past","vip"] as ClientStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{CLIENT_STATUS_LABELS[s]}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              <div><Label>Email</Label><Input value={edit.email ?? ""} onChange={e => setEdit({ ...edit, email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={edit.phone ?? ""} onChange={e => setEdit({ ...edit, phone: e.target.value })} /></div>
              <div><Label>Company</Label><Input value={edit.company ?? ""} onChange={e => setEdit({ ...edit, company: e.target.value })} /></div>
              <div><Label>Artist</Label><Input value={edit.artist_name ?? ""} onChange={e => setEdit({ ...edit, artist_name: e.target.value })} /></div>
            </div>
            <div><Label>Notes</Label><Textarea rows={3} value={edit.notes ?? ""} onChange={e => setEdit({ ...edit, notes: e.target.value })} /></div>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>

        <div className="space-y-4">
          <CardList title="Projects" items={projects.map(p => ({ id: p.id, primary: p.title, secondary: `${p.status}${p.due_date ? " · due " + p.due_date : ""}` }))} empty="No linked projects" />
          <CardList title="Bookings" items={bookings.map(b => ({ id: b.id, primary: b.name || b.project_type, secondary: `${b.status}${b.project_date ? " · " + b.project_date : ""}` }))} empty="No bookings" />
          <CardList title="Quotes" items={quotes.map(q => ({ id: q.id, primary: `${q.number} — ${formatMoney(q.total)}`, secondary: q.status }))} empty="No quotes" />
          <CardList title="Invoices" items={invoices.map(i => ({ id: i.id, primary: `${i.number} — ${formatMoney(i.amount_due)}`, secondary: `${i.status} · paid ${formatMoney(i.amount_paid)}` }))} empty="No invoices" />
        </div>
      </div>
    </div>
  );
};

const CardList = ({ title, items, empty }: { title: string; items: { id: string; primary: string; secondary: string }[]; empty: string }) => (
  <div className="border border-border/60 rounded-sm p-4 bg-background/40">
    <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{title}</div>
    {items.length === 0 ? <div className="text-xs text-muted-foreground">{empty}</div> :
      <ul className="space-y-1.5 text-sm">
        {items.map(i => <li key={i.id} className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5 last:border-0">
          <span className="truncate">{i.primary}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">{i.secondary}</span>
        </li>)}
      </ul>}
  </div>
);

export default ClientsSection;
