import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BreakdownEpisode = {
  id: string;
  episode_number: number | null;
  title: string;
  slug: string | null;
  category: string;
  cover_image_url: string | null;
  summary: string | null;
  watch_url: string | null;
  read_url: string | null;
  breakdown_body: string | null;
  duration: string | null;
  is_featured: boolean;
  status: string;
  published_at: string | null;
};

export type RtgPick = {
  id: string;
  kind: string; // watching | listening | matters
  title: string;
  creator: string | null;
  note: string | null;
  link_url: string | null;
  image_url: string | null;
  sort_order: number;
};

export type Creator = {
  id: string;
  name: string;
  role: string | null;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  city: string | null;
  sort_order: number;
};

export type ChicagoFeedItem = {
  id: string;
  kind: string;
  title: string;
  detail: string | null;
  location: string | null;
  event_date: string | null;
  link_url: string | null;
  image_url: string | null;
};

export function useBreakdownEpisodes(opts?: { featuredOnly?: boolean; limit?: number }) {
  const [data, setData] = useState<BreakdownEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      let q = supabase
        .from("breakdown_episodes" as any)
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (opts?.featuredOnly) q = q.eq("is_featured", true);
      if (opts?.limit) q = q.limit(opts.limit);
      const { data } = await q;
      setData((data ?? []) as unknown as BreakdownEpisode[]);
      setLoading(false);
    })();
  }, [opts?.featuredOnly, opts?.limit]);
  return { episodes: data, loading };
}

export function useRtgPicks() {
  const [picks, setPicks] = useState<RtgPick[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("rtg_picks" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      setPicks((data ?? []) as unknown as RtgPick[]);
      setLoading(false);
    })();
  }, []);
  return { picks, loading };
}

export function useCreators(limit?: number) {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      let q = supabase
        .from("creators" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (limit) q = q.limit(limit);
      const { data } = await q;
      setCreators((data ?? []) as unknown as Creator[]);
      setLoading(false);
    })();
  }, [limit]);
  return { creators, loading };
}

export function useChicagoFeed(limit?: number) {
  const [items, setItems] = useState<ChicagoFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      let q = supabase
        .from("chicago_feed" as any)
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (limit) q = q.limit(limit);
      const { data } = await q;
      setItems((data ?? []) as unknown as ChicagoFeedItem[]);
      setLoading(false);
    })();
  }, [limit]);
  return { items, loading };
}
