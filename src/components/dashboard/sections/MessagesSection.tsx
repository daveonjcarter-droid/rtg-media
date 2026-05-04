// Messaging — threads + messages with realtime
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";

type Thread = {
  id: string; kind: string; subject: string | null;
  project_id: string | null; client_id: string | null;
  participant_ids: string[]; client_visible: boolean;
  last_message_at: string | null; created_at: string;
};
type Message = { id: string; thread_id: string; sender_id: string; body: string; created_at: string; mentions: string[] };

const MessagesSection = ({ clientView = false }: { clientView?: boolean }) => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(params.get("thread"));
  const [createOpen, setCreateOpen] = useState(false);

  const loadThreads = async () => {
    const { data } = await supabase.from("message_threads").select("*").order("last_message_at", { ascending: false, nullsFirst: false });
    setThreads((data as any) ?? []);
  };
  useEffect(() => { loadThreads(); }, []);

  useEffect(() => {
    const ch = supabase.channel("threads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "message_threads" }, loadThreads)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-200px)] min-h-[500px]">
      <div className="border border-border/60 rounded-sm bg-background/40 flex flex-col">
        <div className="p-3 border-b border-border/40 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Threads</div>
          {!clientView && <Button size="icon" variant="ghost" onClick={() => setCreateOpen(true)}><Plus className="h-3 w-3" /></Button>}
        </div>
        <div className="flex-1 overflow-auto">
          {threads.length === 0 ? <div className="p-4 text-xs text-muted-foreground">No threads.</div> :
            threads.map(t => (
              <button key={t.id} onClick={() => { setActiveId(t.id); setParams({ thread: t.id }); }}
                className={`w-full text-left p-3 border-b border-border/30 hover:bg-foreground/[0.03] ${activeId === t.id ? "bg-foreground/[0.05]" : ""}`}>
                <div className="font-medium text-sm truncate">{t.subject ?? "(no subject)"}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{t.kind}</div>
              </button>
            ))}
        </div>
      </div>
      <div className="border border-border/60 rounded-sm bg-background/40 flex flex-col min-h-0">
        {activeId ? <ThreadView threadId={activeId} userId={user?.id} /> :
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground"><MessageSquare className="h-4 w-4 mr-2" />Select a thread</div>}
      </div>

      <CreateThreadDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(id) => { loadThreads(); setActiveId(id); }} userId={user?.id} />
    </div>
  );
};

const ThreadView = ({ threadId, userId }: { threadId: string; userId?: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase.from("messages").select("*").eq("thread_id", threadId).order("created_at");
    setMessages((data as any) ?? []);
  };
  useEffect(() => { load(); }, [threadId]);

  useEffect(() => {
    const ch = supabase.channel(`msg-${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        (p) => setMessages(prev => [...prev, p.new as Message]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9 }); }, [messages.length]);

  const send = async () => {
    if (!body.trim() || !userId) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({ thread_id: threadId, sender_id: userId, body: body.trim() } as any);
    setSending(false);
    if (error) toast.error(error.message); else setBody("");
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`max-w-[70%] ${m.sender_id === userId ? "ml-auto text-right" : ""}`}>
            <div className={`inline-block rounded-sm border px-3 py-2 text-sm ${m.sender_id === userId ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/60"}`}>
              {m.body}
            </div>
            <div className="text-[9px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="border-t border-border/40 p-3 flex gap-2">
        <Input placeholder="Write a message…" value={body} onChange={e => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <Button onClick={send} disabled={sending || !body.trim()}><Send className="h-3 w-3" /></Button>
      </div>
    </>
  );
};

const CreateThreadDialog = ({ open, onClose, onCreated, userId }: any) => {
  const [subject, setSubject] = useState("");
  const [kind, setKind] = useState<"team" | "project" | "client" | "direct">("team");
  const [projectId, setProjectId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientVisible, setClientVisible] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      supabase.from("projects").select("id,title").order("created_at", { ascending: false }).limit(50),
      supabase.from("clients").select("id,name").order("name").limit(100),
    ]).then(([p, c]) => { setProjects((p.data as any) ?? []); setClients((c.data as any) ?? []); });
  }, [open]);

  const create = async () => {
    const { data, error } = await supabase.from("message_threads").insert({
      subject: subject || null, kind, created_by: userId,
      project_id: projectId || null, client_id: clientId || null,
      client_visible: clientVisible, participant_ids: [userId],
    } as any).select("id").single();
    if (error) { toast.error(error.message); return; }
    toast.success("Thread created"); onCreated((data as any).id); onClose();
    setSubject(""); setProjectId(""); setClientId(""); setClientVisible(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Thread</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Subject</Label><Input value={subject} onChange={e => setSubject(e.target.value)} /></div>
          <div><Label>Kind</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kind === "project" && (
            <div><Label>Project</Label>
              <Select value={projectId || "_"} onValueChange={(v) => setProjectId(v === "_" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {(kind === "client" || kind === "project") && (
            <>
              <div><Label>Client</Label>
                <Select value={clientId || "_"} onValueChange={(v) => setClientId(v === "_" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={clientVisible} onChange={e => setClientVisible(e.target.checked)} />
                Visible to client in their portal
              </label>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={create}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessagesSection;
