// Shared project/task constants & helpers.
import type { Database } from "@/integrations/supabase/types";

export type ProjectStatus = "idea" | "planning" | "active" | "editing" | "review" | "completed" | "archived";
export type ProjectPriority = "low" | "normal" | "high" | "urgent";
export type ProjectType = "article" | "shoot" | "music_video" | "film" | "event" | "campaign" | "client_booking" | "internal";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "review" | "completed";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: "Idea", planning: "Planning", active: "Active", editing: "Editing",
  review: "Review", completed: "Completed", archived: "Archived",
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  article: "Article", shoot: "Shoot", music_video: "Music Video", film: "Film",
  event: "Event", campaign: "Campaign", client_booking: "Client Booking", internal: "Internal",
};

export const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: "Low", normal: "Normal", high: "High", urgent: "Urgent",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do", in_progress: "In Progress", blocked: "Blocked",
  review: "Review", completed: "Completed",
};

export const STATUS_TONE: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  blocked: "bg-primary/15 text-primary border-primary/30",
  review: "bg-gold/15 text-gold border-gold/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export const PRIORITY_TONE: Record<ProjectPriority, string> = {
  low: "text-muted-foreground",
  normal: "text-cream",
  high: "text-amber-400",
  urgent: "text-primary",
};

export const PROJECT_STATUS_TONE: Record<ProjectStatus, string> = {
  idea: "bg-muted text-muted-foreground border-border",
  planning: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  editing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  review: "bg-gold/15 text-gold border-gold/30",
  completed: "bg-cream/15 text-cream border-cream/30",
  archived: "bg-muted/40 text-muted-foreground border-border",
};

export const isOverdue = (dueIso: string | null | undefined) =>
  !!dueIso && new Date(dueIso).getTime() < Date.now();

export const isThisWeek = (dueIso: string | null | undefined) => {
  if (!dueIso) return false;
  const now = new Date();
  const end = new Date(now); end.setDate(end.getDate() + 7);
  const d = new Date(dueIso);
  return d >= now && d <= end;
};
