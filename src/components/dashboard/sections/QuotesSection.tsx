// Quotes builder — list, create, edit line items
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ArrowLeft, Trash2, Send, FileText } from "lucide-react";
import { toast } from "sonner";
import { QUOTE_STATUS_LABELS, QUOTE_TONE, formatMoney, computeQuoteTotal, type QuoteStatus } from "@/lib/business";

type Quote = {
  id: string; number: string | null; title: string; status: QuoteStatus;
  client_id: string | null; project_id: string | null;
  base_price: number; addons_total: number; discount: number; tax: number; total: number;
  currency: string; valid_until: string | null; notes: string | null;
  created_at: string;
};
type LineItem = { id: string; quote_id: string; label: string; description: string | null; qty: number; unit_price: number; kind: string; sort_order: number };

const QuotesSection = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Quote[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [q, c] = await Promise.all([
      supabase.from("quotes").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id,name").order("name"),
    ]);
    if (q.error) toast.error(q.error.message); else setRows((q.data as any) ?? []);
    setClients((c.data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (openId) {
    const q = rows.find(x => x.id === openId);
    return q ? <QuoteDetail quote={q} clients={clients} onBack={() => { setOpenId(null); load(); }} /> : null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Sales</div>
          <h2 className="text-2xl font-light">Quotes</h2>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="rounded-sm uppercase tracking-widest text-[10px]">
          <Plus className="h-3 w-3 mr-1" /> New Quote
        </Button>
      </div>

      {loading ? <div className="text-sm text-muted-foreground">Loading…</div> :
       rows.length === 0 ? <div className="text-sm text-muted-foreground border border-border/60 rounded-sm p-8 text-center">No quotes yet.</div> :
       <div className="border border-border/60 rounded-sm overflow-hidden">
        {rows.map(q => {
          const cl = clients.find(c => c.id === q.client_id);
          return (
            <button key={q.id} onClick={() => setOpenId(q.id)}
              className="w-full text-left p-4 border-b border-border/40 last:border-0 hover:bg-foreground/[0.02] transition flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] tracking-widest text-muted-foreground">{q.number}</div>
                <div className="font-medium truncate">{q.title}</div>
                <div className="text-xs text-muted-foreground truncate">{cl?.name ?? "No client"}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-light">{formatMoney(q.total, q.currency)}</div>
                <span className={`text-[9px] uppercase tracking-widest border rounded-sm px-1.5 py-0.5 ${QUOTE_TONE[q.status]}`}>{QUOTE_STATUS_LABELS[q.status]}</span>
              </div>
            </button>
          );
        })}
       </div>}

      <CreateQuoteDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} clients={clients} createdBy={user?.id} />
    </div>
  );
};

const CreateQuoteDialog = ({ open, onClose, onCreated, clients, createdBy }: any) => {
  const [form, setForm] = useState({ title: "New Quote", client_id: "", base_price: 0 });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("quotes").insert({
      title: form.title,
      client_id: form.client_id || null,
      base_price: Number(form.base_price) || 0,
      created_by: createdBy,
    } as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Quote created");
    onCreated(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Quote</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div>
            <Label>Client</Label>
            <Select value={form.client_id || "_"} onValueChange={(v) => setForm({ ...form, client_id: v === "_" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_">No client</SelectItem>
                {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Base price</Label><Input type="number" value={form.base_price} onChange={e => setForm({ ...form, base_price: Number(e.target.value) })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const QuoteDetail = ({ quote, clients, onBack }: { quote: Quote; clients: { id: string; name: string }[]; onBack: () => void }) => {
  const [q, setQ] = useState<Quote>(quote);
  const [items, setItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    const { data } = await supabase.from("quote_line_items").select("*").eq("quote_id", quote.id).order("sort_order");
    setItems((data as any) ?? []);
  };
  useEffect(() => { loadItems(); }, [quote.id]);

  const addonsTotal = useMemo(() => items.filter(i => i.kind === "addon").reduce((s, i) => s + Number(i.qty) * Number(i.unit_price), 0), [items]);
  const computedTotal = computeQuoteTotal(Number(q.base_price), addonsTotal, Number(q.discount), Number(q.tax));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("quotes").update({
      title: q.title, status: q.status, client_id: q.client_id, notes: q.notes,
      base_price: q.base_price, addons_total: addonsTotal, discount: q.discount, tax: q.tax,
      valid_until: q.valid_until,
    }).eq("id", q.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); setQ({ ...q, addons_total: addonsTotal, total: computedTotal });
  };

  const addItem = async () => {
    const { error } = await supabase.from("quote_line_items").insert({ quote_id: q.id, label: "Add-on", qty: 1, unit_price: 0, kind: "addon", sort_order: items.length } as any);
    if (error) toast.error(error.message); else loadItems();
  };
  const updateItem = async (id: string, patch: Partial<LineItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } as LineItem : i));
    await supabase.from("quote_line_items").update(patch).eq("id", id);
  };
  const removeItem = async (id: string) => {
    await supabase.from("quote_line_items").delete().eq("id", id);
    loadItems();
  };

  const sendQuote = async () => {
    const { error } = await supabase.from("quotes").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", q.id);
    if (error) toast.error(error.message); else { toast.success("Quote marked sent"); setQ({ ...q, status: "sent" }); }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to quotes
      </button>

      <div className="border border-border/60 rounded-sm p-5 bg-background/40">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground">{q.number}</div>
            <Input value={q.title} onChange={e => setQ({ ...q, title: e.target.value })} className="text-xl font-light border-0 px-0 h-auto" />
          </div>
          <div className="flex gap-2">
            <span className={`text-[10px] uppercase tracking-widest border rounded-sm px-2 py-1 ${QUOTE_TONE[q.status]}`}>{QUOTE_STATUS_LABELS[q.status]}</span>
            {q.status === "draft" && <Button size="sm" onClick={sendQuote}><Send className="h-3 w-3 mr-1" /> Mark sent</Button>}
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Client</Label>
            <Select value={q.client_id ?? "_"} onValueChange={(v) => setQ({ ...q, client_id: v === "_" ? null : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_">No client</SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={q.status} onValueChange={(v) => setQ({ ...q, status: v as QuoteStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["draft","sent","approved","rejected","expired"] as QuoteStatus[]).map(s => (
                <SelectItem key={s} value={s}>{QUOTE_STATUS_LABELS[s]}</SelectItem>
              ))}</SelectContent>
            </Select>
          </div>
          <div><Label>Valid until</Label><Input type="date" value={q.valid_until ?? ""} onChange={e => setQ({ ...q, valid_until: e.target.value || null })} /></div>
          <div><Label>Notes</Label><Textarea rows={2} value={q.notes ?? ""} onChange={e => setQ({ ...q, notes: e.target.value })} /></div>
        </div>
      </div>

      <div className="border border-border/60 rounded-sm p-4 bg-background/40">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Line Items</div>
          <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add</Button>
        </div>
        <div className="space-y-2">
          {items.map(i => (
            <div key={i.id} className="grid grid-cols-12 gap-2 items-center">
              <Input className="col-span-5" value={i.label} onChange={e => updateItem(i.id, { label: e.target.value })} />
              <Input className="col-span-2" type="number" value={i.qty} onChange={e => updateItem(i.id, { qty: Number(e.target.value) })} />
              <Input className="col-span-3" type="number" value={i.unit_price} onChange={e => updateItem(i.id, { unit_price: Number(e.target.value) })} />
              <div className="col-span-1 text-right text-sm">{formatMoney(Number(i.qty) * Number(i.unit_price))}</div>
              <Button size="icon" variant="ghost" className="col-span-1" onClick={() => removeItem(i.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          {items.length === 0 && <div className="text-xs text-muted-foreground">No add-ons.</div>}
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><Label className="text-xs">Base</Label><Input type="number" value={q.base_price} onChange={e => setQ({ ...q, base_price: Number(e.target.value) })} /></div>
          <div><Label className="text-xs">Add-ons</Label><Input value={formatMoney(addonsTotal)} readOnly /></div>
          <div><Label className="text-xs">Discount</Label><Input type="number" value={q.discount} onChange={e => setQ({ ...q, discount: Number(e.target.value) })} /></div>
          <div><Label className="text-xs">Tax</Label><Input type="number" value={q.tax} onChange={e => setQ({ ...q, tax: Number(e.target.value) })} /></div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
          <div className="text-sm text-muted-foreground"><FileText className="h-3 w-3 inline mr-1" /> Total</div>
          <div className="text-2xl font-light">{formatMoney(computedTotal, q.currency)}</div>
        </div>
        <Button className="mt-3" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save quote"}</Button>
      </div>
    </div>
  );
};

export default QuotesSection;
