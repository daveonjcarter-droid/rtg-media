// Role Management — assign job roles to users + edit per-role access toggles.
// "Job roles" map to existing app_role enum entries; admins can rename labels in UI
// (display only) and grant/revoke roles to users.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Lock, ShieldCheck, UserCog, Plus, Trash2, Search } from "lucide-react";
import { ROLE_LABELS } from "@/lib/permissions";
import type { AppRole } from "@/contexts/AuthContext";
import { logActivity } from "@/lib/activity";

const DEFAULT_JOB_ROLES: AppRole[] = [
  "head_admin", "admin", "project_manager", "booking_manager", "journalist",
  "photographer", "videographer", "editor", "social_manager",
  "designer", "crew",
];

const ACCESS_KEYS = [
  { key: "access_dashboard",       label: "Dashboard access" },
  { key: "access_bookings",        label: "Booking access" },
  { key: "access_calendar",        label: "Calendar access" },
  { key: "access_articles",        label: "Article / editorial access" },
  { key: "access_production",      label: "Production services access" },
  { key: "access_staff",           label: "Staff profiles access" },
  { key: "access_analytics",       label: "Analytics access" },
  { key: "access_pricing",         label: "Pricing access" },
  { key: "access_invites",         label: "Invite / code creation" },
  { key: "access_role_management", label: "Role management access" },
  { key: "access_audit",           label: "Audit log access" },
  { key: "access_website_content", label: "Website content editing" },
] as const;

type AccessRow = {
  id: string;
  role: AppRole;
  [k: string]: any;
};

type UserRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  roles: AppRole[];
};

interface Props { isHeadAdmin: boolean }

const RoleManagementSection = ({ isHeadAdmin }: Props) => {
  const [permRows, setPermRows] = useState<AccessRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [assignRole, setAssignRole] = useState<Record<string, AppRole>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: perms }, { data: meta }, { data: ur }] = await Promise.all([
      supabase.from("role_permissions" as any).select("*"),
      supabase.from("profile_meta").select("user_id, email, display_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setPermRows(((perms as any) ?? []) as AccessRow[]);

    const rolesByUser = new Map<string, AppRole[]>();
    ((ur as any) ?? []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    setUsers(((meta as any) ?? []).map((m: any) => ({
      user_id: m.user_id,
      email: m.email,
      display_name: m.display_name,
      roles: rolesByUser.get(m.user_id) ?? [],
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setToggle = async (row: AccessRow, key: string, value: boolean) => {
    const prev = permRows;
    setPermRows(permRows.map((r) => (r.id === row.id ? { ...r, [key]: value } : r)));
    const { error } = await supabase.from("role_permissions" as any).update({ [key]: value }).eq("id", row.id);
    if (error) { toast.error(error.message); setPermRows(prev); return; }
    toast.success(`${ROLE_LABELS[row.role] ?? row.role}: ${key.replace("access_","")} ${value ? "on" : "off"}`);
    logActivity({
      kind: "settings",
      title: `Role access updated: ${ROLE_LABELS[row.role] ?? row.role}`,
      detail: `${key} → ${value ? "on" : "off"}`,
    });
  };

  const grant = async (userId: string) => {
    const role = assignRole[userId];
    if (!role) { toast.error("Pick a role to assign."); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role } as any);
    if (error) { toast.error(error.message); return; }
    toast.success(`Role assigned: ${ROLE_LABELS[role] ?? role}`);
    logActivity({ kind: "settings", title: "Role assigned", detail: `${ROLE_LABELS[role] ?? role} → user ${userId.slice(0,8)}` });
    load();
  };

  const revoke = async (userId: string, role: AppRole) => {
    if (!confirm(`Remove ${ROLE_LABELS[role] ?? role} from this user?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Role removed");
    logActivity({ kind: "settings", title: "Role removed", detail: `${ROLE_LABELS[role] ?? role} ← user ${userId.slice(0,8)}` });
    load();
  };

  const filteredUsers = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      u.email.toLowerCase().includes(q) ||
      (u.display_name ?? "").toLowerCase().includes(q) ||
      u.roles.some((r) => r.toLowerCase().includes(q)),
    );
  }, [users, filter]);

  const allRoles: AppRole[] = useMemo(() => {
    const set = new Set<AppRole>(DEFAULT_JOB_ROLES);
    permRows.forEach((r) => set.add(r.role));
    return Array.from(set);
  }, [permRows]);

  if (!isHeadAdmin) {
    return (
      <div className="space-y-5">
        <div className="border border-dashed border-border rounded-sm py-14 px-6 text-center">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
          <div className="font-display uppercase text-base">Head Admin only</div>
          <div className="text-xs text-muted-foreground mt-1.5">
            Only the Head Admin can manage roles. Head Admin can grant role-management to other roles via the toggles below.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Admin</div>
        <h2 className="font-display uppercase text-2xl">Role Management</h2>
        <p className="text-xs text-muted-foreground max-w-2xl mt-1">
          Assign roles to users and control what each role can access. Default roles cover the studio's core jobs.
        </p>
      </div>

      {/* USERS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-display uppercase text-base flex items-center gap-2">
            <UserCog className="h-4 w-4 text-primary" /> Users & Assigned Roles
          </h3>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by name, email, role…"
              className="h-9 pl-7 w-64 rounded-sm text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="border border-border rounded-sm divide-y divide-border">
            {filteredUsers.map((u) => (
              <div key={u.user_id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{u.display_name || u.email}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {u.roles.length === 0 ? (
                      <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border border-amber-500/30 bg-amber-500/15 text-amber-300">
                        Pending
                      </span>
                    ) : u.roles.map((r) => (
                      <button
                        key={r}
                        onClick={() => revoke(u.user_id, r)}
                        title="Click to remove"
                        className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border border-primary/30 bg-primary/10 text-primary hover:bg-destructive/15 hover:text-destructive hover:border-destructive/40 transition-colors"
                      >
                        {ROLE_LABELS[r] ?? r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={assignRole[u.user_id] ?? ""}
                    onValueChange={(v) => setAssignRole((s) => ({ ...s, [u.user_id]: v as AppRole }))}
                  >
                    <SelectTrigger className="h-9 w-44 rounded-sm text-xs"><SelectValue placeholder="Assign role…" /></SelectTrigger>
                    <SelectContent>
                      {allRoles
                        .filter((r) => !u.roles.includes(r))
                        .map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => grant(u.user_id)} className="h-9 rounded-sm uppercase tracking-widest text-[10px] bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No users match.</div>
            )}
          </div>
        )}
      </section>

      {/* ROLE ACCESS */}
      <section className="space-y-3">
        <h3 className="font-display uppercase text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Role Access Controls
        </h3>
        <p className="text-xs text-muted-foreground">
          Toggle what each role can access. Head Admin always has full access.
        </p>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-3">
            {permRows
              .sort((a, b) => (DEFAULT_JOB_ROLES.indexOf(a.role) - DEFAULT_JOB_ROLES.indexOf(b.role)))
              .map((row) => (
                <div key={row.id} className="border border-border rounded-sm bg-surface/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <div className="font-display text-base uppercase tracking-widest">
                      {ROLE_LABELS[row.role] ?? row.role}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {ACCESS_KEYS.map((t) => (
                      <label key={t.key} className="flex items-center gap-3 text-xs border border-border rounded-sm px-3 py-2 cursor-pointer hover:border-foreground/40 transition-colors">
                        <Switch
                          checked={Boolean(row[t.key])}
                          onCheckedChange={(v) => setToggle(row, t.key, v)}
                        />
                        <span>{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RoleManagementSection;
