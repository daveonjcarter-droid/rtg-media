// Project Manager dashboard view: workload at a glance.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Briefcase, ListTodo, AlertTriangle, CalendarClock, Folder } from "lucide-react";
import { isOverdue, isThisWeek, PROJECT_STATUS_TONE, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/projects";

type Project = { id: string; title: string; status: ProjectStatus; due_date: string | null };
type Task = { id: string; title: string; due_date: string | null; status: string };

const PMDashboardSection = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookings, setBookings] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: pj }, { data: tk }, { count: bk }] = await Promise.all([
        supabase.from("projects").select("id,title,status,due_date").order("updated_at", { ascending: false }).limit(50),
        supabase.from("project_tasks").select("id,title,due_date,status").or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`).neq("status", "completed").limit(100),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("assignment_status", "unassigned"),
      ]);
      setProjects((pj ?? []) as Project[]);
      setTasks((tk ?? []) as Task[]);
      setBookings(bk ?? 0);
    })();
  }, [user]);

  const overdue = tasks.filter((t) => isOverdue(t.due_date));
  const thisWeek = tasks.filter((t) => isThisWeek(t.due_date));
  const active = projects.filter((p) => ["planning", "active", "editing", "review"].includes(p.status));

  return (
    <div className="space-y-6">
      <div>
        <div className="eyebrow text-primary">Project Manager</div>
        <h2 className="font-display text-2xl uppercase tracking-wider">Workload</h2>
        <p className="text-xs text-muted-foreground mt-1">Your active projects, deadlines and bookings needing attention.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Active projects" value={active.length} icon={Folder} />
        <Stat label="My open tasks" value={tasks.length} icon={ListTodo} />
        <Stat label="Overdue" value={overdue.length} icon={AlertTriangle} tone="text-primary" />
        <Stat label="Due this week" value={thisWeek.length} icon={CalendarClock} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Active projects" empty="No active projects.">
          {active.slice(0, 6).map((p) => (
            <Link key={p.id} to="/dashboard/projects" className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-surface/60 rounded-sm">
              <span className="text-sm truncate">{p.title}</span>
              <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${PROJECT_STATUS_TONE[p.status]}`}>
                {PROJECT_STATUS_LABELS[p.status]}
              </span>
            </Link>
          ))}
        </Panel>

        <Panel title="Overdue & this week" empty="Nothing overdue. Nice.">
          {[...overdue, ...thisWeek].slice(0, 8).map((t) => (
            <Link key={t.id} to="/dashboard/tasks" className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-surface/60 rounded-sm">
              <span className="text-sm truncate">{t.title}</span>
              <span className={`text-[10px] uppercase tracking-widest ${isOverdue(t.due_date) ? "text-primary" : "text-muted-foreground"}`}>
                {t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}
              </span>
            </Link>
          ))}
        </Panel>
      </div>

      <Panel title="Bookings needing assignment" empty="All bookings are assigned.">
        <Link to="/dashboard/bookings" className="block px-3 py-3 text-sm">
          {bookings > 0 ? <><Briefcase className="h-3.5 w-3.5 inline mr-2 text-primary" />{bookings} unassigned booking{bookings === 1 ? "" : "s"} — review</> : "—"}
        </Link>
      </Panel>
    </div>
  );
};

const Stat = ({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone?: string }) => (
  <div className="border border-border rounded-sm bg-surface/40 p-4">
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <Icon className={`h-3.5 w-3.5 ${tone ?? "text-muted-foreground"}`} />
    </div>
    <div className={`font-display text-3xl mt-2 ${tone ?? ""}`}>{value}</div>
  </div>
);

const Panel = ({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) => {
  const arr = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);
  return (
    <div className="border border-border rounded-sm bg-surface/30">
      <div className="px-4 py-2.5 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="divide-y divide-border/50">
        {arr.length === 0 ? <div className="px-4 py-6 text-xs text-muted-foreground text-center">{empty}</div> : children}
      </div>
    </div>
  );
};

export default PMDashboardSection;
