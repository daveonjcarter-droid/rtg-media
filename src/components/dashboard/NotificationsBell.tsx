// Notifications bell — pulls last 12 entries from activity_log.
// Click an item to navigate to a relevant dashboard section.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Activity, Briefcase, Mail, FileText, Send, Calendar as CalIcon, Image as ImageIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { fmtRelative } from "@/lib/dateUtils";

type Row = {
  id: string;
  kind: string;
  title: string;
  detail: string | null;
  actor_name: string | null;
  link_url: string | null;
  created_at: string;
};

const KIND_ICON: Record<string, any> = {
  article_published: Send,
  article_drafted: FileText,
  article_scheduled: CalIcon,
  social_scheduled: CalIcon,
  social_posted: Send,
  booking_received: Briefcase,
  lead_captured: Mail,
  inquiry_received: Mail,
  media_uploaded: ImageIcon,
};

const KIND_TO_SECTION: Record<string, string> = {
  article_published: "published",
  article_drafted: "drafts",
  article_scheduled: "scheduled",
  social_scheduled: "social",
  social_posted: "social",
  booking_received: "bookings",
  lead_captured: "leads",
  inquiry_received: "leads",
  media_uploaded: "media",
};

export const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await supabase
      .from("activity_log")
      .select("id, kind, title, detail, actor_name, link_url, created_at")
      .order("created_at", { ascending: false })
      .limit(12);
    setRows((data as Row[]) ?? []);
    // Compute unread vs lastSeen in localStorage
    const lastSeen = localStorage.getItem("rtg.notif.lastSeen");
    const lastSeenTs = lastSeen ? new Date(lastSeen).getTime() : 0;
    const u = (data ?? []).filter((r: any) => new Date(r.created_at).getTime() > lastSeenTs).length;
    setUnread(u);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (v) {
      localStorage.setItem("rtg.notif.lastSeen", new Date().toISOString());
      setUnread(0);
    }
  };

  const select = (r: Row) => {
    setOpen(false);
    if (r.link_url) {
      window.open(r.link_url, "_blank");
      return;
    }
    const sec = KIND_TO_SECTION[r.kind] ?? "overview";
    navigate(`/dashboard/${sec}`);
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative h-8 w-8 rounded-sm border border-border hover:border-foreground/40 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center border border-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0 bg-[#080808] border-border">
        <div className="px-4 h-11 border-b border-border flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Notifications</div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{rows.length} recent</div>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              <Activity className="h-5 w-5 mx-auto mb-2 opacity-40" />
              No activity yet.
            </div>
          ) : (
            rows.map((r) => {
              const Icon = KIND_ICON[r.kind] ?? Activity;
              return (
                <button
                  key={r.id}
                  onClick={() => select(r)}
                  className="w-full text-left flex gap-3 px-4 py-2.5 border-b border-border/40 last:border-0 hover:bg-surface/40 transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {r.kind.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs text-cream truncate mt-0.5">{r.title}</div>
                    <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                      {fmtRelative(r.created_at)}
                      {r.actor_name && <span className="opacity-60"> · {r.actor_name}</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
