// Deadlines calendar — read-only overlay of tasks/projects/bookings/articles deadlines
// rendered as a grouped list. Pairs with the existing Operations Calendar.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ListTodo, Folder, Briefcase, FileText, Calendar as CalIcon } from "lucide-react";
import { isOverdue } from "@/lib/projects";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  kind: "task" | "project" | "booking" | "article";
  title: string;
  date: string;
  link: string;
};

const KIND_META = {
  task: { icon: ListTodo, label: "Task", tone: "text-sky-400" },
  project: { icon: Folder, label: "Project", tone: "text-amber-400" },
  booking: { icon: Briefcase, label: "Booking", tone: "text-emerald-400" },
  article: { icon: FileText, label: "Article", tone: "text-gold" },
};

const DeadlinesSection = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "task" | "project" | "booking" | "article">("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const horizonHi = new Date(Date.now() + 60 * 86400000).toISOString();
      const horizonLo = new Date(Date.now() - 14 * 86400000).toISOString();

      const [tasks, projects, bookings, articles] = await Promise.all([
        supabase.from("project_tasks").select("id,title,due_date,status").not("due_date", "is", null).neq("status", "completed"),
        supabase.from("projects").select("id,title,due_date,status").not("due_date", "is", null).neq("status", "archived").neq("status", "completed"),
        supabase.from("bookings").select("id,name,project_type,project_date").gte("project_date", horizonLo.slice(0,10)).lte("project_date", horizonHi.slice(0,10)),
        supabase.from("articles").select("id,title,scheduled_for,status").not("scheduled_for", "is", null).in("status", ["scheduled","submitted","revisions","approved"]),
      ]);

      const all: Item[] = [];
      (tasks.data ?? []).forEach((t: any) => all.push({ id: `task-${t.id}`, kind: "task", title: t.title, date: t.due_date, link: "/dashboard/tasks" }));
      (projects.data ?? []).forEach((p: any) => all.push({ id: `project-${p.id}`, kind: "project", title: p.title, date: p.due_date, link: "/dashboard/projects" }));
      (bookings.data ?? []).forEach((b: any) => all.push({ id: `booking-${b.id}`, kind: "booking", title: `${b.project_type ?? "Booking"} — ${b.name ?? ""}`, date: b.project_date, link: "/dashboard/bookings" }));
      (articles.data ?? []).forEach((a: any) => all.push({ id: `article-${a.id}`, kind: "article", title: a.title, date: a.scheduled_for, link: "/dashboard/scheduled" }));

      all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setItems(all);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => filter === "all" ? items : items.filter((i) => i.kind === filter), [items, filter]);

  const grouped = useMemo(() => {
    const g: Record<string, Item[]> = {};
    filtered.forEach((i) => {
      const key = new Date(i.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
      (g[key] ||= []).push(i);
    });
    return g;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="eyebrow text-primary">Operations</div>
          <h2 className="font-display text-2xl uppercase tracking-wider">Deadlines</h2>
          <p className="text-xs text-muted-foreground mt-1">Tasks, project deadlines, booking dates and content drops.</p>
        </div>
        <div className="flex items-center gap-px border border-border rounded-sm overflow-hidden">
          {(["all", "task", "project", "booking", "article"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 text-[10px] uppercase tracking-widest", filter === f ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-surface")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="border border-border rounded-sm bg-surface/40 p-12 text-center">
          <CalIcon className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <div className="font-display uppercase tracking-widest text-sm">No upcoming deadlines</div>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, list]) => (
            <div key={date} className="border border-border rounded-sm bg-surface/30">
              <div className="px-4 py-2.5 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">{date}</div>
              <div className="divide-y divide-border/40">
                {list.map((i) => {
                  const M = KIND_META[i.kind];
                  const Icon = M.icon;
                  const overdue = isOverdue(i.date);
                  return (
                    <a key={i.id} href={i.link} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface/60">
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", M.tone)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{i.title}</div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{M.label}</div>
                      </div>
                      {overdue && <span className="text-[9px] uppercase tracking-widest text-primary">Overdue</span>}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeadlinesSection;
