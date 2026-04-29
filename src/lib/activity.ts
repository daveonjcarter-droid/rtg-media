// Activity log helper — records meaningful events for the Overview activity feed.
import { supabase } from "@/integrations/supabase/client";

export type ActivityKind =
  | "article_published"
  | "article_drafted"
  | "article_scheduled"
  | "social_scheduled"
  | "social_posted"
  | "booking_received"
  | "lead_captured"
  | "inquiry_received"
  | "idea_saved"
  | "media_uploaded";

export type ActivityEntry = {
  kind: ActivityKind;
  title: string;
  detail?: string;
  link_url?: string;
  meta?: Record<string, unknown>;
};

export const logActivity = async (entry: ActivityEntry): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    let actorName: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      actorName = profile?.display_name ?? user.email ?? null;
    }
    const row: Record<string, unknown> = {
      kind: entry.kind,
      title: entry.title,
      meta: entry.meta ?? {},
    };
    if (entry.detail) row.detail = entry.detail;
    if (entry.link_url) row.link_url = entry.link_url;
    if (user?.id) row.actor_id = user.id;
    if (actorName) row.actor_name = actorName;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("activity_log").insert(row as any);
  } catch {
    /* silent — activity log must never break user actions */
  }
};
