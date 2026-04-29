// Head-Admin only UI for editing role_permissions toggles.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Lock, ShieldCheck } from "lucide-react";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/permissions";
import type { AppRole } from "@/contexts/AuthContext";
import { PageHead } from "@/components/dashboard/shared/Primitives";
import { logActivity } from "@/lib/activity";

type Row = {
  id: string;
  role: AppRole;
  editor_can_publish: boolean;
  writer_can_edit_published: boolean;
  social_can_autopost: boolean;
  booking_can_override_availability: boolean;
  media_can_delete: boolean;
};

const TOGGLE_LABELS: { key: keyof Row; label: string; appliesTo: AppRole[] }[] = [
  { key: "editor_can_publish", label: "Can publish without approval", appliesTo: ["editor"] },
  { key: "writer_can_edit_published", label: "Can edit published posts", appliesTo: ["writer"] },
  { key: "social_can_autopost", label: "Can auto-post to platforms", appliesTo: ["social_manager"] },
  { key: "booking_can_override_availability", label: "Can override staff availability", appliesTo: ["booking_manager"] },
  { key: "media_can_delete", label: "Can delete media permanently", appliesTo: ["media_manager"] },
];

const ALL_ROLES: AppRole[] = [
  "head_admin", "admin", "editor", "writer", "social_manager", "booking_manager", "media_manager",
];

interface Props { isHeadAdmin: boolean }

const PermissionsManager = ({ isHeadAdmin }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("role_permissions" as any).select("*");
    if (error) toast.error(error.message);
    setRows(((data as any) || []).sort(
      (a: Row, b: Row) => ALL_ROLES.indexOf(a.role) - ALL_ROLES.indexOf(b.role),
    ));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setToggle = async (row: Row, key: keyof Row, value: boolean) => {
    const prev = rows;
    setRows(rows.map((r) => (r.id === row.id ? { ...r, [key]: value } : r)));
    const { error } = await supabase.from("role_permissions" as any).update({ [key]: value }).eq("id", row.id);
    if (error) {
      toast.error(error.message);
      setRows(prev);
      return;
    }
    toast.success(`${ROLE_LABELS[row.role]}: ${value ? "enabled" : "disabled"}`);
    logActivity({
      kind: "settings",
      title: `Permission updated: ${ROLE_LABELS[row.role]}`,
      detail: `${String(key)} → ${value ? "on" : "off"}`,
    });
  };

  if (!isHeadAdmin) {
    return (
      <div className="space-y-5">
        <PageHead title="Role Permissions" sub="Settings" />
        <div className="border border-dashed border-border rounded-sm py-14 px-6 text-center">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
          <div className="font-display uppercase text-base">Head Admin only</div>
          <div className="text-xs text-muted-foreground mt-1.5">
            Only the Head Admin can change role permission toggles.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHead title="Role Permissions" sub="Per-role toggles" />
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const applicable = TOGGLE_LABELS.filter((t) => t.appliesTo.includes(row.role));
            if (applicable.length === 0) return null;
            return (
              <div key={row.id} className="border border-border rounded-sm bg-surface/40 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <div className="font-display text-base uppercase tracking-widest">{ROLE_LABELS[row.role]}</div>
                </div>
                <div className="text-xs text-muted-foreground mb-3">{ROLE_DESCRIPTIONS[row.role]}</div>
                <div className="space-y-2">
                  {applicable.map((t) => (
                    <label key={String(t.key)} className="flex items-center gap-3 text-xs border border-border rounded-sm px-3 py-2 cursor-pointer hover:border-foreground/40 transition-colors">
                      <Switch
                        checked={Boolean(row[t.key])}
                        onCheckedChange={(v) => setToggle(row, t.key, v)}
                      />
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground pt-2">
            Changes apply to every user holding that role. Head Admin always has full access.
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsManager;
