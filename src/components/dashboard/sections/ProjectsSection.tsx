// Projects section: list + create + detail (with task board).
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, ArrowLeft, Calendar as CalIcon, Flag, Folder, Users } from "lucide-react";
import {
  PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS, PRIORITY_LABELS,
  PROJECT_STATUS_TONE, PRIORITY_TONE, type ProjectStatus, type ProjectPriority, type ProjectType,
} from "@/lib/projects";
import TasksBoard from "./TasksBoard";

type Project = {
  id: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  description: string | null;
  notes: string | null;
  due_date: string | null;
  project_manager_id: string | null;
  assigned_user_ids: string[];
  related_booking_id: string | null;
  related_article_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

const ProjectsSection = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Project[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => filter === "all" ? rows : rows.filter((r) => r.status === filter),
    [rows, filter],
  );

  if (selected) {
    return (
      <ProjectDetail
        project={selected}
        onBack={() => { setSelected(null); load(); }}
        onUpdated={load}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="eyebrow text-primary">Operations</div>
          <h2 className="font-display text-2xl uppercase tracking-wider">Projects</h2>
          <p className="text-xs text-muted-foreground mt-1">Internal & client projects with linked tasks, deadlines and assignments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="h-9 w-[160px] rounded-sm uppercase tracking-widest text-[10px] bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setOpenNew(true)} className="h-9 rounded-sm uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Project
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="border border-border rounded-sm bg-surface/40 p-12 text-center">
          <Folder className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <div className="font-display uppercase tracking-widest text-sm">No projects</div>
          <p className="text-xs text-muted-foreground mt-1">Create your first project to start coordinating work.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="text-left border border-border rounded-sm bg-surface/40 p-5 hover:bg-surface/70 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-display uppercase tracking-wider text-base truncate">{p.title}</div>
                <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${PROJECT_STATUS_TONE[p.status]}`}>
                  {PROJECT_STATUS_LABELS[p.status]}
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {PROJECT_TYPE_LABELS[p.type]} · <span className={PRIORITY_TONE[p.priority]}>{PRIORITY_LABELS[p.priority]}</span>
              </div>
              {p.description && <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-3">
                {p.due_date && <span className="inline-flex items-center gap-1"><CalIcon className="h-3 w-3" />{new Date(p.due_date).toLocaleDateString()}</span>}
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{p.assigned_user_ids.length}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <NewProjectDialog
        open={openNew}
        onOpenChange={setOpenNew}
        userId={user?.id ?? ""}
        onCreated={load}
      />
    </div>
  );
};

// ---------- DETAIL ----------
const ProjectDetail = ({ project, onBack, onUpdated }: { project: Project; onBack: () => void; onUpdated: () => void }) => {
  const [p, setP] = useState(project);

  const updateField = async (patch: Partial<Project>) => {
    const { error } = await supabase.from("projects").update(patch as any).eq("id", p.id);
    if (error) return toast.error(error.message);
    setP((prev) => ({ ...prev, ...patch }));
    onUpdated();
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-cream">
        <ArrowLeft className="h-3 w-3" /> Back to projects
      </button>

      <div className="border border-border rounded-sm bg-surface/40 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="eyebrow text-primary">{PROJECT_TYPE_LABELS[p.type]}</div>
            <h1 className="font-display text-2xl uppercase tracking-wider">{p.title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={p.status} onValueChange={(v) => updateField({ status: v as ProjectStatus })}>
              <SelectTrigger className="h-9 w-[150px] rounded-sm bg-background uppercase tracking-widest text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={p.priority} onValueChange={(v) => updateField({ priority: v as ProjectPriority })}>
              <SelectTrigger className="h-9 w-[130px] rounded-sm bg-background uppercase tracking-widest text-[10px]"><Flag className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORITY_LABELS) as ProjectPriority[]).map((s) => (
                  <SelectItem key={s} value={s}>{PRIORITY_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Description</Label>
            <Textarea
              defaultValue={p.description ?? ""}
              onBlur={(e) => e.target.value !== (p.description ?? "") && updateField({ description: e.target.value })}
              rows={4}
              className="mt-1 bg-background rounded-sm"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Notes</Label>
            <Textarea
              defaultValue={p.notes ?? ""}
              onBlur={(e) => e.target.value !== (p.notes ?? "") && updateField({ notes: e.target.value })}
              rows={4}
              className="mt-1 bg-background rounded-sm"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Due date</Label>
            <Input
              type="date"
              defaultValue={p.due_date ?? ""}
              onBlur={(e) => updateField({ due_date: e.target.value || null })}
              className="mt-1 bg-background rounded-sm h-9"
            />
          </div>
        </div>
      </div>

      <TasksBoard projectId={p.id} />
    </div>
  );
};

// ---------- NEW PROJECT ----------
const NewProjectDialog = ({ open, onOpenChange, userId, onCreated }: {
  open: boolean; onOpenChange: (b: boolean) => void; userId: string; onCreated: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ProjectType>("internal");
  const [priority, setPriority] = useState<ProjectPriority>("normal");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    setBusy(true);
    const { error } = await supabase.from("projects").insert({
      title: title.trim(),
      type, priority, description: description || null,
      due_date: dueDate || null,
      project_manager_id: userId,
      created_by: userId,
    } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Project created");
    setTitle(""); setDescription(""); setDueDate(""); setType("internal"); setPriority("normal");
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border rounded-sm">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wider">New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-surface rounded-sm h-9 mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ProjectType)}>
                <SelectTrigger className="bg-surface rounded-sm h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((s) => (
                    <SelectItem key={s} value={s}>{PROJECT_TYPE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ProjectPriority)}>
                <SelectTrigger className="bg-surface rounded-sm h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as ProjectPriority[]).map((s) => (
                    <SelectItem key={s} value={s}>{PRIORITY_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-surface rounded-sm mt-1" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-surface rounded-sm h-9 mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-sm uppercase tracking-widest text-[10px]">Cancel</Button>
          <Button onClick={submit} disabled={busy} className="rounded-sm uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectsSection;
