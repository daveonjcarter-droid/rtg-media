// Personal in-app notifications bell — distinct from the activity-log NotificationsBell.
// Pulls per-user notifications, supports mark-as-read, realtime updates.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Loader2, Inbox } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fmtRelative } from "@/lib/dateUtils";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

type Row = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
};

const PersonalNotificationsBell = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, kind, title, body, link_url, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);
  useRealtimeTable("notifications", load);

  const unread = rows.filter((r) => !r.read_at).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
    load();
  };

  const click = async (r: Row) => {
    if (!r.read_at) await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", r.id);
    setOpen(false);
    if (r.link_url) navigate(r.link_url);
    load();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative h-8 w-8 rounded-sm border border-border hover:border-foreground/40 flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="My notifications"
        >
          <Inbox className="h-3.5 w-3.5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center border border-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0 bg-[#080808] border-border">
        <div className="px-4 h-11 border-b border-border flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">My Notifications</div>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-cream inline-flex items-center gap-1">
              <Check className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 mx-auto mb-2 animate-spin opacity-60" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              <Bell className="h-5 w-5 mx-auto mb-2 opacity-40" />
              <div className="font-display uppercase text-cream text-sm mb-1">All caught up</div>
              <div>Task & project updates will appear here.</div>
            </div>
          ) : (
            rows.map((r) => (
              <button
                key={r.id}
                onClick={() => click(r)}
                className={`w-full text-left px-4 py-2.5 border-b border-border/40 last:border-0 hover:bg-surface/30 transition-colors ${r.read_at ? "opacity-60" : ""}`}
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.kind.replace(/_/g, " ")}</div>
                <div className="text-xs text-cream mt-0.5">{r.title}</div>
                {r.body && <div className="text-[10px] text-muted-foreground/80 mt-0.5 line-clamp-2">{r.body}</div>}
                <div className="text-[10px] text-muted-foreground/80 mt-1">{fmtRelative(r.created_at)}</div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PersonalNotificationsBell;
