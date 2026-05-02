// Master Audit Log — Head Admin only.
// Reads from public.audit_log (RLS enforces head_admin/owner/co_ceo).
// Shows actor, entity, action, changed fields, and a before→after diff.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHead, EmptyState, SectionShell } from "../shared/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { fmtRelative } from "@/lib/dateUtils";
import { ShieldCheck, ChevronRight, ChevronDown, Lock, Search, Filter } from "lucide-react";

type Row = {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  entity_type: string;
  entity_id: string | null;
  action: "insert" | "update" | "delete";
  changed_fields: string[];
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  summary: string | null;
};

const ACTION_TONE: Record<Row["action"], string> = {
  insert: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
  update: "border-sky-500/40 text-sky-400 bg-sky-500/5",
  delete: "border-primary/40 text-primary bg-primary/5",
};

const ENTITY_LABEL: Record<string, string> = {
  articles: "Article",
  bookings: "Booking",
  crew_assignments: "Crew Slot",
  staff_profiles: "Staff Profile",
  profile_meta: "Profile",
  services: "Service",
  portfolio_items: "Portfolio",
  user_roles: "Role",
  calendar_events: "Calendar",
};

const formatVal = (v: unknown): string => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v.length > 80 ? v.slice(0, 78) + "…" : v;
  if (typeof v === "object") return JSON.stringify(v).slice(0, 80);
  return String(v);
};

export const AuditLogSection = ({ canView }: { canView: boolean }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_log" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    setRows(((data as unknown) as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { if (canView) load(); }, [canView]);
  useRealtimeTable("audit_log", () => { if (canView) load(); }, { event: "INSERT" });

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (entityFilter !== "all" && r.entity_type !== entityFilter) return false;
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${r.actor_name ?? ""} ${r.actor_email ?? ""} ${r.entity_type} ${r.summary ?? ""} ${r.changed_fields.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, entityFilter, actionFilter]);

  const entityOptions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => s.add(r.entity_type));
    return Array.from(s).sort();
  }, [rows]);

  if (!canView) {
    return (
      <SectionShell>
        <PageHead title="Master Audit Log" sub="Restricted" />
        <div className="border border-border/60 rounded-sm bg-surface/30 p-12 text-center">
          <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <div className="font-display uppercase text-cream text-lg mb-1">Head Admin Only</div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            This is the master change log for the entire platform. Access is restricted to Head Admins, Owners, and Co-CEOs.
          </p>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell>
      <PageHead
        title="Master Audit Log"
        sub={`${filtered.length} of ${rows.length} events · last 300 changes`}
        actions={
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary border border-primary/30 px-2 py-1 rounded-sm">
            <ShieldCheck className="h-3 w-3" /> Head Admin
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center border border-border/60 rounded-sm bg-surface/30 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search actor, entity, or field…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-7 text-xs"
          />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entityOptions.map((e) => (
              <SelectItem key={e} value={e}>{ENTITY_LABEL[e] ?? e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="insert">Created</SelectItem>
            <SelectItem value="update">Updated</SelectItem>
            <SelectItem value="delete">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={load} className="h-8 text-[10px] uppercase tracking-widest">
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading audit history…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No audit events match your filters" />
      ) : (
        <div className="border border-border/60 rounded-sm bg-surface/20 overflow-hidden">
          {filtered.map((r) => {
            const open = expanded === r.id;
            const Chevron = open ? ChevronDown : ChevronRight;
            const entityLabel = ENTITY_LABEL[r.entity_type] ?? r.entity_type;
            return (
              <div key={r.id} className="border-b border-border/40 last:border-0">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : r.id)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-surface/40 transition-colors text-left"
                >
                  <Chevron className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
                  <Badge variant="outline" className={`text-[10px] uppercase tracking-widest shrink-0 ${ACTION_TONE[r.action]}`}>
                    {r.action === "insert" ? "create" : r.action}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-cream truncate">
                      <span className="text-muted-foreground">{entityLabel}</span>
                      {r.entity_id && <span className="text-muted-foreground/60 font-mono ml-1.5">·{r.entity_id.slice(0, 8)}</span>}
                      {r.changed_fields.length > 0 && (
                        <span className="ml-2 text-muted-foreground/80">
                          changed: <span className="text-cream">{r.changed_fields.slice(0, 4).join(", ")}</span>
                          {r.changed_fields.length > 4 && <span className="text-muted-foreground"> +{r.changed_fields.length - 4}</span>}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      <span className="text-cream/80">{r.actor_name ?? r.actor_email ?? "System"}</span>
                      <span className="mx-1.5 opacity-50">·</span>
                      {fmtRelative(r.created_at)}
                      <span className="mx-1.5 opacity-50">·</span>
                      <span className="font-mono opacity-60">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </button>

                {open && (
                  <div className="bg-[#080808] border-t border-border/40 px-6 py-4 space-y-3">
                    {r.action === "update" && r.changed_fields.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Changed fields</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              <tr className="border-b border-border/40">
                                <th className="text-left py-1.5 pr-3">Field</th>
                                <th className="text-left py-1.5 pr-3">Before</th>
                                <th className="text-left py-1.5">After</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.changed_fields.map((f) => (
                                <tr key={f} className="border-b border-border/20 last:border-0">
                                  <td className="py-1.5 pr-3 font-mono text-cream">{f}</td>
                                  <td className="py-1.5 pr-3 text-muted-foreground line-through opacity-70">
                                    {formatVal(r.before_data?.[f])}
                                  </td>
                                  <td className="py-1.5 text-emerald-400">
                                    {formatVal(r.after_data?.[f])}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {r.action === "insert" && r.after_data && (
                      <details>
                        <summary className="text-[10px] uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-cream">Created snapshot</summary>
                        <pre className="text-[10px] text-muted-foreground/80 mt-2 p-2 bg-background/50 border border-border/30 rounded-sm overflow-x-auto max-h-[300px]">
{JSON.stringify(r.after_data, null, 2)}
                        </pre>
                      </details>
                    )}
                    {r.action === "delete" && r.before_data && (
                      <details>
                        <summary className="text-[10px] uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-cream">Deleted snapshot</summary>
                        <pre className="text-[10px] text-muted-foreground/80 mt-2 p-2 bg-background/50 border border-border/30 rounded-sm overflow-x-auto max-h-[300px]">
{JSON.stringify(r.before_data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
};

export default AuditLogSection;
