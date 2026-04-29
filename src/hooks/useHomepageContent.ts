import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_HOMEPAGE,
  mergeHomepage,
  type HomepageContent,
} from "@/components/dashboard/QuickSiteUpdates";

/**
 * Reads the published homepage content from site_content.
 * Falls back to DEFAULT_HOMEPAGE so the page always renders.
 */
export function useHomepageContent(): { content: HomepageContent; loading: boolean } {
  const [content, setContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("site_content")
        .select("published")
        .eq("section", "homepage")
        .maybeSingle();
      if (cancelled) return;
      setContent(mergeHomepage(data?.published));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { content, loading };
}
