// Client-facing portal: their projects, messages, quotes, invoices
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Folder, FileText, Receipt, MessageSquare, LogOut } from "lucide-react";
import MessagesSection from "@/components/dashboard/sections/MessagesSection";
import { CLIENT_STATUS_LABELS, formatMoney, INVOICE_STATUS_LABELS, INVOICE_TONE, QUOTE_STATUS_LABELS, QUOTE_TONE } from "@/lib/business";

type Tab = "overview" | "projects" | "quotes" | "invoices" | "messages";

const PortalInner = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [client, setClient] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: cl } = await supabase.from("clients").select("*").eq("user_id", user.id).maybeSingle();
      setClient(cl);
      if (cl) {
        const [pc, q, i] = await Promise.all([
          supabase.from("project_clients").select("projects:projects(id,title,status,priority,due_date,description)").eq("client_id", cl.id),
          supabase.from("quotes").select("*").eq("client_id", cl.id).in("status", ["sent","approved","rejected"]).order("created_at", { ascending: false }),
          supabase.from("invoices").select("*").eq("client_id", cl.id).neq("status", "draft").order("created_at", { ascending: false }),
        ]);
        setProjects((pc.data as any)?.map((r: any) => r.projects).filter(Boolean) ?? []);
        setQuotes((q.data as any) ?? []);
        setInvoices((i.data as any) ?? []);
      }
      setLoading(false);
    })();
  }, [user]);

  const projectProgress = (status: string) => {
    const stages = ["planning", "scheduled", "in_progress", "review", "completed"];
    const idx = stages.indexOf(status);
    return idx < 0 ? 10 : Math.round(((idx + 1) / stages.length) * 100);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading…</div>;

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center border border-border/60 rounded-sm p-8 bg-background/40">
          <h1 className="text-2xl font-light mb-2">Client Portal</h1>
          <p className="text-sm text-muted-foreground mb-4">Your account isn't linked to a client profile yet. Contact RTG to get access.</p>
          <Button variant="outline" onClick={() => signOut()}><LogOut className="h-3 w-3 mr-1" /> Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-primary">Client Portal</div>
            <h1 className="text-xl font-light">{client.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">RTG Studio</Link>
            <Button size="sm" variant="ghost" onClick={() => signOut()}><LogOut className="h-3 w-3" /></Button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {([
            ["overview", "Overview"],
            ["projects", "Projects"],
            ["quotes", "Quotes"],
            ["invoices", "Invoices"],
            ["messages", "Messages"],
          ] as [Tab, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`text-xs uppercase tracking-widest px-3 py-2 border-b-2 transition ${tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-3">
              <Stat label="Projects" value={projects.length} icon={<Folder className="h-3 w-3" />} />
              <Stat label="Open quotes" value={quotes.filter(q => q.status === "sent").length} icon={<FileText className="h-3 w-3" />} />
              <Stat label="Outstanding" value={formatMoney(invoices.filter(i => i.payment_status !== "paid").reduce((s, i) => s + Number(i.amount_due) - Number(i.amount_paid), 0))} icon={<Receipt className="h-3 w-3" />} />
            </div>
            {projects.slice(0, 3).map(p => (
              <ProjectCard key={p.id} p={p} progress={projectProgress(p.status)} />
            ))}
          </div>
        )}

        {tab === "projects" && (
          <div className="space-y-3">
            {projects.length === 0 ? <Empty msg="No projects yet." /> :
              projects.map(p => <ProjectCard key={p.id} p={p} progress={projectProgress(p.status)} />)}
          </div>
        )}

        {tab === "quotes" && (
          <div className="space-y-2">
            {quotes.length === 0 ? <Empty msg="No quotes yet." /> :
              quotes.map(q => (
                <div key={q.id} className="border border-border/60 rounded-sm p-4 bg-background/40 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] tracking-widest text-muted-foreground">{q.number}</div>
                    <div className="font-medium">{q.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-light">{formatMoney(q.total, q.currency)}</div>
                    <span className={`text-[9px] uppercase tracking-widest border rounded-sm px-1.5 py-0.5 ${QUOTE_TONE[q.status as keyof typeof QUOTE_TONE]}`}>{QUOTE_STATUS_LABELS[q.status as keyof typeof QUOTE_STATUS_LABELS]}</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === "invoices" && (
          <div className="space-y-2">
            {invoices.length === 0 ? <Empty msg="No invoices yet." /> :
              invoices.map(i => (
                <div key={i.id} className="border border-border/60 rounded-sm p-4 bg-background/40 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] tracking-widest text-muted-foreground">{i.number}</div>
                    <div className="font-medium">{i.due_date ? `Due ${i.due_date}` : "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-light">{formatMoney(i.amount_due, i.currency)}</div>
                    <span className={`text-[9px] uppercase tracking-widest border rounded-sm px-1.5 py-0.5 ${INVOICE_TONE[i.status as keyof typeof INVOICE_TONE]}`}>{INVOICE_STATUS_LABELS[i.status as keyof typeof INVOICE_STATUS_LABELS]}</span>
                    {i.payment_url && <div className="mt-1"><a className="text-[10px] underline text-primary" href={i.payment_url} target="_blank" rel="noreferrer">Pay online</a></div>}
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === "messages" && <MessagesSection clientView />}
      </main>
    </div>
  );
};

const Stat = ({ label, value, icon }: { label: string; value: any; icon: React.ReactNode }) => (
  <div className="border border-border/60 rounded-sm p-4 bg-background/40">
    <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-1">{icon}{label}</div>
    <div className="text-2xl font-light mt-1">{value}</div>
  </div>
);
const Empty = ({ msg }: { msg: string }) => <div className="text-sm text-muted-foreground border border-border/60 rounded-sm p-8 text-center">{msg}</div>;

const ProjectCard = ({ p, progress }: { p: any; progress: number }) => (
  <div className="border border-border/60 rounded-sm p-4 bg-background/40">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{p.status}</div>
        <h3 className="font-medium">{p.title}</h3>
        {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
      </div>
      {p.due_date && <div className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">Due {p.due_date}</div>}
    </div>
    <div className="mt-3">
      <div className="h-1 bg-border/40 rounded-sm overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">{progress}% complete</div>
    </div>
  </div>
);

const ClientPortal = () => <ProtectedRoute><PortalInner /></ProtectedRoute>;
export default ClientPortal;
