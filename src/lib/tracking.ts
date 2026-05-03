// RTG real visitor tracking — writes to public.page_views and bumps article_engagement.
// Anonymous insert is allowed by RLS; no PII beyond UA + path is stored.
import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "rtg_visitor_id";
const SESSION_KEY = "rtg_session_id";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min

const uuid = () =>
  (crypto.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);

const getVisitorId = (): string => {
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) {
      v = uuid();
      localStorage.setItem(VISITOR_KEY, v);
    }
    return v;
  } catch {
    return uuid();
  }
};

const getSessionId = (): string => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.exp > Date.now()) {
        parsed.exp = Date.now() + SESSION_TTL_MS;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
        return parsed.id;
      }
    }
    const fresh = { id: uuid(), exp: Date.now() + SESSION_TTL_MS };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
    return fresh.id;
  } catch {
    return uuid();
  }
};

const detectDevice = (): "mobile" | "tablet" | "desktop" => {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/(ipad|tablet|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
  if (/(mobi|iphone|ipod|android.*mobi|blackberry|iemobile|opera mini)/i.test(ua)) return "mobile";
  return "desktop";
};

const detectSource = (referrer: string): "direct" | "social" | "search" | "referral" => {
  if (!referrer) return "direct";
  let host = "";
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "direct";
  }
  if (host === window.location.hostname) return "direct";
  if (/(google|bing|duckduckgo|yahoo|baidu|yandex|brave)\./i.test(host)) return "search";
  if (/(facebook|instagram|tiktok|x\.com|twitter|t\.co|linkedin|reddit|pinterest|youtube|threads)/i.test(host))
    return "social";
  return "referral";
};

// Cache geo per session so we don't re-call the edge function on every page view.
let cachedGeo: { country?: string; city?: string } | null = null;

const fetchGeo = async (): Promise<{ country?: string; city?: string }> => {
  if (cachedGeo) return cachedGeo;
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/visitor-geo`;
    const res = await fetch(url, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "" },
    });
    if (res.ok) {
      cachedGeo = await res.json();
      return cachedGeo!;
    }
  } catch {
    /* silent — geo is optional */
  }
  cachedGeo = {};
  return cachedGeo;
};

const isAdminPath = (path: string) =>
  path.startsWith("/dashboard") ||
  path.startsWith("/login") ||
  path.startsWith("/signup") ||
  path.startsWith("/forgot-password");

export type TrackOptions = {
  path?: string;
  articleId?: string;
};

/** Fire-and-forget page view recording. Skipped on admin/auth routes. */
export const trackPageView = async (opts: TrackOptions = {}): Promise<void> => {
  try {
    const path = opts.path ?? window.location.pathname;
    if (isAdminPath(path)) return;

    const referrer = typeof document !== "undefined" ? document.referrer : "";
    const source = detectSource(referrer);
    const device = detectDevice();
    const visitor_id = getVisitorId();
    const session_id = getSessionId();
    const geo = await fetchGeo();

    await supabase.from("page_views").insert({
      path,
      article_id: opts.articleId ?? null,
      referrer: referrer || null,
      source,
      device,
      country: geo.country ?? null,
      city: geo.city ?? null,
      visitor_id,
      session_id,
      user_agent: navigator.userAgent.slice(0, 500),
    });
  } catch {
    /* silent — tracking must never break the UI */
  }
};

/** Atomically bump views on an article via the RPC. */
export const bumpArticleView = async (articleId: string): Promise<void> => {
  try {
    await supabase.rpc("bump_article_view" as never, { article_uuid: articleId } as never);
  } catch {
    /* silent */
  }
};

/** Generic product event recorder — writes to public.analytics_events. */
export type AnalyticsEventType =
  | "page_view"
  | "article_view"
  | "article_read"
  | "booking_click"
  | "booking_started"
  | "booking_submit"
  | "newsletter_signup"
  | "contact_submit"
  | "media_view"
  | "profile_view";

export const trackEvent = async (
  eventType: AnalyticsEventType,
  metadata: Record<string, unknown> = {},
): Promise<void> => {
  try {
    const path = (metadata.path as string | undefined) ?? (typeof window !== "undefined" ? window.location.pathname : null);
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    await supabase.from("analytics_events" as never).insert({
      event_type: eventType,
      page_path: path,
      article_id: (metadata.articleId as string | undefined) ?? null,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      referrer: referrer || null,
      device_type: detectDevice(),
      source: detectSource(referrer),
      metadata,
    } as never);
  } catch {
    /* silent — never break UI */
  }
};

/** Increment shares counter when a user shares an article. */
export const bumpArticleShare = async (articleId: string): Promise<void> => {
  try {
    const { data } = await supabase
      .from("article_engagement")
      .select("shares")
      .eq("article_id", articleId)
      .maybeSingle();
    const next = (data?.shares ?? 0) + 1;
    await supabase
      .from("article_engagement")
      .upsert({ article_id: articleId, shares: next }, { onConflict: "article_id" });
  } catch {
    /* silent */
  }
};
