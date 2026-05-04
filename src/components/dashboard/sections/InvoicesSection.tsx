// Invoices — manual today, Stripe-ready schema
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { INVOICE_STATUS_LABELS, INVOICE_TONE, formatMoney, type InvoiceStatus, type PaymentStatus } from "@/lib/business";

type Invoice = {
  id: string; number: string | null; quote_id: string | null; client_id: string | null;
  status: InvoiceStatus; amount_due: number; amount_paid: number; currency: string;
  issued_at: string | null; due_date: string | null;
  payment_provider: "manual" | "stripe"; payment_status: PaymentStatus;
  payment_method: string | null; payment_notes: string | null; paid_at: string | null;
  payment_url: string | null;
};

const InvoicesSection = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [quotes, setQuotes] = useState<{ id: string; number: string | null; total: number; client_id: string | null }[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    const [i, c, q] = await Promise.all([
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id,name").order("name"),
      supabase.from("quotes").select("id,number,total,client_id").eq("status", "approved"),
    ]);
    setRows((i.data as any) ?? []);
    setClients((c.data as any) ?? []);
    setQuotes((q.data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  if (openId) {
    const inv = rows.find(r => r.id === openId);
    return inv ? <InvoiceDetail invoice={inv} clients={clients} onBack={() => { setOpenId(null); load(); }} /> : null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Billing</div>
          <h2 className="text-2xl font-light">Invoices</h2>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="rounded-sm uppercase tracking-widest text-[10px]">
          <Plus className="h-3 w-3 mr-1" /> New Invoice
        </Button>
      </div>

      {rows.length === 0 ? <div className="text-sm text-muted-foreground border border-border/60 rounded-sm p-8 text-center">No invoices yet.</div> :
        <div className="border border-border/60 rounded-sm overflow-hidden">
          {rows.map(inv => {
            const cl = clients.find(c => c.id === inv.client_id);
            return (
              <button key={inv.id} onClick={() => setOpenId(inv.id)} className="w-full text-left p-4 border-b border-border/40 last:border-0 hover:bg-foreground/[0.02] flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] tracking-widest text-muted-foreground">{inv.number}</div>
                  <div className="font-medium">{cl?.name ?? "No client"}</div>
                  <div className="text-xs text-muted-foreground">{inv.due_date ? `Due ${inv.due_date}` : "No due date"}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-light">{formatMoney(inv.amount_due, inv.currency)}</div>
                  <span className={`text-[9px] uppercase tracking-widest border rounded-sm px-1.5 py-0.5 ${INVOICE_TONE[inv.status]}`}>{INVOICE_STATUS_LABELS[inv.status]}</span>
                </div>
              </button>
            );
          })}
        </div>
      }

      <CreateInvoiceDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} clients={clients} quotes={quotes} createdBy={user?.id} />
    </div>
  );
};

const CreateInvoiceDialog = ({ open, onClose, onCreated, clients, quotes, createdBy }: any) => {
  const [form, setForm] = useState({ client_id: "", quote_id: "", amount_due: 0, due_date: "" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("invoices").insert({
      client_id: form.client_id || null,
      quote_id: form.quote_id || null,
      amount_due: Number(form.amount_due),
      due_date: form.due_date || null,
      issued_at: new Date().toISOString(),
      status: "draft",
      created_by: createdBy,
    } as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Invoice created"); onCreated(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
        <div className="space-y-3">
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
          <div>
            <Label>From quote (optional)</Label>
            <Select value={form.quote_id || "_"} onValueChange={(v) => {
              const q = quotes.find((qq: any) => qq.id === v);
              setForm({ ...form, quote_id: v === "_" ? "" : v, amount_due: q?.total ?? form.amount_due, client_id: q?.client_id ?? form.client_id });
            }}>
              <SelectTrigger><SelectValue placeholder="Approved quotes…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_">None</SelectItem>
                {quotes.map((q: any) => <SelectItem key={q.id} value={q.id}>{q.number} — {formatMoney(q.total)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Amount</Label><Input type="number" value={form.amount_due} onChange={e => setForm({ ...form, amount_due: Number(e.target.value) })} /></div>
            <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InvoiceDetail = ({ invoice, clients, onBack }: { invoice: Invoice; clients: { id: string; name: string }[]; onBack: () => void }) => {
  const [inv, setInv] = useState<Invoice>(invoice);
  const [saving, setSaving] = useState(false);
  const cl = clients.find(c => c.id === inv.client_id);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("invoices").update({
      status: inv.status, amount_due: inv.amount_due, amount_paid: inv.amount_paid,
      due_date: inv.due_date, payment_method: inv.payment_method, payment_notes: inv.payment_notes,
      payment_status: inv.payment_status, paid_at: inv.paid_at, payment_url: inv.payment_url,
    }).eq("id", inv.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const markPaid = () => setInv({
    ...inv, status: "paid", payment_status: "paid",
    amount_paid: inv.amount_due, paid_at: new Date().toISOString()
  });

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back
      </button>

      <div className="border border-border/60 rounded-sm p-5 bg-background/40">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground">{inv.number}</div>
            <h2 className="text-2xl font-light">{cl?.name ?? "No client"}</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-light">{formatMoney(inv.amount_due, inv.currency)}</div>
            <span className={`text-[10px] uppercase tracking-widest border rounded-sm px-2 py-0.5 ${INVOICE_TONE[inv.status]}`}>{INVOICE_STATUS_LABELS[inv.status]}</span>
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div><Label>Status</Label>
            <Select value={inv.status} onValueChange={(v) => setInv({ ...inv, status: v as InvoiceStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map(s => <SelectItem key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Payment status</Label>
            <Select value={inv.payment_status} onValueChange={(v) => setInv({ ...inv, payment_status: v as PaymentStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["unpaid","partial","paid","failed","refunded"] as PaymentStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Amount paid</Label><Input type="number" value={inv.amount_paid} onChange={e => setInv({ ...inv, amount_paid: Number(e.target.value) })} /></div>
          <div><Label>Due date</Label><Input type="date" value={inv.due_date ?? ""} onChange={e => setInv({ ...inv, due_date: e.target.value || null })} /></div>
          <div><Label>Method</Label><Input value={inv.payment_method ?? ""} onChange={e => setInv({ ...inv, payment_method: e.target.value })} placeholder="Cash, Zelle, Stripe…" /></div>
          <div><Label>Payment URL (Stripe-ready)</Label><Input value={inv.payment_url ?? ""} onChange={e => setInv({ ...inv, payment_url: e.target.value })} /></div>
          <div className="sm:col-span-2 lg:col-span-3"><Label>Notes</Label><Textarea rows={2} value={inv.payment_notes ?? ""} onChange={e => setInv({ ...inv, payment_notes: e.target.value })} /></div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          {inv.payment_status !== "paid" && <Button variant="outline" onClick={markPaid}><CheckCircle2 className="h-3 w-3 mr-1" /> Mark paid</Button>}
        </div>
      </div>
    </div>
  );
};

export default InvoicesSection;
