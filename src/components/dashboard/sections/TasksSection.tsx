// Standalone Tasks section with scope tabs.
import { useState } from "react";
import TasksBoard from "./TasksBoard";
import { cn } from "@/lib/utils";
import { ListTodo, AlertTriangle, CalendarClock, Users } from "lucide-react";

const TABS: { id: "mine" | "team" | "overdue" | "week"; label: string; icon: any }[] = [
  { id: "mine", label: "My Tasks", icon: ListTodo },
  { id: "team", label: "Team Tasks", icon: Users },
  { id: "overdue", label: "Overdue", icon: AlertTriangle },
  { id: "week", label: "Due This Week", icon: CalendarClock },
];

const TasksSection = () => {
  const [tab, setTab] = useState<"mine" | "team" | "overdue" | "week">("mine");
  return (
    <div className="space-y-6">
      <div>
        <div className="eyebrow text-primary">Operations</div>
        <h2 className="font-display text-2xl uppercase tracking-wider">Tasks</h2>
        <p className="text-xs text-muted-foreground mt-1">Track work across projects, deadlines and teammates.</p>
      </div>

      <div className="flex items-center gap-px border border-border rounded-sm overflow-hidden w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-3 py-2 text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5",
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-surface",
              )}
            >
              <Icon className="h-3 w-3" />{t.label}
            </button>
          );
        })}
      </div>

      <TasksBoard scope={tab === "team" ? "all" : tab} hideHeader />
    </div>
  );
};

export default TasksSection;
