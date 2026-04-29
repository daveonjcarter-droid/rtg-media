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
    await supabase.from("activity_log").insert({
      kind: entry.kind,
      title: entry.title,
      detail: entry.detail ?? null,
      link_url: entry.link_url ?? null,
      actor_id: user?.id ?? null,
      actor_name: actorName,
      meta: entry.meta ?? {},
    });
  } catch {
    /* silent — activity log must never break user actions */
  }
};
