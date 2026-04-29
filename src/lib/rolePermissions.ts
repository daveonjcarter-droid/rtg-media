// Role permission toggles loaded from the role_permissions table.
// Provides a hook that returns toggles for the current user's roles.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/contexts/AuthContext";

export type RolePermissionRow = {
  role: AppRole;
  editor_can_publish: boolean;
  writer_can_edit_published: boolean;
  social_can_autopost: boolean;
  booking_can_override_availability: boolean;
  media_can_delete: boolean;
};

export const DEFAULT_TOGGLES: Omit<RolePermissionRow, "role"> = {
  editor_can_publish: true,
  writer_can_edit_published: false,
  social_can_autopost: false,
  booking_can_override_availability: false,
  media_can_delete: false,
};

export type EffectiveToggles = Omit<RolePermissionRow, "role">;

/** Merge toggles across all of the user's roles using OR (most permissive wins). */
export const mergeTogglesForRoles = (
  rows: RolePermissionRow[],
  roles: AppRole[],
): EffectiveToggles => {
  const out: EffectiveToggles = { ...DEFAULT_TOGGLES };
  rows
    .filter((r) => roles.includes(r.role))
    .forEach((r) => {
      (Object.keys(out) as (keyof EffectiveToggles)[]).forEach((k) => {
        if (r[k]) out[k] = true;
      });
    });
  // Head admin always has everything.
  if (roles.includes("head_admin")) {
    (Object.keys(out) as (keyof EffectiveToggles)[]).forEach((k) => (out[k] = true));
  }
  return out;
};

export const useRolePermissions = (roles: AppRole[]) => {
  const [rows, setRows] = useState<RolePermissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("role_permissions" as any).select("*");
    setRows((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggles = mergeTogglesForRoles(rows, roles);
  return { rows, toggles, loading, reload: load };
};
