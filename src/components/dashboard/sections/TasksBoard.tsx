// Tasks board — kanban + list with quick add. Used inside a project or standalone.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, ListTodo, LayoutGrid, Calendar as CalIcon, Flag, User as UserIcon } from "lucide-react";
import {
  TASK_STATUS_LABELS, STATUS_TONE, PRIORITY_LABELS, PRIORITY_TONE,
  type TaskStatus, type ProjectPriority, isOverdue,
} from "@/lib/projects";
import { cn } from "@/lib/utils";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: ProjectPriority;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  project_id: string | null;
  related_booking_id: string | null;
  related_article_id: string | null;
  completed_at: string | null;
  created_at: string;
};

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "blocked", "review", "completed"];

type Props = {
  projectId?: string;
  /** preset filter when used standalone */
  scope?: "all" | "mine" | "team" | "overdue" | "week";
  defaultView?: "kanban" | "list";
  hideHeader?: boolean;
};

const TasksBoard = ({ projectId, scope = "all", defaultView = "kanban", hideHeader = false }: Props) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">(defaultView);
  const [quick, setQuick] = useState("");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("project_tasks").select("*").order("created_at", { ascending: false });
    if (projectId) q = q.eq("project_id", projectId);
    if (scope === "mine" && user) q = q.eq("assigned_to", user.id);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data ?? []) as Task[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [projectId, scope]);

  const filtered = useMemo(() => {
    let r = rows;
    if (scope === "overdue") r = r.filter((t) => t.status !== "completed" && isOverdue(t.due_date));
    if (scope === "week") {
      const end = Date.now() + 7 * 86400000;
      r = r.filter((t) => t.due_date && new Date(t.due_date).getTime() <= end && t.status !== "completed");
    }
    return r;
  }, [rows, scope]);

  const addQuick = async () => {
    if (!quick.trim() || !user) return;
    const { error } = await supabase.from("project_tasks").insert({
      title: quick.trim(),
      project_id: projectId ?? null,
      created_by: user.id,
      assigned_to: scope === "mine" ? user.id : null,
    } as any);
    if (error) return toast.error(error.message);
    setQuick("");
    load();
  };

  const updateStatus = async (t: Task, status: TaskStatus) => {
    const { error } = await supabase.from("project_tasks").update({ status } as any).eq("id", t.id);
    if (error) return toast.error(error.message);
    load();
  };

  const updatePriority = async (t: Task, priority: ProjectPriority) => {
    const { error } = await supabase.from("project_tasks").update({ priority } as any).eq("id", t.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-primary" />
            <div className="font-display uppercase tracking-wider text-sm">Tasks</div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">· {filtered.length}</span>
          </div>
          <div className="flex items-center gap-px border border-border rounded-sm overflow-hidden">
            <button onClick={() => setView("kanban")} className={cn("px-3 py-1.5 text-[10px] uppercase tracking-widest", view === "kanban" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-surface")}><LayoutGrid className="h-3 w-3 inline mr-1" />Board</button>
            <button onClick={() => setView("list")} className={cn("px-3 py-1.5 text-[10px] uppercase tracking-widest", view === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-surface")}><ListTodo className="h-3 w-3 inline mr-1" />List</button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Add a task and press enter…"
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addQuick(); }}
          className="bg-background rounded-sm h-9 text-sm"
        />
        <Button onClick={addQuick} className="h-9 rounded-sm uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90"><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="border border-border rounded-sm bg-surface/40 p-10 text-center text-xs text-muted-foreground">
          No tasks yet.
        </div>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {COLUMNS.map((col) => {
            const items = filtered.filter((t) => t.status === col);
            return (
              <div key={col} className="border border-border rounded-sm bg-surface/30 min-h-[120px]">
                <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{TASK_STATUS_LABELS[col]}</span>
                  <span className="text-[10px] text-muted-foreground">{items.length}</span>
                </div>
                <div className="p-2 space-y-2">
                  {items.map((t) => (
                    <TaskCard key={t.id} task={t} onStatus={(s) => updateStatus(t, s)} onPriority={(p) => updatePriority(t, p)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-border rounded-sm bg-surface/30 divide-y divide-border">
          {filtered.map((t) => (
            <div key={t.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
              <Select value={t.status} onValueChange={(v) => updateStatus(t, v as TaskStatus)}>
                <SelectTrigger className="h-8 w-[140px] rounded-sm bg-background uppercase tracking-widest text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((s) => <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{t.title}</div>
                {t.description && <div className="text-[11px] text-muted-foreground truncate">{t.description}</div>}
              </div>
              {t.due_date && (
                <span className={cn("inline-flex items-center gap-1 text-[10px] uppercase tracking-widest", isOverdue(t.due_date) && t.status !== "completed" ? "text-primary" : "text-muted-foreground")}>
                  <CalIcon className="h-3 w-3" />{new Date(t.due_date).toLocaleDateString()}
                </span>
              )}
              <span className={cn("text-[10px] uppercase tracking-widest", PRIORITY_TONE[t.priority])}><Flag className="h-3 w-3 inline mr-1" />{PRIORITY_LABELS[t.priority]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TaskCard = ({ task, onStatus, onPriority }: {
  task: Task; onStatus: (s: TaskStatus) => void; onPriority: (p: ProjectPriority) => void;
}) => {
  const overdue = isOverdue(task.due_date) && task.status !== "completed";
  return (
    <div className={cn("border border-border bg-background rounded-sm p-3 space-y-2", overdue && "border-primary/40")}>
      <div className="text-xs leading-snug">{task.title}</div>
      {task.description && <div className="text-[10px] text-muted-foreground line-clamp-2">{task.description}</div>}
      <div className="flex items-center justify-between gap-2">
        {task.due_date ? (
          <span className={cn("inline-flex items-center gap-1 text-[9px] uppercase tracking-widest", overdue ? "text-primary" : "text-muted-foreground")}>
            <CalIcon className="h-2.5 w-2.5" />{new Date(task.due_date).toLocaleDateString()}
          </span>
        ) : <span />}
        <Select value={task.priority} onValueChange={(v) => onPriority(v as ProjectPriority)}>
          <SelectTrigger className={cn("h-6 w-auto px-1.5 border-0 bg-transparent uppercase tracking-widest text-[9px]", PRIORITY_TONE[task.priority])}>
            <Flag className="h-2.5 w-2.5 mr-1" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PRIORITY_LABELS) as ProjectPriority[]).map((p) => (
              <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Select value={task.status} onValueChange={(v) => onStatus(v as TaskStatus)}>
        <SelectTrigger className={cn("h-7 rounded-sm uppercase tracking-widest text-[9px] border", STATUS_TONE[task.status])}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COLUMNS.map((s) => <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TasksBoard;
